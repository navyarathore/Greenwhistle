import { EventBus } from "../EventBus";
import SystemManager from "../SystemManager";
import { GameSave } from "../managers/SaveManager";
import { GameObjects, Scene } from "phaser";
import { SCREEN_WIDTH } from "~~/game/config";

export class MainMenu extends Scene {
  background!: GameObjects.Image;
  logo!: GameObjects.Image;
  playButton!: GameObjects.Sprite;

  // Loading elements
  private loadingCircle!: GameObjects.Arc;
  private loadingText!: GameObjects.Text;
  private errorText!: GameObjects.Text;
  private tryAgainButton!: GameObjects.Text;
  private isLoading = false;

  constructor() {
    super("MainMenu");
  }

  create() {
    // Background with parallax effect
    this.background = this.add.sprite(SCREEN_WIDTH / 2, 360, "background").play("background");

    // Centered logo image instead of text
    // this.logo = this.add.image(670, 180, "logo").setOrigin(0.5).setDepth(100);

    // Centered play button using an image
    this.playButton = this.createImageButton(650, 375, "start_button", () => this.startLoading());

    // Create loading elements (initially hidden)
    this.createLoadingElements();

    EventBus.emit("current-scene-ready", { scene: this });
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

  private createLoadingElements(): void {
    // Create a circular loading animation
    this.loadingCircle = this.add.arc(650, 375, 40, 0, 360, false, 0x48ff00, 0.8);
    this.loadingCircle.setStrokeStyle(4, 0xffffff);
    this.loadingCircle.setDepth(200);
    this.loadingCircle.visible = false;

    // Loading text
    this.loadingText = this.add
      .text(650, 440, "Loading game...", {
        fontSize: "18px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(200);
    this.loadingText.visible = false;

    // Error message text (initially hidden)
    this.errorText = this.add
      .text(650, 375, "Error loading game data\nfrom blockchain", {
        fontSize: "20px",
        color: "#ff4444",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(200);
    this.errorText.visible = false;

    // Try again button (initially hidden)
    this.tryAgainButton = this.add
      .text(650, 440, "Try Again", {
        fontSize: "18px",
        color: "#48ff00",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
        backgroundColor: "#333333",
        padding: { left: 15, right: 15, top: 10, bottom: 10 },
      })
      .setOrigin(0.5)
      .setDepth(200)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => this.tryAgainButton.setColor("#ffffff"))
      .on("pointerout", () => this.tryAgainButton.setColor("#48ff00"))
      .on("pointerdown", () => this.startLoading());
    this.tryAgainButton.visible = false;
  }

  private showError(message: string): void {
    // Hide loading elements
    this.loadingCircle.visible = false;
    this.loadingText.visible = false;

    // Update and show error message
    this.errorText.setText(message);
    this.errorText.visible = true;
    this.tryAgainButton.visible = true;

    // Allow trying again
    this.isLoading = false;
  }

  private startLoading(): void {
    if (this.isLoading) return; // Prevent multiple clicks

    this.isLoading = true;

    // Hide any error messages if they were showing
    this.errorText.visible = false;
    this.tryAgainButton.visible = false;

    // Hide the play button and show loading elements
    this.playButton.visible = false;
    this.loadingCircle.visible = true;
    this.loadingText.visible = true;

    // Animate the loading circle
    this.tweens.add({
      targets: this.loadingCircle,
      angle: 360,
      duration: 1500,
      repeat: -1,
      ease: "Linear",
    });

    // Start loading process - we'll use setTimeout to give the UI time to update
    this.time.delayedCall(100, async () => {
      try {
        // Try to load data from the blockchain
        const saveManager = SystemManager.instance.saveManager;
        const saveData = await saveManager.retrieveData("blockchain");

        // Wait a bit to ensure the loading animation is visible (better user experience)
        this.time.delayedCall(1000, () => {
          this.changeScene(saveData);
        });
      } catch (error) {
        console.error("Error loading game data:", error);

        // Show error message
        const errorMessage =
          error instanceof Error
            ? `Error loading game data:\n${error.message}`
            : "Error loading game data\nfrom blockchain";

        this.showError(errorMessage);
      }
    });
  }

  changeScene(gameData: GameSave | null): void {
    this.scene.start("Game", { gameData });
  }
}
