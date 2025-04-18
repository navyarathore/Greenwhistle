import config from "./config";
import { Boot } from "./scenes/Boot";
import { Game as MainGame } from "./scenes/Game";
import { GameOver } from "./scenes/GameOver";
import { MainMenu } from "./scenes/MainMenu";
import { Preloader } from "./scenes/Preloader";
import * as Phaser from "phaser";

const StartGame = (parent: string | undefined) => {
  const conf = config([Boot, Preloader, MainMenu, MainGame, GameOver]);
  return new Phaser.Game({
    ...conf,
    parent: parent ? parent : conf.parent,
  });
};

export default StartGame;
