"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderOpenDot } from "lucide-react";
import { hardhat } from "viem/chains";
import { Bars3Icon, ChevronDownIcon, HomeIcon, ShoppingCartIcon, TrophyIcon } from "@heroicons/react/24/outline";
import { FaucetButton, OnchainKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/",
    icon: <HomeIcon className="h-5 w-5" />,
  },
  {
    label: "Game",
    href: "/game",
    icon: <TrophyIcon className="h-5 w-5" />,
  },
  {
    label: "MarketPlace",
    href: "/marketplace",
    icon: <ShoppingCartIcon className="h-5 w-5" />,
  },
  {
    label: "Recipes",
    href: "/recipes",
    icon: <FolderOpenDot className="h-5 w-5" />,
  },
];

export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;
  const pathname = usePathname();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useOutsideClick(
    dropdownRef,
    useCallback(() => setIsDropdownOpen(false), []),
  );

  return (
    <div className="top-0 w-full navbar min-h-0 z-50 px-4 py-2 bg-amber-200 bg-opacity-95 border-b-2 border-amber-800 flex items-center justify-between relative">
      {/* Left - Logo */}
      <div className="flex items-center">
        <Link href="/" passHref className="flex items-center gap-3 shrink-0">
          <Image
            alt="Greenwhistle Logo"
            width={200}
            height={100}
            className="h-16 w-[120px] rounded-lg transform hover:scale-105 transition"
            src="/logo.png"
          />
        </Link>
      </div>

      {/* Center - Navigation Links */}
      <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-6">
        {menuLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-amber-900 font-semibold hover:bg-amber-300 border-2 border-transparent hover:border-amber-800 transition-all ${
              pathname === link.href ? "bg-amber-300 border-amber-800 font-bold" : ""
            }`}
          >
            {link.icon}
            <span>{link.label}</span>
          </Link>
        ))}
      </div>

      {/* Right - Wallet Connection */}
      <div className="flex items-center gap-3">
        <div className="bg-amber-300 p-1.5 rounded-lg border-2 border-amber-800 shadow-md hover:bg-amber-400 transition-colors">
          <OnchainKitCustomConnectButton />
        </div>
        {isLocalNetwork && (
          <div className="bg-amber-300 p-1.5 rounded-lg border-2 border-amber-800 shadow-md hover:bg-amber-400 transition-colors">
            <FaucetButton />
          </div>
        )}
      </div>
    </div>
  );
};
