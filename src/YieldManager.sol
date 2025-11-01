// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title YieldManager
 * @notice Manages yield generation for insurance pool funds via Aave V3
 * @dev Deposits idle insurance funds into Aave to earn yield
 */
import { SafeERC20, IERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IPool } from "./interfaces/IPool.sol";

interface IAToken is IERC20 {
    /**
     * @notice Returns the scaled balance of the user
     * @param user The address of the user
     * @return The scaled balance of the user
     */
    function scaledBalanceOf(address user) external view returns (uint256);
}

contract YieldManager is Ownable {
    using SafeERC20 for IERC20;
    using SafeERC20 for IAToken;

    // --- Constants ---
    // Aave V3 Pool on Base Mainnet
    IPool public constant AAVE_POOL = IPool(0xA238Dd80C259a72e81d7e4664a9801593F98d1c5);

    // USDC on Base Mainnet (official)
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    // aUSDC (Aave interest-bearing USDC) on Base
    IAToken public constant aUSDC = IAToken(0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB);

    // Yield allocation: percentage to members (rest goes to protocol treasury)
    uint256 public yieldToMembersPercent = 70; // 70% to members, 30% to treasury

    // Maximum allocation percentage (100%)
    uint256 public constant MAX_PERCENT = 100;

    // Treasury address (receives protocol share of yield)
    address public treasury;

    // --- State ---

    // Mapping: circleId => deposited amount (principal only, not including yield)
    mapping(uint256 => uint256) public circleDeposits;

    // Mapping: circleId => last recorded aToken balance (for yield calculation)
    mapping(uint256 => uint256) private lastATokenBalance;

    // Mapping: circleId => accumulated yield earned
    mapping(uint256 => uint256) public accumulatedYield;

    // Mapping: circleId => whether yield is enabled for this circle
    mapping(uint256 => bool) public yieldEnabled;

    // Total deposits across all circles
    uint256 public totalDeposits;

    // --- Events ---

    event YieldDeposited(uint256 indexed circleId, address indexed token, uint256 amount);
    event YieldWithdrawn(uint256 indexed circleId, address indexed token, uint256 amount);
    event YieldHarvested(uint256 indexed circleId, uint256 totalYield, uint256 memberShare, uint256 treasuryShare);
    event YieldAllocationUpdated(uint256 newMemberPercent);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event YieldEnabledForCircle(uint256 indexed circleId, bool enabled);

    // --- Constructor ---

    constructor(address _treasury) Ownable(msg.sender) {
        require(_treasury != address(0), "treasury zero");
        treasury = _treasury;
    }

    // --- External Functions ---

    /**
     * @notice Deposit insurance pool funds into Aave to earn yield
     * @param circleId The circle ID
     * @param token The token address to deposit (must be USDC for now)
     * @param amount The amount to deposit
     */
    function depositToYield(uint256 circleId, address token, uint256 amount) external onlyOwner {
        require(amount > 0, "amount zero");
        require(token == USDC, "only USDC supported");
        require(yieldEnabled[circleId], "yield not enabled for circle");

        // Transfer tokens from PoolTurnSecure to this contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Approve Aave Pool to spend tokens
        IERC20(token).safeIncreaseAllowance(address(AAVE_POOL), amount);

        // Supply to Aave (receive aTokens)
        AAVE_POOL.supply(token, amount, address(this), 0);

        // Update tracking
        circleDeposits[circleId] += amount;
        totalDeposits += amount;

        // Update aToken balance tracking
        lastATokenBalance[circleId] = aUSDC.balanceOf(address(this));

        emit YieldDeposited(circleId, token, amount);
    }

    /**
     * @notice Withdraw principal from Aave back to PoolTurnSecure
     * @param circleId The circle ID
     * @param token The token address (must be USDC)
     * @param amount The amount to withdraw (0 = withdraw all)
     * @param to The address to send withdrawn funds to
     */
    function withdrawFromYield(
        uint256 circleId,
        address token,
        uint256 amount,
        address to
    )
        external
        onlyOwner
        returns (uint256)
    {
        require(token == USDC, "only USDC supported");
        require(to != address(0), "recipient zero");

        uint256 circleDeposit = circleDeposits[circleId];
        require(circleDeposit > 0, "no deposits");

        // If amount is 0, withdraw all principal for this circle
        uint256 withdrawAmount = amount == 0 ? circleDeposit : amount;
        require(withdrawAmount <= circleDeposit, "exceeds deposit");

        // Harvest yield before withdrawing
        _harvestYield(circleId);

        // Withdraw from Aave
        uint256 withdrawn = AAVE_POOL.withdraw(token, withdrawAmount, to);

        // Update tracking
        circleDeposits[circleId] -= withdrawn;
        totalDeposits -= withdrawn;

        // Update aToken balance tracking
        lastATokenBalance[circleId] = aUSDC.balanceOf(address(this));

        emit YieldWithdrawn(circleId, token, withdrawn);
        return withdrawn;
    }

    /**
     * @notice Harvest earned yield and distribute between members and treasury
     * @param circleId The circle ID
     * @return memberShare Amount of yield allocated to members
     * @return treasuryShare Amount of yield allocated to treasury
     */
    function harvestYield(uint256 circleId) external onlyOwner returns (uint256 memberShare, uint256 treasuryShare) {
        return _harvestYield(circleId);
    }

    /**
     * @notice Enable or disable yield generation for a specific circle
     * @param circleId The circle ID
     * @param enabled Whether yield should be enabled
     */
    function setYieldEnabled(uint256 circleId, bool enabled) external onlyOwner {
        yieldEnabled[circleId] = enabled;
        emit YieldEnabledForCircle(circleId, enabled);
    }

    /**
     * @notice Update yield allocation percentage (only owner)
     * @param newMemberPercent New percentage for members (0-100)
     */
    function setYieldAllocation(uint256 newMemberPercent) external onlyOwner {
        require(newMemberPercent <= MAX_PERCENT, "exceeds 100%");
        yieldToMembersPercent = newMemberPercent;
        emit YieldAllocationUpdated(newMemberPercent);
    }

    /**
     * @notice Update treasury address
     * @param newTreasury New treasury address
     */
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "treasury zero");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    // --- View Functions ---

    /**
     * @notice Get current aToken balance for a circle
     * @param circleId The circle ID
     * @return Current aToken balance
     */
    function getATokenBalance(uint256 circleId) external view returns (uint256) {
        // Simplified: return proportional share of total aUSDC balance
        if (totalDeposits == 0) return 0;
        uint256 totalATokens = aUSDC.balanceOf(address(this));
        return (totalATokens * circleDeposits[circleId]) / totalDeposits;
    }

    /**
     * @notice Calculate pending yield for a circle
     * @param circleId The circle ID
     * @return Pending yield amount
     */
    function getPendingYield(uint256 circleId) public view returns (uint256) {
        if (circleDeposits[circleId] == 0 || totalDeposits == 0) return 0;

        // Get current proportional aToken balance
        uint256 totalATokens = aUSDC.balanceOf(address(this));
        uint256 currentATokenBalance = (totalATokens * circleDeposits[circleId]) / totalDeposits;
        uint256 lastBalance = lastATokenBalance[circleId];

        // Yield = current aToken balance - principal - already accumulated
        if (currentATokenBalance <= circleDeposits[circleId] + accumulatedYield[circleId]) {
            return 0;
        }

        return currentATokenBalance - circleDeposits[circleId] - accumulatedYield[circleId];
    }

    /**
     * @notice Get total value (principal + yield) for a circle
     * @param circleId The circle ID
     * @return Total value in Aave
     */
    function getTotalValue(uint256 circleId) external view returns (uint256) {
        if (totalDeposits == 0) return 0;
        uint256 totalATokens = aUSDC.balanceOf(address(this));
        return (totalATokens * circleDeposits[circleId]) / totalDeposits;
    }

    // --- Internal Functions ---

    /**
     * @notice Internal function to harvest yield
     */
    function _harvestYield(uint256 circleId) internal returns (uint256 memberShare, uint256 treasuryShare) {
        uint256 pendingYield = getPendingYield(circleId);

        if (pendingYield == 0) {
            return (0, 0);
        }

        // Calculate allocation
        memberShare = (pendingYield * yieldToMembersPercent) / MAX_PERCENT;
        treasuryShare = pendingYield - memberShare;

        // Update accumulated yield for members (they can claim from PoolTurnSecure)
        accumulatedYield[circleId] += memberShare;

        // Withdraw treasury share if > 0
        if (treasuryShare > 0) {
            AAVE_POOL.withdraw(USDC, treasuryShare, treasury);
        }

        // Update tracking
        lastATokenBalance[circleId] = aUSDC.balanceOf(address(this));

        emit YieldHarvested(circleId, pendingYield, memberShare, treasuryShare);
    }
}
