// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/SharedPool.sol";

contract SharedPoolTest is Test {
    SharedPool pool;
    address user1 = address(0x1);
    address user2 = address(0x2);
    uint256 monthlyDue = 0.01 ether;

    function setUp() public {
        pool = new SharedPool(user1, user2, monthlyDue);
        // Kasih ETH ke user1 dan user2 untuk testing
        vm.deal(user1, 1 ether);
        vm.deal(user2, 1 ether);
    }

    // Test deposit berhasil
    function test_Deposit() public {
        vm.prank(user1);
        pool.deposit{value: 0.01 ether}();

        assertEq(pool.poolBalance(), 0.01 ether);
    }

    // Test jatah tersisa setelah deposit
    function test_RemainingQuota() public {
        vm.prank(user1);
        pool.deposit{value: 0.01 ether}();

        assertEq(pool.remainingQuota(user1), 0.01 ether);
        assertEq(pool.remainingQuota(user2), 0);
    }

    // Test submit dan approve klaim
    function test_SubmitAndApproveClaim() public {
        // Kedua user deposit
        vm.prank(user1);
        pool.deposit{value: 0.01 ether}();
        vm.prank(user2);
        pool.deposit{value: 0.01 ether}();

        // User1 submit klaim
        vm.prank(user1);
        pool.submitClaim(0.005 ether, "ipfs://fakehash123");

        // User2 approve klaim user1
        uint256 balanceBefore = user1.balance;
        vm.prank(user2);
        pool.approveClaim(0);

        // User1 harus terima uang
        assertGt(user1.balance, balanceBefore);
    }

    // Test klaim melebihi jatah → harus revert
    function test_ClaimExceedsQuota() public {
        vm.prank(user1);
        pool.deposit{value: 0.01 ether}();
        vm.prank(user2);
        pool.deposit{value: 0.01 ether}();

        // User1 coba klaim lebih dari depositnya sendiri → harus gagal
        vm.prank(user1);
        vm.expectRevert("Melebihi jatah bulan ini");
        pool.submitClaim(0.02 ether, "ipfs://fakehash123");
    }

    // Test tidak bisa approve klaim sendiri
    function test_CannotApproveSelf() public {
        vm.prank(user1);
        pool.deposit{value: 0.01 ether}();

        vm.prank(user1);
        pool.submitClaim(0.005 ether, "ipfs://fakehash123");

        vm.prank(user1);
        vm.expectRevert("Tidak bisa approve klaim sendiri");
        pool.approveClaim(0);
    }
}