"use client";

import dynamic from "next/dynamic";

// Import the App component with SSR disabled
const AppWithoutSSR = dynamic(() => import("./App"), { ssr: false });

export default function GamePage() {
  return (
    <div className="container bg-[#1b1b1b] mx-auto px-4 py-8">
      <AppWithoutSSR />
    </div>
  );
}
