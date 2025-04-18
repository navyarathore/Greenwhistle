"use client";

import { useRef, useState } from "react";
import { IRefPhaserGame, PhaserGame } from "../../game/PhaserGame";
import { MainMenu } from "../../game/scenes/MainMenu";

function App() {
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

  // const moveSprite = () => {
  //   if (phaserRef.current) {
  //     const scene = phaserRef.current.scene as MainMenu;

  //     if (scene && scene.scene.key === "MainMenu") {
  //       // Get the update logo position
  //       scene.moveLogo(({ x, y }) => {
  //         setSpritePosition({ x, y });
  //       });
  //     }
  //   }
  // };

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
    <div id="app" className="flex flex-col md:flex-row gap-6">
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
        <div className="mb-4">
          <button
            className="bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold py-3 px-6 rounded-lg w-full hover:scale-105 transition-all shadow-lg hover:shadow-green-500/25"
            onClick={addSprite}
          >
            Add New Sprite
          </button>
        </div>
        <div className="spritePosition bg-gray-900/60 p-3 rounded">
          <div className="font-semibold text-blue-400">Sprite Position:</div>
          <pre className="text-sm text-white">{`{\n  x: ${spritePosition.x}\n  y: ${spritePosition.y}\n}`}</pre>
        </div>
      </div>
    </div>
  );
}

export default App;
