// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/*
  PoolTurnSecure.sol
  Collateral-protected PoolTurn (Rotating Savings and Credit Association)
  - Pull-payment model: winners must claim payout (avoids reentrancy on transfers)
  - Collateral slashing to cover missed contributions
  - Insurance pool to handle multi-default situations
  - Rotation-based payout order (deterministic -> no VRF)
  - Reputation tracking and ban thresholds
  - Admin: pause/unpause, emergency withdrawal with strict checks
  - Up to MAX_MEMBERS per circle to limit gas cost when iterating members
*/

import { SafeERC20, IERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { YieldManager } from "./YieldManager.sol";
import { PoolTurnTypes } from "./types/PoolTurnTypes.sol";
import { PoolTurnConstants } from "./constants/PoolTurnConstants.sol";
import { PoolTurnEvent } from "./events/PoolTurnEvent.sol";
import { PoolTurn } from "./states/PoolTurnState.sol";
import { PoolTurnHelper } from "./helpers/PoolTurnHelper.sol";

contract PoolTurnSecure is PoolTurn, ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    // --- Modifiers ---
    modifier circleExists(uint256 circleId) {
        // require(circles[circleId].creator != address(0), "circle does not exist");
        // _;
        if (circles[circleId].creator == address(0)) revert("circle does not exist");
        _;
    }

    modifier onlyActive(uint256 circleId) {
        // require(circles[circleId].state == PoolTurnTypes.CircleState.Active, "circle not active");
        // _;
        if (circles[circleId].state != PoolTurnTypes.CircleState.Active) revert("circle not active");
        _;
    }

    // --- Constructor ---
    constructor() Ownable(msg.sender) { }

    // // --- Public / External functions ---

    /**
     * Create a PoolTurn circle. Creator is not auto-joined.
     * payoutOrder can be provided now (preferred) or later when all members join.
     * @param enableYield If true, insurance pool will be deposited to Aave for yield
     * @param creatorRewardAmount Optional reward amount creator deposits for perfect-payment members
     * @param gracePeriod Extra time (in seconds) after period deadline before members are marked as defaulted
     */
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
        uint256 creatorRewardAmount,
        uint256 gracePeriod
    )
        external
        whenNotPaused
        returns (uint256)
    {
        // require(token != address(0), "token zero");
        if (token == address(0)) revert("token zero");
        // require(token.code.length > 0, "not a contract");
        if (token.code.length == 0) revert("not a contract");
        // require(contributionAmount > 0, "contrib zero");
        if (contributionAmount == 0) revert("contrib zero");
        // require(periodDuration >= PoolTurnConstants.MIN_PERIOD_SECONDS, "period too short");
        if (periodDuration < PoolTurnConstants.MIN_PERIOD_SECONDS) revert("period too short");
        // require(maxMembers >= 2 && maxMembers <= PoolTurnConstants.MAX_MEMBERS, "invalid members");
        if (maxMembers < 2 || maxMembers > PoolTurnConstants.MAX_MEMBERS) revert("invalid members");
        // require(collateralFactor >= 1, "collateralFactor < 1");
        if (collateralFactor < 1) revert("collateralFactor < 1");
        // require(gracePeriod >= PoolTurnConstants.MIN_GRACE_PERIOD && gracePeriod <= PoolTurnConstants.MAX_GRACE_PERIOD, "invalid grace period");
        if (gracePeriod < PoolTurnConstants.MIN_GRACE_PERIOD || gracePeriod > PoolTurnConstants.MAX_GRACE_PERIOD) {
            revert("invalid grace period");
        }

        uint256 circleId = nextCircleId++;

        PoolTurnTypes.CircleDetails storage details = circleDetails[circleId];
        details.name = _name;
        details.desc = _desc;

        PoolTurnTypes.Circle storage c = circles[circleId];
        c.creator = msg.sender;
        c.token = IERC20(token);
        c.contributionAmount = contributionAmount;
        c.periodDuration = periodDuration;
        c.maxMembers = maxMembers;
        c.collateralFactor = collateralFactor;

        // Validate insurance fee is reasonable (max 100% of contribution amount)
        // require(insuranceFee <= contributionAmount, "insurance fee too high");
        if (insuranceFee > contributionAmount) revert("insurance fee too high");
        c.insuranceFee = insuranceFee;
        c.gracePeriod = gracePeriod;
        c.state = PoolTurnTypes.CircleState.Open;

        // if initial payoutOrder provided, validate and lock it
        if (initialPayoutOrder.length > 0) {
            // require(initialPayoutOrder.length == maxMembers, "payoutOrder length mismatch");
            if (initialPayoutOrder.length != maxMembers) revert("payoutOrder length mismatch");
            PoolTurnHelper._validatePayoutOrder(initialPayoutOrder);
            payoutOrder[circleId] = initialPayoutOrder;
            c.rotationLocked = true;
            emit PoolTurnEvent.PayoutOrderSet(circleId, initialPayoutOrder);
        }

        // Enable yield generation if requested and YieldManager is set
        if (enableYield) {
            // require(address(yieldManager) != address(0), "YieldManager not set");
            if (address(yieldManager) == address(0)) revert("YieldManager not set");
            yieldGenerationEnabled[circleId] = true;
            yieldManager.setYieldEnabled(circleId, true);
            emit PoolTurnEvent.YieldGenerationToggled(circleId, true);
        }

        // Handle creator reward pool deposit if provided
        if (creatorRewardAmount > 0) {
            c.token.safeTransferFrom(msg.sender, address(this), creatorRewardAmount);
            creatorRewardPool[circleId] = creatorRewardAmount;
            emit PoolTurnEvent.CreatorRewardDeposited(circleId, msg.sender, creatorRewardAmount);
        }

        emit PoolTurnEvent.CircleCreated(circleId, msg.sender);
        return circleId;
    }

    /**
     * Join a circle and lock collateral + insuranceFee.
     * Caller must approve token for the sum before calling:
     *   totalLock = contributionAmount * collateralFactor + insuranceFee
     */
    function joinCircle(uint256 circleId) external nonReentrant whenNotPaused circleExists(circleId) {
        PoolTurnTypes.Circle storage c = circles[circleId];
        // require(c.state == PoolTurnTypes.CircleState.Open, "not open");
        if (c.state != PoolTurnTypes.CircleState.Open) revert("not open");
        // require(membersList[circleId].length < c.maxMembers, "full");
        if (membersList[circleId].length >= c.maxMembers) revert("full");
        // require(!members[circleId][msg.sender].exists, "already joined");
        if (members[circleId][msg.sender].exists) revert("already joined");

        // Check global ban status
        // require(!globallyBanned[msg.sender], "globally banned");
        if (globallyBanned[msg.sender]) revert("globally banned");

        PoolTurnTypes.Member storage m = members[circleId][msg.sender];
        // require(!m.banned, "member banned");
        if (m.banned) revert("member banned");

        uint256 collateral = c.contributionAmount * c.collateralFactor;
        uint256 totalLock = collateral + c.insuranceFee;

        // Use transferFrom to pull tokens into contract. For tokens with fees, measure balances.
        uint256 before = c.token.balanceOf(address(this));
        c.token.safeTransferFrom(msg.sender, address(this), totalLock);

        // Verify transfer was successful
        uint256 thisBalAfter = c.token.balanceOf(address(this));
        uint256 received = thisBalAfter - before;
        // require(received >= totalLock, "token transfer shortfall");
        if (received < totalLock) revert("token transfer shortfall");

        // record member
        m.exists = true;
        m.collateralLocked = collateral;
        m.insuranceContributed = c.insuranceFee;
        m.defaults = 0;
        m.banned = false;
        m.withdrawnCollateral = false;

        membersList[circleId].push(msg.sender);

        // increment insurance pool
        if (c.insuranceFee > 0) {
            insurancePool[circleId] += c.insuranceFee;
        }

        emit PoolTurnEvent.MemberJoined(circleId, msg.sender, collateral, c.insuranceFee);

        // If circle is full after this join, activate and set timestamps
        if (membersList[circleId].length == c.maxMembers) {
            c.state = PoolTurnTypes.CircleState.Active;
            c.currentRound = 1;
            c.startTimestamp = block.timestamp;
            c.roundStart = block.timestamp;

            // If payoutOrder not previously set, create deterministic rotation from current members
            if (payoutOrder[circleId].length == 0) {
                // M-04 improvement: Pseudo-random shuffle using block data
                // address[] memory shuffled = _shuffleMembers(membersList[circleId], circleId);
                address[] memory shuffled = PoolTurnHelper._shuffleMembers(membersList, circleId);

                // Store shuffled order
                for (uint256 i = 0; i < shuffled.length; i++) {
                    payoutOrder[circleId].push(shuffled[i]);
                }
                c.rotationLocked = true; // lock to avoid changes
                emit PoolTurnEvent.PayoutOrderSet(circleId, payoutOrder[circleId]);
            }

            // Deposit insurance pool to yield manager if enabled
            if (yieldGenerationEnabled[circleId] && address(yieldManager) != address(0)) {
                uint256 poolAmount = insurancePool[circleId];
                if (poolAmount > 0) {
                    // Approve YieldManager to spend tokens
                    c.token.safeIncreaseAllowance(address(yieldManager), poolAmount);
                    // Deposit to yield generation
                    yieldManager.depositToYield(circleId, address(c.token), poolAmount);
                }
            }

            emit PoolTurnEvent.RoundStarted(circleId, c.currentRound, c.roundStart);
        }
    }

    /**
     * Make the contribution for the current round.
     * Caller must approve contributionAmount to the contract before calling.
     */
    function contribute(uint256 circleId)
        external
        nonReentrant
        whenNotPaused
        circleExists(circleId)
        onlyActive(circleId)
    {
        PoolTurnTypes.Circle storage c = circles[circleId];
        PoolTurnTypes.Member storage m = members[circleId][msg.sender];
        // require(m.exists, "not a member");
        if (!m.exists) revert("not a member");

        uint256 roundId = c.currentRound;
        PoolTurnTypes.RoundState storage r = roundStates[circleId][roundId];
        require(!r.deposited[msg.sender], "already paid");

        // pull tokens
        uint256 before = c.token.balanceOf(address(this));
        c.token.safeTransferFrom(msg.sender, address(this), c.contributionAmount);
        uint256 thisBal = c.token.balanceOf(address(this));
        uint256 received = thisBal - before;
        // require(received >= c.contributionAmount, "transfer shortfall");
        if (received < c.contributionAmount) revert("transfer shortfall");

        r.deposited[msg.sender] = true;
        r.depositsMade += 1;

        emit PoolTurnEvent.ContributionMade(circleId, roundId, msg.sender, c.contributionAmount);

        // if everyone paid, finalize immediately
        if (r.depositsMade == c.maxMembers) {
            PoolTurnHelper._finalizeRound(circles, roundStates, payoutOrder, members, pendingPayouts, circleId, roundId);
        }
    }

    /**
     * Anyone can call to finalize a round after it has expired.
     * This handles default detection, collateral slashing, pot assembly,
     * winner selection and crediting pending payout (pull model).
     */
    function finalizeRoundIfExpired(uint256 circleId)
        external
        nonReentrant
        whenNotPaused
        circleExists(circleId)
        onlyActive(circleId)
    {
        PoolTurnTypes.Circle storage c = circles[circleId];
        uint256 roundId = c.currentRound;
        PoolTurnTypes.RoundState storage r = roundStates[circleId][roundId];
        // require(!r.settled, "already settled");
        if (r.settled) revert("already settled");
        // require(block.timestamp >= c.roundStart + c.periodDuration + c.gracePeriod, "grace period active");
        if (block.timestamp < c.roundStart + c.periodDuration + c.gracePeriod) revert("grace period active");

        PoolTurnHelper._handleDefaultsAndFinalize(
            circles,
            roundStates,
            membersList,
            members,
            insurancePool,
            payoutOrder,
            pendingPayouts,
            globalDefaults,
            globallyBanned,
            circleId,
            roundId
        );
    }

    /**
     * Claim any pending payout (pull payments).
     */
    function claimPayout(uint256 circleId) external nonReentrant whenNotPaused {
        uint256 amount = pendingPayouts[circleId][msg.sender];
        // require(amount > 0, "no payout");
        if (amount == 0) revert("no payout");
        pendingPayouts[circleId][msg.sender] = 0;
        PoolTurnTypes.Circle storage c = circles[circleId];
        c.token.safeTransfer(msg.sender, amount);
        emit PoolTurnEvent.PayoutClaimed(circleId, msg.sender, amount);
    }

    /**
     * Withdraw remaining collateral after the circle is Completed (and withdrawnCollateral false).
     * Collateral is returned pro-rata based on remaining collateralLocked.
     */
    function withdrawCollateral(uint256 circleId) external nonReentrant whenNotPaused circleExists(circleId) {
        PoolTurnTypes.Circle storage c = circles[circleId];
        // require(c.state == PoolTurnTypes.CircleState.Completed || c.state == PoolTurnTypes.CircleState.Cancelled, "circle not finished");
        if (c.state != PoolTurnTypes.CircleState.Completed && c.state != PoolTurnTypes.CircleState.Cancelled) {
            revert("circle not finished");
        }

        PoolTurnTypes.Member storage m = members[circleId][msg.sender];
        // require(m.exists, "not member");
        if (!m.exists) revert("not member");
        // require(!m.withdrawnCollateral, "already withdrawn");
        if (m.withdrawnCollateral) revert("already withdrawn");

        uint256 amount = m.collateralLocked;
        m.collateralLocked = 0;
        m.withdrawnCollateral = true;

        if (amount > 0) {
            c.token.safeTransfer(msg.sender, amount);
        }
        emit PoolTurnEvent.CollateralWithdrawn(circleId, msg.sender, amount);
    }

    /**
     * @notice Harvest yield from Aave and distribute proportionally to circle members
     * @param circleId The circle ID
     */
    function harvestYield(uint256 circleId) external nonReentrant whenNotPaused circleExists(circleId) {
        // require(yieldGenerationEnabled[circleId], "yield not enabled");
        if (!yieldGenerationEnabled[circleId]) revert("yield not enabled");
        // require(address(yieldManager) != address(0), "YieldManager not set");
        if (address(yieldManager) == address(0)) revert("YieldManager not set");

        // Harvest yield from YieldManager
        (uint256 memberShare,) = yieldManager.harvestYield(circleId);

        if (memberShare == 0) return;

        // Distribute yield proportionally to all circle members
        address[] storage mems = membersList[circleId];
        uint256 memsLen = mems.length;
        // require(memsLen > 0, "no members");
        if (memsLen == 0) revert("no members");

        uint256 sharePerMember = memberShare / memsLen;

        for (uint256 i = 0; i < memsLen;) {
            memberYieldShares[circleId][mems[i]] += sharePerMember;
            unchecked {
                ++i;
            }
        }

        emit PoolTurnEvent.YieldHarvestedForCircle(circleId, memberShare, sharePerMember);
    }

    /**
     * @notice Claim accumulated yield share for a member
     * @param circleId The circle ID
     */
    function claimYield(uint256 circleId) external nonReentrant whenNotPaused circleExists(circleId) {
        uint256 yieldAmount = memberYieldShares[circleId][msg.sender];
        // require(yieldAmount > 0, "no yield to claim");
        if (yieldAmount == 0) revert("no yield to claim");

        memberYieldShares[circleId][msg.sender] = 0;

        PoolTurnTypes.Circle storage c = circles[circleId];

        // Withdraw yield from YieldManager if needed
        if (address(yieldManager) != address(0)) {
            yieldManager.withdrawFromYield(circleId, address(c.token), yieldAmount, msg.sender);
        }

        emit PoolTurnEvent.MemberYieldClaimed(circleId, msg.sender, yieldAmount);
    }

    /**
     * @notice Claim creator reward for members with perfect payment history
     * @param circleId The circle ID
     */
    function claimCreatorReward(uint256 circleId) external nonReentrant whenNotPaused circleExists(circleId) {
        PoolTurnTypes.Circle storage c = circles[circleId];
        // require(c.state == PoolTurnTypes.CircleState.Completed, "circle not completed");
        if (c.state != PoolTurnTypes.CircleState.Completed) revert("circle not completed");

        PoolTurnTypes.Member storage m = members[circleId][msg.sender];
        // require(m.exists, "not a member");
        if (!m.exists) revert("not a member");
        // require(m.defaults == 0, "has defaults, not eligible");
        if (m.defaults != 0) revert("has defaults, not eligible");
        // require(!creatorRewardClaimed[circleId][msg.sender], "already claimed");
        if (creatorRewardClaimed[circleId][msg.sender]) revert("already claimed");

        uint256 rewardPool = creatorRewardPool[circleId];
        // require(rewardPool > 0, "no reward pool");
        if (rewardPool == 0) revert("no reward pool");

        // Count members with perfect payment (0 defaults)
        address[] storage mems = membersList[circleId];
        uint256 memsLen = mems.length;
        uint256 perfectMembers = 0;

        for (uint256 i = 0; i < memsLen;) {
            if (members[circleId][mems[i]].defaults == 0) {
                unchecked {
                    perfectMembers++;
                }
            }
            unchecked {
                ++i;
            }
        }

        // require(perfectMembers > 0, "no perfect members");
        if (perfectMembers == 0) revert("no perfect members");

        uint256 rewardPerMember = rewardPool / perfectMembers;
        // require(rewardPerMember > 0, "reward too small");
        if (rewardPerMember == 0) revert("reward too small");

        // Mark as claimed
        creatorRewardClaimed[circleId][msg.sender] = true;
        creatorRewardPool[circleId] -= rewardPerMember;

        c.token.safeTransfer(msg.sender, rewardPerMember);
        emit PoolTurnEvent.CreatorRewardClaimed(circleId, msg.sender, rewardPerMember);
    }
    // --- Admin functions ---

    /**
     * @notice Set the YieldManager contract address
     * @param _yieldManager Address of the YieldManager contract
     */
    function setYieldManager(address _yieldManager) external onlyOwner {
        // require(_yieldManager != address(0), "zero address");
        if (_yieldManager == address(0)) revert("zero address");
        yieldManager = YieldManager(_yieldManager);
        emit PoolTurnEvent.YieldManagerSet(_yieldManager);
    }

    /**
     * Pause contract in emergency
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * Emergency withdraw: owner may withdraw only tokens from a CANCELLED circle to a specified address.
     * Strict policy: only allowed if circle is Cancelled and pendingPayouts for all recipients are zero.
     * This is a last-resort administrative escape hatch.
     */
    function emergencyWithdraw(
        uint256 circleId,
        address to,
        uint256 amount
    )
        external
        onlyOwner
        circleExists(circleId)
        nonReentrant
    {
        PoolTurnTypes.Circle storage c = circles[circleId];
        // require(c.state == PoolTurnTypes.CircleState.Cancelled, "circle not cancelled");
        if (c.state != PoolTurnTypes.CircleState.Cancelled) revert("circle not cancelled");
        // require(to != address(0), "zero recipient");
        if (to == address(0)) revert("zero recipient");
        // require(to != address(this), "cannot withdraw to self"); // L-02 fix
        if (to == address(this)) revert("cannot withdraw to self");

        // ensure no pending payouts remain
        // (Note: We conservatively check that total pending payouts are zero to avoid stealing user funds.)
        uint256 totalPending = 0;
        address[] storage mems = membersList[circleId];
        uint256 memsLen = mems.length; // Cache length

        for (uint256 i = 0; i < memsLen;) {
            totalPending += pendingPayouts[circleId][mems[i]];
            unchecked {
                ++i;
            }
        }
        // require(totalPending == 0, "pending payouts exist");
        if (totalPending != 0) revert("pending payouts exist");

        // Ensure insurance pool is empty (belongs to members)
        // require(insurancePool[circleId] == 0, "insurance pool not empty");
        if (insurancePool[circleId] != 0) revert("insurance pool not empty");

        c.token.safeTransfer(to, amount);
        emit PoolTurnEvent.EmergencyWithdraw(circleId, to, amount);
    }

    /**
     * Owner can cancel a circle before it becomes active; refunds collateral and insurance
     */
    function cancelCircle(uint256 circleId) external circleExists(circleId) nonReentrant onlyOwner {
        PoolTurnTypes.Circle storage c = circles[circleId];
        // require(c.state == PoolTurnTypes.CircleState.Open, "cannot cancel active/completed");
        if (c.state != PoolTurnTypes.CircleState.Open) revert("cannot cancel active/completed");

        // refund any joined members their locked sums
        address[] storage mems = membersList[circleId];
        uint256 memsLen = mems.length; // Cache length

        for (uint256 i = 0; i < memsLen;) {
            address maddr = mems[i];
            PoolTurnTypes.Member storage mm = members[circleId][maddr];
            uint256 refund = mm.collateralLocked + mm.insuranceContributed;
            mm.collateralLocked = 0;
            mm.insuranceContributed = 0;

            if (refund > 0) {
                c.token.safeTransfer(maddr, refund);
            }

            unchecked {
                ++i;
            }
        }

        // Reset insurance pool to maintain accounting consistency
        insurancePool[circleId] = 0;

        c.state = PoolTurnTypes.CircleState.Cancelled;
        emit PoolTurnEvent.CircleCancelled(circleId);
    }

    // --- View helpers ---

    function getMembers(uint256 circleId) external view returns (address[] memory) {
        return membersList[circleId];
    }

    function getPayoutOrder(uint256 circleId) external view returns (address[] memory) {
        return payoutOrder[circleId];
    }

    function getCircleInfo(uint256 circleId)
        external
        view
        returns (
            address creator,
            address tokenAddr,
            uint256 contributionAmount,
            uint256 periodDuration,
            uint256 maxMembers,
            uint256 collateralFactor,
            uint256 insuranceFee,
            uint256 gracePeriod,
            uint256 startTimestamp,
            uint256 currentRound,
            uint256 roundStart,
            PoolTurnTypes.CircleState state
        )
    {
        PoolTurnTypes.Circle storage c = circles[circleId];
        creator = c.creator;
        tokenAddr = address(c.token);
        contributionAmount = c.contributionAmount;
        periodDuration = c.periodDuration;
        maxMembers = c.maxMembers;
        collateralFactor = c.collateralFactor;
        insuranceFee = c.insuranceFee;
        gracePeriod = c.gracePeriod;
        startTimestamp = c.startTimestamp;
        currentRound = c.currentRound;
        roundStart = c.roundStart;
        state = c.state;
    }

    function getCircleDetails(uint256 circleId) external view returns (string memory name, string memory desc) {
        PoolTurnTypes.CircleDetails storage details = circleDetails[circleId];
        name = details.name;
        desc = details.desc;
    }

    /**
     * Replace unbounded getAllCircles() with paginated version
     * @param offset Starting circle ID (inclusive)
     * @param limit Maximum number of circles to return (max 100)
     */
    function getCircles(uint256 offset, uint256 limit) external view returns (PoolTurnTypes.Circle[] memory circles_) {
        // require(limit > 0 && limit <= 100, "limit must be 1-100");
        if (limit == 0 || limit > 100) revert("limit must be 1-100");
        // require(offset > 0, "offset must be >= 1");
        if (offset == 0) revert("offset must be >= 1");

        // Calculate actual range
        uint256 start = offset;
        uint256 end = offset + limit;
        if (end > nextCircleId) {
            end = nextCircleId;
        }

        uint256 resultSize = end > start ? end - start : 0;
        circles_ = new PoolTurnTypes.Circle[](resultSize);

        for (uint256 i = 0; i < resultSize;) {
            circles_[i] = circles[start + i];
            unchecked {
                ++i;
            }
        }
    }

    /**
     * Get total number of circles created
     */
    function getTotalCircles() external view returns (uint256) {
        return nextCircleId - 1;
    }

    // Additional utility views (member info, round info, insurance pool)
    function getMemberInfo(
        uint256 circleId,
        address member
    )
        external
        view
        returns (
            bool exists,
            uint256 collateralLocked,
            uint256 insuranceContributed,
            uint256 defaults,
            bool banned,
            bool withdrawnCollateral
        )
    {
        PoolTurnTypes.Member storage m = members[circleId][member];
        exists = m.exists;
        collateralLocked = m.collateralLocked;
        insuranceContributed = m.insuranceContributed;
        defaults = m.defaults;
        banned = m.banned;
        withdrawnCollateral = m.withdrawnCollateral;
    }

    function getRoundDeposited(uint256 circleId, uint256 roundId, address member) external view returns (bool) {
        return roundStates[circleId][roundId].deposited[member];
    }

    function getInsurancePool(uint256 circleId) external view returns (uint256) {
        return insurancePool[circleId];
    }

    // --- Yield & Rewards View Functions ---

    /**
     * @notice Get member's pending yield share
     * @param circleId The circle ID
     * @param member The member address
     * @return Pending yield amount
     */
    function getMemberYieldShare(uint256 circleId, address member) external view returns (uint256) {
        return memberYieldShares[circleId][member];
    }

    /**
     * @notice Get creator reward pool balance for a circle
     * @param circleId The circle ID
     * @return Creator reward pool balance
     */
    function getCreatorRewardPool(uint256 circleId) external view returns (uint256) {
        return creatorRewardPool[circleId];
    }

    /**
     * @notice Check if member has claimed creator reward
     * @param circleId The circle ID
     * @param member The member address
     * @return True if already claimed
     */
    function hasClaimedCreatorReward(uint256 circleId, address member) external view returns (bool) {
        return creatorRewardClaimed[circleId][member];
    }

    /**
     * @notice Get pending yield for a circle from YieldManager
     * @param circleId The circle ID
     * @return Pending yield amount
     */
    function getCirclePendingYield(uint256 circleId) external view returns (uint256) {
        if (address(yieldManager) == address(0)) return 0;
        return yieldManager.getPendingYield(circleId);
    }

    /**
     * @notice Get total value (principal + yield) in YieldManager for a circle
     * @param circleId The circle ID
     * @return Total value
     */
    function getCircleTotalYieldValue(uint256 circleId) external view returns (uint256) {
        if (address(yieldManager) == address(0)) return 0;
        return yieldManager.getTotalValue(circleId);
    }

    /**
     * @notice Check if yield generation is enabled for a circle
     * @param circleId The circle ID
     * @return True if enabled
     */
    function isYieldEnabled(uint256 circleId) external view returns (bool) {
        return yieldGenerationEnabled[circleId];
    }

    /**
     * @notice Get count of members eligible for creator reward (perfect payment)
     * @param circleId The circle ID
     * @return Number of members with zero defaults
     */
    function getEligibleRewardMembers(uint256 circleId) external view returns (uint256) {
        address[] storage mems = membersList[circleId];
        uint256 memsLen = mems.length;
        uint256 count = 0;

        for (uint256 i = 0; i < memsLen;) {
            if (members[circleId][mems[i]].defaults == 0) {
                unchecked {
                    count++;
                }
            }
            unchecked {
                ++i;
            }
        }

        return count;
    }
}
