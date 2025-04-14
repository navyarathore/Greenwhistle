"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);
        setIsConnected(true);
      } catch (error) {
        console.error("Error connecting to wallet:", error);
      }
    } else {
      alert("Please install MetaMask to play Bloomstead!");
    }
  };

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
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-green-300 overflow-x-hidden">
      <motion.div
        className="max-w-6xl mx-auto px-4 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="text-center mb-12"
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <motion.h1
            className="text-6xl font-bold text-green-800 mb-4"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Bloomstead
          </motion.h1>
          <motion.p
            className="text-xl text-green-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Your magical farming adventure awaits in the blockchain
          </motion.p>
        </motion.div>

        {!isConnected ? (
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={connectWallet}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors shadow-lg"
            >
              Connect Wallet to Play
            </motion.button>
            <p className="mt-4 text-green-700">Connect with MetaMask using Sepolia network to start playing</p>
          </motion.div>
        ) : (
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-green-800 mb-4">
              Connected: {account?.slice(0, 6)}...{account?.slice(-4)}
            </p>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="/game"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors inline-block shadow-lg"
            >
              Start Game
            </motion.a>
          </motion.div>
        )}

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {gameFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="bg-white/50 p-6 rounded-lg shadow-lg backdrop-blur-sm"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 * index }}
            >
              <h3 className="text-xl font-bold text-green-800 mb-2">{feature.title}</h3>
              <p className="text-green-700 mb-4">{feature.description}</p>
              <ul className="list-disc list-inside text-green-600 space-y-1">
                {feature.details.map((detail, i) => (
                  <li key={i}>{detail}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
          <motion.button
            onClick={() => setShowRules(!showRules)}
            className="text-green-700 underline"
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
                className="mt-6 bg-white/50 p-6 rounded-lg shadow-lg backdrop-blur-sm"
              >
                <h3 className="text-xl font-bold text-green-800 mb-4">Game Controls</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div>
                    <h4 className="font-bold text-green-700">Movement</h4>
                    <ul className="list-disc list-inside text-green-600">
                      <li>WASD or Arrow keys to move</li>
                      <li>Hold Shift to run</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-green-700">Actions</h4>
                    <ul className="list-disc list-inside text-green-600">
                      <li>E or Space to interact</li>
                      <li>1-5 to select items</li>
                      <li>I to open inventory</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-green-700">Tools</h4>
                    <ul className="list-disc list-inside text-green-600">
                      <li>Hoe: Till soil for planting</li>
                      <li>Watering Can: Water crops</li>
                      <li>Seeds: Plant in tilled soil</li>
                      <li>Fishing Rod: Fish in water</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-green-700">Tips</h4>
                    <ul className="list-disc list-inside text-green-600">
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
      </motion.div>
    </div>
  );
}
