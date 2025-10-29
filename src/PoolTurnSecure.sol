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

contract PoolTurnSecure is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    // --- Constants ---
    uint256 public constant MAX_MEMBERS = 100; // safety cap to prevent gas bombs
    uint256 public constant DEFAULT_BAN_THRESHOLD = 3; // defaults before ban
    uint256 public constant MIN_PERIOD_SECONDS = 3 minutes;

    // --- Types ---
    enum CircleState {
        Open,
        Active,
        Completed,
        Cancelled
    }

    struct Circle {
        address creator;
        IERC20 token; // ERC20 token used for contributions (stablecoin recommended)
        uint256 contributionAmount; // A
        uint256 periodDuration; // seconds per round
        uint256 maxMembers; // N
        uint256 collateralFactor; // CF (1 == 1x contribution)
        uint256 insuranceFee; // per-member fee added to insurance pool at join
        uint256 startTimestamp; // filled when circle becomes Active
        uint256 currentRound; // 1..N
        uint256 roundStart; // timestamp of current round
        CircleState state;
        bool rotationLocked; // if true, payoutOrder cannot be changed
    }

    struct Member {
        bool exists;
        bool banned; // if true, cannot join new circles
        bool withdrawnCollateral; // whether collateral returned after completion
        uint8 defaults; // number of defaults (for reputation/ban) - max 255
        uint256 collateralLocked; // amount locked as collateral
        uint256 insuranceContributed;
    }

    struct RoundState {
        uint256 depositsMade; // number of members who deposited this round
        mapping(address => bool) deposited; // member => whether deposited this round
        mapping(address => bool) defaulted; // member => defaulted this round
        address winner; // winner for the round
        bool settled;
    }

    struct CircleDetails {
        string name;
        string desc;
    }

    // --- State ---

    uint256 public nextCircleId = 1;
    mapping(uint256 => Circle) public circles;

    // members list per circle
    mapping(uint256 => address[]) private membersList;

    // member info per circle
    mapping(uint256 => mapping(address => Member)) public members;

    // round states per circle
    mapping(uint256 => mapping(uint256 => RoundState)) private roundStates;

    // payout order per circle (rotation). Fixed size = maxMembers
    mapping(uint256 => address[]) private payoutOrder;

    // insurance pool balances per circle (slashed fees + insurance fees go here)
    mapping(uint256 => uint256) public insurancePool;

    // winner payouts credited (pull model). token amounts credited per address per circle
    mapping(uint256 => mapping(address => uint256)) public pendingPayouts;

    mapping(uint256 => CircleDetails) public circleDetails;

    // Global ban tracking
    mapping(address => bool) public globallyBanned;
    mapping(address => uint256) public globalDefaults;

    // events
    event CircleCreated(uint256 indexed circleId, address indexed creator);
    event MemberJoined(
        uint256 indexed circleId, address indexed member, uint256 collateralLocked, uint256 insuranceFee
    );
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

    // --- Modifiers ---
    modifier circleExists(uint256 circleId) {
        require(circles[circleId].creator != address(0), "circle does not exist");
        _;
    }

    modifier onlyActive(uint256 circleId) {
        require(circles[circleId].state == CircleState.Active, "circle not active");
        _;
    }

    // --- Constructor ---
    constructor() Ownable(msg.sender) { }

    // // --- Public / External functions ---

    /**
     * Create a PoolTurn circle. Creator is not auto-joined.
     * payoutOrder can be provided now (preferred) or later when all members join.
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
        address[] calldata initialPayoutOrder
    )
        external
        whenNotPaused
        returns (uint256)
    {
        require(token != address(0), "token zero");
        require(token.code.length > 0, "not a contract");
        require(contributionAmount > 0, "contrib zero");
        require(periodDuration >= MIN_PERIOD_SECONDS, "period too short");
        require(maxMembers >= 2 && maxMembers <= MAX_MEMBERS, "invalid members");
        require(collateralFactor >= 1, "collateralFactor < 1");

        uint256 circleId = nextCircleId++;

        CircleDetails storage details = circleDetails[circleId];
        details.name = _name;
        details.desc = _desc;

        Circle storage c = circles[circleId];
        c.creator = msg.sender;
        c.token = IERC20(token);
        c.contributionAmount = contributionAmount;
        c.periodDuration = periodDuration;
        c.maxMembers = maxMembers;
        c.collateralFactor = collateralFactor;

        // Validate insurance fee is reasonable (max 100% of contribution amount)
        require(insuranceFee <= contributionAmount, "insurance fee too high");
        c.insuranceFee = insuranceFee;
        c.state = CircleState.Open;

        // if initial payoutOrder provided, validate and lock it
        if (initialPayoutOrder.length > 0) {
            require(initialPayoutOrder.length == maxMembers, "payoutOrder length mismatch");
            _validatePayoutOrder(initialPayoutOrder);
            payoutOrder[circleId] = initialPayoutOrder;
            c.rotationLocked = true;
            emit PayoutOrderSet(circleId, initialPayoutOrder);
        }

        emit CircleCreated(circleId, msg.sender);
        return circleId;
    }

    /**
     * Join a circle and lock collateral + insuranceFee.
     * Caller must approve token for the sum before calling:
     *   totalLock = contributionAmount * collateralFactor + insuranceFee
     */
    function joinCircle(uint256 circleId) external nonReentrant whenNotPaused circleExists(circleId) {
        Circle storage c = circles[circleId];
        require(c.state == CircleState.Open, "not open");
        require(membersList[circleId].length < c.maxMembers, "full");
        require(!members[circleId][msg.sender].exists, "already joined");

        // Check global ban status
        require(!globallyBanned[msg.sender], "globally banned");

        Member storage m = members[circleId][msg.sender];
        require(!m.banned, "member banned");

        uint256 collateral = c.contributionAmount * c.collateralFactor;
        uint256 totalLock = collateral + c.insuranceFee;

        // Use transferFrom to pull tokens into contract. For tokens with fees, measure balances.
        uint256 before = c.token.balanceOf(address(this));
        c.token.safeTransferFrom(msg.sender, address(this), totalLock);

        // Verify transfer was successful
        uint256 thisBalAfter = c.token.balanceOf(address(this));
        uint256 received = thisBalAfter - before;
        require(received >= totalLock, "token transfer shortfall");

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

        emit MemberJoined(circleId, msg.sender, collateral, c.insuranceFee);

        // If circle is full after this join, activate and set timestamps
        if (membersList[circleId].length == c.maxMembers) {
            c.state = CircleState.Active;
            c.currentRound = 1;
            c.startTimestamp = block.timestamp;
            c.roundStart = block.timestamp;

            // If payoutOrder not previously set, create deterministic rotation from current members
            if (payoutOrder[circleId].length == 0) {
                // M-04 improvement: Pseudo-random shuffle using block data
                address[] memory shuffled = _shuffleMembers(membersList[circleId], circleId);

                // Store shuffled order
                for (uint256 i = 0; i < shuffled.length; i++) {
                    payoutOrder[circleId].push(shuffled[i]);
                }
                c.rotationLocked = true; // lock to avoid changes
                emit PayoutOrderSet(circleId, payoutOrder[circleId]);
            }

            emit RoundStarted(circleId, c.currentRound, c.roundStart);
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
        Circle storage c = circles[circleId];
        Member storage m = members[circleId][msg.sender];
        require(m.exists, "not a member");

        uint256 roundId = c.currentRound;
        RoundState storage r = roundStates[circleId][roundId];
        require(!r.deposited[msg.sender], "already paid");

        // pull tokens
        uint256 before = c.token.balanceOf(address(this));
        c.token.safeTransferFrom(msg.sender, address(this), c.contributionAmount);
        uint256 thisBal = c.token.balanceOf(address(this));
        uint256 received = thisBal - before;
        require(received >= c.contributionAmount, "transfer shortfall");

        r.deposited[msg.sender] = true;
        r.depositsMade += 1;

        emit ContributionMade(circleId, roundId, msg.sender, c.contributionAmount);

        // if everyone paid, finalize immediately
        if (r.depositsMade == c.maxMembers) {
            _finalizeRound(circleId, roundId);
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
        Circle storage c = circles[circleId];
        uint256 roundId = c.currentRound;
        RoundState storage r = roundStates[circleId][roundId];
        require(!r.settled, "already settled");
        require(block.timestamp >= c.roundStart + c.periodDuration, "round still ongoing");

        _handleDefaultsAndFinalize(circleId, roundId);
    }

    /**
     * Claim any pending payout (pull payments).
     */
    function claimPayout(uint256 circleId) external nonReentrant whenNotPaused {
        uint256 amount = pendingPayouts[circleId][msg.sender];
        require(amount > 0, "no payout");
        pendingPayouts[circleId][msg.sender] = 0;
        Circle storage c = circles[circleId];
        c.token.safeTransfer(msg.sender, amount);
        emit PayoutClaimed(circleId, msg.sender, amount);
    }

    /**
     * Withdraw remaining collateral after the circle is Completed (and withdrawnCollateral false).
     * Collateral is returned pro-rata based on remaining collateralLocked.
     */
    function withdrawCollateral(uint256 circleId) external nonReentrant whenNotPaused circleExists(circleId) {
        Circle storage c = circles[circleId];
        require(c.state == CircleState.Completed || c.state == CircleState.Cancelled, "circle not finished");
        Member storage m = members[circleId][msg.sender];
        require(m.exists, "not member");
        require(!m.withdrawnCollateral, "already withdrawn");

        uint256 amount = m.collateralLocked;
        m.collateralLocked = 0;
        m.withdrawnCollateral = true;

        if (amount > 0) {
            c.token.safeTransfer(msg.sender, amount);
        }
        emit CollateralWithdrawn(circleId, msg.sender, amount);
    }

    // --- Internal helpers ---

    /**
     * Internal finalize routine. Uses rotation-based winner selection (deterministic).
     * Slashes collateral of defaulters by at most contributionAmount per default.
     * Topped pot = contributions + slashedCollateral + insurancePool (if needed).
     * Winner payout is credited to pendingPayouts for pull pattern.
     */
    function _handleDefaultsAndFinalize(uint256 circleId, uint256 roundId) internal {
        Circle storage c = circles[circleId];
        RoundState storage r = roundStates[circleId][roundId];
        require(!r.settled, "already settled");

        address[] storage mems = membersList[circleId];
        uint256 memsLen = mems.length;  // Cache length
        uint256 payers = 0;
        uint256 slashedTotal = 0;

        // Combined loop - mark defaults, count payers, and slash in one pass
        for (uint256 i = 0; i < memsLen;) {
            address maddr = mems[i];
            if (!r.deposited[maddr]) {
                r.defaulted[maddr] = true;

                Member storage mm = members[circleId][maddr];
                uint256 slash = mm.collateralLocked >= c.contributionAmount ?
                    c.contributionAmount : mm.collateralLocked;

                if (slash > 0) {
                    mm.collateralLocked -= slash;
                    slashedTotal += slash;
                    emit DefaultDetected(circleId, roundId, maddr, slash);
                }

                // Global reputation tracking
                globalDefaults[maddr] += 1;
                mm.defaults += 1;

                // Ban both locally and globally if threshold exceeded
                if (mm.defaults >= DEFAULT_BAN_THRESHOLD) {
                    mm.banned = true;
                    emit MemberBanned(circleId, maddr);
                }

                if (globalDefaults[maddr] >= DEFAULT_BAN_THRESHOLD) {
                    globallyBanned[maddr] = true;
                    emit MemberGloballyBanned(maddr, globalDefaults[maddr]);
                }
            } else {
                unchecked { payers++; }  // Safe unchecked increment
            }

            unchecked { ++i; }  // Safe unchecked increment
        }

        // Pot is contributions from payers plus slashed collateral
        uint256 pot = c.contributionAmount * payers + slashedTotal;

        // If pot is less than full expected (N*A), allow insurance pool to top up up to remaining expected pot
        uint256 expectedFull = c.contributionAmount * c.maxMembers;
        if (pot < expectedFull) {
            uint256 need = expectedFull - pot;
            uint256 availableInsurance = insurancePool[circleId];
            uint256 use = availableInsurance >= need ? need : availableInsurance;
            if (use > 0) {
                insurancePool[circleId] -= use;
                pot += use;
            }
            // pot may still be < expectedFull, in which case winner gets what's available.
        }

        // Winner selection: rotation: payoutOrder[circleId][roundId - 1]
        address winner = payoutOrder[circleId][roundId - 1];

        // Validate winner is an actual member
        require(members[circleId][winner].exists, "winner not a member");

        r.winner = winner;

        // Credit payout to pendingPayouts (pull)
        pendingPayouts[circleId][winner] += pot;
        r.settled = true;

        emit WinnerSelected(circleId, roundId, winner, pot);

        // Advance round or complete
        unchecked { c.currentRound += 1; }  // Safe unchecked increment

        if (c.currentRound > c.maxMembers) {
            c.state = CircleState.Completed;
            emit CircleCompleted(circleId);
        } else {
            // Use fixed schedule to prevent drift
            c.roundStart = c.startTimestamp + ((c.currentRound - 1) * c.periodDuration);
            emit RoundStarted(circleId, c.currentRound, c.roundStart);
        }
    }

    /**
     * Immediate finalization when all paid early
     */
    function _finalizeRound(uint256 circleId, uint256 roundId) internal {
        Circle storage c = circles[circleId];
        RoundState storage r = roundStates[circleId][roundId];
        require(!r.settled, "already settled");

        uint256 payers = r.depositsMade;
        uint256 pot = c.contributionAmount * payers;

        // no slashing needed

        address winner = payoutOrder[circleId][roundId - 1];

        // Validate winner is an actual member
        require(members[circleId][winner].exists, "winner not a member");

        r.winner = winner;
        r.settled = true;
        pendingPayouts[circleId][winner] += pot;

        emit WinnerSelected(circleId, roundId, winner, pot);

        // next round
        unchecked { c.currentRound += 1; }  // Safe unchecked increment

        if (c.currentRound > c.maxMembers) {
            c.state = CircleState.Completed;
            emit CircleCompleted(circleId);
        } else {
            // Use fixed schedule to prevent drift
            c.roundStart = c.startTimestamp + ((c.currentRound - 1) * c.periodDuration);
            emit RoundStarted(circleId, c.currentRound, c.roundStart);
        }
    }

    /**
     * Validate payout order for duplicates and zero addresses
     * Optimized: Uses memory array to track seen addresses, reducing redundant comparisons
     */
    function _validatePayoutOrder(address[] calldata order) private pure {
        uint256 len = order.length;
        require(len <= MAX_MEMBERS, "order exceeds MAX_MEMBERS");

        // Use memory array to track seen addresses for efficient duplicate detection
        address[] memory seen = new address[](len);

        for (uint256 i = 0; i < len;) {
            address current = order[i];
            require(current != address(0), "zero address in payout order");

            // Check against previously seen addresses only (more efficient than nested comparison)
            for (uint256 j = 0; j < i;) {
                require(seen[j] != current, "duplicate address in payout order");
                unchecked { ++j; }
            }

            seen[i] = current;
            unchecked { ++i; }
        }
    }

    /**
     * Pseudo-random shuffle using block data
     * Note: This is not cryptographically secure randomness, but prevents
     * first-joiner advantage and simple manipulation.
     * For production, consider Chainlink VRF for true randomness.
     */
    function _shuffleMembers(address[] storage memberList, uint256 circleId)
        private
        view
        returns (address[] memory)
    {
        uint256 len = memberList.length;
        address[] memory shuffled = new address[](len);

        // Copy to memory
        for (uint256 i = 0; i < len;) {
            shuffled[i] = memberList[i];
            unchecked { ++i; }
        }

        // Fisher-Yates shuffle with pseudo-random seed
        bytes32 seed = keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,  // replaces difficulty in post-merge Ethereum
            block.number,
            circleId,
            len
        ));

        for (uint256 i = len - 1; i > 0;) {
            uint256 j = uint256(seed) % (i + 1);
            (shuffled[i], shuffled[j]) = (shuffled[j], shuffled[i]);
            seed = keccak256(abi.encodePacked(seed, i));
            unchecked { --i; }
        }

        return shuffled;
    }

    // --- Admin functions ---

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
        Circle storage c = circles[circleId];
        require(c.state == CircleState.Cancelled, "circle not cancelled");
        require(to != address(0), "zero recipient");
        require(to != address(this), "cannot withdraw to self");  // L-02 fix

        // ensure no pending payouts remain
        // (Note: We conservatively check that total pending payouts are zero to avoid stealing user funds.)
        uint256 totalPending = 0;
        address[] storage mems = membersList[circleId];
        uint256 memsLen = mems.length;  // Cache length

        for (uint256 i = 0; i < memsLen;) {
            totalPending += pendingPayouts[circleId][mems[i]];
            unchecked { ++i; } 
        }
        require(totalPending == 0, "pending payouts exist");

        // Ensure insurance pool is empty (belongs to members)
        require(insurancePool[circleId] == 0, "insurance pool not empty");

        c.token.safeTransfer(to, amount);
        emit EmergencyWithdraw(circleId, to, amount);
    }

    /**
     * Owner can cancel a circle before it becomes active; refunds collateral and insurance
     */
    function cancelCircle(uint256 circleId) external circleExists(circleId) nonReentrant onlyOwner {
        Circle storage c = circles[circleId];
        require(c.state == CircleState.Open, "cannot cancel active/completed");

        // refund any joined members their locked sums
        address[] storage mems = membersList[circleId];
        uint256 memsLen = mems.length;  // Cache length

        for (uint256 i = 0; i < memsLen;) {
            address maddr = mems[i];
            Member storage mm = members[circleId][maddr];
            uint256 refund = mm.collateralLocked + mm.insuranceContributed;
            mm.collateralLocked = 0;
            mm.insuranceContributed = 0;

            if (refund > 0) {
                c.token.safeTransfer(maddr, refund);
            }

            unchecked { ++i; } 
        }

        // Reset insurance pool to maintain accounting consistency
        insurancePool[circleId] = 0;

        c.state = CircleState.Cancelled;
        emit CircleCancelled(circleId);
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
            uint256 startTimestamp,
            uint256 currentRound,
            uint256 roundStart,
            CircleState state
        )
    {
        Circle storage c = circles[circleId];
        creator = c.creator;
        tokenAddr = address(c.token);
        contributionAmount = c.contributionAmount;
        periodDuration = c.periodDuration;
        maxMembers = c.maxMembers;
        collateralFactor = c.collateralFactor;
        insuranceFee = c.insuranceFee;
        startTimestamp = c.startTimestamp;
        currentRound = c.currentRound;
        roundStart = c.roundStart;
        state = c.state;
    }

    function getCircleDetails(uint256 circleId) external view returns (string memory name, string memory desc) {
        CircleDetails storage details = circleDetails[circleId];
        name = details.name;
        desc = details.desc;
    }

    /**
     * Replace unbounded getAllCircles() with paginated version
     * @param offset Starting circle ID (inclusive)
     * @param limit Maximum number of circles to return (max 100)
     */
    function getCircles(uint256 offset, uint256 limit)
        external
        view
        returns (Circle[] memory circles_)
    {
        require(limit > 0 && limit <= 100, "limit must be 1-100");
        require(offset > 0, "offset must be >= 1");

        // Calculate actual range
        uint256 start = offset;
        uint256 end = offset + limit;
        if (end > nextCircleId) {
            end = nextCircleId;
        }

        uint256 resultSize = end > start ? end - start : 0;
        circles_ = new Circle[](resultSize);

        for (uint256 i = 0; i < resultSize;) {
            circles_[i] = circles[start + i];
            unchecked { ++i; }
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
        Member storage m = members[circleId][member];
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
}
