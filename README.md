# PoolTurn - Decentralized Community Savings Platform

PoolTurn is a blockchain-based Rotating Savings and Credit Association (PoolTurn) platform that enables secure community savings circles with collateral protection. Built on Base Mainnet with a modern Next.js frontend.

## 🌟 Features

### Smart Contract (Solidity)

- **Collateral Protection**: Members lock collateral to ensure payment commitments
- **Rotation-based Payouts**: Deterministic winner selection without randomness
- **Insurance Pool**: Community fund to handle extreme default scenarios
- **Yield-Generating Insurance Pool** ✨ NEW: Insurance funds earn yield via Aave V3 (70% to members, 30% to protocol)
- **Creator Reward Pool** ✨ NEW: Creators can deposit bonus rewards for members with perfect payment history
- **Pull Payment Model**: Gas-efficient and reentrancy-safe payout system
- **Reputation System**: Default tracking with automatic member banning
- **Admin Controls**: Emergency functions with strict access controls

### Frontend (Next.js)

- **Modern UI**: Built with Next.js 15, Tailwind CSS, and shadcn/ui components
- **Web3 Integration**: wagmi + RainbowKit for seamless wallet connections
- **Base Network**: Optimized for fast, low-cost transactions on Ethereum L2
- **Responsive Design**: Mobile-first design with glassmorphism effects
- **Real-time Updates**: Live circle status and payment tracking

## 🏗️ Architecture

```
├── src/
│   ├── PoolTurnSecure.sol         # Main PoolTurn smart contract
│   ├── YieldManager.sol           # ✨ NEW: Aave V3 yield generation manager
│   ├── USDC.sol                   # Mock USDC token (for testing)
│   └── USDT.sol                   # Mock USDT token (for testing)
├── test/
│   ├── PoolTurnSecure.t.sol       # Comprehensive test suite (32 tests)
│   └── YieldAndRewards.t.sol      # ✨ NEW: Yield & rewards test suite (12 tests)
├── frontend/                      # Next.js application
│   ├── app/                       # App Router pages
│   ├── components/                # UI components
│   ├── lib/                       # Web3 configuration
│   ├── hooks/                     # Custom React hooks
│   └── abi/                       # Contract ABIs
├── YIELD_AND_REWARDS.md           # ✨ NEW: Complete yield & rewards documentation
└── foundry.toml                   # Foundry configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Foundry
- Git

### Smart Contract Development

```shell
# Build contracts
forge build

# Run all tests (44 total: 32 core + 12 yield/rewards)
forge test

# Run tests with gas reporting
forge test --gas-report

# Format code
forge fmt

# Generate gas snapshots
forge snapshot
```

### Frontend Development

```shell
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

### Environment Setup

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_RPC_URL=https://base-mainnet.g.alchemy.com/v2/your_alchemy_key
NEXT_PUBLIC_POOLTURN_CONTRACT_ADDRESS=your_deployed_contract_address
NEXT_PUBLIC_YIELDMANAGER_CONTRACT_ADDRESS=your_yieldmanager_address
NEXT_PUBLIC_MULTICALL3_ADDRESS=0xcA11bde05977b3631167028862bE2a173976CA11
NEXT_PUBLIC_USDC_ADDRESS=your_usdc_token_address
NEXT_PUBLIC_USDT_ADDRESS=your_usdt_token_address
```

## 📋 How It Works

### 1. Circle Creation

- Creator sets contribution amount, period duration, max members
- Defines collateral factor (1x-10x contribution as security)
- Optional insurance fee for community protection pool
- **✨ NEW**: Optional yield generation (insurance pool earns via Aave V3)
- **✨ NEW**: Optional creator reward pool for perfect-payment members

### 2. Member Joining

- Members lock collateral + insurance fee to join
- Circle activates when reaching maximum capacity
- **✨ NEW**: Insurance pool automatically deposited to Aave if yield enabled
- Payout order is set deterministically

### 3. Contribution Rounds

- Members contribute each period (weekly/monthly)
- Winners receive full pot based on rotation
- Defaulters have collateral slashed automatically
- **✨ NEW**: Yield accumulates on insurance pool during circle lifecycle

### 4. Payout Claims

- Winners can claim payouts using pull payment pattern
- Collateral returned after successful circle completion
- Insurance pool covers extreme scenarios
- **✨ NEW**: Members claim their share of earned yield
- **✨ NEW**: Perfect-payment members claim creator rewards after completion

## 🧪 Testing

The project includes a comprehensive test suite with **44 tests** covering:

### Core Functionality (32 tests)

- **Circle Creation**: Parameter validation and initialization
- **Member Management**: Joining, collateral locking, activation
- **Contribution Mechanics**: Payments, defaults, winner selection
- **Payout System**: Claims, collateral withdrawal
- **Admin Functions**: Pause, cancel, emergency procedures
- **Edge Cases**: Insurance pool usage, reputation system
- **Security**: Access control, reentrancy protection

### ✨ Yield & Rewards (12 tests)

- **YieldManager Setup**: Contract deployment and configuration
- **Yield Generation**: Insurance pool deposit to Aave, yield harvesting
- **Yield Distribution**: Member yield shares and claims
- **Creator Rewards**: Reward pool deposits, eligibility checks, claims
- **Edge Cases**: Double claims, non-eligible members, completed circles

```shell
# Run all tests
forge test

# Run specific test
forge test --match-test testCreateCircleSuccess

# Run with verbose output
forge test -vv
```

## ✨ Yield & Rewards Features

### Yield-Generating Insurance Pool

Insurance pool funds automatically earn yield through Aave V3 on Base Mainnet when enabled:

- **Automated Yield**: Insurance pool deposited to Aave when circle activates
- **Member Benefits**: 70% of earned yield distributed to all circle members
- **Protocol Treasury**: 30% of yield supports platform development
- **Supported Tokens**: USDC only (USDT not available on Aave V3 Base)
- **Flexible Claiming**: Members can harvest and claim yield anytime

### Creator Reward Pool

Circle creators can incentivize perfect payment behavior with bonus rewards:

- **Optional Deposit**: Creators fund reward pool during circle creation
- **Eligibility**: Only members with zero defaults qualify
- **Equal Distribution**: Reward split equally among all eligible members
- **Post-Completion**: Claimable only after circle successfully completes
- **One-Time Claim**: Each eligible member claims their share once

For complete documentation and usage examples, see [YIELD_AND_REWARDS.md](./YIELD_AND_REWARDS.md).

## 🌐 Network Information

**Base Mainnet**
- Chain ID: 8453
- RPC URL: https://base-mainnet.g.alchemy.com/v2/{YOUR_API_KEY}
- Explorer: https://basescan.org
- Native Currency: ETH

### 📋 Deployed Contracts

**PoolTurnSecure Main Contract**
- Address: [0x0530776AF89fEBb03933fa27613Fc6C7446a1b10](https://basescan.org/address/0x0530776AF89fEBb03933fa27613Fc6C7446a1b10)
- Description: Main PoolTurn smart contract handling circle creation, member management, and payout distribution

**Multicall3 Contract**
- Address: [0xcA11bde05977b3631167028862bE2a173976CA11](https://basescan.org/address/0xcA11bde05977b3631167028862bE2a173976CA11)
- Description: Efficient batch contract calls for fetching multiple circle data

**USDC Mock Token**
- Address: [0x6b54e6ec75eEb7c6cD1889cD3cBB858E6734471D](https://basescan.org/address/0x6b54e6ec75eEb7c6cD1889cD3cBB858E6734471D)
- Description: Mock USDC token deployed for this project (6 decimals)

**USDT Mock Token**
- Address: [0x6c925BE58927c5eD7f907a8126BC6F733F87c3B0](https://basescan.org/address/0x6c925BE58927c5eD7f907a8126BC6F733F87c3B0)
- Description: Mock USDT token deployed for this project (6 decimals)


## 📦 Technology Stack

### Smart Contracts

- **Solidity** ^0.8.19
- **Foundry** for development and testing
- **OpenZeppelin** for security primitives
- **ERC20** token support for contributions
- **Aave V3** ✨ NEW: Yield generation on insurance pools

### Frontend
- **Next.js** 15.2.4 with App Router
- **wagmi** v2.12.29 for Web3 functionality
- **RainbowKit** v2.2.5 for wallet connections
- **viem** v2.21.45 for blockchain interactions
- **Tailwind CSS** + **shadcn/ui** for styling
- **TypeScript** for type safety

## 🔐 Security Features

- **Pull Payment Pattern**: Prevents reentrancy attacks
- **Collateral Slashing**: Automatic default handling
- **Access Controls**: Owner-only admin functions
- **Input Validation**: Comprehensive parameter checking
- **Emergency Functions**: Circuit breakers for extreme cases
- **Reputation Tracking**: Prevents repeat defaulters

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Run tests: `forge test && cd frontend && npm run lint`
4. Commit changes with descriptive messages
5. Submit a pull request

## ⚠️ Disclaimer

**Important Notice:**
- This project is deployed on **Base Mainnet** but uses **mock ERC20 tokens** (USDC and USDT) that were deployed specifically for this project.
- These mock tokens are NOT the official USDC/USDT tokens. Use with caution.
- This smart contract has **NOT been professionally audited**. Use at your own risk.
- For production use with real funds, conduct thorough security audits and use official tokens.
- The developers are not responsible for any loss of funds.
