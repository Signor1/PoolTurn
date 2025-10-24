import { useMemo } from 'react';
import { useReadContract, useReadContracts, useBlockNumber } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { RoscaSecureABI } from '@/abi/RoscaSecure';
import { ROSCA_CONTRACT_ADDRESS } from '@/lib/config';

// Types for better type safety
export interface CircleInfo {
  creator: string;
  tokenAddr: string;
  contributionAmount: bigint;
  periodDuration: bigint;
  maxMembers: bigint;
  collateralFactor: bigint;
  insuranceFee: bigint;
  startTimestamp: bigint;
  currentRound: bigint;
  roundStart: bigint;
  state: number; // 0: Open, 1: Active, 2: Completed, 3: Cancelled
}

export interface CircleDetails {
  name: string;
  description: string;
}

export interface FormattedCircle {
  id: number;
  name: string;
  description: string;
  creator: string;
  token: string;
  contributionAmount: string;
  periodDuration: number;
  maxMembers: number;
  currentMembers: number;
  collateralFactor: number;
  insuranceFee: string;
  state: number;
  startTimestamp: number;
  currentRound: number;
  roundStart: number;
}

// Hook to get total number of circles
export const useCircleCount = () => {
  const queryKey = ['circleCount'];
  const queryClient = useQueryClient();

  const { data: nextCircleId, isLoading, error } = useReadContract({
    address: ROSCA_CONTRACT_ADDRESS,
    abi: RoscaSecureABI,
    functionName: 'nextCircleId',
  });

  // Watch for new blocks to invalidate queries
  const { data: blockNumber } = useBlockNumber({ watch: true });

  useEffect(() => {
    if (blockNumber) {
      queryClient.invalidateQueries({ queryKey });
    }
  }, [blockNumber, queryClient]);

  return {
    totalCircles: nextCircleId ? Number(nextCircleId) - 1 : 0,
    isLoading,
    error,
  };
};

// Helper to generate circle IDs array
export const useCircleIds = () => {
  const { totalCircles } = useCircleCount();

  return useMemo(() => {
    if (totalCircles === 0) return [];
    return Array.from({ length: totalCircles }, (_, i) => i + 1);
  }, [totalCircles]);
};

// Hook to get individual circle info
export const useCircleInfo = (circleId: bigint) => {
  const queryKey = ['circleInfo', circleId.toString()];
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useReadContract({
    address: ROSCA_CONTRACT_ADDRESS,
    abi: RoscaSecureABI,
    functionName: 'getCircleInfo',
    args: [circleId],
  });

  const { data: blockNumber } = useBlockNumber({ watch: true });

  useEffect(() => {
    if (blockNumber) {
      queryClient.invalidateQueries({ queryKey });
    }
  }, [blockNumber, queryClient]);

  const circleInfo = useMemo((): CircleInfo | null => {
    if (!data) return null;

    return {
      creator: data[0] as string,
      tokenAddr: data[1] as string,
      contributionAmount: data[2] as bigint,
      periodDuration: data[3] as bigint,
      maxMembers: data[4] as bigint,
      collateralFactor: data[5] as bigint,
      insuranceFee: data[6] as bigint,
      startTimestamp: data[7] as bigint,
      currentRound: data[8] as bigint,
      roundStart: data[9] as bigint,
      state: data[10] as number,
    };
  }, [data]);

  return { circleInfo, isLoading, error };
};

// Hook to get circle details (name & description)
export const useCircleDetails = (circleId: bigint) => {
  const queryKey = ['circleDetails', circleId.toString()];
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useReadContract({
    address: ROSCA_CONTRACT_ADDRESS,
    abi: RoscaSecureABI,
    functionName: 'getCircleDetails',
    args: [circleId],
  });

  const { data: blockNumber } = useBlockNumber({ watch: true });

  useEffect(() => {
    if (blockNumber) {
      queryClient.invalidateQueries({ queryKey });
    }
  }, [blockNumber, queryClient]);

  const circleDetails = useMemo((): CircleDetails | null => {
    if (!data) return null;

    return {
      name: data[0] as string,
      description: data[1] as string,
    };
  }, [data]);

  return { circleDetails, isLoading, error };
};

// Hook to get circle members
export const useCircleMembers = (circleId: bigint) => {
  const queryKey = ['circleMembers', circleId.toString()];
  const queryClient = useQueryClient();

  const { data: members, isLoading, error } = useReadContract({
    address: ROSCA_CONTRACT_ADDRESS,
    abi: RoscaSecureABI,
    functionName: 'getMembers',
    args: [circleId],
  });

  const { data: blockNumber } = useBlockNumber({ watch: true });

  useEffect(() => {
    if (blockNumber) {
      queryClient.invalidateQueries({ queryKey });
    }
  }, [blockNumber, queryClient]);

  return {
    members: members as readonly string[] | undefined,
    isLoading,
    error
  };
};

// Optimized hook for getting all circles efficiently using useReadContracts
export const useAllCirclesMulticall = () => {
  const queryKey = ['allCircles'];
  const queryClient = useQueryClient();
  const circleIds = useCircleIds();

  // Prepare contracts array for useReadContracts
  const contracts = useMemo(() => {
    if (circleIds.length === 0) return [];

    return circleIds.flatMap(id => [
      // Contract 1: getCircleInfo
      {
        address: ROSCA_CONTRACT_ADDRESS,
        abi: RoscaSecureABI,
        functionName: 'getCircleInfo' as const,
        args: [BigInt(id)],
      },
      // Contract 2: getCircleDetails
      {
        address: ROSCA_CONTRACT_ADDRESS,
        abi: RoscaSecureABI,
        functionName: 'getCircleDetails' as const,
        args: [BigInt(id)],
      },
      // Contract 3: getMembers
      {
        address: ROSCA_CONTRACT_ADDRESS,
        abi: RoscaSecureABI,
        functionName: 'getMembers' as const,
        args: [BigInt(id)],
      },
    ]);
  }, [circleIds]);

  // Use useReadContracts for batch reading
  const { data: contractResults, isLoading, error } = useReadContracts({
    contracts,
    query: {
      enabled: contracts.length > 0,
    },
  });

  const { data: blockNumber } = useBlockNumber({ watch: true });

  useEffect(() => {
    if (blockNumber) {
      queryClient.invalidateQueries({ queryKey });
    }
  }, [blockNumber, queryClient]);

  // Process contract results
  const circles = useMemo((): FormattedCircle[] => {
    if (!contractResults || !circleIds.length) return [];

    const formattedCircles: FormattedCircle[] = [];

    for (let i = 0; i < circleIds.length; i++) {
      const circleId = circleIds[i];
      const baseIndex = i * 3; // 3 contracts per circle

      try {
        // Get results for this circle
        const circleInfoResult = contractResults[baseIndex];
        const circleDetailsResult = contractResults[baseIndex + 1];
        const membersResult = contractResults[baseIndex + 2];

        // Check if all results are successful
        if (
          circleInfoResult?.status === 'success' &&
          circleDetailsResult?.status === 'success' &&
          membersResult?.status === 'success'
        ) {
          // Extract data from successful results
          const circleInfo = circleInfoResult.result as readonly [string, string, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, number];
          const circleDetails = circleDetailsResult.result as readonly [string, string];
          const members = membersResult.result as readonly string[];

          // Format token amounts (assuming 6 decimals for USDC)
          const formatTokenAmount = (amount: bigint) => {
            return (Number(amount) / Math.pow(10, 6)).toString();
          };

          const formattedCircle: FormattedCircle = {
            id: circleId,
            name: circleDetails[0] || `Circle ${circleId}`,
            description: circleDetails[1] || 'No description available',
            creator: circleInfo[0],
            token: circleInfo[1],
            contributionAmount: formatTokenAmount(circleInfo[2]),
            periodDuration: Number(circleInfo[3]),
            maxMembers: Number(circleInfo[4]),
            currentMembers: members.length,
            collateralFactor: Number(circleInfo[5]),
            insuranceFee: formatTokenAmount(circleInfo[6]),
            state: Number(circleInfo[10]), // State is at index 10
            startTimestamp: Number(circleInfo[7]),
            currentRound: Number(circleInfo[8]),
            roundStart: Number(circleInfo[9]),
          };

          formattedCircles.push(formattedCircle);
        }
      } catch (error) {
        console.error(`Error processing circle ${circleId}:`, error);
        // Continue with other circles
      }
    }

    return formattedCircles;
  }, [contractResults, circleIds]);

  return {
    circles,
    isLoading,
    error,
  };
};

// Hook for user-specific circles
export const useUserCircles = (userAddress?: string) => {
  const { circles, isLoading, error } = useAllCirclesMulticall();

  const userCircles = useMemo(() => {
    if (!userAddress || !circles.length) return [];

    // For now, filter by creator. In the future, we could extend this
    // to check membership by fetching member lists for each circle
    return circles.filter(circle =>
      circle.creator.toLowerCase() === userAddress.toLowerCase()
    );
  }, [circles, userAddress]);

  return {
    circles: userCircles,
    isLoading,
    error,
  };
};