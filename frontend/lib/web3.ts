"use client";

import { config } from "@/lib/config";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { http } from "viem";
import { base } from "viem/chains";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// 1. Get projectId from environment
const projectId = config.walletConnectProjectId;

if (!projectId) {
  throw new Error("NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID is not set");
}

// 2. Set up Wagmi adapter
export const wagmiAdapter = new WagmiAdapter({
  networks: [base],
  transports: {
    [base.id]: http(config.rpcUrl, {
      batch: true,
    }),
  },
  projectId,
  ssr: false,
});

// 3. Create wagmi config
export const wagmiConfig = wagmiAdapter.wagmiConfig;

// 4. Create modal
const metadata = {
  name: "PoolTurn",
  description: "Decentralized Community Savings Platform",
  url: typeof window !== "undefined" ? window.location.origin : "https://poolturn.com",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: [base],
  metadata,
  projectId,
  features: {
    analytics: true,
  },
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "hsl(var(--primary))",
  },
});
