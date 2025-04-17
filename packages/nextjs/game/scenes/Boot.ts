import { Scene } from "phaser";

export class Boot extends Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    this.load.spritesheet("background", "assets/background.png", {
      frameWidth: 1280,
      frameHeight: 720,
    });
  }

  create() {
    this.scene.start("Preloader");
  }
}
