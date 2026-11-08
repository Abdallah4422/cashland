// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {CashlandSafePay} from "../CashlandSafePay.sol";
import {BlocklistERC20} from "./BlocklistERC20.sol";

/// @dev Invariant handler: drives bounded, realistic random sequences against CashlandSafePay.
contract SafePayHandler is Test {
    CashlandSafePay public escrow;
    BlocklistERC20 public token;
    address public owner;

    address[] internal _actors; // buyers [0..2], sellers [3..4]

    uint256 public calls;

    constructor(CashlandSafePay escrow_, BlocklistERC20 token_, address owner_) {
        escrow = escrow_;
        token = token_;
        owner = owner_;
        for (uint256 i = 0; i < 5; i++) {
            address a = makeAddr(string.concat("actor", vm.toString(i)));
            _actors.push(a);
            token.mint(a, 1e15);
            vm.prank(a);
            token.approve(address(escrow_), type(uint256).max);
        }
    }

    function actorCount() external view returns (uint256) {
        return _actors.length;
    }

    function actorAt(uint256 i) external view returns (address) {
        return _actors[i];
    }

    function _pick(uint256 seed, uint256 lo, uint256 hi) internal view returns (address) {
        return _actors[bound(seed, lo, hi)];
    }

    function _id(uint256 seed) internal view returns (bool ok, uint256 id) {
        uint256 n = escrow.nextSafePayId() - 1;
        if (n == 0) return (false, 0);
        return (true, bound(seed, 1, n));
    }

    function create(uint256 b, uint256 s, uint256 amount, uint256 dl) external {
        calls++;
        address buyer = _pick(b, 0, 2);
        address seller = _pick(s, 3, 4);
        amount = bound(amount, 1, 1e12);
        dl = block.timestamp + bound(dl, 1, 30 days);
        vm.prank(buyer);
        try escrow.createSafePay(seller, amount, "x", dl) {} catch {}
    }

    function engage(uint256 idSeed) external {
        calls++;
        (bool ok, uint256 id) = _id(idSeed);
        if (!ok) return;
        address seller = escrow.getSafePay(id).seller;
        vm.prank(seller);
        try escrow.engageSafePay(id) {} catch {}
    }

    function release(uint256 idSeed) external {
        calls++;
        (bool ok, uint256 id) = _id(idSeed);
        if (!ok) return;
        address buyer = escrow.getSafePay(id).buyer;
        vm.prank(buyer);
        try escrow.releaseFunds(id) {} catch {}
    }

    function dispute(uint256 idSeed) external {
        calls++;
        (bool ok, uint256 id) = _id(idSeed);
        if (!ok) return;
        address buyer = escrow.getSafePay(id).buyer;
        vm.prank(buyer);
        try escrow.raiseDispute(id) {} catch {}
    }

    function cancel(uint256 idSeed) external {
        calls++;
        (bool ok, uint256 id) = _id(idSeed);
        if (!ok) return;
        address buyer = escrow.getSafePay(id).buyer;
        vm.prank(buyer);
        try escrow.cancelSafePay(id) {} catch {}
    }

    function autoRelease(uint256 idSeed) external {
        calls++;
        (bool ok, uint256 id) = _id(idSeed);
        if (!ok) return;
        try escrow.triggerAutoRelease(id) {} catch {}
    }

    function resolve(uint256 idSeed, bool toSeller) external {
        calls++;
        (bool ok, uint256 id) = _id(idSeed);
        if (!ok) return;
        vm.prank(owner);
        try escrow.resolveDispute(id, toSeller) {} catch {}
    }

    function emergency(uint256 idSeed) external {
        calls++;
        (bool ok, uint256 id) = _id(idSeed);
        if (!ok) return;
        vm.prank(owner);
        try escrow.emergencyWithdraw(id) {} catch {}
    }

    function withdraw(uint256 actorSeed) external {
        calls++;
        address a = _pick(actorSeed, 0, 4);
        vm.prank(a);
        try escrow.withdraw() {} catch {}
    }

    function warp(uint256 secs) external {
        calls++;
        vm.warp(block.timestamp + bound(secs, 1, 10 days));
    }

    function setBlocked(uint256 actorSeed, bool isBlocked) external {
        calls++;
        token.setBlocked(_pick(actorSeed, 0, 4), isBlocked);
    }
}
