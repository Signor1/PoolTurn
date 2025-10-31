// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { PoolTurnTypes } from "../types/PoolTurnTypes.sol";
import { YieldManager } from "../YieldManager.sol";

abstract contract PoolTurn {
    uint256 public nextCircleId = 1;
    mapping(uint256 => PoolTurnTypes.Circle) public circles;

    // members list per circle
    mapping(uint256 => address[]) private membersList;

    // member info per circle
    mapping(uint256 => mapping(address => PoolTurnTypes.Member)) public members;

    // round states per circle
    mapping(uint256 => mapping(uint256 => PoolTurnTypes.RoundState)) private roundStates;

    // payout order per circle (rotation). Fixed size = maxMembers
    mapping(uint256 => address[]) private payoutOrder;

    // insurance pool balances per circle (slashed fees + insurance fees go here)
    mapping(uint256 => uint256) public insurancePool;

    // winner payouts credited (pull model). token amounts credited per address per circle
    mapping(uint256 => mapping(address => uint256)) public pendingPayouts;

    mapping(uint256 => PoolTurnTypes.CircleDetails) public circleDetails;

    // Global ban tracking
    mapping(address => bool) public globallyBanned;
    mapping(address => uint256) public globalDefaults;

    // --- Yield & Rewards State ---

    // YieldManager contract for generating yield on insurance pool
    YieldManager public yieldManager;

    // Creator reward pool per circle (optional bonus for members with perfect payment)
    mapping(uint256 => uint256) public creatorRewardPool;

    // Track member yield shares (accumulated from insurance pool yield)
    mapping(uint256 => mapping(address => uint256)) public memberYieldShares;

    // Track if yield generation is enabled per circle
    mapping(uint256 => bool) public yieldGenerationEnabled;

    // Track if member has claimed creator reward
    mapping(uint256 => mapping(address => bool)) public creatorRewardClaimed;
}
