// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CashlandSafePay is Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum SafePayStatus {
        Active,
        Released,
        Disputed,
        Cancelled
    }

    struct SafePay {
        uint256 id;
        address buyer;
        address seller;
        uint256 amount;
        string description;
        SafePayStatus status;
        uint256 createdAt;
        uint256 deadline;
        bool sellerEngaged;
    }

    IERC20 public immutable usdcToken;

    uint256 public nextSafePayId = 1;

    mapping(uint256 safePayId => SafePay safePay) private _safePays;

    error ZeroAddress();
    error ZeroAmount();
    error InvalidDeadline();
    error SafePayNotFound(uint256 safePayId);
    error NotSafePayBuyer(uint256 safePayId, address caller);
    error NotSafePaySeller(uint256 safePayId, address caller);
    error SafePayNotActive(uint256 safePayId);
    error SafePayNotDisputed(uint256 safePayId);
    error DeadlinePassed(uint256 safePayId);
    error DeadlineNotReached(uint256 safePayId);
    error SellerAlreadyEngaged(uint256 safePayId);
    error CannotRenounceOwnership();
    error SafePayAlreadyFinalized(uint256 safePayId);

    event SafePayCreated(
        uint256 indexed id,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        string description,
        uint256 deadline
    );
    event FundsReleased(uint256 indexed id, address indexed buyer, address indexed seller, uint256 amount);
    event DisputeRaised(uint256 indexed id, address indexed buyer);
    event DisputeResolved(uint256 indexed id, bool releasedToSeller, address indexed resolver);
    event SafePayCancelled(uint256 indexed id, address indexed buyer, uint256 amount);
    event EmergencyWithdraw(uint256 indexed id, address indexed buyer, uint256 amount);

    constructor(address usdcToken_, address initialOwner) Ownable(initialOwner) {
        if (usdcToken_ == address(0) || initialOwner == address(0)) revert ZeroAddress();
        require(usdcToken_.code.length > 0, "Not a contract");
        usdcToken = IERC20(usdcToken_);
    }

    function renounceOwnership() public override onlyOwner {
        revert CannotRenounceOwnership();
    }

    function createSafePay(address seller, uint256 amount, string calldata description, uint256 deadline)
        external
        nonReentrant
        returns (uint256 safePayId)
    {
        if (seller == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (deadline <= block.timestamp) revert InvalidDeadline();

        safePayId = nextSafePayId;
        nextSafePayId = safePayId + 1;

        usdcToken.safeTransferFrom(msg.sender, address(this), amount);

        SafePay storage safePay = _safePays[safePayId];
        safePay.id = safePayId;
        safePay.buyer = msg.sender;
        safePay.seller = seller;
        safePay.amount = amount;
        safePay.description = description;
        safePay.status = SafePayStatus.Active;
        safePay.createdAt = block.timestamp;
        safePay.deadline = deadline;

        emit SafePayCreated(safePayId, msg.sender, seller, amount, description, deadline);
    }

    function engageSafePay(uint256 safePayId) external {
        SafePay storage safePay = _safePayOrRevert(safePayId);

        if (safePay.seller != msg.sender) revert NotSafePaySeller(safePayId, msg.sender);
        if (safePay.status != SafePayStatus.Active) revert SafePayNotActive(safePayId);

        safePay.sellerEngaged = true;
    }

    function releaseFunds(uint256 safePayId) external nonReentrant {
        SafePay storage safePay = _safePayOrRevert(safePayId);

        if (safePay.buyer != msg.sender) revert NotSafePayBuyer(safePayId, msg.sender);
        if (safePay.status != SafePayStatus.Active) revert SafePayNotActive(safePayId);

        safePay.status = SafePayStatus.Released;
        usdcToken.safeTransfer(safePay.seller, safePay.amount);

        emit FundsReleased(safePayId, safePay.buyer, safePay.seller, safePay.amount);
    }

    function raiseDispute(uint256 safePayId) external {
        SafePay storage safePay = _safePayOrRevert(safePayId);

        if (safePay.buyer != msg.sender) revert NotSafePayBuyer(safePayId, msg.sender);
        if (safePay.status != SafePayStatus.Active) revert SafePayNotActive(safePayId);
        if (block.timestamp >= safePay.deadline) revert DeadlinePassed(safePayId);

        safePay.status = SafePayStatus.Disputed;

        emit DisputeRaised(safePayId, msg.sender);
    }

    function triggerAutoRelease(uint256 safePayId) external nonReentrant {
        SafePay storage safePay = _safePayOrRevert(safePayId);

        if (safePay.status != SafePayStatus.Active) revert SafePayNotActive(safePayId);
        if (block.timestamp < safePay.deadline) revert DeadlineNotReached(safePayId);

        safePay.status = SafePayStatus.Released;
        usdcToken.safeTransfer(safePay.seller, safePay.amount);

        emit FundsReleased(safePayId, safePay.buyer, safePay.seller, safePay.amount);
    }

    function resolveDispute(uint256 safePayId, bool releaseToSeller) external onlyOwner nonReentrant {
        SafePay storage safePay = _safePayOrRevert(safePayId);

        if (safePay.status != SafePayStatus.Disputed) revert SafePayNotDisputed(safePayId);

        if (releaseToSeller) {
            safePay.status = SafePayStatus.Released;
            usdcToken.safeTransfer(safePay.seller, safePay.amount);
            emit FundsReleased(safePayId, safePay.buyer, safePay.seller, safePay.amount);
        } else {
            safePay.status = SafePayStatus.Cancelled;
            usdcToken.safeTransfer(safePay.buyer, safePay.amount);
            emit SafePayCancelled(safePayId, safePay.buyer, safePay.amount);
        }

        emit DisputeResolved(safePayId, releaseToSeller, msg.sender);
    }

    function cancelSafePay(uint256 safePayId) external nonReentrant {
        SafePay storage safePay = _safePayOrRevert(safePayId);

        if (safePay.buyer != msg.sender) revert NotSafePayBuyer(safePayId, msg.sender);
        if (safePay.status != SafePayStatus.Active) revert SafePayNotActive(safePayId);
        if (safePay.sellerEngaged) revert SellerAlreadyEngaged(safePayId);

        safePay.status = SafePayStatus.Cancelled;
        usdcToken.safeTransfer(safePay.buyer, safePay.amount);

        emit SafePayCancelled(safePayId, safePay.buyer, safePay.amount);
    }

    function emergencyWithdraw(uint256 safePayId) external onlyOwner nonReentrant {
        SafePay storage safePay = _safePayOrRevert(safePayId);

        // Emergency refunds are allowed only while funds are still escrowed.
        // Never pay out an escrow a second time after release or cancellation.
        if (safePay.status != SafePayStatus.Active && safePay.status != SafePayStatus.Disputed) {
            revert SafePayAlreadyFinalized(safePayId);
        }

        safePay.status = SafePayStatus.Cancelled;
        usdcToken.safeTransfer(safePay.buyer, safePay.amount);

        emit EmergencyWithdraw(safePayId, safePay.buyer, safePay.amount);
    }

    function getSafePay(uint256 safePayId) external view returns (SafePay memory safePay) {
        safePay = _safePays[safePayId];
        if (safePay.buyer == address(0)) revert SafePayNotFound(safePayId);
    }

    function _safePayOrRevert(uint256 safePayId) internal view returns (SafePay storage safePay) {
        safePay = _safePays[safePayId];
        if (safePay.buyer == address(0)) revert SafePayNotFound(safePayId);
    }
}
