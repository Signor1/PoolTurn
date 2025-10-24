export const config = {
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 8453,
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL as string,
  walletConnectProjectId: process.env
    .NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID as string,
} as const;

// PoolTurn Contract Address
export const POOLTURN_CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_POOLTURN_CONTRACT_ADDRESS as `0x${string}`; // actual deployed address

// Multicall3 Contract Address
export const MULTICALL3_ADDRESS = process.env
  .NEXT_PUBLIC_MULTICALL3_ADDRESS as `0x${string}`;

// Supported ERC20 tokens for contributions on Base Mainnet
// Note: These are mock tokens deployed specifically for this project
export const SUPPORTED_TOKENS = {
  USDC: {
    address: (process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x6b54e6ec75eEb7c6cD1889cD3cBB858E6734471D") as `0x${string}`,
    decimals: 6,
    symbol: "USDC",
    name: "USDC Token",
  },
  USDT: {
    address: (process.env.NEXT_PUBLIC_USDT_ADDRESS || "0x6c925BE58927c5eD7f907a8126BC6F733F87c3B0") as `0x${string}`,
    decimals: 6,
    symbol: "USDT",
    name: "USDT Token",
  },
} as const;

// Circle configuration limits
export const CIRCLE_LIMITS = {
  MIN_MEMBERS: 2,
  MAX_MEMBERS: 100,
  MIN_PERIOD_HOURS: 1, // 1 hour for testing
  MIN_PERIOD_DAYS: 7, // 1 week minimum in production
  MAX_PERIOD_DAYS: 90, // 3 months maximum
  MIN_CONTRIBUTION: 1, // Minimum contribution amount
  MAX_CONTRIBUTION: 10000, // Maximum contribution amount
  MIN_COLLATERAL_FACTOR: 1,
  MAX_COLLATERAL_FACTOR: 10,
} as const;

// Period duration presets (in seconds)
export const PERIOD_PRESETS = {
  WEEKLY: 7 * 24 * 60 * 60,
  BIWEEKLY: 14 * 24 * 60 * 60,
  MONTHLY: 30 * 24 * 60 * 60,
  QUARTERLY: 90 * 24 * 60 * 60,
} as const;

// Circle states enum
export enum CircleState {
  Open = 0,
  Active = 1,
  Completed = 2,
  Cancelled = 3,
}

// Default values for circle creation
export const DEFAULT_CIRCLE_VALUES = {
  contributionAmount: "100",
  periodDuration: PERIOD_PRESETS.MONTHLY,
  maxMembers: 10,
  collateralFactor: 2,
  insuranceFee: "5",
  token: SUPPORTED_TOKENS.USDC.address,
} as const;
