

library PoolTurnEvent {
    event RoundStarted(uint256 indexed circleId, uint256 indexed roundId, uint256 startedAt);
    event ContributionMade(uint256 indexed circleId, uint256 indexed roundId, address indexed member, uint256 amount);
    event DefaultDetected(uint256 indexed circleId, uint256 indexed roundId, address indexed member, uint256 slashed);
    event WinnerSelected(uint256 indexed circleId, uint256 indexed roundId, address indexed winner, uint256 pot);
    event PayoutClaimed(uint256 indexed circleId, address indexed claimer, uint256 amount);
    event CollateralWithdrawn(uint256 indexed circleId, address indexed member, uint256 amount);
    event CircleCompleted(uint256 indexed circleId);
    event MemberBanned(uint256 indexed circleId, address indexed member);
    event MemberGloballyBanned(address indexed member, uint256 totalDefaults);
    event EmergencyWithdraw(uint256 indexed circleId, address indexed to, uint256 amount);
    event PayoutOrderSet(uint256 indexed circleId, address[] payoutOrder);
    event CircleCancelled(uint256 indexed circleId);
    event YieldManagerSet(address indexed yieldManager);
    event YieldGenerationToggled(uint256 indexed circleId, bool enabled);
    event YieldHarvestedForCircle(uint256 indexed circleId, uint256 totalYield, uint256 memberShare);
    event MemberYieldClaimed(uint256 indexed circleId, address indexed member, uint256 amount);
    event CreatorRewardDeposited(uint256 indexed circleId, address indexed creator, uint256 amount);
    event CreatorRewardClaimed(uint256 indexed circleId, address indexed member, uint256 amount);
}