import { EventBus } from "../EventBus";
import { SCREEN_WIDTH } from "../config";
import { GameObjects, Scene } from "phaser";

export class GameOver extends Scene {
  camera!: Phaser.Cameras.Scene2D.Camera;
  background!: GameObjects.Image;
  gameOverText!: GameObjects.Text;
  retryButton!: GameObjects.Sprite;

  constructor() {
    super("GameOver");
  }

  create() {
    this.camera = this.cameras.main;

    // Add background
    this.background = this.add.image(SCREEN_WIDTH / 2, 360, "background");
    this.background.setAlpha(0.5);

    // Game Over text
    this.gameOverText = this.add
      .text(SCREEN_WIDTH / 2, 260, "Game Over", {
        fontFamily: "Arial Black",
        fontSize: 64,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(100);

    // Create retry button using the same pattern as in MainMenu
    this.retryButton = this.createImageButton(SCREEN_WIDTH / 2, 460, "start_button", () => this.refreshPage());

    EventBus.emit("current-scene-ready", { scene: this });
  }

  // Using the same button creation method as in MainMenu
  createImageButton(x: number, y: number, texture: string, callback: () => void): GameObjects.Sprite {
    const button = this.add
      .sprite(x, y, texture)
      .setOrigin(0.5)
      .setDepth(100)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        button.setScale(1.1);
        button.setTint(0xffff00);
      })
      .on("pointerout", () => {
        button.setScale(1);
        button.clearTint();
      })
      .on("pointerdown", () => {
        button.setScale(0.95);
      })
      .on("pointerup", () => {
        button.setScale(1);
        callback();
      });

    return button;
  }

  refreshPage() {
    // Instead of starting a new game scene, refresh the entire page
    window.location.reload();
  }

  changeScene() {
    this.scene.start("MainMenu");
  }
}
