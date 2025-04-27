"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGridDemo } from "~~/components/layout-grid-demo";

export default function Home() {
  const [showRules, setShowRules] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Handle scroll for parallax effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const gameFeatures = [
    {
      title: "Farming",
      description:
        "Till soil, plant crops, water them daily, and harvest when ready. Different crops have different growth times and values.",
      details: [
        "Use the Hoe to till grass into farmland",
        "Plant seeds in tilled soil",
        "Water daily for faster growth",
        "Harvest crops when fully grown",
      ],
      variant: "blue",
    },
    {
      title: "Marketplace",
      description: "Trade your harvested crops and items using Sepolia ETH. Buy seeds, tools, and special items.",
      details: [
        "Sell crops for Sepolia ETH",
        "Buy new seeds and tools",
        "NFTs marketplace for unique items",
        "Trade with other players",
        "Daily market price changes",
      ],
      variant: "yellow",
    },
    {
      title: "Combat",
      description:
        "Engage in intense battles against wild creatures and enemies. Use your skills and weapons to survive and grow stronger.",
      details: [
        "Explore dangerous zones with enemy spawns",
        "Fight using melee, ranged, or magic attacks",
        "Earn XP and level up your combat skills",
        "Collect loot from defeated enemies",
      ],
      variant: "default",
    },
    {
      title: "NPCs",
      description: "Interact with villagers to learn farming tips, get quests, and trade special items.",
      details: [
        "Talk to NPCs using 'E' key",
        "Complete quests for rewards",
        "Learn farming techniques",
        "Build relationships",
      ],
      variant: "pink",
    },
  ];

  const gameControls = [
    {
      title: "Movement",
      details: ["W --> Move Up", "A --> Move Left", "S --> Move Down", "D --> Move Right"],
    },
    {
      title: "Actions",
      details: ["F To Collect Items", "E To Open Inventory", "Q To use the Tools"],
    },
    {
      title: "Tools",
      details: [
        "Axe: Chop trees and collect wood",
        "Pickaxe: Mine ores and stones",
        "Hoe: Till soil for planting",
        "Seeds: Plant in tilled soil",
      ],
    },
    {
      title: "Tips",
      details: ["Check market prices before selling"],
    },
  ];

  return (
    <div className="min-h-screen bg-[#1b1b1b] overflow-x-hidden">
      {/* Hero Section with Parallax */}
      <div className="relative h-screen">
        {/* Parallax Background */}
        <div
          className="absolute inset-0 h-full w-full"
          style={{
            backgroundImage: "url('/3.gif')",
            backgroundPosition: "center bottom",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            transform: `translateY(${scrollY * 0.3}px) scale(1.1)`,
            transformOrigin: "center bottom",
          }}
        />

        {/* Game Logo with Parallax Effect */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-10 z-20">
          <Image
            src="/logo.png"
            alt="Green Whistle Logo"
            width={550}
            height={200}
            priority
            className="w-[500px] max-w-[80vw] pointer-events-none select-none"
            style={{
              transform: `translateY(${scrollY * 0.15}px)`,
              transition: "transform 0.1s linear",
            }}
          />

          {/* Start Adventure Button */}
          <motion.a
            href="/game"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-amber-800 text-amber-100 font-bold py-4 px-8 rounded-lg text-xl hover:bg-amber-700 
      transition-all shadow-lg border-2 border-amber-900 inline-block transform hover:scale-105"
          >
            Start Your Adventure
          </motion.a>
        </div>
      </div>
      {/* Layout Grid Demo Section */}
      <LayoutGridDemo />

      {/* Welcome Section */}
      <div className="bg-[#1b1b1b] py-16 px-4">
        <div className="max-w-7xl mx-auto mb-12">
          {/* <h2 className="text-6xl font-bold text-amber-900 text-center mb-8 font-['PixelGame']"> */}
          <h2 className="text-6xl font-bold text-[#c6c607] text-center mb-8 font-['PixelHeading']">
            {" "}
            Welcome to Green Whistle{" "}
          </h2>
          <p className="text-xl text-white font-['Montserrat-Medium'] mb-6 text-center max-w-3xl mx-auto">
            Dive into a vibrant world of farming, trading, and adventure. Grow your crops, catch fish, and trade with
            friends in this immersive pixelated universe.
          </p>
        </div>

        {/* Game Features Section */}
        <div className="max-w-7xl mt-20 mx-auto">
          <h2 className="text-4xl font-[PixelHeading] text-[#c6c607] text-center mb-12 ">Game Features</h2>

          {/* Game Features Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {gameFeatures.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-[#1a1c2c] p-6 "
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 * index }}
              >
                <h3 className="text-xl font-bold text-[#c6c607] mb-3">{feature.title}</h3>
                <p className="text-white mb-4">{feature.description}</p>
                <ul className="list-disc list-inside text-white space-y-2">
                  {feature.details.map((detail, i) => (
                    <li key={i} className="pl-2">
                      {detail}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Game Controls Section - Prominent Version */}
          <div className="bg-[#2a2a2a] py-16 px-4 mt-16 border-t-2 border-b-2 border-[#c6c607]">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-4xl font-[PixelHeading] text-[#c6c607] text-center mb-12">Game Controls</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {gameControls.map((control, index) => (
                  <motion.div
                    key={index}
                    className="bg-[#1a1c2c] p-6 rounded-lg border-2 border-[#c6c607] hover:border-[#e6e600] 
                    transition-all duration-300 hover:transform hover:scale-105"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <div className="flex items-center mb-4">
                      <h3 className="text-2xl font-bold text-[#c6c607]">{control.title}</h3>
                    </div>
                    <ul className="space-y-3">
                      {control.details.map((detail, i) => (
                        <li key={i} className="flex items-center text-white text-lg">
                          <span className="mr-2">→</span>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>

              {/* Quick Reference */}
              <div className="mt-12 bg-[#1a1c2c] p-6 rounded-lg border-2 border-[#c6c607]">
                <h3 className="text-xl font-bold text-[#c6c607] mb-4 text-center">Quick Reference</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-white">
                  <div>
                    <span className="bg-[#c6c607] text-black px-2 py-1 rounded">W A S D</span>
                    <span className="ml-2">Movement</span>
                  </div>
                  <div>
                    <span className="bg-[#c6c607] text-black px-2 py-1 rounded">E</span>
                    <span className="ml-2">Inventory</span>
                  </div>
                  <div>
                    <span className="bg-[#c6c607] text-black px-2 py-1 rounded">F</span>
                    <span className="ml-2">Collect</span>
                  </div>
                  <div>
                    <span className="bg-[#c6c607] text-black px-2 py-1 rounded">Q</span>
                    <span className="ml-2">Use Tool</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* YouTube Video Section */}
      <div className="max-w-7xl mx-auto py-16 px-4">
        <h2 className="text-4xl font-[PixelHeading] text-[#c6c607] text-center mb-12">Game Preview</h2>
        <div className="relative w-full aspect-video">
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src="https://www.youtube.com/embed/MTDZzDe7_Gc?si=406hL-dPwwKKvWOy"
            title="Green Whistle Gameplay Preview"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
