// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { PoolTurnTypes } from "../types/PoolTurnTypes.sol";
import { YieldManager } from "../YieldManager.sol";

abstract contract PoolTurn {
    uint256 public nextCircleId = 1;
    mapping(uint256 => PoolTurnTypes.Circle) internal circles;

    // members list per circle
    mapping(uint256 => address[]) internal membersList;

    // member info per circle
    mapping(uint256 => mapping(address => PoolTurnTypes.Member)) internal members;

    // round states per circle
    mapping(uint256 => mapping(uint256 => PoolTurnTypes.RoundState)) internal roundStates;

    // payout order per circle (rotation). Fixed size = maxMembers
    mapping(uint256 => address[]) internal payoutOrder;

    // insurance pool balances per circle (slashed fees + insurance fees go here)
    mapping(uint256 => uint256) internal insurancePool;

    // winner payouts credited (pull model). token amounts credited per address per circle
    mapping(uint256 => mapping(address => uint256)) public pendingPayouts;

    mapping(uint256 => PoolTurnTypes.CircleDetails) internal circleDetails;

    // Global ban tracking
    mapping(address => bool) public globallyBanned;
    mapping(address => uint256) public globalDefaults;

    // --- Yield & Rewards State ---

    // YieldManager contract for generating yield on insurance pool
    YieldManager public yieldManager;

    // Creator reward pool per circle (optional bonus for members with perfect payment)
    mapping(uint256 => uint256) internal creatorRewardPool;

    // Track member yield shares (accumulated from insurance pool yield)
    mapping(uint256 => mapping(address => uint256)) internal memberYieldShares;

    // Track if yield generation is enabled per circle
    mapping(uint256 => bool) internal yieldGenerationEnabled;

    // Track if member has claimed creator reward
    mapping(uint256 => mapping(address => bool)) internal creatorRewardClaimed;



    function getMembers(uint256 circleId) external view returns (address[] memory) {
        return membersList[circleId];
    }

    function getPayoutOrder(uint256 circleId) external view returns (address[] memory) {
        return payoutOrder[circleId];
    }

    function getCircleInfo(uint256 circleId)
        external
        view
        returns (
            address creator,
            address tokenAddr,
            uint256 contributionAmount,
            uint256 periodDuration,
            uint256 maxMembers,
            uint256 collateralFactor,
            uint256 insuranceFee,
            uint256 gracePeriod,
            uint256 startTimestamp,
            uint256 currentRound,
            uint256 roundStart,
            PoolTurnTypes.CircleState state
        )
    {
        PoolTurnTypes.Circle storage c = circles[circleId];
        creator = c.creator;
        tokenAddr = address(c.token);
        contributionAmount = c.contributionAmount;
        periodDuration = c.periodDuration;
        maxMembers = c.maxMembers;
        collateralFactor = c.collateralFactor;
        insuranceFee = c.insuranceFee;
        gracePeriod = c.gracePeriod;
        startTimestamp = c.startTimestamp;
        currentRound = c.currentRound;
        roundStart = c.roundStart;
        state = c.state;
    }

    function getCircleDetails(uint256 circleId) external view returns (string memory name, string memory desc) {
        PoolTurnTypes.CircleDetails storage details = circleDetails[circleId];
        name = details.name;
        desc = details.desc;
    }

    /**
     * Replace unbounded getAllCircles() with paginated version
     * @param offset Starting circle ID (inclusive)
     * @param limit Maximum number of circles to return (max 100)
     */
    function getCircles(uint256 offset, uint256 limit) external view returns (PoolTurnTypes.Circle[] memory circles_) {
        // require(limit > 0 && limit <= 100, "limit must be 1-100");
        if (limit == 0 || limit > 100) revert("limit must be 1-100");
        // require(offset > 0, "offset must be >= 1");
        if (offset == 0) revert("offset must be >= 1");

        // Calculate actual range
        uint256 start = offset;
        uint256 end = offset + limit;
        if (end > nextCircleId) {
            end = nextCircleId;
        }

        uint256 resultSize = end > start ? end - start : 0;
        circles_ = new PoolTurnTypes.Circle[](resultSize);

        for (uint256 i = 0; i < resultSize;) {
            circles_[i] = circles[start + i];
            unchecked {
                ++i;
            }
        }
    }

    /**
     * Get total number of circles created
     */
    function getTotalCircles() external view returns (uint256) {
        return nextCircleId - 1;
    }

    // Additional utility views (member info, round info, insurance pool)
    function getMemberInfo(
        uint256 circleId,
        address member
    )
        external
        view
        returns (
            bool exists,
            uint256 collateralLocked,
            uint256 insuranceContributed,
            uint256 defaults,
            bool banned,
            bool withdrawnCollateral
        )
    {
        PoolTurnTypes.Member storage m = members[circleId][member];
        exists = m.exists;
        collateralLocked = m.collateralLocked;
        insuranceContributed = m.insuranceContributed;
        defaults = m.defaults;
        banned = m.banned;
        withdrawnCollateral = m.withdrawnCollateral;
    }

    function getRoundDeposited(uint256 circleId, uint256 roundId, address member) external view returns (bool) {
        return roundStates[circleId][roundId].deposited[member];
    }

    function getInsurancePool(uint256 circleId) external view returns (uint256) {
        return insurancePool[circleId];
    }

    // --- Yield & Rewards View Functions ---

    /**
     * @notice Get member's pending yield share
     * @param circleId The circle ID
     * @param member The member address
     * @return Pending yield amount
     */
    function getMemberYieldShare(uint256 circleId, address member) external view returns (uint256) {
        return memberYieldShares[circleId][member];
    }

    /**
     * @notice Get creator reward pool balance for a circle
     * @param circleId The circle ID
     * @return Creator reward pool balance
     */
    function getCreatorRewardPool(uint256 circleId) external view returns (uint256) {
        return creatorRewardPool[circleId];
    }

    /**
     * @notice Check if member has claimed creator reward
     * @param circleId The circle ID
     * @param member The member address
     * @return True if already claimed
     */
    function hasClaimedCreatorReward(uint256 circleId, address member) external view returns (bool) {
        return creatorRewardClaimed[circleId][member];
    }

    /**
     * @notice Get pending yield for a circle from YieldManager
     * @param circleId The circle ID
     * @return Pending yield amount
     */
    function getCirclePendingYield(uint256 circleId) external view returns (uint256) {
        if (address(yieldManager) == address(0)) return 0;
        return yieldManager.getPendingYield(circleId);
    }

    /**
     * @notice Get total value (principal + yield) in YieldManager for a circle
     * @param circleId The circle ID
     * @return Total value
     */
    function getCircleTotalYieldValue(uint256 circleId) external view returns (uint256) {
        if (address(yieldManager) == address(0)) return 0;
        return yieldManager.getTotalValue(circleId);
    }

    /**
     * @notice Check if yield generation is enabled for a circle
     * @param circleId The circle ID
     * @return True if enabled
     */
    function isYieldEnabled(uint256 circleId) external view returns (bool) {
        return yieldGenerationEnabled[circleId];
    }

    /**
     * @notice Get count of members eligible for creator reward (perfect payment)
     * @param circleId The circle ID
     * @return Number of members with zero defaults
     */
    function getEligibleRewardMembers(uint256 circleId) external view returns (uint256) {
        address[] storage mems = membersList[circleId];
        uint256 memsLen = mems.length;
        uint256 count = 0;

        for (uint256 i = 0; i < memsLen;) {
            if (members[circleId][mems[i]].defaults == 0) {
                unchecked {
                    count++;
                }
            }
            unchecked {
                ++i;
            }
        }

        return count;
    }
}
