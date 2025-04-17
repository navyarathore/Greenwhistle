"use client";

import { useRef, useState } from "react";
import { IRefPhaserGame, PhaserGame } from "../../game/PhaserGame";
import { MainMenu } from "../../game/scenes/MainMenu";

export default function GamePage() {
  // The sprite can only be moved in the MainMenu Scene
  const [canMoveSprite, setCanMoveSprite] = useState(true);

  //  References to the PhaserGame component (game and scene are exposed)
  const phaserRef = useRef<IRefPhaserGame | null>(null);
  const [spritePosition, setSpritePosition] = useState({ x: 0, y: 0 });

  const changeScene = () => {
    if (phaserRef.current) {
      const scene = phaserRef.current.scene as MainMenu;

      if (scene) {
        scene.changeScene();
      }
    }
  };

  const moveSprite = () => {
    if (phaserRef.current) {
      const scene = phaserRef.current.scene as MainMenu;

      if (scene && scene.scene.key === "MainMenu") {
        // Get the update logo position
        scene.moveLogo(({ x, y }) => {
          setSpritePosition({ x, y });
        });
      }
    }
  };

  const addSprite = () => {
    if (phaserRef.current) {
      const scene = phaserRef.current.scene;

      if (scene) {
        // Add more stars
        const x = Phaser.Math.Between(64, scene.scale.width - 64);
        const y = Phaser.Math.Between(64, scene.scale.height - 64);

        //  `add.sprite` is a Phaser GameObjectFactory method and it returns a Sprite Game Object instance
        const star = scene.add.sprite(x, y, "star");

        //  ... which you can then act upon. Here we create a Phaser Tween to fade the star sprite in and out.
        //  You could, of course, do this from within the Phaser Scene code, but this is just an example
        //  showing that Phaser objects and systems can be acted upon from outside of Phaser itself.
        scene.add.tween({
          targets: star,
          duration: 500 + Math.random() * 1000,
          alpha: 0,
          yoyo: true,
          repeat: -1,
        });
      }
    }
  };

  // Event emitted from the PhaserGame component
  const currentScene = (scene: Phaser.Scene) => {
    setCanMoveSprite(scene.scene.key !== "MainMenu");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Phaser Game Example</h1>
      <div id="app" className="flex flex-col md:flex-row gap-6">
        <div className="game-container">
          <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
        </div>
        <div className="controls bg-base-200 p-4 rounded-lg">
          <div className="mb-4">
            <button className="btn btn-primary w-full" onClick={changeScene}>
              Change Scene
            </button>
          </div>
          <div className="mb-4">
            <button disabled={canMoveSprite} className="btn btn-secondary w-full" onClick={moveSprite}>
              Toggle Movement
            </button>
          </div>
          <div className="mb-4">
            <button className="btn btn-accent w-full" onClick={addSprite}>
              Add New Sprite
            </button>
          </div>
          <div className="spritePosition bg-base-300 p-3 rounded">
            <div className="font-semibold">Sprite Position:</div>
            <pre className="text-sm">{`{\n  x: ${spritePosition.x}\n  y: ${spritePosition.y}\n}`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
