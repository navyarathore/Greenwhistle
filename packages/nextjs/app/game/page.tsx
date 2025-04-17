"use client";

import dynamic from "next/dynamic";

// Import the App component with SSR disabled
const AppWithoutSSR = dynamic(() => import("./App"), { ssr: false });

export default function GamePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Phaser Game Example</h1>
      <AppWithoutSSR />
    </div>
  );
}
