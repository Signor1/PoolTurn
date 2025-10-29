# Deployment Guide

This guide covers deploying the PoolTurn ROSCA smart contracts and frontend application.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Smart Contract Deployment](#smart-contract-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Environment Configuration](#environment-configuration)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools
- **Foundry** - Smart contract development framework
- **Node.js** v18+ - JavaScript runtime
- **Git** - Version control
- **Wallet** with:
  - ETH for gas fees on Base network
  - Private key with funds for deployment

### Network Information
- **Base Mainnet**
  - Chain ID: 8453
  - RPC URL: `https://mainnet.base.org`
  - Explorer: https://basescan.org

- **Base Sepolia (Testnet)**
  - Chain ID: 84532
  - RPC URL: `https://sepolia.base.org`
  - Faucet: https://portal.cdp.coinbase.com/

---

## Smart Contract Deployment

### 1. Setup Environment Variables

Create a `.env` file in the project root:

```bash
# Network RPC URLs
BASE_RPC_URL="https://mainnet.base.org"
BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"

# Deployer private key (NEVER commit this)
PRIVATE_KEY="your_private_key_here"

# Optional: Etherscan API key for verification
BASESCAN_API_KEY="your_basescan_api_key"
```

**⚠️ Security Warning**: Never commit your `.env` file or private keys to version control!

### 2. Compile Contracts

```bash
# Clean previous builds
forge clean

# Compile contracts
forge build

# Verify compilation
forge build --sizes
```

### 3. Run Tests

```bash
# Run all tests
forge test

# Run tests with gas report
forge test --gas-report

# Run tests with detailed output
forge test -vvv
```

### 4. Deploy Mock Tokens (Testnet Only)

For testnets, deploy mock USDC and USDT tokens:

```bash
# Deploy USDC
forge script script/USDC.s.sol:USDCScript \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY

# Deploy USDT
forge script script/USDT.s.sol:USDTScript \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY
```

**Note the deployed token addresses** for the next step.

### 5. Deploy PoolTurnSecure Contract

```bash
# Deploy to testnet
forge script script/PoolTurnSecure.s.sol:PoolTurnSecureScript \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY

# Deploy to mainnet (use with caution!)
forge script script/PoolTurnSecure.s.sol:PoolTurnSecureScript \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY
```

### 6. Using Makefile (Alternative)

The project includes a Makefile for convenience:

```bash
# Deploy to testnet
make deploy-testnet

# Deploy to mainnet
make deploy-mainnet
```

### 7. Verify Contracts (if not auto-verified)

```bash
forge verify-contract \
  --chain-id 8453 \
  --compiler-version v0.8.19 \
  <CONTRACT_ADDRESS> \
  src/PoolTurnSecure.sol:PoolTurnSecure \
  --etherscan-api-key $BASESCAN_API_KEY
```

### 8. Update Contract Addresses

After deployment, update the contract addresses in:
- `frontend/lib/config.ts`
- `frontend/abi/` (if ABIs changed)
- README.md

---

## Frontend Deployment

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Create `frontend/.env.local`:

```bash
# WalletConnect Project ID (get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your_project_id"

# Contract Addresses (from deployment step)
NEXT_PUBLIC_POOLTURN_CONTRACT="0x..."
NEXT_PUBLIC_USDC_ADDRESS="0x..."
NEXT_PUBLIC_USDT_ADDRESS="0x..."

# Network Configuration
NEXT_PUBLIC_CHAIN_ID="8453"

# Optional: Analytics
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
```

### 3. Update Configuration

Edit `frontend/lib/config.ts`:

```typescript
export const POOLTURN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_POOLTURN_CONTRACT as `0x${string}`;

export const SUPPORTED_TOKENS = {
  USDC: {
    address: process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`,
    symbol: 'USDC',
    decimals: 6,
  },
  // ... other tokens
};
```

### 4. Build and Test

```bash
# Type checking
npm run type-check

# Build for production
npm run build

# Test production build locally
npm run start
```

### 5. Deploy to Vercel (Recommended)

#### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

#### Manual Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### Configure Vercel Environment Variables

In Vercel Dashboard:
1. Go to **Project Settings** → **Environment Variables**
2. Add all variables from `.env.local`
3. Redeploy

### 6. Alternative Deployment Options

#### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

**netlify.toml:**
```toml
[build]
  command = "npm run build"
  publish = "frontend/.next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

#### Self-Hosted

```bash
# Build
npm run build

# Start production server
npm run start

# Or use PM2 for process management
pm2 start npm --name "poolturn-frontend" -- start
```

**With Docker:**
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t poolturn-frontend .
docker run -p 3000:3000 poolturn-frontend
```

---

## Environment Configuration

### Production Checklist

- [ ] Use official USDC/USDT contracts (not mocks)
- [ ] Contract addresses are correct
- [ ] WalletConnect Project ID is configured
- [ ] Environment variables are set in deployment platform
- [ ] Smart contracts are verified on BaseScan
- [ ] Test all major flows (create, join, contribute, claim)
- [ ] Set up error monitoring (Sentry, LogRocket, etc.)
- [ ] Configure analytics (Google Analytics, Mixpanel, etc.)
- [ ] Set up uptime monitoring
- [ ] Review security settings

### Security Best Practices

1. **Never expose private keys**
   - Use environment variables
   - Use hardware wallets for mainnet deployments
   - Rotate keys regularly

2. **Smart Contract Security**
   - Get professional audit before mainnet
   - Implement timelock for admin functions
   - Use multisig wallet for contract ownership
   - Monitor contracts with tools like Tenderly

3. **Frontend Security**
   - Enable CSP headers
   - Use HTTPS only
   - Implement rate limiting
   - Validate all user inputs

---

## Post-Deployment

### 1. Smoke Tests

After deployment, test critical flows:

```bash
# Create a test circle
# Join with test account
# Make contribution
# Verify state transitions
# Test payout claims
```

### 2. Monitoring Setup

- **Smart Contract Events**: Set up event listeners
- **Transaction Monitoring**: Track failed transactions
- **Gas Optimization**: Monitor gas usage patterns
- **User Analytics**: Track user flows and drop-offs

### 3. Documentation Updates

- Update README.md with deployed addresses
- Document any configuration changes
- Create deployment log/changelog
- Update API documentation if needed

### 4. Announcement

- Announce deployment to community
- Share contract addresses
- Provide user guides
- Set up support channels

---

## Troubleshooting

### Common Issues

#### Contract Deployment Fails

```bash
Error: insufficient funds for gas
```
**Solution**: Ensure deployer wallet has enough ETH for gas fees.

```bash
Error: nonce too low
```
**Solution**: Wait for previous transaction to confirm or reset nonce.

#### Verification Fails

```bash
Error: contract source code already verified
```
**Solution**: Contract is already verified, no action needed.

```bash
Error: unable to verify
```
**Solution**: Try manual verification or check compiler settings match deployment.

#### Frontend Build Errors

```bash
Error: Cannot find module '@/lib/config'
```
**Solution**: Check import paths and TypeScript configuration.

```bash
Error: Invalid hook call
```
**Solution**: Ensure React hooks are used in functional components.

#### Connection Issues

```
Error: could not connect to wallet
```
**Solution**:
- Verify WalletConnect Project ID
- Check network configuration
- Ensure wallet has correct network selected

### Getting Help

If you encounter issues:
1. Check the [Troubleshooting Guide](./docs/troubleshooting.md)
2. Review closed issues on GitHub
3. Create a new issue with:
   - Deployment environment (testnet/mainnet)
   - Full error message
   - Steps to reproduce
   - Relevant configuration (redact sensitive info)

---

## Rollback Plan

If critical issues arise:

### Smart Contracts
1. Pause contract using `pause()` function
2. Investigate issue
3. Deploy fixed version if needed
4. Update frontend to use new contract
5. Announce to users

### Frontend
1. Revert to previous Vercel deployment
2. Fix issue in new branch
3. Test thoroughly
4. Redeploy

---

## Maintenance

### Regular Tasks

- **Weekly**: Review contract events and user activity
- **Monthly**: Check for dependency updates
- **Quarterly**: Security review and audit prep
- **As Needed**: Gas optimization and feature updates

### Upgrade Process

For smart contract upgrades:
1. Test extensively on testnet
2. Get audit if significant changes
3. Announce upgrade schedule
4. Deploy during low-activity period
5. Monitor closely post-upgrade

---

## Additional Resources

- [Foundry Documentation](https://book.getfoundry.sh/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Base Network Docs](https://docs.base.org/)
- [Vercel Docs](https://vercel.com/docs)

---

**Last Updated**: 2025-01-29
