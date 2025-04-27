"use client";

import { useEffect, useState } from "react";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { WagmiProvider } from "wagmi";
import { RouteGuard } from "~~/app/wallet/RouteGuard";
import { Footer } from "~~/components/Footer";
import { Header } from "~~/components/Header";
import { useInitializeNativeCurrencyPrice } from "~~/hooks/scaffold-eth";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  useInitializeNativeCurrencyPrice();

  return (
    <>
      <div className={`flex flex-col min-h-screen `}>
        <Header />
        <main className="relative bg-[#1b1b1b] flex flex-col flex-1">{children}</main>
        <Footer />
      </div>
      <Toaster />
    </>
  );
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export const ScaffoldEthAppWithProviders = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ProgressBar height="3px" color="#2299dd" />
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAIN_API_KEY}
          chain={wagmiConfig.chains[0]}
          config={{
            appearance: {
              name: "GreenWhistle",
              logo: "/logo.svg",
              mode: mounted ? (isDarkMode ? "dark" : "light") : "light",
              theme: "default",
            },
            wallet: {
              display: "modal",
              supportedWallets: {
                frame: true,
                rabby: true,
                trust: true,
              },
            },
          }}
        >
          <ScaffoldEthApp>
            <RouteGuard>{children}</RouteGuard>
          </ScaffoldEthApp>
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
