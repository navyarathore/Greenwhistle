import React from "react";
import Link from "next/link";
import AnimatedTooltipPreview from "./animated-tooltip-demo";
import { HeartIcon } from "@heroicons/react/24/outline";
import { BuidlGuidlLogo } from "~~/components/assets/BuidlGuidlLogo";

export const Footer = () => {
  return (
    <>
      {/* Decorative top border */}
      <div className="w-full h-4 bg-amber-900 flex shadow-inner">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="flex-1 border-r border-amber-700"></div>
        ))}
      </div>

      {/* Main footer */}
      <footer className="bg-amber-100 border-t-4 border-amber-900 text-amber-900">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Logo & About */}
          <div className="flex flex-col gap-4 items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-800 rounded-full flex items-center justify-center border-2 border-amber-900 shadow">
                <GameLogo />
              </div>
              <div>
                <h2 className="text-xl font-semibold font-serif">Greenwhistle</h2>
                <p className="text-xs italic text-amber-700">Game of the year</p>
              </div>
            </div>
            <p className="text-sm">
              The ultimate blockchain gaming experience. Collect, trade, and conquer in the world of Greenwhistle.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4 items-center">
            <h3 className="text-lg font-bold font-serif">Quick Links</h3>
            <ul className="space-y-2 text-sm font-medium">
              {["/", "/game", "/marketplace"].map((path, i) => {
                const names = ["Home", "Game", "Marketplace"];
                return (
                  <li key={path}>
                    <Link href={path} className="hover:text-amber-600 transition">
                      {names[i]}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Community & Social */}
          <div className="flex flex-col gap-4 items-center md:items-end">
            <h3 className="text-lg font-bold font-serif">Community</h3>
            <div className="flex gap-3">
              <SocialIcon href="https://github.com/scaffold-eth/se-2" label="GitHub">
                <GitHubIcon />
              </SocialIcon>
              <SocialIcon href="https://buidlguidl.com/" label="BuidlGuidl">
                <BuidlGuidlLogo className="w-4 h-6" />
              </SocialIcon>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>Built with</span>
              <HeartIcon className="w-4 h-4 text-red-500" />
              <span>XLR8</span>
            </div>
          </div>
        </div>
        <AnimatedTooltipPreview />
      </footer>

      {/* Copyright */}
      <div className="bg-amber-900 text-amber-200 text-center text-xs py-3">
        © 2025 Greenwhistle. All rights reserved.
      </div>
    </>
  );
};

const GameLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-amber-200">
    <path d="..." />
  </svg>
);

const SocialIcon = ({ href, children, label }: { href: string; children: React.ReactNode; label: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    aria-label={label}
    className="p-2 border-2 border-amber-900 bg-amber-300 hover:bg-amber-400 rounded-lg transition"
  >
    {children}
  </a>
);

const GitHubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
    <path d="..." />
  </svg>
);
