import { EventBus } from "../EventBus";
import { GameObjects, Scene } from "phaser";
import { SCREEN_WIDTH } from "~~/game/config";

export class MainMenu extends Scene {
  background!: GameObjects.Image;
  title!: GameObjects.Text;
  playButton!: GameObjects.Text;

  constructor() {
    super("MainMenu");
  }

  create() {
    // Background with parallax effect
    this.background = this.add.sprite(SCREEN_WIDTH / 2, 360, "background").play("background");

    // Centered title
    this.title = this.add
      .text(700, 180, "Green Whistle", {
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

    // Centered play button
    this.playButton = this.createButton(SCREEN_WIDTH / 2, 450, "Play", () => this.changeScene());

    EventBus.emit("current-scene-ready", this);
  }

  createButton(x: number, y: number, text: string, callback: () => void): GameObjects.Text {
    const button = this.add
      .text(x, y, text, {
        fontFamily: "Arial Black",
        fontSize: 48,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 6,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setPadding(15)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        button.setScale(1.1);
        button.setColor("#ffff00");
      })
      .on("pointerout", () => {
        button.setScale(1);
        button.setColor("#ffffff");
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
