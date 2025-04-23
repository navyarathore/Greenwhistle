import React from "react";
import Link from "next/link";
import AnimatedTooltipPreview from "./animated-tooltip-demo";
import { HeartIcon } from "@heroicons/react/24/outline";
import { BuidlGuidlLogo } from "~~/components/assets/BuidlGuidlLogo";

export const Footer = () => {
  return (
    <>
      {/* Decorative top border with gradient */}
      <div className="w-full h-3 bg-gradient-to-r from-amber-900 via-amber-700 to-amber-900 shadow-inner" />

      {/* Main footer */}
      <footer className="bg-gradient-to-b from-amber-100 to-amber-50 text-amber-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Logo & About */}
            <div className="flex flex-col gap-6 items-center md:items-start text-center md:text-left">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-800 rounded-xl flex items-center justify-center border-2 border-amber-900 shadow-lg transform hover:scale-105 transition">
                  <GameLogo />
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-serif tracking-tight">Greenwhistle</h2>
                  <p className="text-sm italic text-amber-700">Game of the Year</p>
                </div>
              </div>
              <p className="text-sm text-amber-800 max-w-xs">
                Dive into the ultimate blockchain gaming adventure. Collect, trade, and dominate in Greenwhistle’s
                vibrant universe.
              </p>
            </div>

            {/* Quick Links */}
            <div className="flex flex-col gap-6 items-center">
              <h3 className="text-xl font-bold font-serif text-amber-900">Quick Links</h3>
              <ul className="space-y-3 text-sm font-medium">
                {["/", "/game", "/marketplace"].map((path, i) => {
                  const names = ["Home", "Game", "Marketplace"];
                  return (
                    <li key={path}>
                      <Link
                        href={path}
                        className="relative text-amber-800 hover:text-amber-600 transition-colors duration-200 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-amber-600 after:transition-all after:duration-200 hover:after:w-full"
                      >
                        {names[i]}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Community & Social */}
            <div className="flex flex-col gap-6 items-center md:items-end">
              <h3 className="text-xl font-bold font-serif text-amber-900">Community</h3>
              <div className="flex gap-4">
                <SocialIcon href="https://github.com/scaffold-eth/se-2" label="GitHub">
                  <GitHubIcon className="w-6 h-6" />
                </SocialIcon>
                <SocialIcon href="https://buidlguidl.com/" label="BuidlGuidl">
                  <BuidlGuidlLogo className="w-5 h-7" />
                </SocialIcon>
              </div>
              <div className="flex items-center gap-2 text-sm text-amber-800">
                <span>Built with</span>
                <HeartIcon className="w-5 h-5 text-red-500 animate-pulse" />
                <span className="font-medium">XLR8</span>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <AnimatedTooltipPreview />
          </div>
        </div>

        {/* Copyright */}
        <div className="bg-amber-900 text-amber-200 text-center text-xs py-4">
          © 2025 Greenwhistle. All rights reserved.
        </div>
      </footer>
    </>
  );
};

const GameLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-amber-200">
    <path
      fillRule="evenodd"
      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM8.25 12a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm3.75-3.75a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm1.5 7.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z"
      clipRule="evenodd"
    />
  </svg>
);

interface SocialIconProps {
  href: string;
  children: React.ReactNode;
  label: string;
}

const SocialIcon = ({ href, children, label }: SocialIconProps) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    aria-label={label}
    className="p-3 bg-amber-200 border-2 border-amber-900 rounded-xl hover:bg-amber-300 hover:scale-110 transition-all duration-200 shadow-sm"
  >
    {children}
  </a>
);

interface GitHubIconProps {
  className?: string;
}

const GitHubIcon = ({ className }: GitHubIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`text-amber-900 ${className}`}
  >
    <path
      fillRule="evenodd"
      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75 0 4.308 2.787 7.957 6.645 9.255.487.09.66-.21.66-.465v-1.635c-2.697.585-3.27-1.305-3.27-1.305-.45-1.14-1.095-1.44-1.095-1.44-.892-.615.068-.602.068-.602.99.142 1.515.66 1.515.66.885 1.515 2.325 1.08 2.895.825.09-.69.345-1.08.615-1.327-2.145-.24-4.395-1.072-4.395-4.785 0-1.057.375-1.92 1.005-2.595-.102-.24-.435-1.23.09-2.565 0 0 .81-.255 2.655.975a9.12 9.12 0 012.415-.33c.825 0 1.657.112 2.415.33 1.845-1.23 2.655-.975 2.655-.975.525 1.335.195 2.325.09 2.565.63.675 1.005 1.537 1.005 2.595 0 3.72-2.25 4.545-4.395 4.785.345.3.615.825.615 1.665v2.475c0 .255.172.555.66.465 3.862-1.297 6.645-4.947 6.645-9.255 0-5.385-4.365-9.75-9.75-9.75z"
      clipRule="evenodd"
    />
  </svg>
);
