import { EventBus } from "../EventBus";
import { GameObjects, Scene } from "phaser";
import { SCREEN_WIDTH } from "~~/game/config";

export class MainMenu extends Scene {
  background!: GameObjects.Image;
  title!: GameObjects.Text;
  playButton!: GameObjects.Sprite;

  constructor() {
    super("MainMenu");
  }

  create() {
    // Background with parallax effect
    this.background = this.add.sprite(SCREEN_WIDTH / 2, 360, "background").play("background");

    // Centered title
    this.title = this.add
      .text(650, 180, "Green Whistle", {
        fontFamily: "Arial Black",
        fontSize: 72,
        color: "#48ff00",
        stroke: "#000000",
        strokeThickness: 12,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setShadow(5, 5, "rgba(0,0,0,0.5)", 5);

    // Centered play button using an image instead of text
    this.playButton = this.createImageButton(SCREEN_WIDTH / 2, 450, "start_button", () => this.changeScene());

    EventBus.emit("current-scene-ready", this);
  }

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

  changeScene() {
    this.scene.start("Game");
  }
}
