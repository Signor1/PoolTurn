
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import { PoolTurnTypes } from "../types/PoolTurnTypes.sol";
import { PoolTurnEvent } from "../events/PoolTurnEvent.sol";
import { PoolTurnConstants } from "../constants/PoolTurnConstants.sol";

library PoolTurnHelper {

    /**
     * Internal finalize routine. Uses rotation-based winner selection (deterministic).
     * Slashes collateral of defaulters by at most contributionAmount per default.
     * Topped pot = contributions + slashedCollateral + insurancePool (if needed).
     * Winner payout is credited to pendingPayouts for pull pattern.
     */
    function _handleDefaultsAndFinalize
    (
        mapping(uint256 => PoolTurnTypes.Circle) storage circles,
        mapping(uint256 => mapping(uint256 => PoolTurnTypes.RoundState)) storage roundStates,
        mapping(uint256 => address[]) storage membersList,
        mapping(uint256 => mapping(address => PoolTurnTypes.Member)) storage members,
        mapping(uint256 => uint256) storage insurancePool,
        mapping(uint256 => address[]) storage payoutOrder,
        mapping(uint256 => mapping(address => uint256)) storage pendingPayouts,
        mapping(address => uint256) storage globalDefaults,
        mapping(address => bool) storage globallyBanned,
        uint256 circleId, uint256 roundId
    ) internal {
        PoolTurnTypes.Circle storage c = circles[circleId];
        PoolTurnTypes.RoundState storage r = roundStates[circleId][roundId];
        // require(!r.settled, "already settled");
        if(r.settled) revert("already settled");

        address[] storage mems = membersList[circleId];
        uint256 memsLen = mems.length; // Cache length
        uint256 payers = 0;
        uint256 slashedTotal = 0;

        // Combined loop - mark defaults, count payers, and slash in one pass
        for (uint256 i = 0; i < memsLen;) {
            address maddr = mems[i];
            if (!r.deposited[maddr]) {
                r.defaulted[maddr] = true;

                PoolTurnTypes.Member storage mm = members[circleId][maddr];
                uint256 slash = mm.collateralLocked >= c.contributionAmount ? c.contributionAmount : mm.collateralLocked;

                if (slash > 0) {
                    mm.collateralLocked -= slash;
                    slashedTotal += slash;
                    emit PoolTurnEvent.DefaultDetected(circleId, roundId, maddr, slash);
                }

                // Global reputation tracking
                globalDefaults[maddr] += 1;
                mm.defaults += 1;

                // Ban both locally and globally if threshold exceeded
                if (mm.defaults >= PoolTurnConstants.DEFAULT_BAN_THRESHOLD) {
                    mm.banned = true;
                    emit PoolTurnEvent.MemberBanned(circleId, maddr);
                }

                if (globalDefaults[maddr] >= PoolTurnConstants.DEFAULT_BAN_THRESHOLD) {
                    globallyBanned[maddr] = true;
                    emit PoolTurnEvent.MemberGloballyBanned(maddr, globalDefaults[maddr]);
                }
            } else {
                unchecked {
                    payers++;
                } // Safe unchecked increment
            }

            unchecked {
                ++i;
            } // Safe unchecked increment
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
        // require(members[circleId][winner].exists, "winner not a member");
        if(!members[circleId][winner].exists) revert("winner not a member");

        r.winner = winner;

        // Credit payout to pendingPayouts (pull)
        pendingPayouts[circleId][winner] += pot;
        r.settled = true;

        emit PoolTurnEvent.WinnerSelected(circleId, roundId, winner, pot);

        // Advance round or complete
        unchecked {
            c.currentRound += 1;
        } // Safe unchecked increment

        if (c.currentRound > c.maxMembers) {
            c.state = PoolTurnTypes.CircleState.Completed;
            emit PoolTurnEvent.CircleCompleted(circleId);
        } else {
            // Use fixed schedule to prevent drift
            c.roundStart = c.startTimestamp + ((c.currentRound - 1) * c.periodDuration);
            emit PoolTurnEvent.RoundStarted(circleId, c.currentRound, c.roundStart);
        }
    }

    /**
     * Immediate finalization when all paid early
     */
    function _finalizeRound
    (
        mapping(uint256 => PoolTurnTypes.Circle) storage circles,
        mapping(uint256 => mapping(uint256 => PoolTurnTypes.RoundState)) storage roundStates,
        mapping(uint256 => address[]) storage payoutOrder,
        mapping(uint256 => mapping(address => PoolTurnTypes.Member)) storage members,
        mapping(uint256 => mapping(address => uint256)) storage pendingPayouts,
        uint256 circleId,
        uint256 roundId
    ) internal {
        PoolTurnTypes.Circle storage c = circles[circleId];
        PoolTurnTypes.RoundState storage r = roundStates[circleId][roundId];
        // require(!r.settled, "already settled");
        if(r.settled) revert("already settled");

        uint256 payers = r.depositsMade;
        uint256 pot = c.contributionAmount * payers;

        // no slashing needed

        address winner = payoutOrder[circleId][roundId - 1];

        // Validate winner is an actual member
        // require(members[circleId][winner].exists, "winner not a member");
        if(!members[circleId][winner].exists) revert("winner not a member");

        r.winner = winner;
        r.settled = true;
        pendingPayouts[circleId][winner] += pot;

        emit PoolTurnEvent.WinnerSelected(circleId, roundId, winner, pot);

        // next round
        unchecked {
            c.currentRound += 1;
        } // Safe unchecked increment

        if (c.currentRound > c.maxMembers) {
            c.state = PoolTurnTypes.CircleState.Completed;
            emit PoolTurnEvent.CircleCompleted(circleId);
        } else {
            // Use fixed schedule to prevent drift
            c.roundStart = c.startTimestamp + ((c.currentRound - 1) * c.periodDuration);
            emit PoolTurnEvent.RoundStarted(circleId, c.currentRound, c.roundStart);
        }
    }

    /**
     * Pseudo-random shuffle using block data
     * Note: This is not cryptographically secure randomness, but prevents
     * first-joiner advantage and simple manipulation.
     * For production, consider Chainlink VRF for true randomness.
     */
    function _shuffleMembers
    (

        mapping(uint256 => address[]) storage membersList,   
        uint256 circleId
    ) internal view returns (address[] memory) {
        uint256 len = membersList[circleId].length;
        address[] memory memberList = membersList[circleId];
        address[] memory shuffled = new address[](len);

        // Copy to memory
        for (uint256 i = 0; i < len;) {
            shuffled[i] = memberList[i];
            unchecked {
                ++i;
            }
        }

        // Fisher-Yates shuffle with pseudo-random seed
        // bytes32 seed = keccak256(abi.encodePacked(
        //     block.timestamp,
        //     block.prevrandao,  // replaces difficulty in post-merge Ethereum
        //     block.number,
        //     circleId,
        //     len
        // ));

        // Inline assembly keccak256 (more efficient than abi.encodePacked)
        bytes32 seed;
        assembly {
            // Get free memory pointer
            let ptr := mload(0x40)
            mstore(ptr, timestamp())
            mstore(add(ptr, 0x20), prevrandao())
            mstore(add(ptr, 0x40), number())
            mstore(add(ptr, 0x60), circleId)
            mstore(add(ptr, 0x80), len)
            seed := keccak256(ptr, 0xa0) // hash 5 * 32 bytes
        }

        for (uint256 i = len - 1; i > 0;) {
            uint256 j = uint256(seed) % (i + 1);
            (shuffled[i], shuffled[j]) = (shuffled[j], shuffled[i]);
            seed = keccak256(abi.encodePacked(seed, i));
            unchecked {
                --i;
            }
        }

        return shuffled;
    }

    /**
     * Validate payout order for duplicates and zero addresses
     * Optimized: Uses memory array to track seen addresses, reducing redundant comparisons
     */
    function _validatePayoutOrder(address[] calldata order) internal pure {
        uint256 len = order.length;
        require(len <= PoolTurnConstants.MAX_MEMBERS, "order exceeds MAX_MEMBERS");

        // Use memory array to track seen addresses for efficient duplicate detection
        address[] memory seen = new address[](len);

        for (uint256 i = 0; i < len;) {
            address current = order[i];
            require(current != address(0), "zero address in payout order");

            // Check against previously seen addresses only (more efficient than nested comparison)
            for (uint256 j = 0; j < i;) {
                require(seen[j] != current, "duplicate address in payout order");
                unchecked {
                    ++j;
                }
            }

            seen[i] = current;
            unchecked {
                ++i;
            }
        }
    }
}