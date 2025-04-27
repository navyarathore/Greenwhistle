"use client";

import { useEffect, useRef, useState } from "react";
import { IRefPhaserGame, PhaserGame } from "~~/game/PhaserGame";

function App() {
  // References to the PhaserGame component (game and scene are exposed)
  const phaserRef = useRef<IRefPhaserGame | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Event emitted from the PhaserGame component
  const currentScene = (scene: Phaser.Scene) => {
    // Callback on scene change
  };

  const toggleFullscreen = () => {
    if (!gameContainerRef.current) return;

    if (!document.fullscreenElement) {
      // Enter fullscreen
      gameContainerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      // Exit fullscreen
      document.exitFullscreen().catch(err => {
        console.error(`Error attempting to exit fullscreen: ${err.message}`);
      });
    }
  };

  // Update state when fullscreen changes
  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };

  // Add event listeners for fullscreen changes
  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Add cleanup effect to destroy game when component unmounts
  useEffect(() => {
    // Store ref in a variable to avoid closure issues
    const gameInstance = phaserRef.current;
    return () => {
      // Cleanup when component unmounts
      if (gameInstance?.game) {
        gameInstance.game.destroy(true);
      }
    };
  }, []);

  return (
    <div id="app" className="flex flex-col gap-6">
      <div className={`flex flex-col ${!isFullscreen ? "ml-[35px]" : "ml-[20px]"} md:flex-row gap-6`}>
        <div className="relative w-full">
          <div
            ref={gameContainerRef}
            className={`game-container bg-[#1b1b1b] rounded-lg overflow-hidden shadow-xl ${
              isFullscreen ? "w-full h-full" : ""
            }`}
            style={isFullscreen ? { margin: 0 } : {}}
          >
            <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />

            {/* Button inside the game container to maintain position in fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-md shadow-md z-10"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                // Exit fullscreen icon
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
                </svg>
              ) : (
                // Enter fullscreen icon
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 8V5a2 2 0 0 1 2-2h3m13 0h3a2 2 0 0 1 2 2v3m0 13v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 1 2 2h3"></path>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
