import { config } from "@/lib/config";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

// Note: Alchemy doesn't support Somnia Testnet, so we'll use the direct RPC
// If you need indexing services, consider alternatives like The Graph or Moralis

export function rpcClient() {
  return createPublicClient({
    chain: base,
    transport: http(config.rpcUrl),
    batch: {
      multicall: true,
    },
  });
}
