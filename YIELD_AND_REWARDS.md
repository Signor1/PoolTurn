# Yield Generation & Creator Rewards

This document describes the new yield generation and creator rewards features added to PoolTurn.

## Overview

Two new features have been implemented to enhance the PoolTurn platform:

1. **Yield-Generating Insurance Pool (Option 1)**: Insurance pool funds are automatically deposited into Aave V3 to earn yield, which is then distributed to circle members.

2. **Creator Reward Pool (Option 2)**: Circle creators can deposit bonus rewards that are distributed to members with perfect payment history (zero defaults) after circle completion.

## Features

### 1. Yield-Generating Insurance Pool

#### How It Works

- When a circle is created with `enableYield = true`, the insurance pool is automatically deposited into Aave V3 on Base Mainnet
- The deposited funds earn yield through Aave's lending protocol
- Earned yield is split between:
  - **Members (default 70%)**: Distributed equally among all circle members
  - **Protocol Treasury (default 30%)**: Supports platform development
- Members can harvest and claim their yield share at any time

#### Smart Contracts

- **YieldManager.sol**: Manages Aave V3 integration and yield distribution
  - Deposits insurance funds to Aave
  - Tracks yield earned per circle
  - Harvests and distributes yield
  - Configurable yield allocation percentage

#### Key Functions

**Admin Functions:**
```solidity
// Set the YieldManager contract (owner only)
function setYieldManager(address _yieldManager) external onlyOwner

// Configure yield allocation in YieldManager (owner only)
function setYieldAllocation(uint256 newMemberPercent) external onlyOwner
```

**User Functions:**
```solidity
// Harvest yield for a circle (anyone can call)
function harvestYield(uint256 circleId) external

// Claim your accumulated yield
function claimYield(uint256 circleId) external
```

**View Functions:**
```solidity
// Get member's pending yield share
function getMemberYieldShare(uint256 circleId, address member) external view returns (uint256)

// Get pending yield from Aave for a circle
function getCirclePendingYield(uint256 circleId) external view returns (uint256)

// Get total value (principal + yield) in Aave
function getCircleTotalYieldValue(uint256 circleId) external view returns (uint256)
```

### 2. Creator Reward Pool

#### How It Works

- When creating a circle, the creator can deposit a bonus reward amount
- After circle completion, only members with **perfect payment history** (zero defaults) are eligible
- The reward pool is split equally among eligible members
- Each eligible member can claim their share once

#### Key Functions

**Creation:**
```solidity
// Create circle with creator reward
function createCircle(
    string calldata _name,
    string calldata _desc,
    address token,
    uint256 contributionAmount,
    uint256 periodDuration,
    uint256 maxMembers,
    uint256 collateralFactor,
    uint256 insuranceFee,
    address[] calldata initialPayoutOrder,
    bool enableYield,
    uint256 creatorRewardAmount  // Bonus reward from creator
) external returns (uint256)
```

**Claiming:**
```solidity
// Claim creator reward (only eligible members with zero defaults)
function claimCreatorReward(uint256 circleId) external
```

**View Functions:**
```solidity
// Get creator reward pool balance
function getCreatorRewardPool(uint256 circleId) external view returns (uint256)

// Check if member has claimed reward
function hasClaimedCreatorReward(uint256 circleId, address member) external view returns (bool)

// Get count of eligible members
function getEligibleRewardMembers(uint256 circleId) external view returns (uint256)
```

## Deployment Guide

### 1. Deploy YieldManager

```solidity
// Deploy with treasury address
YieldManager yieldManager = new YieldManager(treasuryAddress);
```

### 2. Set YieldManager in PoolTurnSecure

```solidity
// Owner sets the YieldManager contract
poolTurn.setYieldManager(address(yieldManager));
```

### 3. Transfer YieldManager Ownership

```solidity
// Transfer YieldManager ownership to PoolTurnSecure
yieldManager.transferOwnership(address(poolTurn));
```

## Usage Examples

### Example 1: Create Circle with Yield Generation Only

```solidity
address[] memory emptyOrder;

uint256 circleId = poolTurn.createCircle(
    "Savings Circle with Yield",
    "Earn extra yield on insurance pool",
    usdcAddress,
    100e6,          // 100 USDC contribution
    7 days,         // Weekly periods
    10,             // 10 members
    2,              // 2x collateral
    10e6,           // 10 USDC insurance fee
    emptyOrder,
    true,           // Enable yield generation
    0               // No creator reward
);
```

### Example 2: Create Circle with Creator Reward Only

```solidity
// Approve tokens first
usdc.approve(address(poolTurn), 500e6); // 500 USDC reward

uint256 circleId = poolTurn.createCircle(
    "High Reward Circle",
    "500 USDC bonus for perfect payers",
    usdcAddress,
    100e6,
    7 days,
    10,
    2,
    10e6,
    emptyOrder,
    false,          // No yield generation
    500e6           // 500 USDC creator reward
);
```

### Example 3: Create Circle with Both Features

```solidity
// Approve creator reward
usdc.approve(address(poolTurn), 1000e6);

uint256 circleId = poolTurn.createCircle(
    "Premium Circle",
    "Yield + 1000 USDC reward",
    usdcAddress,
    200e6,          // 200 USDC contribution
    7 days,
    10,
    3,              // 3x collateral for safety
    20e6,           // 20 USDC insurance (will earn yield)
    emptyOrder,
    true,           // Enable yield
    1000e6          // 1000 USDC creator reward
);
```

### Example 4: Harvest and Claim Yield

```solidity
// Anyone can harvest yield for a circle
poolTurn.harvestYield(circleId);

// Member claims their accumulated yield
poolTurn.claimYield(circleId);
```

### Example 5: Claim Creator Reward

```solidity
// After circle completion, eligible members claim reward
// Requires: circle completed + zero defaults
poolTurn.claimCreatorReward(circleId);
```

## Important Notes

### Yield Generation

- **Only USDC is supported** on Aave V3 Base (USDT not available)
- Insurance pool must be non-zero for yield generation
- Yield starts accumulating when the circle becomes Active (full membership)
- Yield allocation can be adjusted by contract owner (default 70/30 split)
- Anyone can call `harvestYield()` to update yield distribution

### Creator Rewards

- Creator must approve tokens before creating circle with rewards
- Only members with **zero defaults** are eligible
- Reward is split equally among all eligible members
- Each member can only claim once
- Claims only possible after circle completion

### Gas Optimization

- Yield harvesting aggregates rewards before distribution
- Pull payment pattern used for both yield and rewards
- View functions help estimate earnings before claiming

## Security Considerations

- YieldManager uses OpenZeppelin's `SafeERC20` for all token transfers
- YieldManager ownership should be transferred to PoolTurnSecure contract
- Pull payment pattern prevents reentrancy attacks
- Double-claim protection on creator rewards
- Aave V3 integration uses battle-tested protocols

## Aave V3 Addresses (Base Mainnet)

- **Pool**: `0xA238Dd80C259a72e81d7e4664a9801593F98d1c5`
- **USDC**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **aUSDC**: `0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB`

## Testing

Comprehensive test suite included in `test/YieldAndRewards.t.sol`:

```bash
# Run yield and rewards tests
forge test --match-contract YieldAndRewardsTest

# Run all tests
forge test
```

All tests pass:
- ✅ 12 yield and rewards tests
- ✅ 32 original PoolTurn tests

## Future Enhancements

Potential improvements for future versions:

1. **Multi-token Support**: Add support for other Aave V3 assets (DAI, USDT when available)
2. **Dynamic Yield Allocation**: Allow per-circle yield split configuration
3. **NFT Rewards**: Issue achievement NFTs to perfect-payment members
4. **Compound Yield**: Auto-reinvest yields into insurance pool
5. **Governance**: Token holders vote on yield allocation percentages

## Support

For questions or issues:
- Open an issue on GitHub
- Check the test files for usage examples
- Review smart contract natspec comments

---

**Built with:**
- Solidity ^0.8.19
- OpenZeppelin Contracts
- Aave V3 Protocol
- Foundry/Forge
