"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderOpenDot } from "lucide-react";
import { hardhat } from "viem/chains";
import { useAccount } from "wagmi";
import { Bars3Icon, ChevronDownIcon, HomeIcon, ShoppingCartIcon, TrophyIcon } from "@heroicons/react/24/outline";
import { FaucetButton, OnchainKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
  protected: boolean;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/",
    icon: <HomeIcon className="h-5 w-5" />,
    protected: false, // Home page is accessible to everyone
  },
  {
    label: "Game",
    href: "/game",
    icon: <TrophyIcon className="h-5 w-5" />,
    protected: true, // Requires wallet connection
  },
  {
    label: "MarketPlace",
    href: "/marketplace",
    icon: <ShoppingCartIcon className="h-5 w-5" />,
    protected: true, // Requires wallet connection
  },
  {
    label: "Recipes",
    href: "/recipes",
    icon: <FolderOpenDot className="h-5 w-5" />,
    protected: true, // Requires wallet connection
  },
];

export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;
  const pathname = usePathname();

  // Get wallet connection status
  const { isConnected } = useAccount();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useOutsideClick(
    dropdownRef,
    useCallback(() => setIsDropdownOpen(false), []),
  );

  // Function to handle protected navigation
  const handleNavigation = (e: React.MouseEvent, link: HeaderMenuLink) => {
    if (link.protected && !isConnected) {
      e.preventDefault();
      notification.warning(
        <div className="flex flex-col gap-1">
          <p className="my-0 font-bold">Wallet Not Connected</p>
          <p className="my-0">Please connect your wallet to access {link.label}</p>
        </div>,
        { duration: 5000 },
      );
    }
  };

  return (
    <div className="top-0 w-full navbar min-h-0 z-50 px-4 py-2 bg-[#1b1b1b] bg-opacity-95 flex items-center justify-between relative">
      {/* Left - Logo */}
      <div className="flex items-center">
        <Link href="/" passHref className="flex items-center gap-3 shrink-0">
          <Image
            alt="Greenwhistle Logo"
            width={200}
            height={100}
            className="h-16 w-[108px] aspect-square rounded-lg transform hover:scale-105 transition"
            src="/logo.png"
          />
        </Link>
      </div>

      {/* Center - Navigation Links */}
      <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-6">
        {menuLinks.map(link => (
          <Link
            key={link.href}
            href={link.protected && !isConnected ? "#" : link.href}
            onClick={e => handleNavigation(e, link)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[#c6c607] font-semibold 
              ${
                link.protected && !isConnected
                  ? "opacity-50 cursor-not-allowed hover:bg-transparent hover:border-transparent"
                  : "hover:bg-[#c6c607] hover:text-[#1a1c2c] hover:border-[#1a1c2c]"
              } 
              border-2 border-transparent transition-all
              ${pathname === link.href ? "bg-[#1a1c2c] border-amber-800 font-bold" : ""}`}
          >
            {link.icon}
            <span>{link.label}</span>
            {link.protected && !isConnected && (
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
                className="ml-1"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            )}
          </Link>
        ))}
      </div>

      {/* Right - Wallet Connection */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg border-2 shadow-md transition-colors">
          <OnchainKitCustomConnectButton />
        </div>
        {isLocalNetwork && <FaucetButton />}
      </div>
    </div>
  );
};
