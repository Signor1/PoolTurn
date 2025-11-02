// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
library PoolTurnConstants {
    uint8 internal constant MAX_MEMBERS = 100; // safety cap to prevent gas bombs
    uint8 internal constant DEFAULT_BAN_THRESHOLD = 3; // defaults before ban
    uint256 internal constant MIN_PERIOD_SECONDS = 3 minutes;
    uint256 internal constant MIN_GRACE_PERIOD = 1 hours; // minimum grace period
    uint256 internal constant MAX_GRACE_PERIOD = 7 days; // maximum grace period
}