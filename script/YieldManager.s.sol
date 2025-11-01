// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { Script } from "forge-std/Script.sol";
import { YieldManager } from "../src/YieldManager.sol";

contract YieldManagerScript is Script {
    YieldManager public yieldManager;

    function setUp() public { }

    function run() public {
        vm.startBroadcast();

        // Deploy with msg.sender as treasury
        yieldManager = new YieldManager(msg.sender);

        vm.stopBroadcast();
    }
}
