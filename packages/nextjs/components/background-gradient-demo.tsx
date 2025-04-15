"use client";

import Image from "next/image";
import { BackgroundGradient } from "./ui/background-gradient";

export default function BackgroundGradientDemo() {
  const features = [
    {
      title: "Magical Farming",
      description:
        "Cultivate enchanted crops, master the art of magical agriculture, and watch your farm flourish with mystical plants.",
      icon: "🌱",
      color: "from-emerald-400 to-cyan-400",
    },
    {
      title: "Web3 Trading",
      description:
        "Trade your harvested goods on the blockchain marketplace using Sepolia ETH. Connect with other farmers globally.",
      icon: "💎",
      color: "from-violet-400 to-indigo-400",
    },
    {
      title: "Character Growth",
      description:
        "Level up your character's skills, unlock new abilities, and become a legendary farmer in the world of Bloomstead.",
      icon: "⚔️",
      color: "from-pink-400 to-red-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
      {features.map((feature, index) => (
        <BackgroundGradient key={index} className="rounded-[22px] p-6 bg-white dark:bg-zinc-900">
          <div className="flex flex-col items-center text-center space-y-4">
            <span className="text-5xl">{feature.icon}</span>
            <h3 className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${feature.color}`}>
              {feature.title}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{feature.description}</p>
            <button className="rounded-full px-4 py-2 text-white flex items-center space-x-2 bg-black/80 hover:bg-black/60 transition-colors dark:bg-zinc-800">
              <span className="text-sm font-medium">Learn more</span>
            </button>
          </div>
        </BackgroundGradient>
      ))}
    </div>
  );
}
