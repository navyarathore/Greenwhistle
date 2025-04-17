import { Boot } from "./scenes/Boot";
import { Game as MainGame } from "./scenes/Game";
import { GameOver } from "./scenes/GameOver";
import { MainMenu } from "./scenes/MainMenu";
import { Preloader } from "./scenes/Preloader";
import GridEngine from "grid-engine";
import * as Phaser from "phaser";

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
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
  scene: [Boot, Preloader, MainMenu, MainGame, GameOver],
  input: {
    mouse: {
      preventDefaultWheel: false,
    },
  },
};

const StartGame = (parent: string | undefined) => {
  return new Phaser.Game({
    ...config,
    parent: parent ? parent : config.parent,
  });
};

export default StartGame;
