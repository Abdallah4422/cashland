// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {CashlandSafePay} from "../CashlandSafePay.sol";

contract MockUSDC is IERC20 {
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

contract CashlandSafePayEmergencyWithdrawTest is Test {
    MockUSDC private token;
    CashlandSafePay private escrow;

    address private buyer1 = address(0xBEEF);
    address private buyer2 = address(0xB0B);
    address private seller = address(0xCAFE);

    function setUp() public {
        token = new MockUSDC();
        escrow = new CashlandSafePay(address(token), address(this));

        token.mint(buyer1, 1_000);
        token.mint(buyer2, 1_000);

        vm.prank(buyer1);
        token.approve(address(escrow), type(uint256).max);
        vm.prank(buyer2);
        token.approve(address(escrow), type(uint256).max);
    }

    function _create(address buyer, uint256 amount) private returns (uint256 id) {
        vm.prank(buyer);
        id = escrow.createSafePay(seller, amount, "test purchase", block.timestamp + 1 days);
    }

    function testEmergencyWithdrawRefundsActiveEscrowOnce() public {
        uint256 id = _create(buyer1, 100);

        escrow.emergencyWithdraw(id);

        assertEq(token.balanceOf(buyer1), 1_000);
        assertEq(token.balanceOf(address(escrow)), 0);
        assertEq(uint256(escrow.getSafePay(id).status), uint256(CashlandSafePay.SafePayStatus.Cancelled));

        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.SafePayAlreadyFinalized.selector, id));
        escrow.emergencyWithdraw(id);
        assertEq(token.balanceOf(address(escrow)), 0);
    }

    function testRepeatedEmergencyWithdrawCannotDrainAnotherEscrow() public {
        uint256 firstId = _create(buyer1, 100);
        _create(buyer2, 200);

        escrow.emergencyWithdraw(firstId);

        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.SafePayAlreadyFinalized.selector, firstId));
        escrow.emergencyWithdraw(firstId);

        assertEq(token.balanceOf(address(escrow)), 200);
        assertEq(token.balanceOf(buyer2), 800);
    }

    function testEmergencyWithdrawRejectsReleasedEscrow() public {
        uint256 id = _create(buyer1, 100);

        vm.prank(buyer1);
        escrow.releaseFunds(id);

        vm.expectRevert(abi.encodeWithSelector(CashlandSafePay.SafePayAlreadyFinalized.selector, id));
        escrow.emergencyWithdraw(id);

        assertEq(token.balanceOf(seller), 100);
        assertEq(token.balanceOf(address(escrow)), 0);
    }

    function testEmergencyWithdrawCanRefundDisputedEscrow() public {
        uint256 id = _create(buyer1, 100);

        vm.prank(buyer1);
        escrow.raiseDispute(id);
        escrow.emergencyWithdraw(id);

        assertEq(token.balanceOf(buyer1), 1_000);
        assertEq(uint256(escrow.getSafePay(id).status), uint256(CashlandSafePay.SafePayStatus.Cancelled));
    }
}
