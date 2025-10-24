// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {USDCToken} from "../src/USDC.sol";

contract USDCScript is Script {
    USDCToken public usdc;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        usdc = new USDCToken();

        vm.stopBroadcast();
    }
}
