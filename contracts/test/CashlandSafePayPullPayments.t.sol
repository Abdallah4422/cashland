// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {CashlandSafePay} from "../CashlandSafePay.sol";
import {BlocklistERC20} from "../test-helpers/BlocklistERC20.sol";
import {ReentrantRecipient} from "../test-helpers/ReentrantRecipient.sol";
import {SafePayHandler} from "../test-helpers/SafePayHandler.sol";

abstract contract PullPaymentsBase is Test {
    BlocklistERC20 internal token;
    CashlandSafePay internal escrow;

    address internal owner = makeAddr("owner");
    address internal buyer = makeAddr("buyer");
    address internal seller = makeAddr("seller");
    address internal stranger = makeAddr("stranger");

    uint256 internal constant AMOUNT = 100e6;
    uint256 internal constant START = 1_000e6;
    uint256 internal deadline;

    function setUp() public virtual {
        token = new BlocklistERC20();
        escrow = new CashlandSafePay(address(token), owner);
        token.mint(buyer, START);
        vm.prank(buyer);
        token.approve(address(escrow), type(uint256).max);
        deadline = block.timestamp + 1 days;
    }

    function _create() internal returns (uint256 id) {
        return _createAmt(AMOUNT);
    }

    function _createAmt(uint256 amt) internal returns (uint256 id) {
        vm.prank(buyer);
        id = escrow.createSafePay(seller, amt, "goods", deadline);
    }

    function _engage(uint256 id) internal {
        vm.prank(seller);
        escrow.engageSafePay(id);
    }

    function _dispute(uint256 id) internal {
        vm.prank(buyer);
        escrow.raiseDispute(id);
    }

    function _status(uint256 id) internal view returns (CashlandSafePay.SafePayStatus) {
        return escrow.getSafePay(id).status;
    }

    function _bals() internal view returns (bytes32) {
        return keccak256(
            abi.encode(token.balanceOf(address(escrow)), token.balanceOf(buyer), token.balanceOf(seller))
        );
    }

    function _expectCredit(uint256 id, address account, uint256 amt) internal {
        vm.expectEmit(true, true, false, true, address(escrow));
        emit CashlandSafePay.PayoutCredited(id, account, amt);
    }
}

contract CashlandSafePayPullPaymentsTest is PullPaymentsBase {
    // ---------- six settlement paths: credit right account, move no USDC ----------

    function test_ReleaseFunds_CreditsSellerAndMovesNoUsdc() public {
        uint256 id = _create();
        bytes32 before = _bals();

        _expectCredit(id, seller, AMOUNT);
        vm.expectEmit(true, true, true, true, address(escrow));
        emit CashlandSafePay.FundsReleased(id, buyer, seller, AMOUNT);
        vm.prank(buyer);
        escrow.releaseFunds(id);

        assertEq(_bals(), before, "no USDC moved");
        assertEq(escrow.claimable(seller), AMOUNT);
        assertEq(escrow.claimable(buyer), 0);
        assertEq(escrow.totalClaimable(), AMOUNT);
        assertEq(uint256(_status(id)), uint256(CashlandSafePay.SafePayStatus.Released));
    }

    function test_TriggerAutoRelease_CreditsSellerAndMovesNoUsdc() public {
        uint256 id = _create();
        _engage(id);
        vm.warp(deadline);
        bytes32 before = _bals();

        _expectCredit(id, seller, AMOUNT);
        vm.expectEmit(true, true, true, true, address(escrow));
        emit CashlandSafePay.FundsReleased(id, buyer, seller, AMOUNT);
        vm.prank(stranger);
        escrow.triggerAutoRelease(id);

        assertEq(_bals(), before, "no USDC moved");
        assertEq(escrow.claimable(seller), AMOUNT);
        assertEq(escrow.claimable(stranger), 0);
        assertEq(escrow.claimable(buyer), 0);
        assertEq(escrow.totalClaimable(), AMOUNT);
        assertEq(uint256(_status(id)), uint256(CashlandSafePay.SafePayStatus.Released));
    }

    function test_ResolveDispute_ToSeller_CreditsSellerAndMovesNoUsdc() public {
        uint256 id = _create();
        _dispute(id);
        bytes32 before = _bals();

        _expectCredit(id, seller, AMOUNT);
        vm.expectEmit(true, true, true, true, address(escrow));
        emit CashlandSafePay.FundsReleased(id, buyer, seller, AMOUNT);
        vm.expectEmit(true, false, true, true, address(escrow));
        emit CashlandSafePay.DisputeResolved(id, true, owner);
        vm.prank(owner);
        escrow.resolveDispute(id, true);

        assertEq(_bals(), before, "no USDC moved");
        assertEq(escrow.claimable(seller), AMOUNT);
        assertEq(escrow.claimable(buyer), 0);
        assertEq(escrow.claimable(owner), 0);
        assertEq(escrow.totalClaimable(), AMOUNT);
        assertEq(uint256(_status(id)), uint256(CashlandSafePay.SafePayStatus.Released));
    }

    function test_ResolveDispute_ToBuyer_CreditsBuyerAndMovesNoUsdc() public {
        uint256 id = _create();
        _dispute(id);
        bytes32 before = _bals();

        _expectCredit(id, buyer, AMOUNT);
        vm.expectEmit(true, true, false, true, address(escrow));
        emit CashlandSafePay.SafePayCancelled(id, buyer, AMOUNT);
        vm.expectEmit(true, false, true, true, address(escrow));
        emit CashlandSafePay.DisputeResolved(id, false, owner);
        vm.prank(owner);
        escrow.resolveDispute(id, false);

        assertEq(_bals(), before, "no USDC moved");
        assertEq(escrow.claimable(buyer), AMOUNT);
        assertEq(escrow.claimable(seller), 0);
        assertEq(escrow.totalClaimable(), AMOUNT);
        assertEq(uint256(_status(id)), uint256(CashlandSafePay.SafePayStatus.Cancelled));
    }

    function test_CancelSafePay_CreditsBuyerAndMovesNoUsdc() public {
        uint256 id = _create();
        bytes32 before = _bals();

        _expectCredit(id, buyer, AMOUNT);
        vm.expectEmit(true, true, false, true, address(escrow));
        emit CashlandSafePay.SafePayCancelled(id, buyer, AMOUNT);
        vm.prank(buyer);
        escrow.cancelSafePay(id);

        assertEq(_bals(), before, "no USDC moved");
        assertEq(escrow.claimable(buyer), AMOUNT);
        assertEq(escrow.claimable(seller), 0);
        assertEq(escrow.totalClaimable(), AMOUNT);
        assertEq(uint256(_status(id)), uint256(CashlandSafePay.SafePayStatus.Cancelled));
    }

    function test_EmergencyWithdraw_CreditsBuyerAndMovesNoUsdc_Active() public {
        uint256 id = _create();
        bytes32 before = _bals();

        _expectCredit(id, buyer, AMOUNT);
        vm.expectEmit(true, true, false, true, address(escrow));
        emit CashlandSafePay.EmergencyWithdraw(id, buyer, AMOUNT);
        vm.prank(owner);
        escrow.emergencyWithdraw(id);

        assertEq(_bals(), before, "no USDC moved");
        assertEq(escrow.claimable(buyer), AMOUNT);
        assertEq(escrow.claimable(owner), 0);
        assertEq(escrow.totalClaimable(), AMOUNT);
        assertEq(uint256(_status(id)), uint256(CashlandSafePay.SafePayStatus.Cancelled));
    }

    function test_EmergencyWithdraw_CreditsBuyerAndMovesNoUsdc_Disputed() public {
        uint256 id = _create();
        _dispute(id);
        bytes32 before = _bals();

        _expectCredit(id, buyer, AMOUNT);
        vm.prank(owner);
        escrow.emergencyWithdraw(id);

        assertEq(_bals(), before, "no USDC moved");
        assertEq(escrow.claimable(buyer), AMOUNT);
        assertEq(escrow.totalClaimable(), AMOUNT);
    }

    // ---------- withdraw ----------

    function test_Withdraw_PaysOnlyCallerAndZeroesBalance() public {
        uint256 id1 = _create(); // -> seller
        uint256 id2 = _createAmt(50e6); // -> buyer
        vm.startPrank(buyer);
        escrow.releaseFunds(id1);
        escrow.cancelSafePay(id2);
        vm.stopPrank();

        uint256 buyerBefore = token.balanceOf(buyer);

        vm.expectEmit(true, false, false, true, address(escrow));
        emit CashlandSafePay.Withdrawn(seller, AMOUNT);
        vm.prank(seller);
        uint256 paid = escrow.withdraw();

        assertEq(paid, AMOUNT);
        assertEq(token.balanceOf(seller), AMOUNT);
        assertEq(escrow.claimable(seller), 0);
        // Buyer is untouched: balance unchanged, credit intact.
        assertEq(token.balanceOf(buyer), buyerBefore);
        assertEq(escrow.claimable(buyer), 50e6);
        assertEq(escrow.totalClaimable(), 50e6);
        assertEq(token.balanceOf(address(escrow)), 50e6);

        vm.prank(buyer);
        escrow.withdraw();
        assertEq(token.balanceOf(buyer), buyerBefore + 50e6);
        assertEq(escrow.totalClaimable(), 0);
        assertEq(token.balanceOf(address(escrow)), 0);
    }

    function test_Withdraw_AggregatesMultipleCredits() public {
        uint256 id1 = _create();
        uint256 id2 = _createAmt(30e6);
        vm.startPrank(buyer);
        escrow.releaseFunds(id1);
        escrow.releaseFunds(id2);
        vm.stopPrank();

        assertEq(escrow.claimable(seller), AMOUNT + 30e6);
        vm.prank(seller);
        assertEq(escrow.withdraw(), AMOUNT + 30e6);
        assertEq(token.balanceOf(seller), AMOUNT + 30e6);
    }

    function test_Withdraw_RevertsNothingToWithdrawForAccountWithoutCredit() public {
        uint256 id = _create();
        vm.prank(buyer);
        escrow.releaseFunds(id);

        // A stranger cannot pull the seller's credit.
        vm.prank(stranger);
        vm.expectRevert(CashlandSafePay.NothingToWithdraw.selector);
        escrow.withdraw();
        assertEq(escrow.claimable(seller), AMOUNT);
        assertEq(token.balanceOf(stranger), 0);

        // Nor can the buyer (who funded it) or the owner.
        vm.prank(buyer);
        vm.expectRevert(CashlandSafePay.NothingToWithdraw.selector);
        escrow.withdraw();
        vm.prank(owner);
        vm.expectRevert(CashlandSafePay.NothingToWithdraw.selector);
        escrow.withdraw();
    }

    function test_Withdraw_DoubleWithdrawRevertsNothingToWithdraw() public {
        uint256 id = _create();
        vm.prank(buyer);
        escrow.releaseFunds(id);

        vm.prank(seller);
        escrow.withdraw();

        vm.prank(seller);
        vm.expectRevert(CashlandSafePay.NothingToWithdraw.selector);
        escrow.withdraw();
        assertEq(token.balanceOf(seller), AMOUNT);
    }

    function testFuzz_WithdrawRoundTrip(uint256 amt) public {
        amt = bound(amt, 1, START);
        uint256 id = _createAmt(amt);
        vm.prank(buyer);
        escrow.releaseFunds(id);
        assertEq(escrow.claimable(seller), amt);
        assertEq(escrow.totalClaimable(), amt);

        vm.prank(seller);
        escrow.withdraw();
        assertEq(token.balanceOf(seller), amt);
        assertEq(token.balanceOf(address(escrow)), 0);
        assertEq(escrow.totalClaimable(), 0);
    }

    // ---------- blocklisted recipient cannot DoS settlement ----------

    function test_BlockedSellerCannotStopBuyerOrOwnerFromSettling() public {
        uint256 id1 = _create(); // buyer releases
        uint256 id2 = _createAmt(40e6); // owner resolves to seller
        uint256 id3 = _createAmt(30e6); // owner resolves to buyer
        _dispute(id2);
        _dispute(id3);

        token.setBlocked(seller, true);

        // Every settlement path still works with the seller blocked.
        vm.prank(buyer);
        escrow.releaseFunds(id1);
        vm.startPrank(owner);
        escrow.resolveDispute(id2, true);
        escrow.resolveDispute(id3, false);
        vm.stopPrank();

        assertEq(escrow.claimable(seller), AMOUNT + 40e6);
        assertEq(escrow.claimable(buyer), 30e6);

        // The other party can still collect.
        uint256 buyerBefore = token.balanceOf(buyer);
        vm.prank(buyer);
        escrow.withdraw();
        assertEq(token.balanceOf(buyer), buyerBefore + 30e6);

        // The blocked seller cannot withdraw, and their credit is preserved by the revert.
        vm.prank(seller);
        vm.expectRevert(abi.encodeWithSelector(BlocklistERC20.Blocked.selector, seller));
        escrow.withdraw();
        assertEq(escrow.claimable(seller), AMOUNT + 40e6);
        assertEq(escrow.totalClaimable(), AMOUNT + 40e6);
        assertEq(token.balanceOf(address(escrow)), AMOUNT + 40e6);

        // After unblock the seller gets everything.
        token.setBlocked(seller, false);
        vm.prank(seller);
        escrow.withdraw();
        assertEq(token.balanceOf(seller), AMOUNT + 40e6);
        assertEq(escrow.claimable(seller), 0);
        assertEq(escrow.totalClaimable(), 0);
        assertEq(token.balanceOf(address(escrow)), 0);
    }

    function test_BlockedBuyerCannotStopSellerOrOwnerFromSettling() public {
        uint256 id1 = _create(); // buyer cancels
        uint256 id2 = _createAmt(40e6); // seller engaged -> auto release
        uint256 id3 = _createAmt(30e6); // owner emergency
        vm.prank(seller);
        escrow.engageSafePay(id2);

        token.setBlocked(buyer, true);

        vm.prank(buyer);
        escrow.cancelSafePay(id1);
        vm.warp(deadline);
        escrow.triggerAutoRelease(id2);
        vm.prank(owner);
        escrow.emergencyWithdraw(id3);

        assertEq(escrow.claimable(buyer), AMOUNT + 30e6);
        assertEq(escrow.claimable(seller), 40e6);

        vm.prank(seller);
        escrow.withdraw();
        assertEq(token.balanceOf(seller), 40e6);

        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(BlocklistERC20.Blocked.selector, buyer));
        escrow.withdraw();
        assertEq(escrow.claimable(buyer), AMOUNT + 30e6);
        assertEq(escrow.totalClaimable(), AMOUNT + 30e6);

        uint256 buyerBefore = token.balanceOf(buyer);
        token.setBlocked(buyer, false);
        vm.prank(buyer);
        escrow.withdraw();
        assertEq(token.balanceOf(buyer), buyerBefore + AMOUNT + 30e6);
        assertEq(token.balanceOf(address(escrow)), 0);
        assertEq(escrow.totalClaimable(), 0);
    }

    // ---------- no double payout ----------

    function test_ResolveDisputeTwiceRevertsSafePayNotDisputed() public {
        uint256 id = _create();
        _dispute(id);
        vm.startPrank(owner);
        escrow.resolveDispute(id, true);

        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.SafePayNotDisputed.selector, id));
        escrow.resolveDispute(id, true);
        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.SafePayNotDisputed.selector, id));
        escrow.resolveDispute(id, false);
        vm.stopPrank();

        assertEq(escrow.claimable(seller), AMOUNT);
        assertEq(escrow.claimable(buyer), 0);
        assertEq(escrow.totalClaimable(), AMOUNT);
    }

    function test_ResolveDisputeRevertsOnActiveEscrow() public {
        uint256 id = _create();
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.SafePayNotDisputed.selector, id));
        escrow.resolveDispute(id, true);
        assertEq(escrow.totalClaimable(), 0);
    }

    function test_ResolveDisputeAfterEmergencyWithdrawRevertsSafePayNotDisputed() public {
        uint256 id = _create();
        _dispute(id);
        vm.startPrank(owner);
        escrow.emergencyWithdraw(id);

        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.SafePayNotDisputed.selector, id));
        escrow.resolveDispute(id, true);
        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.SafePayNotDisputed.selector, id));
        escrow.resolveDispute(id, false);
        vm.stopPrank();

        assertEq(escrow.claimable(buyer), AMOUNT);
        assertEq(escrow.claimable(seller), 0);
        assertEq(escrow.totalClaimable(), AMOUNT);
    }

    function test_EmergencyWithdrawAfterResolveRevertsSafePayAlreadyFinalized() public {
        uint256 id1 = _create();
        uint256 id2 = _create();
        _dispute(id1);
        _dispute(id2);
        vm.startPrank(owner);
        escrow.resolveDispute(id1, true);
        escrow.resolveDispute(id2, false);

        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.SafePayAlreadyFinalized.selector, id1));
        escrow.emergencyWithdraw(id1);
        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.SafePayAlreadyFinalized.selector, id2));
        escrow.emergencyWithdraw(id2);
        vm.stopPrank();

        assertEq(escrow.claimable(seller), AMOUNT);
        assertEq(escrow.claimable(buyer), AMOUNT);
        assertEq(escrow.totalClaimable(), 2 * AMOUNT);
    }

    function test_EmergencyWithdrawAfterAnySettlementRevertsAndNeverDoubleCredits() public {
        uint256 released = _create();
        uint256 cancelled = _create();
        uint256 auto_ = _create();
        _engage(auto_);

        vm.startPrank(buyer);
        escrow.releaseFunds(released);
        escrow.cancelSafePay(cancelled);
        vm.stopPrank();
        vm.warp(deadline);
        escrow.triggerAutoRelease(auto_);

        uint256 total = escrow.totalClaimable();
        assertEq(total, 3 * AMOUNT);

        vm.startPrank(owner);
        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.SafePayAlreadyFinalized.selector, released));
        escrow.emergencyWithdraw(released);
        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.SafePayAlreadyFinalized.selector, cancelled));
        escrow.emergencyWithdraw(cancelled);
        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.SafePayAlreadyFinalized.selector, auto_));
        escrow.emergencyWithdraw(auto_);
        vm.stopPrank();

        assertEq(escrow.totalClaimable(), total);
        assertEq(token.balanceOf(address(escrow)), total);
    }

    function test_SettlementPathsRevertAfterFinalization() public {
        uint256 id = _create();
        vm.prank(buyer);
        escrow.releaseFunds(id);

        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.SafePayNotActive.selector, id));
        escrow.releaseFunds(id);
        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.SafePayNotActive.selector, id));
        escrow.cancelSafePay(id);
        assertEq(escrow.totalClaimable(), AMOUNT);
    }
}

// =====================================================================================
// Invariant: contract always holds enough USDC to cover credits + live escrows
// =====================================================================================

contract CashlandSafePayPullPaymentsInvariantTest is PullPaymentsBase {
    SafePayHandler internal handler;

    function setUp() public override {
        super.setUp();
        handler = new SafePayHandler(escrow, token, owner);
        targetContract(address(handler));
    }

    function _liveEscrowSum() internal view returns (uint256 sum) {
        uint256 n = escrow.nextSafePayId() - 1;
        for (uint256 id = 1; id <= n; id++) {
            CashlandSafePay.SafePay memory sp = escrow.getSafePay(id);
            if (sp.status == CashlandSafePay.SafePayStatus.Active || sp.status == CashlandSafePay.SafePayStatus.Disputed)
            {
                sum += sp.amount;
            }
        }
    }

    /// PROPERTY: balance >= totalClaimable + sum(Active/Disputed amounts).
    function invariant_BalanceCoversClaimableAndLiveEscrows() public view {
        assertGe(token.balanceOf(address(escrow)), escrow.totalClaimable() + _liveEscrowSum());
    }

    /// PROPERTY: totalClaimable is exactly the sum of every account's claimable.
    function invariant_TotalClaimableEqualsSumOfAccounts() public view {
        uint256 sum;
        uint256 n = handler.actorCount();
        for (uint256 i = 0; i < n; i++) {
            sum += escrow.claimable(handler.actorAt(i));
        }
        assertEq(escrow.totalClaimable(), sum);
    }
}

// =====================================================================================
// Reentrancy
// =====================================================================================

contract CashlandSafePayPullPaymentsReentrancyTest is PullPaymentsBase {
    ReentrantRecipient internal evil;

    function setUp() public override {
        super.setUp();
        evil = new ReentrantRecipient(escrow);
        token.setHooksEnabled(true);
    }

    function _createFor(address to, uint256 amt) internal returns (uint256 id) {
        vm.prank(buyer);
        id = escrow.createSafePay(to, amt, "evil", deadline);
    }

    function test_ReentrantRecipientCannotDoubleWithdraw() public {
        uint256 id = _createFor(address(evil), AMOUNT);
        // A second, unrelated, engaged escrow that is already auto-releasable.
        uint256 otherId = _create();
        _engage(otherId);

        vm.prank(buyer);
        escrow.releaseFunds(id);
        vm.warp(deadline);

        // A third escrow funds the contract with extra USDC a double-withdraw could steal.
        vm.prank(buyer);
        escrow.createSafePay(seller, 500e6, "bait", deadline + 1 days);

        evil.arm(true, false, otherId);
        uint256 escrowBefore = token.balanceOf(address(escrow));

        evil.callWithdraw();

        // Paid exactly once.
        assertEq(token.balanceOf(address(evil)), AMOUNT);
        assertEq(token.balanceOf(address(escrow)), escrowBefore - AMOUNT);
        assertEq(escrow.claimable(address(evil)), 0);
        assertEq(evil.hookCalls(), 1);

        // Both re-entries were rejected by the reentrancy guard.
        assertFalse(evil.withdrawReentrySucceeded());
        assertFalse(evil.triggerReentrySucceeded());
        assertEq(bytes4(evil.withdrawReentryError()), ReentrancyGuard.ReentrancyGuardReentrantCall.selector);
        assertEq(bytes4(evil.triggerReentryError()), ReentrancyGuard.ReentrancyGuardReentrantCall.selector);

        // The unrelated escrow was not settled by the re-entry.
        assertEq(uint256(_status(otherId)), uint256(CashlandSafePay.SafePayStatus.Active));
        assertEq(escrow.claimable(seller), 0);
        assertEq(escrow.totalClaimable(), 0);
    }

    function test_BubblingReentrancyRevertsWholeWithdrawAndPreservesCredit() public {
        uint256 id = _createFor(address(evil), AMOUNT);
        vm.prank(buyer);
        escrow.releaseFunds(id);

        evil.arm(true, true, 0);
        vm.expectRevert();
        evil.callWithdraw();

        // Nothing was paid, accounting is untouched.
        assertEq(token.balanceOf(address(evil)), 0);
        assertEq(escrow.claimable(address(evil)), AMOUNT);
        assertEq(escrow.totalClaimable(), AMOUNT);
        assertEq(token.balanceOf(address(escrow)), AMOUNT);

        // Once the hook stops attacking, the credit is still withdrawable exactly once.
        evil.arm(false, false, 0);
        evil.callWithdraw();
        assertEq(token.balanceOf(address(evil)), AMOUNT);
        assertEq(escrow.totalClaimable(), 0);

        vm.expectRevert(CashlandSafePay.NothingToWithdraw.selector);
        evil.callWithdraw();
    }

    function test_ReentrantRecipientCannotBlockSettlementForOthers() public {
        uint256 evilId = _createFor(address(evil), AMOUNT);
        uint256 honestId = _create();
        evil.arm(true, true, 0);

        // Evil's credit being un-withdrawable never affects anyone else.
        vm.startPrank(buyer);
        escrow.releaseFunds(evilId);
        escrow.releaseFunds(honestId);
        vm.stopPrank();

        vm.prank(seller);
        escrow.withdraw();
        assertEq(token.balanceOf(seller), AMOUNT);
        assertEq(escrow.claimable(address(evil)), AMOUNT);
    }
}
