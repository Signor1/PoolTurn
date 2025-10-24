'use client';

import { wagmiConfig } from '@/lib/web3';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';

interface Web3ProviderProps {
    children: ReactNode
}

const queryClient = new QueryClient();

export const Providers = ({ children }: Web3ProviderProps) => {
    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <WagmiProvider config={wagmiConfig}>
                <QueryClientProvider client={queryClient}>
                    {children}
                </QueryClientProvider>
            </WagmiProvider>
        </ThemeProvider>
    );
};
