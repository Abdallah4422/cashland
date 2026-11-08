// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITokenReceiverHook {
    function onTokenReceived() external;
}

/// @dev Test-only USDC-like token with a blocklist toggle (like USDC's blacklist) and an optional
///      ERC777-style receive hook that calls back into recipient contracts during `transfer`.
contract BlocklistERC20 {
    string public name = "Mock USDC";
    string public symbol = "mUSDC";
    uint8 public constant decimals = 6;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => bool) public blocked;
    bool public hooksEnabled;

    error Blocked(address account);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function setBlocked(address account, bool isBlocked) external {
        blocked[account] = isBlocked;
    }

    function setHooksEnabled(bool enabled) external {
        hooksEnabled = enabled;
    }

    function mint(address to, uint256 amount) external {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _move(msg.sender, to, amount);
        // Post-transfer callback into contract recipients (reentrancy vector).
        if (hooksEnabled && to.code.length > 0) {
            ITokenReceiverHook(to).onTokenReceived();
        }
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        if (blocked[msg.sender]) revert Blocked(msg.sender);
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= amount, "allowance");
        if (allowed != type(uint256).max) allowance[from][msg.sender] = allowed - amount;
        _move(from, to, amount);
        return true;
    }

    function _move(address from, address to, uint256 amount) internal {
        if (blocked[from]) revert Blocked(from);
        if (blocked[to]) revert Blocked(to);
        require(balanceOf[from] >= amount, "balance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}
