// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { Test } from "forge-std/Test.sol";
import { PoolTurnSecure } from "../src/PoolTurnSecure.sol";
import { PoolTurnTypes } from "../src/types/PoolTurnTypes.sol";
import { YieldManager } from "../src/YieldManager.sol";
import { ERC20Mock } from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";
// import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title YieldAndRewardsTest
 * @notice Comprehensive tests for yield generation and creator rewards functionality
 * @dev Tests both Option 1 (Yield-Generating Insurance Pool) and Option 2 (Creator Reward Pool)
 */
contract YieldAndRewardsTest is Test {
    PoolTurnSecure public poolturn;
    YieldManager public yieldManager;
    ERC20Mock public token;

    address public owner = address(this);
    address public treasury = address(0x99);
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public carol = address(0x3);
    address public dave = address(0x4);

    // Circle parameters
    uint256 constant CONTRIBUTION_AMOUNT = 100e6; // 100 USDC (6 decimals)
    uint256 constant PERIOD_DURATION = 7 days;
    uint256 constant MAX_MEMBERS = 4;
    uint256 constant COLLATERAL_FACTOR = 2;
    uint256 constant INSURANCE_FEE = 10e6; // 10 USDC
    uint256 constant CREATOR_REWARD = 100e6; // 100 USDC bonus

    // Events
    event YieldManagerSet(address indexed yieldManager);
    event YieldGenerationToggled(uint256 indexed circleId, bool enabled);
    event YieldHarvestedForCircle(uint256 indexed circleId, uint256 totalYield, uint256 memberShare);
    event MemberYieldClaimed(uint256 indexed circleId, address indexed member, uint256 amount);
    event CreatorRewardDeposited(uint256 indexed circleId, address indexed creator, uint256 amount);
    event CreatorRewardClaimed(uint256 indexed circleId, address indexed member, uint256 amount);

    function setUp() public {
        // Deploy contracts
        poolturn = new PoolTurnSecure();
        yieldManager = new YieldManager(treasury);
        token = new ERC20Mock();

        // Set YieldManager in PoolTurnSecure
        poolturn.setYieldManager(address(yieldManager));

        // Transfer YieldManager ownership to PoolTurnSecure
        yieldManager.transferOwnership(address(poolturn));

        // Fund test accounts
        address[] memory accounts = new address[](5);
        accounts[0] = owner;
        accounts[1] = alice;
        accounts[2] = bob;
        accounts[3] = carol;
        accounts[4] = dave;

        for (uint256 i = 0; i < accounts.length; i++) {
            token.mint(accounts[i], 10000e6); // 10,000 tokens each
        }
    }

    // ================================
    // YieldManager Setup Tests
    // ================================

    function testSetYieldManager() public {
        PoolTurnSecure newPoolTurn = new PoolTurnSecure();
        YieldManager newYieldManager = new YieldManager(treasury);

        vm.expectEmit(true, false, false, true);
        emit YieldManagerSet(address(newYieldManager));

        newPoolTurn.setYieldManager(address(newYieldManager));

        assertEq(address(newPoolTurn.yieldManager()), address(newYieldManager));
    }

    function testSetYieldManagerRevertsZeroAddress() public {
        PoolTurnSecure newPoolTurn = new PoolTurnSecure();

        vm.expectRevert("zero address");
        newPoolTurn.setYieldManager(address(0));
    }

    function testSetYieldManagerOnlyOwner() public {
        PoolTurnSecure newPoolTurn = new PoolTurnSecure();
        YieldManager newYieldManager = new YieldManager(treasury);

        vm.prank(alice);
        vm.expectRevert();
        newPoolTurn.setYieldManager(address(newYieldManager));
    }

    // ================================
    // Circle Creation with Yield Tests
    // ================================

    function testCreateCircleWithYieldEnabled() public {
        address[] memory emptyOrder;

        vm.expectEmit(true, false, false, true);
        emit YieldGenerationToggled(1, true);

        uint256 circleId = poolturn.createCircle(
            "Yield Circle",
            "A circle with yield generation",
            address(token),
            CONTRIBUTION_AMOUNT,
            PERIOD_DURATION,
            MAX_MEMBERS,
            COLLATERAL_FACTOR,
            INSURANCE_FEE,
            emptyOrder,
            true, // enable yield
            0, // no creator reward
            1 hours // grace period
        );

        assertTrue(poolturn.isYieldEnabled(circleId));
    }

    function testCreateCircleWithoutYieldManager() public {
        PoolTurnSecure newPoolTurn = new PoolTurnSecure();
        address[] memory emptyOrder;

        vm.expectRevert("YieldManager not set");
        newPoolTurn.createCircle(
            "Test Circle",
            "Description",
            address(token),
            CONTRIBUTION_AMOUNT,
            PERIOD_DURATION,
            MAX_MEMBERS,
            COLLATERAL_FACTOR,
            INSURANCE_FEE,
            emptyOrder,
            true, // enable yield
            0,
            1 hours // grace period
        );
    }

    // ================================
    // Creator Reward Pool Tests
    // ================================

    function testCreateCircleWithCreatorReward() public {
        address[] memory emptyOrder;

        uint256 ownerBalanceBefore = token.balanceOf(owner);

        token.approve(address(poolturn), CREATOR_REWARD);

        vm.expectEmit(true, true, false, true);
        emit CreatorRewardDeposited(1, owner, CREATOR_REWARD);

        uint256 circleId = poolturn.createCircle(
            "Reward Circle",
            "A circle with creator rewards",
            address(token),
            CONTRIBUTION_AMOUNT,
            PERIOD_DURATION,
            MAX_MEMBERS,
            COLLATERAL_FACTOR,
            INSURANCE_FEE,
            emptyOrder,
            false, // no yield
            CREATOR_REWARD,
            1 hours // grace period
        );

        assertEq(poolturn.getCreatorRewardPool(circleId), CREATOR_REWARD);
        assertEq(token.balanceOf(owner), ownerBalanceBefore - CREATOR_REWARD);
    }

    function testCreateCircleWithYieldAndReward() public {
        address[] memory emptyOrder;

        token.approve(address(poolturn), CREATOR_REWARD);

        uint256 circleId = poolturn.createCircle(
            "Full Features Circle",
            "Yield + Rewards",
            address(token),
            CONTRIBUTION_AMOUNT,
            PERIOD_DURATION,
            MAX_MEMBERS,
            COLLATERAL_FACTOR,
            INSURANCE_FEE,
            emptyOrder,
            true, // enable yield
            CREATOR_REWARD, // with creator reward
            1 hours // grace period
        );

        assertTrue(poolturn.isYieldEnabled(circleId));
        assertEq(poolturn.getCreatorRewardPool(circleId), CREATOR_REWARD);
    }

    // ================================
    // Creator Reward Claiming Tests
    // ================================

    function testClaimCreatorRewardSuccess() public {
        // Create circle with reward
        address[] memory emptyOrder;
        token.approve(address(poolturn), CREATOR_REWARD);

        uint256 circleId = poolturn.createCircle(
            "Reward Circle",
            "Description",
            address(token),
            CONTRIBUTION_AMOUNT,
            PERIOD_DURATION,
            MAX_MEMBERS,
            COLLATERAL_FACTOR,
            INSURANCE_FEE,
            emptyOrder,
            false,
            CREATOR_REWARD,
            1 hours // grace period
        );

        // Join circle with 4 members
        joinCircleWithApproval(circleId, alice);
        joinCircleWithApproval(circleId, bob);
        joinCircleWithApproval(circleId, carol);
        joinCircleWithApproval(circleId, dave);

        // Complete all rounds successfully (no defaults)
        for (uint256 round = 1; round <= MAX_MEMBERS; round++) {
            contributeWithApproval(circleId, alice);
            contributeWithApproval(circleId, bob);
            contributeWithApproval(circleId, carol);
            contributeWithApproval(circleId, dave);
        }

        // Circle should be completed
        (,,,,,,,,,,, PoolTurnTypes.CircleState state) = poolturn.getCircleInfo(circleId);
        assertEq(uint256(state), uint256(PoolTurnTypes.CircleState.Completed));

        // All 4 members have perfect payment, so each gets 25 USDC
        uint256 expectedReward = CREATOR_REWARD / 4;

        uint256 aliceBalanceBefore = token.balanceOf(alice);

        // Alice claims reward
        vm.prank(alice);
        vm.expectEmit(true, true, false, true);
        emit CreatorRewardClaimed(circleId, alice, expectedReward);
        poolturn.claimCreatorReward(circleId);

        assertEq(token.balanceOf(alice), aliceBalanceBefore + expectedReward);
        assertTrue(poolturn.hasClaimedCreatorReward(circleId, alice));
    }

    function testClaimCreatorRewardWithDefaults() public {
        // Create circle with reward
        address[] memory emptyOrder;
        token.approve(address(poolturn), CREATOR_REWARD);

        uint256 circleId = poolturn.createCircle(
            "Reward Circle",
            "Description",
            address(token),
            CONTRIBUTION_AMOUNT,
            PERIOD_DURATION,
            MAX_MEMBERS,
            COLLATERAL_FACTOR,
            INSURANCE_FEE,
            emptyOrder,
            false,
            CREATOR_REWARD,
            1 hours // grace period
        );

        // Join circle
        joinCircleWithApproval(circleId, alice);
        joinCircleWithApproval(circleId, bob);
        joinCircleWithApproval(circleId, carol);
        joinCircleWithApproval(circleId, dave);

        // Round 1: Bob defaults
        contributeWithApproval(circleId, alice);
        // bob skips
        contributeWithApproval(circleId, carol);
        contributeWithApproval(circleId, dave);

        // Advance time and finalize
        vm.warp(block.timestamp + PERIOD_DURATION + 1 hours + 1);
        poolturn.finalizeRoundIfExpired(circleId);

        // Complete remaining rounds with everyone paying
        for (uint256 round = 2; round <= MAX_MEMBERS; round++) {
            contributeWithApproval(circleId, alice);
            contributeWithApproval(circleId, bob);
            contributeWithApproval(circleId, carol);
            contributeWithApproval(circleId, dave);
        }

        // Only Alice, Carol, and Dave are eligible (3 members)
        uint256 expectedReward = CREATOR_REWARD / 3;

        // Alice can claim
        vm.prank(alice);
        poolturn.claimCreatorReward(circleId);

        // Bob cannot claim (has defaults)
        vm.prank(bob);
        vm.expectRevert("has defaults, not eligible");
        poolturn.claimCreatorReward(circleId);

        assertEq(poolturn.getEligibleRewardMembers(circleId), 3);
    }

    function testClaimCreatorRewardDoubleClaim() public {
        // Create and complete circle
        address[] memory emptyOrder;
        token.approve(address(poolturn), CREATOR_REWARD);

        uint256 circleId = poolturn.createCircle(
            "Reward Circle",
            "Description",
            address(token),
            CONTRIBUTION_AMOUNT,
            PERIOD_DURATION,
            MAX_MEMBERS,
            COLLATERAL_FACTOR,
            INSURANCE_FEE,
            emptyOrder,
            false,
            CREATOR_REWARD,
            1 hours // grace period
        );

        joinCircleWithApproval(circleId, alice);
        joinCircleWithApproval(circleId, bob);
        joinCircleWithApproval(circleId, carol);
        joinCircleWithApproval(circleId, dave);

        for (uint256 round = 1; round <= MAX_MEMBERS; round++) {
            contributeWithApproval(circleId, alice);
            contributeWithApproval(circleId, bob);
            contributeWithApproval(circleId, carol);
            contributeWithApproval(circleId, dave);
        }

        // Alice claims once
        vm.prank(alice);
        poolturn.claimCreatorReward(circleId);

        // Alice tries to claim again
        vm.prank(alice);
        vm.expectRevert("already claimed");
        poolturn.claimCreatorReward(circleId);
    }

    function testClaimCreatorRewardCircleNotCompleted() public {
        address[] memory emptyOrder;
        token.approve(address(poolturn), CREATOR_REWARD);

        uint256 circleId = poolturn.createCircle(
            "Reward Circle",
            "Description",
            address(token),
            CONTRIBUTION_AMOUNT,
            PERIOD_DURATION,
            MAX_MEMBERS,
            COLLATERAL_FACTOR,
            INSURANCE_FEE,
            emptyOrder,
            false,
            CREATOR_REWARD,
            1 hours // grace period
        );

        joinCircleWithApproval(circleId, alice);

        vm.prank(alice);
        vm.expectRevert("circle not completed");
        poolturn.claimCreatorReward(circleId);
    }

    // ================================
    // View Functions Tests
    // ================================

    function testGetEligibleRewardMembers() public {
        address[] memory emptyOrder;
        token.approve(address(poolturn), CREATOR_REWARD);

        uint256 circleId = poolturn.createCircle(
            "Test",
            "Test",
            address(token),
            CONTRIBUTION_AMOUNT,
            PERIOD_DURATION,
            MAX_MEMBERS,
            COLLATERAL_FACTOR,
            INSURANCE_FEE,
            emptyOrder,
            false,
            CREATOR_REWARD,
            1 hours // grace period
        );

        joinCircleWithApproval(circleId, alice);
        joinCircleWithApproval(circleId, bob);
        joinCircleWithApproval(circleId, carol);
        joinCircleWithApproval(circleId, dave);

        // Initially all 4 members are eligible
        assertEq(poolturn.getEligibleRewardMembers(circleId), 4);

        // Bob defaults in round 1
        contributeWithApproval(circleId, alice);
        contributeWithApproval(circleId, carol);
        contributeWithApproval(circleId, dave);

        vm.warp(block.timestamp + PERIOD_DURATION + 1 hours + 1);
        poolturn.finalizeRoundIfExpired(circleId);

        // Now only 3 eligible
        assertEq(poolturn.getEligibleRewardMembers(circleId), 3);
    }

    // ================================
    // Helper Functions
    // ================================

    function joinCircleWithApproval(uint256 circleId, address member) internal {
        (,,,,, uint256 collateralFactor, uint256 insuranceFee,,,,,) = poolturn.getCircleInfo(circleId);
        uint256 totalLock = CONTRIBUTION_AMOUNT * collateralFactor + insuranceFee;
        vm.startPrank(member);
        token.approve(address(poolturn), totalLock);
        poolturn.joinCircle(circleId);
        vm.stopPrank();
    }

    function contributeWithApproval(uint256 circleId, address member) internal {
        vm.startPrank(member);
        token.approve(address(poolturn), CONTRIBUTION_AMOUNT);
        poolturn.contribute(circleId);
        vm.stopPrank();
    }
}
