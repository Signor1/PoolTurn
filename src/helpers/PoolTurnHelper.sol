
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
}