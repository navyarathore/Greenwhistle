"use client";

import { useRef } from "react";
import { IRefPhaserGame, PhaserGame } from "~~/game/PhaserGame";

function App() {
  //  References to the PhaserGame component (game and scene are exposed)
  const phaserRef = useRef<IRefPhaserGame | null>(null);

  // Event emitted from the PhaserGame component
  const currentScene = (scene: Phaser.Scene) => {
    // Callback on scene change
  };

  return (
    <div id="app" className="flex flex-col gap-6">
      <div className="flex flex-col ml-[105px] md:flex-row gap-6">
        <div className="game-container bg-[#1b1b1b] rounded-lg overflow-hidden shadow-xl">
          <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
        </div>
      </div>
    </div>
  );
}

export default App;
