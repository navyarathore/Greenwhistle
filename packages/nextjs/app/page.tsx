"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
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
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <div className="relative h-screen">
        <div className="flex flex-row items-center justify-between">
          <div className="w-1/2 pl-20 z-10">
            <motion.div
              className="text-left"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-6">
                GreenWhistel World
              </h1>
              <p className="text-2xl text-gray-300 mb-8">A global farming adventure connecting players worldwide</p>
              <p className="text-lg text-gray-400 mb-8 max-w-xl">
                Welcome to Bloomstead, a worldwide blockchain farming community. Join farmers from across the globe,
                trade internationally on our decentralized marketplace, and be part of an interconnected Web3 ecosystem.
                Using Sepolia testnet, you can safely participate in this global agricultural revolution.
              </p>
              <motion.a
                href="/game"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-4 px-8 rounded-lg text-xl hover:scale-105 transition-all shadow-lg hover:shadow-blue-500/25"
              >
                Start Your Adventure
              </motion.a>
            </motion.div>
          </div>

          <div className="w-1/2 h-screen">
            <GlobeDemo />
          </div>
        </div>
      </div>
      <LayoutGridDemo />
      <div className="max-w-7xl mx-auto px-4 py-20">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {gameFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="bg-gray-800/50 p-6 rounded-lg backdrop-blur-sm border border-gray-700"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 * index }}
            >
              <h3 className="text-xl font-bold text-blue-400 mb-2">{feature.title}</h3>
              <p className="text-gray-300 mb-4">{feature.description}</p>
              <ul className="list-disc list-inside text-gray-400 space-y-1">
                {feature.details.map((detail, i) => (
                  <li key={i}>{detail}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            onClick={() => setShowRules(!showRules)}
            className="text-blue-400 underline"
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
                className="mt-6 bg-gray-800/50 p-6 rounded-lg backdrop-blur-sm border border-gray-700"
              >
                <h3 className="text-xl font-bold text-blue-400 mb-4">Game Controls</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div>
                    <h4 className="font-bold text-blue-400">Movement</h4>
                    <ul className="list-disc list-inside text-gray-300">
                      <li>WASD or Arrow keys to move</li>
                      <li>Hold Shift to run</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-400">Actions</h4>
                    <ul className="list-disc list-inside text-gray-300">
                      <li>E or Space to interact</li>
                      <li>1-5 to select items</li>
                      <li>I to open inventory</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-400">Tools</h4>
                    <ul className="list-disc list-inside text-gray-300">
                      <li>Hoe: Till soil for planting</li>
                      <li>Watering Can: Water crops</li>
                      <li>Seeds: Plant in tilled soil</li>
                      <li>Fishing Rod: Fish in water</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-400">Tips</h4>
                    <ul className="list-disc list-inside text-gray-300">
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
        <BackgroundGradientDemo />
      </div>
    </div>
  );
}
