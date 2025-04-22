"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BackgroundGradientDemo from "~~/components/background-gradient-demo";
import { GlobeDemo } from "~~/components/globe-demo";
import { LayoutGridDemo } from "~~/components/layout-grid-demo";

export default function Home() {
  const [showRules, setShowRules] = useState(false);

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
    },
    {
      title: "🏪 Marketplace",
      description: "Trade your harvested crops and items using Sepolia ETH. Buy seeds, tools, and special items.",
      details: [
        "Sell crops for Sepolia ETH",
        "Buy new seeds and tools",
        "Trade with other players",
        "Daily market price changes",
      ],
    },
    {
      title: "🎣 Fishing",
      description: "Fish in the lake area to earn extra money. Different fish have different values and rarity.",
      details: [
        "Use fishing rod near water",
        "Catch different types of fish",
        "Sell fish at the market",
        "Special rare catches",
      ],
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
    },
  ];

  return (
    <div className="min-h-screen bg-amber-100 overflow-x-hidden">
      {/* Decorative top pixel pattern (matches header) */}
      <div className="w-full h-4 bg-amber-900 shadow-md flex">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="flex-1 border-r-2 border-amber-700"></div>
        ))}
      </div>

      {/* Hero Section */}
      <div className="relative min-h-screen bg-gradient-to-b from-amber-100 to-amber-200">
        <div className="absolute inset-0 bg-[url('/textures/old-paper.png')] opacity-10"></div>
        <div className="flex flex-col lg:flex-row items-center justify-between">
          <div className="w-full lg:w-1/2 p-8 lg:pl-20 z-10">
            <motion.div
              className="text-left"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold font-serif mb-6 text-amber-900">GreenWhistle World</h1>
              <p className="text-xl md:text-2xl text-amber-800 mb-8 font-serif">
                A global farming adventure connecting players worldwide
              </p>
              <p className="text-lg text-amber-700 mb-8 max-w-xl border-l-4 border-amber-700 pl-4">
                Welcome to Bloomstead, a worldwide blockchain farming community. Join farmers from across the globe,
                trade internationally on our decentralized marketplace, and be part of an interconnected Web3 ecosystem.
                Using Sepolia testnet, you can safely participate in this global agricultural revolution.
              </p>
              <motion.a
                href="/game"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-amber-800 text-amber-100 font-bold py-4 px-8 rounded-lg text-xl hover:bg-amber-700 
                transition-all shadow-lg border-2 border-amber-900 inline-block transform hover:scale-105"
              >
                Start Your Adventure
              </motion.a>
            </motion.div>
          </div>

          <div className="w-full lg:w-1/2 h-[50vh] lg:h-screen relative">
            <div className="absolute inset-0 transform scale-90 border-8 border-amber-900 rounded-lg overflow-hidden m-4">
              <GlobeDemo />
              <div className="absolute inset-0 bg-amber-900 opacity-10 pointer-events-none"></div>
            </div>
          </div>
        </div>
      </div>
      <LayoutGridDemo />
      {/* Decorative divider */}
      <div className="w-full h-6 bg-amber-900 flex items-center justify-center">
        <div className="flex space-x-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-4 h-4 bg-amber-200 rounded-full border-2 border-amber-700"></div>
          ))}
        </div>
      </div>

      {/* Feature cards */}
      <div className="bg-amber-200 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-amber-900 text-center mb-12 font-serif">Game Features</h2>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {gameFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="bg-amber-100 p-6 rounded-lg border-4 border-amber-800 shadow-lg"
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 * index }}
              >
                <h3 className="text-2xl font-bold text-amber-900 mb-3 font-serif">{feature.title}</h3>
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
          </motion.div>

          {/* Game Controls */}
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
                  className="mt-6 bg-amber-100 p-6 rounded-lg backdrop-blur-sm border-4 border-amber-800 shadow-lg"
                >
                  <h3 className="text-2xl font-bold text-amber-900 mb-4 font-serif">Game Controls</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-700">
                      <h4 className="font-bold text-amber-900 text-lg mb-2">Movement</h4>
                      <ul className="list-disc list-inside text-amber-800 space-y-1">
                        <li>WASD or Arrow keys to move</li>
                        <li>Hold Shift to run</li>
                      </ul>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-700">
                      <h4 className="font-bold text-amber-900 text-lg mb-2">Actions</h4>
                      <ul className="list-disc list-inside text-amber-800 space-y-1">
                        <li>E or Space to interact</li>
                        <li>1-5 to select items</li>
                        <li>I to open inventory</li>
                      </ul>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-700">
                      <h4 className="font-bold text-amber-900 text-lg mb-2">Tools</h4>
                      <ul className="list-disc list-inside text-amber-800 space-y-1">
                        <li>Hoe: Till soil for planting</li>
                        <li>Watering Can: Water crops</li>
                        <li>Seeds: Plant in tilled soil</li>
                        <li>Fishing Rod: Fish in water</li>
                      </ul>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-700">
                      <h4 className="font-bold text-amber-900 text-lg mb-2">Tips</h4>
                      <ul className="list-disc list-inside text-amber-800 space-y-1">
                        <li>Water crops daily for faster growth</li>
                        <li>Check market prices before selling</li>
                        <li>Talk to NPCs for useful tips</li>
                        <li>Use the mini-map for navigation</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Decorative bottom pixel pattern (matches header) */}
      <div className="w-full h-4 bg-amber-900 shadow-md flex">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="flex-1 border-r-2 border-amber-700"></div>
        ))}
      </div>
    </div>
  );
}
