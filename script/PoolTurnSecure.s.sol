// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { Script } from "forge-std/Script.sol";
import { PoolTurnSecure } from "../src/PoolTurnSecure.sol";

contract PoolTurnSecureScript is Script {
    PoolTurnSecure public poolturn;

    function setUp() public { }

    function run() public {
        vm.startBroadcast();

        poolturn = new PoolTurnSecure();

        vm.stopBroadcast();
    }
}
