"use client";

import { useEffect, useRef, useState } from "react";
import { MainMenu } from "../../game/scenes/MainMenu";
import { InventoryGrid } from "~~/components/game/InventoryGrid";
import { EventBus } from "~~/game/EventBus";
import { IRefPhaserGame, PhaserGame } from "~~/game/PhaserGame";
import InventoryManager, { PLAYER_INVENTORY_SIZE } from "~~/game/managers/InventoryManager";
import { Item } from "~~/game/resources/Item";

function App() {
  // The sprite can only be moved in the MainMenu Scene
  const [canMoveSprite, setCanMoveSprite] = useState(true);

  //  References to the PhaserGame component (game and scene are exposed)
  const phaserRef = useRef<IRefPhaserGame | null>(null);
  const [inventoryItems, setInventoryItems] = useState<Item[]>([]);

  useEffect(() => {
    const handleInventoryUpdate = (items: Item[]) => {
      setInventoryItems(items);
      console.log("Inventory updated:", items);
    };

    const handleInventoryReady = (system: InventoryManager) => {
      setInventoryItems(system.getItems());
      console.log("Inventory updated:", system.getItems());
    };

    EventBus.on("update-inventory-ui", handleInventoryUpdate);
    EventBus.on("inventory-system-ready", handleInventoryReady);

    return () => {
      EventBus.off("update-inventory-ui", handleInventoryUpdate);
      EventBus.off("inventory-system-ready", handleInventoryReady);
    };
  });

  const changeScene = () => {
    if (phaserRef.current) {
      const scene = phaserRef.current.scene as MainMenu;

      if (scene) {
        scene.changeScene();
      }
    }
  };

  // Event emitted from the PhaserGame component
  const currentScene = (scene: Phaser.Scene) => {
    setCanMoveSprite(scene.scene.key !== "MainMenu");
  };

  return (
    <div id="app" className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="game-container bg-gray-800 rounded-lg overflow-hidden shadow-xl">
          <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
        </div>
        <div className="controls bg-gray-800/50 p-4 rounded-lg backdrop-blur-sm border border-gray-700">
          <div className="mb-4">
            <button
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg w-full hover:scale-105 transition-all shadow-lg hover:shadow-blue-500/25"
              onClick={changeScene}
            >
              Change Scene
            </button>
          </div>
          <div className="mb-4">
            <button
              disabled={canMoveSprite}
              className="bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold py-3 px-6 rounded-lg w-full hover:scale-105 transition-all shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              // onClick={moveSprite}
            >
              Toggle Movement
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Section */}
      <InventoryGrid items={inventoryItems} maxSlots={PLAYER_INVENTORY_SIZE} />
    </div>
  );
}

export default App;
