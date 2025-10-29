# Frontend Hooks API Documentation

This document provides comprehensive documentation for all custom React hooks in the PoolTurn frontend application.

## Table of Contents
- [Contract Interaction Hooks](#contract-interaction-hooks)
- [Data Query Hooks](#data-query-hooks)
- [Transaction Hooks](#transaction-hooks)
- [Utility Hooks](#utility-hooks)

---

## Contract Interaction Hooks

### `useCreateCircle`

Creates a new savings circle.

**Location**: `hooks/contract/useCreateCircle.ts`

```typescript
const { createCircle, isPending, isConfirming, isConfirmed, hash } = useCreateCircle();
```

**Parameters for `createCircle` function:**
| Parameter | Type | Description |
|-----------|------|-------------|
| name | `string` | Circle name |
| description | `string` | Circle description |
| token | `0x${string}` | Token contract address |
| contributionAmount | `bigint` | Contribution amount per round |
| periodDuration | `bigint` | Duration of each round in seconds |
| maxMembers | `bigint` | Maximum number of members |
| collateralFactor | `bigint` | Collateral multiplier (1x, 2x, etc.) |
| insuranceFee | `bigint` | Insurance fee per member |
| initialPayoutOrder | `0x${string}[]` | Optional predefined payout order |

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| createCircle | `function` | Function to create a circle |
| isPending | `boolean` | Transaction is being prepared |
| isConfirming | `boolean` | Transaction is confirming on-chain |
| isConfirmed | `boolean` | Transaction is confirmed |
| hash | `string` | Transaction hash |

**Example:**
```typescript
const { createCircle, isConfirming } = useCreateCircle();

const handleCreate = () => {
  createCircle({
    name: "Savings Circle",
    description: "Monthly savings",
    token: SUPPORTED_TOKENS.USDC.address,
    contributionAmount: parseUnits("100", 6),
    periodDuration: BigInt(30 * 24 * 60 * 60), // 30 days
    maxMembers: BigInt(10),
    collateralFactor: BigInt(2),
    insuranceFee: parseUnits("10", 6),
    initialPayoutOrder: [],
  });
};
```

---

### `useJoinCircle`

Joins an existing circle (basic version).

**Location**: `hooks/contract/useJoinCircle.ts`

```typescript
const { joinCircle, isPending, isConfirming, isConfirmed } = useJoinCircle();
```

**Parameters for `joinCircle` function:**
| Parameter | Type | Description |
|-----------|------|-------------|
| circleId | `bigint` | ID of the circle to join |

**Note**: User must have approved sufficient tokens before calling this function.

---

### `useJoinCircleFlow`

Enhanced join circle hook with automatic approval handling.

**Location**: `hooks/contract/useJoinCircle.ts`

```typescript
const {
  startJoinFlow,
  currentStep,
  isPending,
  isApproving,
  isJoining,
  isCompleted,
  resetFlow
} = useJoinCircleFlow(tokenAddress);
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| tokenAddress | `string` | Address of the token contract |

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| startJoinFlow | `function` | Initiates the join flow |
| resetFlow | `function` | Resets the flow state |
| currentStep | `string` | Current step: 'idle', 'checking-allowance', 'approving', 'joining', 'completed', 'error' |
| isPending | `boolean` | Flow is in progress |
| isApproving | `boolean` | Approval transaction in progress |
| isJoining | `boolean` | Join transaction in progress |
| isCompleted | `boolean` | Flow completed successfully |

**startJoinFlow Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| circleId | `bigint` | Circle to join |
| requiredAmount | `bigint` | Total amount needed (collateral + insurance) |
| userAddress | `0x${string}` | User's wallet address |

**Example:**
```typescript
const { startJoinFlow, isApproving, isJoining } = useJoinCircleFlow(
  SUPPORTED_TOKENS.USDC.address
);

const handleJoin = async () => {
  if (!address) return;

  const totalRequired = collateral + insuranceFee;
  await startJoinFlow(BigInt(circleId), totalRequired, address);
};
```

---

### `useContribute`

Makes a contribution to a circle for the current round.

**Location**: `hooks/contract/useContribution.ts`

```typescript
const { contribute, isPending, isConfirming, isConfirmed } = useContribute();
```

**Parameters for `contribute` function:**
| Parameter | Type | Description |
|-----------|------|-------------|
| circleId | `bigint` | Circle ID to contribute to |

**Note**: Deprecated. Use `useContributeFlow` for automatic approval handling.

---

### `useContributeFlow`

Enhanced contribution hook with approval flow.

**Location**: `hooks/contract/useContribution.ts`

```typescript
const {
  startContributeFlow,
  proceedToContribute,
  currentStep,
  isApproveConfirmed
} = useContributeFlow();
```

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| startContributeFlow | `function` | Starts contribution flow |
| proceedToContribute | `function` | Proceeds to contribute after approval |
| resetFlow | `function` | Resets flow state |
| currentStep | `string` | 'idle', 'approving', 'contributing' |
| isApproveConfirmed | `boolean` | Approval confirmed |

---

### `useClaimPayout`

Claims available payout for a circle.

**Location**: `hooks/contract/usePayout.ts`

```typescript
const { claimPayout, isPending, isConfirming, isConfirmed } = useClaimPayout();
```

---

### `useWithdrawCollateral`

Withdraws collateral after circle completion.

**Location**: `hooks/contract/usePayout.ts`

```typescript
const { withdrawCollateral, isPending, isConfirmed } = useWithdrawCollateral();
```

---

### `useFinalizeRound`

Finalizes an expired round (can be called by anyone).

**Location**: `hooks/contract/useContribution.ts`

```typescript
const { finalizeRound, isPending, isConfirmed } = useFinalizeRound();
```

---

## Data Query Hooks

### `useCircleData`

Fetches comprehensive circle data with auto-refresh.

**Location**: `hooks/contract/useCircleData.ts`

```typescript
const {
  circleInfo,
  members,
  payoutOrder,
  insurancePool,
  isLoading,
  error
} = useCircleData(circleId);
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| circleId | `bigint` | Circle ID to fetch |

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| circleInfo | `CircleInfo` | Circle metadata and state |
| members | `address[]` | Array of member addresses |
| payoutOrder | `address[]` | Payout order array |
| insurancePool | `bigint` | Insurance pool balance |
| isLoading | `boolean` | Data is loading |
| error | `Error` | Query error if any |

**Auto-refresh**: Data refreshes every 5 seconds and on new blocks.

---

### `useMemberData`

Fetches member-specific data for a circle.

**Location**: `hooks/contract/useCircleData.ts`

```typescript
const { memberInfo, isLoading, error } = useMemberData(circleId, memberAddress);
```

**Returns MemberInfo:**
```typescript
interface MemberInfo {
  collateralLocked: bigint;
  paidCurrentRound: boolean;
  defaultCount: number;
  isBanned: boolean;
  hasWithdrawnCollateral: boolean;
}
```

---

### `usePendingPayout`

Fetches pending payout amount for a user.

**Location**: `hooks/contract/useCircleData.ts`

```typescript
const { pendingAmount, isLoading } = usePendingPayout(circleId, userAddress);
```

---

### `useAllCirclesMulticall`

Fetches all circles using multicall for efficiency.

**Location**: `hooks/useCircleQueries.tsx`

```typescript
const { circles, isLoading, error } = useAllCirclesMulticall();
```

**Returns:**
Array of formatted circle objects with:
- Basic info (id, name, description)
- Financial details (contribution amount, fees)
- Membership info (current/max members)
- State and timestamps

---

## Utility Hooks

### `useCircleComparison`

Manages circle comparison functionality.

**Location**: `components/circle-comparison.tsx`

```typescript
const {
  selectedCircles,
  addCircle,
  removeCircle,
  clearAll,
  isSelected,
  canAddMore
} = useCircleComparison();
```

**Methods:**
| Method | Parameters | Description |
|--------|------------|-------------|
| addCircle | `circleId: number` | Add circle to comparison (max 4) |
| removeCircle | `circleId: number` | Remove circle from comparison |
| clearAll | none | Clear all selected circles |
| isSelected | `circleId: number` | Check if circle is selected |

---

### `useContributionNotifications`

Manages browser notifications for contributions.

**Location**: `components/contribution-reminders.tsx`

```typescript
const {
  permission,
  requestPermission,
  sendNotification,
  isSupported
} = useContributionNotifications();
```

**Methods:**
| Method | Parameters | Description |
|--------|------------|-------------|
| requestPermission | none | Request notification permission |
| sendNotification | `title: string, body: string` | Send browser notification |

---

## Best Practices

### 1. Error Handling

All hooks handle errors internally and show toast notifications. Wrap hook usage in error boundaries for additional safety:

```typescript
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### 2. Loading States

Always check loading states before rendering data:

```typescript
const { circleInfo, isLoading } = useCircleData(circleId);

if (isLoading) return <CircleDetailsSkeleton />;
if (!circleInfo) return <div>Circle not found</div>;

return <CircleDetails data={circleInfo} />;
```

### 3. Transaction Confirmation

Wait for confirmation before updating UI:

```typescript
const { createCircle, isConfirmed } = useCreateCircle();

useEffect(() => {
  if (isConfirmed) {
    // Redirect or update UI
    router.push('/my-circles');
  }
}, [isConfirmed]);
```

### 4. Wallet Connection

Always check wallet connection:

```typescript
const { address } = useAccount();

const handleAction = () => {
  if (!address) {
    toast.error('Please connect your wallet');
    return;
  }
  // Proceed with action
};
```

---

## Type Definitions

### Common Types

```typescript
// Circle State
enum CircleState {
  Open = 0,
  Active = 1,
  Completed = 2,
  Cancelled = 3
}

// Circle Info
interface CircleInfo {
  creator: string;
  token: string;
  contributionAmount: bigint;
  periodDuration: bigint;
  maxMembers: bigint;
  collateralFactor: bigint;
  insuranceFee: bigint;
  startTimestamp: bigint;
  currentRound: bigint;
  state: CircleState;
}

// Transaction Status
type TransactionStatus = 'pending' | 'confirmed' | 'failed';
```

---

## Support

For questions or issues with the hooks:
1. Check the inline code documentation
2. Review example usage in the codebase
3. Create an issue on GitHub
4. Consult the main README.md

---

Last updated: 2025-01-29
