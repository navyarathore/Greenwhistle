import GridEngine from "grid-engine";
import * as Phaser from "phaser";

export const SCREEN_WIDTH = 1280;
export const SCREEN_HEIGHT = 720;

export default (scenes: Phaser.Types.Scenes.SceneType[]): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  pixelArt: true,
  parent: "game-container",
  backgroundColor: "#028af8",
  scale: {
    mode: Phaser.Scale.FIT,
  },
  plugins: {
    scene: [
      {
        key: "gridEngine",
        plugin: GridEngine,
        mapping: "gridEngine",
      },
    ],
  },
  scene: scenes,
  input: {
    mouse: {
      preventDefaultWheel: true,
    },
  },
});
