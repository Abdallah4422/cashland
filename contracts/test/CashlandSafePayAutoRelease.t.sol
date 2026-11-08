// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {CashlandSafePay} from "../CashlandSafePay.sol";

contract AutoReleaseMockToken is IERC20 {
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "balance");
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= amount, "allowance");
        if (allowed != type(uint256).max) allowance[from][msg.sender] = allowed - amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}

contract CashlandSafePayAutoReleaseTest is Test {
    AutoReleaseMockToken internal token;
    CashlandSafePay internal escrow;

    address internal owner = makeAddr("owner");
    address internal newOwner = makeAddr("newOwner");
    address internal buyer = makeAddr("buyer");
    address internal seller = makeAddr("seller");
    address internal stranger = makeAddr("stranger");

    uint256 internal constant AMOUNT = 100e6;
    uint256 internal constant START_BAL = 1_000e6;
    uint256 internal deadline;

    function setUp() public {
        token = new AutoReleaseMockToken();
        escrow = new CashlandSafePay(address(token), owner);
        token.mint(buyer, START_BAL);
        vm.prank(buyer);
        token.approve(address(escrow), type(uint256).max);
        deadline = block.timestamp + 1 days;
    }

    function _create() internal returns (uint256 id) {
        vm.prank(buyer);
        id = escrow.createSafePay(seller, AMOUNT, "goods", deadline);
    }

    function _engage(uint256 id) internal {
        vm.prank(seller);
        escrow.engageSafePay(id);
    }

    function _status(uint256 id) internal view returns (CashlandSafePay.SafePayStatus) {
        return escrow.getSafePay(id).status;
    }

    // ---------- (1) triggerAutoRelease: unengaged ----------

    function test_TriggerAutoReleaseRevertsSellerNotEngagedAfterDeadline() public {
        uint256 id = _create();
        vm.warp(deadline + 1);
        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.SellerNotEngaged.selector, id));
        escrow.triggerAutoRelease(id);
        assertEq(token.balanceOf(seller), 0);
        assertEq(escrow.claimable(seller), 0);
        assertEq(escrow.totalClaimable(), 0);
        assertEq(token.balanceOf(address(escrow)), AMOUNT);
        assertEq(uint256(_status(id)), uint256(CashlandSafePay.SafePayStatus.Active));
    }

    function test_TriggerAutoReleaseRevertsSellerNotEngagedExactlyAtDeadline() public {
        uint256 id = _create();
        vm.warp(deadline);
        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.SellerNotEngaged.selector, id));
        escrow.triggerAutoRelease(id);
    }

    function test_TriggerAutoReleaseRevertsBeforeDeadline() public {
        uint256 id = _create();
        _engage(id);
        vm.warp(deadline - 1);
        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.DeadlineNotReached.selector, id));
        escrow.triggerAutoRelease(id);
    }

    function test_TriggerAutoReleaseRevertsWhenNotActive() public {
        uint256 id = _create();
        _engage(id);
        vm.warp(deadline);
        escrow.triggerAutoRelease(id);
        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.SafePayNotActive.selector, id));
        escrow.triggerAutoRelease(id);
        // Credited once; the failed second trigger did not double-credit.
        assertEq(escrow.claimable(seller), AMOUNT);
        assertEq(escrow.totalClaimable(), AMOUNT);
        vm.prank(seller);
        escrow.withdraw();
        assertEq(token.balanceOf(seller), AMOUNT);
    }

    // ---------- (2) triggerAutoRelease: engaged ----------

    function test_TriggerAutoReleasePaysEngagedSellerAfterDeadline() public {
        uint256 id = _create();
        _engage(id);
        vm.warp(deadline + 1);

        vm.expectEmit(true, true, false, true, address(escrow));
        emit CashlandSafePay.PayoutCredited(id, seller, AMOUNT);
        vm.expectEmit(true, true, true, true, address(escrow));
        emit CashlandSafePay.FundsReleased(id, buyer, seller, AMOUNT);
        vm.prank(stranger); // permissionless
        escrow.triggerAutoRelease(id);

        // Credited, not yet paid.
        assertEq(token.balanceOf(seller), 0);
        assertEq(token.balanceOf(address(escrow)), AMOUNT);
        assertEq(escrow.claimable(seller), AMOUNT);
        assertEq(escrow.totalClaimable(), AMOUNT);
        assertEq(uint256(_status(id)), uint256(CashlandSafePay.SafePayStatus.Released));

        // Seller (not the stranger who triggered it) pulls the funds.
        vm.prank(seller);
        escrow.withdraw();
        assertEq(token.balanceOf(seller), AMOUNT);
        assertEq(token.balanceOf(buyer), START_BAL - AMOUNT);
        assertEq(token.balanceOf(address(escrow)), 0);
        assertEq(escrow.claimable(seller), 0);
        assertEq(escrow.totalClaimable(), 0);
    }

    function test_TriggerAutoReleasePaysEngagedSellerExactlyAtDeadline() public {
        uint256 id = _create();
        _engage(id);
        vm.warp(deadline);
        escrow.triggerAutoRelease(id);
        assertEq(escrow.claimable(seller), AMOUNT);
        vm.prank(seller);
        escrow.withdraw();
        assertEq(token.balanceOf(seller), AMOUNT);
    }

    // ---------- (3) engageSafePay deadline ----------

    function test_EngageSafePayRevertsDeadlinePassedAtDeadline() public {
        uint256 id = _create();
        vm.warp(deadline);
        vm.prank(seller);
        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.DeadlinePassed.selector, id));
        escrow.engageSafePay(id);
    }

    function test_EngageSafePayRevertsDeadlinePassedAfterDeadline() public {
        uint256 id = _create();
        vm.warp(deadline + 1 days);
        vm.prank(seller);
        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.DeadlinePassed.selector, id));
        escrow.engageSafePay(id);
        assertFalse(escrow.getSafePay(id).sellerEngaged);
    }

    function test_EngageSafePaySucceedsOneSecondBeforeDeadline() public {
        uint256 id = _create();
        vm.warp(deadline - 1);
        _engage(id);
        assertTrue(escrow.getSafePay(id).sellerEngaged);
    }

    function test_EngageSafePayRevertsForNonSeller() public {
        uint256 id = _create();
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.NotSafePaySeller.selector, id, stranger));
        escrow.engageSafePay(id);
    }

    function test_EngageSafePayRevertsWhenNotActive() public {
        uint256 id = _create();
        vm.prank(buyer);
        escrow.cancelSafePay(id);
        vm.prank(seller);
        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.SafePayNotActive.selector, id));
        escrow.engageSafePay(id);
    }

    // ---------- (4) buyer cancel unengaged after deadline ----------

    function test_BuyerCanCancelUnengagedAfterDeadlineWithFullRefund() public {
        uint256 id = _create();
        vm.warp(deadline + 7 days);

        vm.expectEmit(true, true, false, true, address(escrow));
        emit CashlandSafePay.PayoutCredited(id, buyer, AMOUNT);
        vm.expectEmit(true, true, false, true, address(escrow));
        emit CashlandSafePay.SafePayCancelled(id, buyer, AMOUNT);
        vm.prank(buyer);
        escrow.cancelSafePay(id);

        assertEq(escrow.claimable(buyer), AMOUNT);
        assertEq(escrow.totalClaimable(), AMOUNT);
        assertEq(token.balanceOf(buyer), START_BAL - AMOUNT);
        assertEq(token.balanceOf(address(escrow)), AMOUNT);

        vm.prank(buyer);
        escrow.withdraw();
        assertEq(token.balanceOf(buyer), START_BAL);
        assertEq(token.balanceOf(address(escrow)), 0);
        assertEq(token.balanceOf(seller), 0);
        assertEq(escrow.totalClaimable(), 0);
        assertEq(uint256(_status(id)), uint256(CashlandSafePay.SafePayStatus.Cancelled));
    }

    function test_CancelRevertsForNonBuyer() public {
        uint256 id = _create();
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.NotSafePayBuyer.selector, id, stranger));
        escrow.cancelSafePay(id);
    }

    function test_CancelRevertsWhenNotActive() public {
        uint256 id = _create();
        vm.startPrank(buyer);
        escrow.cancelSafePay(id);
        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.SafePayNotActive.selector, id));
        escrow.cancelSafePay(id);
        vm.stopPrank();
    }

    // ---------- (5) cancel after engagement ----------

    function test_CancelRevertsSellerAlreadyEngaged() public {
        uint256 id = _create();
        _engage(id);
        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.SellerAlreadyEngaged.selector, id));
        escrow.cancelSafePay(id);
        assertEq(token.balanceOf(address(escrow)), AMOUNT);
    }

    function test_CancelRevertsSellerAlreadyEngagedAfterDeadline() public {
        uint256 id = _create();
        _engage(id);
        vm.warp(deadline + 1);
        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.SellerAlreadyEngaged.selector, id));
        escrow.cancelSafePay(id);
    }

    // ---------- (6) raiseDispute deadline ----------

    function test_RaiseDisputeRevertsDeadlinePassedAfterDeadline() public {
        uint256 id = _create();
        vm.warp(deadline + 1);
        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.DeadlinePassed.selector, id));
        escrow.raiseDispute(id);
        assertEq(uint256(_status(id)), uint256(CashlandSafePay.SafePayStatus.Active));
    }

    function test_RaiseDisputeRevertsDeadlinePassedAtDeadline() public {
        uint256 id = _create();
        vm.warp(deadline);
        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.DeadlinePassed.selector, id));
        escrow.raiseDispute(id);
    }

    function test_RaiseDisputeSucceedsBeforeDeadline() public {
        uint256 id = _create();
        vm.warp(deadline - 1);
        vm.expectEmit(true, true, false, false, address(escrow));
        emit CashlandSafePay.DisputeRaised(id, buyer);
        vm.prank(buyer);
        escrow.raiseDispute(id);
        assertEq(uint256(_status(id)), uint256(CashlandSafePay.SafePayStatus.Disputed));
    }

    function test_RaiseDisputeRevertsForNonBuyer() public {
        uint256 id = _create();
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.NotSafePayBuyer.selector, id, stranger));
        escrow.raiseDispute(id);
    }

    // ---------- (7) Ownable2Step ----------

    function test_OwnershipHandoverTwoStep() public {
        vm.prank(owner);
        escrow.transferOwnership(newOwner);
        assertEq(escrow.owner(), owner, "owner unchanged until accept");
        assertEq(escrow.pendingOwner(), newOwner);

        vm.prank(newOwner);
        escrow.acceptOwnership();
        assertEq(escrow.owner(), newOwner);
        assertEq(escrow.pendingOwner(), address(0));
    }

    function test_PendingOwnerHasNoRightsBeforeAccept() public {
        vm.prank(owner);
        escrow.transferOwnership(newOwner);
        uint256 id = _create();
        vm.prank(newOwner);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, newOwner));
        escrow.emergencyWithdraw(id);
    }

    function test_AcceptOwnershipRevertsForNonPendingOwner() public {
        vm.prank(owner);
        escrow.transferOwnership(newOwner);
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        escrow.acceptOwnership();
    }

    function test_TransferOwnershipRevertsForNonOwner() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        escrow.transferOwnership(newOwner);
    }

    function test_OldOwnerLosesOnlyOwnerRightsAfterHandover() public {
        uint256 id = _create();
        vm.prank(owner);
        escrow.transferOwnership(newOwner);
        vm.prank(newOwner);
        escrow.acceptOwnership();

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, owner));
        escrow.emergencyWithdraw(id);

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, owner));
        escrow.resolveDispute(id, true);

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, owner));
        escrow.transferOwnership(owner);

        // New owner has the rights.
        vm.prank(newOwner);
        escrow.emergencyWithdraw(id);
        assertEq(escrow.claimable(buyer), AMOUNT);
        vm.prank(buyer);
        escrow.withdraw();
        assertEq(token.balanceOf(buyer), START_BAL);
    }

    function test_RenounceOwnershipRevertsForOwner() public {
        vm.prank(owner);
        vm.expectRevert(CashlandSafePay.CannotRenounceOwnership.selector);
        escrow.renounceOwnership();
        assertEq(escrow.owner(), owner);
    }

    function test_RenounceOwnershipRevertsForNonOwner() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        escrow.renounceOwnership();
    }

    // ---------- fuzz ----------

    function testFuzz_AutoReleaseOnlyForEngaged(uint256 warpBy, bool engaged) public {
        warpBy = bound(warpBy, 0, 365 days);
        uint256 id = _create();
        if (engaged) _engage(id);
        vm.warp(deadline + warpBy);
        if (engaged) {
            escrow.triggerAutoRelease(id);
            assertEq(escrow.claimable(seller), AMOUNT);
            assertEq(token.balanceOf(seller), 0);
            vm.prank(seller);
            escrow.withdraw();
            assertEq(token.balanceOf(seller), AMOUNT);
        } else {
            vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.SellerNotEngaged.selector, id));
            escrow.triggerAutoRelease(id);
            vm.prank(buyer);
            escrow.cancelSafePay(id);
            assertEq(escrow.claimable(buyer), AMOUNT);
            vm.prank(buyer);
            escrow.withdraw();
            assertEq(token.balanceOf(buyer), START_BAL);
        }
        assertEq(escrow.totalClaimable(), 0);
        assertEq(token.balanceOf(address(escrow)), 0);
    }
}
