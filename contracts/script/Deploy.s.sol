// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {WelcomeToWhitechain} from "../src/WelcomeToWhitechain.sol";
import {SlabRenderer} from "../src/SlabRenderer.sol";

/// Deploys the slab artwork and the badge contract. The deploying wallet becomes the owner,
/// which only allows swapping the artwork later (setRenderer).
contract Deploy is Script {
    function run() external returns (WelcomeToWhitechain badge, SlabRenderer renderer) {
        vm.startBroadcast();
        // The wallet that signs (--account, --private-key, ...). Inside a script `msg.sender` is
        // only that wallet when --sender is also passed, so read it from the broadcast instead.
        (, address deployer,) = vm.readCallers();
        renderer = new SlabRenderer();
        badge = new WelcomeToWhitechain(deployer, renderer);
        vm.stopBroadcast();

        console.log("Owner:              ", badge.owner());
        console.log("SlabRenderer:       ", address(renderer));
        console.log("WelcomeToWhitechain:", address(badge));
        console.log("Put this in web/.env -> VITE_BADGE_ADDRESS=%s", address(badge));
    }
}
