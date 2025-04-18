import { GameObjects, Scene } from "phaser";

export class Settings extends Scene {
  private background!: GameObjects.Image;
  private title!: GameObjects.Text;
  private volumeText!: GameObjects.Text;
  private volumeSlider!: GameObjects.Rectangle;
  private volumeButton!: GameObjects.Rectangle;
  private backButton!: GameObjects.Text;
  private volume = 0.5;

  constructor() {
    super("Settings");
  }

  create() {
    // Background
    this.background = this.add.sprite(640, 360, "background").play("background");

    // Title
    this.title = this.add
      .text(512, 100, "Settings", {
        fontFamily: "Arial Black",
        fontSize: 48,
        color: "#48ff00",
        stroke: "#000000",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(100);

    // Volume Control
    this.createVolumeControl();

    // Back Button
    this.backButton = this.add
      .text(512, 500, "Back to Menu", {
        fontFamily: "Arial Black",
        fontSize: 32,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => this.backButton.setColor("#ffff00"))
      .on("pointerout", () => this.backButton.setColor("#ffffff"))
      .on("pointerdown", () => this.scene.start("MainMenu"));
  }

  private createVolumeControl() {
    this.volumeText = this.add
      .text(512, 250, "Volume", {
        fontFamily: "Arial Black",
        fontSize: 32,
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Slider background
    this.volumeSlider = this.add.rectangle(512, 300, 200, 20, 0x666666);
    this.volumeSlider.setInteractive();

    // Slider button
    this.volumeButton = this.add.rectangle(512 + (this.volume - 0.5) * 200, 300, 30, 40, 0x48ff00);
    this.volumeButton.setInteractive({ draggable: true });

    this.volumeButton.on("drag", (pointer: Phaser.Input.Pointer, dragX: number) => {
      const minX = this.volumeSlider.x - this.volumeSlider.width / 2;
      const maxX = this.volumeSlider.x + this.volumeSlider.width / 2;
      this.volumeButton.x = Phaser.Math.Clamp(dragX, minX, maxX);
      this.volume = (this.volumeButton.x - minX) / (maxX - minX);
      // Here you can implement the actual volume control
    });
  }
}
