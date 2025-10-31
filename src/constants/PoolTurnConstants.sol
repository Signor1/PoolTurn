// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

library PoolTurnConstants {
    uint256 public constant MAX_MEMBERS = 100; // safety cap to prevent gas bombs
    uint256 public constant DEFAULT_BAN_THRESHOLD = 3; // defaults before ban
    uint256 public constant MIN_PERIOD_SECONDS = 3 minutes;
}
