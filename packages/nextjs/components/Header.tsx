"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { hardhat } from "viem/chains";
import { Bars3Icon, BugAntIcon, TrophyIcon } from "@heroicons/react/24/outline";
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
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
    ),
  },
  {
    label: "Game",
    href: "/game",
    icon: <TrophyIcon className="h-4 w-4" />,
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={`${
                isActive ? "bg-amber-800 text-amber-100" : "text-amber-900"
              } hover:bg-amber-700 hover:text-amber-100 focus:!bg-amber-700 active:!text-amber-100 py-2 px-4 text-sm font-bold border-2 border-amber-900 rounded-lg gap-2 grid grid-flow-col transition-all`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * Site header with vintage game theme
 */
export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const burgerMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(
    burgerMenuRef,
    useCallback(() => setIsDrawerOpen(false), []),
  );

  return (
    <>
      {/* Top decorative border */}
      <div className="w-full h-4 bg-amber-900 shadow-md flex">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="flex-1 border-r-2 border-amber-700"></div>
        ))}
      </div>
      <div className="sticky lg:static top-0 navbar min-h-0 flex-shrink-0 justify-between z-20 px-0 sm:px-2 bg-amber-200 bg-opacity-90 border-b-4 border-amber-900 shadow-md">
        <div className="navbar-start w-auto lg:w-1/2">
          <div className="lg:hidden dropdown" ref={burgerMenuRef}>
            <label
              tabIndex={0}
              className={`ml-1 btn border-2 border-amber-800 bg-amber-300 text-amber-900 ${isDrawerOpen ? "hover:bg-amber-400" : "hover:bg-amber-400"}`}
              onClick={() => {
                setIsDrawerOpen(prevIsOpenState => !prevIsOpenState);
              }}
            >
              <Bars3Icon className="h-1/2" />
            </label>
            {isDrawerOpen && (
              <ul
                tabIndex={0}
                className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-amber-200 border-2 border-amber-900 rounded-lg w-52"
                onClick={() => {
                  setIsDrawerOpen(false);
                }}
              >
                <HeaderMenuLinks />
              </ul>
            )}
          </div>
          <Link href="/" passHref className="hidden lg:flex items-center gap-3 ml-4 mr-6 shrink-0">
            <div className="flex relative w-12 h-12 bg-amber-800 rounded-full border-2 border-amber-900 shadow-md overflow-hidden">
              <GameLogo />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl text-amber-900 font-serif tracking-wider">Greenwhistle</span>
              <span className="text-xs text-amber-800 italic">Game of the year</span>
            </div>
          </Link>
          <ul className="hidden lg:flex lg:flex-nowrap text-white menu menu-horizontal px-1 gap-3">
            <HeaderMenuLinks />
          </ul>
        </div>
        <div className="navbar-end flex-grow mr-4">
          <div className="bg-amber-300 p-1 rounded-lg border-2 text-white border-amber-900">
            <OnchainKitCustomConnectButton />
          </div>
          {isLocalNetwork && (
            <div className="ml-2 bg-amber-300 p-1 rounded-lg border-2 border-amber-900">
              <FaucetButton />
            </div>
          )}
        </div>
      </div>
      {/* Bottom decorative border */}
      <div className="w-full h-4 bg-amber-900 shadow-md flex">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="flex-1 border-r-2 border-amber-700"></div>
        ))}
      </div>
    </>
  );
};

const GameLogo = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted ? (
    <div className="w-full h-full flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-8 h-8 text-amber-200"
      >
        <path d="M11.25 5.337c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.036 1.007-1.875 2.25-1.875S15 2.34 15 3.375c0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959 0 .332.278.598.61.578 1.91-.114 3.79-.342 5.632-.676a.75.75 0 01.878.645 49.17 49.17 0 01.376 5.452.657.657 0 01-.66.664c-.354 0-.675-.186-.958-.401a1.647 1.647 0 00-1.003-.349c-1.035 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401.31 0 .557.262.534.571a48.774 48.774 0 01-.595 4.845.75.75 0 01-.61.61c-1.82.317-3.673.533-5.555.642a.58.58 0 01-.611-.581c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.035-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959a.641.641 0 01-.658.643 49.118 49.118 0 01-4.708-.36.75.75 0 01-.645-.878c.293-1.614.504-3.257.629-4.924A.53.53 0 005.337 15c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.036 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.369 0 .713.128 1.003.349.283.215.604.401.959.401a.656.656 0 00.659-.663 47.703 47.703 0 00-.31-4.82.75.75 0 01.83-.832c1.343.155 2.703.254 4.077.294a.64.64 0 00.657-.642z" />
      </svg>
    </div>
  ) : (
    <div className="w-full h-full rounded-full"></div>
  );
};
