"use client";

import { useEffect, useRef, useState } from "react";
import { MainMenu } from "../../game/scenes/MainMenu";
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
        <div className="game-container bg-amber-700 rounded-lg overflow-hidden shadow-xl">
          <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
        </div>
      </div>
    </div>
  );
}

export default App;
