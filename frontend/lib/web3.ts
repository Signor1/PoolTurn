"use client";

import { config } from "@/lib/config";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { http } from "viem";
import { base } from "viem/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "RoscaSecure",
  ssr: false,
  projectId: config.walletConnectProjectId,
  chains: [base],
  transports: {
    [base.id]: http(config.rpcUrl, {
      batch: true,
    }),
  },
});
