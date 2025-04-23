"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
];

/**
 * Site header with vintage game theme and improved dropdown menu
 */
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

  // Find the active menu item
  const activeMenu = menuLinks.find(link => link.href === pathname) || menuLinks[0];

  return (
    <div className="top-0 navbar min-h-0 flex-shrink-0 justify-between z-50 px-2 sm:px-4 bg-amber-200 bg-opacity-95 ">
      {/* Left side - Logo and Dropdown */}
      <div className="flex items-center">
        {/* Logo */}
        <Link href="/" passHref className="flex items-center gap-3 mr-4 shrink-0">
          <Image
            alt="Greenwhistle Logo"
            width={200} // increased from 80
            height={100} // increased from 80
            className="h-20 w-48 rounded-lg transform hover:scale-105 transition" // increased from h-12 w-12
            src="/logo.png"
          />
        </Link>

        {/* Dropdown Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 py-2 px-4 text-amber-900 hover:bg-amber-300 rounded-lg border-2 border-amber-800 font-bold transition-all"
          >
            <span className="flex items-center gap-2">
              {activeMenu.icon}
              <span>{activeMenu.label}</span>
            </span>
            <ChevronDownIcon className={`h-5 w-5 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute mt-2 w-56 bg-amber-100 rounded-lg shadow-lg border-2 border-amber-800 py-2 z-50">
              {menuLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsDropdownOpen(false)}
                  className={`
                    flex items-center px-4 py-3 text-sm hover:bg-amber-300 transition-colors
                    ${pathname === link.href ? "bg-amber-300 font-bold text-amber-900" : "text-amber-900"}
                  `}
                >
                  <span className="mr-3">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side - Wallet Connection */}
      <div className="flex items-center space-x-3">
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
