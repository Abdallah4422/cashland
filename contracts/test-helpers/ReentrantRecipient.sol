// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {CashlandSafePay} from "../CashlandSafePay.sol";
import {ITokenReceiverHook} from "./BlocklistERC20.sol";

/// @dev Malicious recipient: when the token pays it during `withdraw()`, it re-enters the escrow.
contract ReentrantRecipient is ITokenReceiverHook {
    CashlandSafePay public immutable escrow;

    bool public armed;
    bool public bubble; // true: let the re-entrant revert bubble up; false: swallow and record it
    uint256 public otherId; // an unrelated escrow to try triggerAutoRelease on
    uint256 public hookCalls;

    bool public withdrawReentrySucceeded;
    bytes public withdrawReentryError;
    bool public triggerReentrySucceeded;
    bytes public triggerReentryError;

    constructor(CashlandSafePay escrow_) {
        escrow = escrow_;
    }

    function arm(bool armed_, bool bubble_, uint256 otherId_) external {
        armed = armed_;
        bubble = bubble_;
        otherId = otherId_;
    }

    function callWithdraw() external returns (uint256) {
        return escrow.withdraw();
    }

    function onTokenReceived() external override {
        hookCalls++;
        if (!armed || hookCalls > 1) return;

        if (bubble) {
            escrow.withdraw();
            return;
        }

        try escrow.withdraw() returns (uint256) {
            withdrawReentrySucceeded = true;
        } catch (bytes memory err) {
            withdrawReentryError = err;
        }

        try escrow.triggerAutoRelease(otherId) {
            triggerReentrySucceeded = true;
        } catch (bytes memory err) {
            triggerReentryError = err;
        }
    }
}
