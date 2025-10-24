// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {RoscaSecure} from "../src/Rosca.sol";

contract RoscaSecureScript is Script {
    RoscaSecure public rosca;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        rosca = new RoscaSecure();

        vm.stopBroadcast();
    }
}
