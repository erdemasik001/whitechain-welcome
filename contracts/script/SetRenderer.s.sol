// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {WelcomeToWhitechain} from "../src/WelcomeToWhitechain.sol";
import {IWelcomeRenderer} from "../src/IWelcomeRenderer.sol";

/// Points the badge at a new artwork contract. Use once the final design is deployed.
/// Env: BADGE_ADDRESS, RENDERER_ADDRESS
contract SetRenderer is Script {
    function run() external {
        WelcomeToWhitechain badge = WelcomeToWhitechain(vm.envAddress("BADGE_ADDRESS"));
        IWelcomeRenderer renderer = IWelcomeRenderer(vm.envAddress("RENDERER_ADDRESS"));

        vm.startBroadcast();
        badge.setRenderer(renderer);
        vm.stopBroadcast();

        console.log("Badge now renders with", address(renderer));
    }
}
