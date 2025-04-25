import { EventBus } from "../EventBus";
import { GameObjects, Scene } from "phaser";
import { SCREEN_WIDTH } from "~~/game/config";

export class MainMenu extends Scene {
  background!: GameObjects.Image;
  logo!: GameObjects.Image;
  playButton!: GameObjects.Sprite;

  constructor() {
    super("MainMenu");
  }

  create() {
    // Background with parallax effect
    this.background = this.add.sprite(SCREEN_WIDTH / 2, 360, "background").play("background");

    // Centered logo image instead of text
    // this.logo = this.add.image(670, 180, "logo").setOrigin(0.5).setDepth(100);

    // Centered play button using an image
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
