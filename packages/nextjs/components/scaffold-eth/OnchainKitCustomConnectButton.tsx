"use client";

import { useState } from "react";
import { AddressInfoDropdown } from "./RainbowKitCustomConnectButton/AddressInfoDropdown";
import { AddressQRCodeModal } from "./RainbowKitCustomConnectButton/AddressQRCodeModal";
import { WrongNetworkDropdown } from "./RainbowKitCustomConnectButton/WrongNetworkDropdown";
import { EthBalance } from "@coinbase/onchainkit/identity";
import { ConnectWallet, Wallet } from "@coinbase/onchainkit/wallet";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { useNetworkColor } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-eth";

/**
 * Custom OnchainKit Connect Button (watch balance + custom design)
 * This recreates the same UX as your RainbowKit custom button
 */
export const OnchainKitCustomConnectButton = () => {
  const networkColor = useNetworkColor();
  const { targetNetwork } = useTargetNetwork();

  // Using OnchainKit hooks to get wallet state
  const { address, isConnected, chain } = useAccount();
  // Getting block explorer link (same as original component)
  const blockExplorerAddressLink = address
    ? getBlockExplorerAddressLink(targetNetwork, address as `0x${string}`)
    : undefined;

  // Creating similar behavior to RainbowKit component
  if (!isConnected) {
    return (
      // Not connected state - enhanced connect button
      <ConnectWallet
        className="btn btn-primary btn-sm px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-medium"
        disconnectedLabel={
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
              <path d="M18 12h.01"></path>
            </svg>
            Connect Wallet
          </div>
        }
      />
    );
  }

  // Check if network is wrong (similar to RainbowKit)
  if (chain?.id !== targetNetwork.id) {
    return <WrongNetworkDropdown />;
  }

  // Connected and correct network state
  return (
    <Wallet>
      {/* Display balance and network same as original */}
      <div className="flex items-center gap-1">
        <div className="flex flex-col items-center mr-1">
          <EthBalance address={address} className="min-h-0 h-auto" />
          <span className="text-xs" style={{ color: networkColor }}>
            {chain.name}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <AddressInfoDropdown address={address as Address} blockExplorerAddressLink={blockExplorerAddressLink} />
        </div>

        <AddressQRCodeModal address={address as Address} modalId="qrcode-modal" />
      </div>
    </Wallet>
  );
};
