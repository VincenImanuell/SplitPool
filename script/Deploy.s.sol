// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/SharedPool.sol";

contract DeploySharedPool is Script {
    function run() external {
        // Ambil private key dari .env
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address owner1 = vm.envAddress("OWNER1_ADDRESS");
        address owner2 = vm.envAddress("OWNER2_ADDRESS");

        // Monthly due = 0.01 ETH (bisa diubah)
        uint256 monthlyDue = 0.01 ether;

        vm.startBroadcast(deployerKey);

        SharedPool pool = new SharedPool(owner1, owner2, monthlyDue);
        console.log("SharedPool deployed at:", address(pool));

        vm.stopBroadcast();
    }
}