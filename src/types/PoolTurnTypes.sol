// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

library PoolTurnTypes {

    enum CircleState {
        Open,
        Active,
        Completed,
        Cancelled
    }
    struct Circle {
        address creator;
        IERC20 token; // ERC20 token used for contributions (stablecoin recommended)
        uint256 contributionAmount; // A
        uint256 periodDuration; // seconds per round
        uint256 maxMembers; // N
        uint256 collateralFactor; // CF (1 == 1x contribution)
        uint256 insuranceFee; // per-member fee added to insurance pool at join
        uint256 gracePeriod; // extra time after period before default (in seconds)
        uint256 startTimestamp; // filled when circle becomes Active
        uint256 currentRound; // 1..N
        uint256 roundStart; // timestamp of current round
        CircleState state;
        bool rotationLocked; // if true, payoutOrder cannot be changed
    }

    struct Member {
        bool exists;
        bool banned; // if true, cannot join new circles
        bool withdrawnCollateral; // whether collateral returned after completion
        uint8 defaults; // number of defaults (for reputation/ban) - max 255
        uint256 collateralLocked; // amount locked as collateral
        uint256 insuranceContributed;
    }
    struct RoundState {
        uint256 depositsMade; // number of members who deposited this round
        mapping(address => bool) deposited; // member => whether deposited this round
        mapping(address => bool) defaulted; // member => defaulted this round
        address winner; // winner for the round
        bool settled;
    }
    struct CircleDetails {
        string name;
        string desc;
    }
}
