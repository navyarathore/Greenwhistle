"use client";

import dynamic from "next/dynamic";
import { ProtectedRoute } from "../wallet/ProtectedRoute";

// Import the App component with SSR disabled
const AppWithoutSSR = dynamic(() => import("./App"), { ssr: false });

export default function GamePage() {
  return (
    <ProtectedRoute>
      <div className="container bg-[#1b1b1b] mx-auto px-4 py-8">
        <AppWithoutSSR />
      </div>
    </ProtectedRoute>
  );
}
