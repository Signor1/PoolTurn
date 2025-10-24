// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { Script } from "forge-std/Script.sol";
import { USDTToken } from "../src/USDT.sol";

contract USDTScript is Script {
    USDTToken public usdt;

    function setUp() public { }

    function run() public {
        vm.startBroadcast();

        usdt = new USDTToken();

        vm.stopBroadcast();
    }
}
