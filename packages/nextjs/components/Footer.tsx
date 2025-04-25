import React from "react";
import Image from "next/image";
import Link from "next/link";
import AnimatedTooltipPreview from "./animated-tooltip-demo";

export const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-amber-200 to-amber-300 text-amber-900">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Left side - Large Logo */}
          <div className="w-full md:w-1/4 flex justify-center md:justify-start">
            <Link href="/" className="block">
              <Image
                src="/logo.png"
                alt="Greenwhistle Logo"
                width={200}
                height={100}
                className="rounded-lg h-auto w-full max-w-xs"
              />
            </Link>
          </div>

          {/* Center - Game info and navigation */}
          <div className="w-full md:w-2/5 flex flex-col items-center text-center gap-4">
            <div className="mb-2">
              <h2 className="text-2xl font-bold mb-3 text-amber-900">Adventure Awaits</h2>
              <p className="text-md text-amber-800 mb-4">
                Explore the magical world of Greenwhistle where blockchain meets fantasy. Collect unique heroes, battle
                in tournaments, and trade legendary artifacts in this immersive gaming experience.
              </p>

              <div className="flex justify-center gap-8 mt-4">
                {[
                  { name: "Home", path: "/" },
                  { name: "Game", path: "/game" },
                  { name: "Marketplace", path: "/marketplace" },
                  { name: "Recipes", path: "/recipes" },
                ].map(link => (
                  <Link
                    key={link.path}
                    href={link.path}
                    className="text-amber-900 hover:text-amber-600 font-bold px-3 py-2 rounded-lg hover:bg-amber-100 transition-all"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right side - AnimatedTooltip */}
          <div className="w-full md:w-1/4 flex justify-center md:justify-end">
            <div className="p-4 rounded-lg">
              <AnimatedTooltipPreview />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
