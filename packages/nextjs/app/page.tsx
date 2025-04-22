"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGridDemo } from "~~/components/layout-grid-demo";

// import PixelCard from "~~/components/PixcelCard";

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
        "Trade with other players",
        "Daily market price changes",
      ],
      variant: "yellow",
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

  return (
    <div className="min-h-screen bg-amber-100 overflow-x-hidden">
      {/* Pixel-art border at top */}
      <div className="w-full h-4 bg-amber-900 shadow-md flex">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="flex-1 border-r-2 border-amber-700"></div>
        ))}
      </div>

      {/* Hero Section with Parallax */}
      <div className="relative h-screen">
        {/* Parallax Background */}
        <div
          className="absolute inset-0 h-full w-full"
          style={{
            backgroundImage: "url('https://i.ibb.co/CRWH571/Green-Whistle.png')",
            backgroundPosition: "center bottom",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            transform: `translateY(${scrollY * 0.3}px) scale(1.1)`,
            transformOrigin: "center bottom",
          }}
        />

        {/* Game Logo with Parallax Effect */}
        <Image
          src="/whitetext.png"
          alt="Green Whistle Logo"
          width={350}
          height={100}
          priority
          className="absolute left-1/2 top-[20%] w-[350px] max-w-[80vw] z-10 pointer-events-none select-none"
          style={{
            transform: `translate(-50%, ${scrollY * 0.15}px)`,
            transition: "transform 0.1s linear",
          }}
        />

        {/* Start Adventure Button */}
        <div className="relative z-20 h-full flex flex-col items-center justify-end pb-16">
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

      {/* Decorative pixel divider */}
      <div className="w-full h-6 bg-amber-900 flex items-center justify-center">
        <div className="flex space-x-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-4 h-4 bg-amber-200 rounded-full border-2 border-amber-700"></div>
          ))}
        </div>
      </div>

      {/* Welcome Section */}
      <div className="bg-amber-200 py-16 px-4">
        <div className="max-w-7xl mx-auto mb-12">
          <h2 className="text-4xl font-bold text-amber-900 text-center mb-8 font-serif">Welcome to Green Whistle</h2>
          <p className="text-lg text-amber-800 mb-6 text-center max-w-3xl mx-auto">
            Dive into a vibrant world of farming, trading, and adventure. Grow your crops, catch fish, and trade with
            friends in this immersive pixelated universe.
          </p>
        </div>

        {/* Game Features Section */}
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-amber-900 text-center mb-12 font-serif">Game Features</h2>

          {/* Game Features in Pixel Cards - 4 in a row */}
          {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {gameFeatures.map((feature, index) => (
              <PixelCard key={index} className="h-full">
                <div className="text-center text-white p-2">
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                </div>
              </PixelCard>
            ))}
          </div> */}

          {/* Game Features Details (outside PixelCards) */}
          <div className="grid grid-cols-1 rounded-xl sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
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
                  className="mt-6"
                >
                  <div className="bg-amber-100 p-6 rounded-lg border-4 border-amber-800 shadow-lg">
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
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="bg-amber-800 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-amber-100 mb-6 font-serif">Ready to Start Farming?</h2>
          <p className="text-amber-200 mb-8">
            Join the Green Whistle community and start your farming adventure today!
          </p>
          <motion.a
            href="/game"
            className="bg-amber-100 text-amber-800 font-bold py-3 px-8 rounded-lg text-xl hover:bg-amber-200
              transition-all shadow-lg border-2 border-amber-900 inline-block"
            whileHover={{ scale: 1.05 }}
          >
            Play Now
          </motion.a>
        </div>
      </div>

      {/* Decorative bottom pixel pattern */}
      <div className="w-full h-4 bg-amber-900 shadow-md flex">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="flex-1 border-r-2 border-amber-700"></div>
        ))}
      </div>
    </div>
  );
}
