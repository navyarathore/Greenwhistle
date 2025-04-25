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
      title: "🌾 Farming",
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
      title: "🏪 Marketplace",
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
      title: "⚔️ Combat",
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
      title: "👥 NPCs",
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
      details: ["WASD or Arrow keys to move", "Hold Shift to run"],
    },
    {
      title: "Actions",
      details: ["E or Space to interact", "1-5 to select items", "I to open inventory"],
    },
    {
      title: "Tools",
      details: [
        "Hoe: Till soil for planting",
        "Watering Can: Water crops",
        "Seeds: Plant in tilled soil",
        "Fishing Rod: Fish in water",
      ],
    },
    {
      title: "Tips",
      details: [
        "Water crops daily for faster growth",
        "Check market prices before selling",
        "Talk to NPCs for useful tips",
        "Use the mini-map for navigation",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-amber-100 overflow-x-hidden">
      {/* Hero Section with Parallax */}
      <div className="relative h-screen">
        {/* Parallax Background */}
        <div
          className="absolute inset-0 h-full w-full"
          style={{
            backgroundImage: "url('/background.jpeg')",
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
      <div className="bg-amber-200 py-16 px-4">
        <div className="max-w-7xl mx-auto mb-12">
          <h2 className="text-6xl font-bold text-amber-900 text-center mb-8 font-['PixelGame']">
            {" "}
            Welcome to Green Whistle{" "}
          </h2>
          <p className="text-2xl text-amber-800 mb-6 text-center max-w-3xl font-serif mx-auto">
            Dive into a vibrant world of farming, trading, and adventure. Grow your crops, catch fish, and trade with
            friends in this immersive pixelated universe.
          </p>
        </div>

        {/* Game Features Section */}
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-amber-900 text-center mb-12 font-serif">Game Features</h2>

          {/* Game Features Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {gameFeatures.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-amber-100 p-6 rounded-3xl border-4 border-amber-800 shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 * index }}
              >
                <h3 className="text-xl font-bold text-amber-900 mb-3">{feature.title}</h3>
                <p className="text-amber-800 mb-4">{feature.description}</p>
                <ul className="list-disc list-inside text-amber-700 space-y-2">
                  {feature.details.map((detail, i) => (
                    <li key={i} className="pl-2">
                      {detail}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Game Controls Section */}
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.button
              onClick={() => setShowRules(!showRules)}
              className="bg-amber-800 text-amber-100 py-3 px-6 rounded-lg border-2 border-amber-900 font-bold"
              whileHover={{ scale: 1.05 }}
            >
              {showRules ? "Hide Game Controls" : "Show Game Controls"}
            </motion.button>

            <AnimatePresence>
              {showRules && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {gameControls.map((control, index) => (
                      <motion.div
                        key={index}
                        className="bg-amber-100 p-6 rounded-3xl border-4 border-amber-800 shadow-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 * index }}
                      >
                        <h3 className="text-xl font-bold text-amber-900 mb-3">{control.title}</h3>
                        <ul className="list-disc list-inside text-amber-700 space-y-2">
                          {control.details.map((detail, i) => (
                            <li key={i} className="pl-2">
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
