import { EventBus } from "../EventBus";
import { Scene } from "phaser";

export default class AIPopupUI {
  private scene: Scene;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  private icon: Phaser.GameObjects.Image;
  private closeButton: Phaser.GameObjects.Text;
  private hideTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Scene) {
    this.scene = scene;

    // Create container for popup elements
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(1000); // Ensure it"s above other elements
    this.container.setVisible(false);

    // Create background panel
    this.background = this.scene.add.graphics();
    this.drawBackground(300, 150);

    // Create AI icon - fallback to a text symbol if image not available
    try {
      this.icon = this.scene.add.image(25, 25, "ai_assistant_icon").setScale(0.5);
    } catch (e) {
      // Fallback to a text icon if image isn"t available
      this.icon = this.scene.add.text(25, 25, "🤖", {
        fontSize: "24px",
      }) as any;
      this.icon.setOrigin(0.5);
    }

    // Create text display
    this.text = this.scene.add.text(50, 45, "", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#ffffff",
      wordWrap: { width: 240 },
    });

    // Create close button
    this.closeButton = this.scene.add.text(280, 10, "X", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#ffffff",
      backgroundColor: "#ff0000",
      padding: { x: 5, y: 2 },
    });
    this.closeButton.setInteractive({ useHandCursor: true }).on("pointerup", () => this.hide());

    // Add all elements to container
    this.container.add([this.background, this.icon, this.text, this.closeButton]);

    // Position the popup
    this.container.setPosition(this.scene.cameras.main.width - 320, this.scene.cameras.main.height - 170);

    // Make container fixed to camera
    this.container.setScrollFactor(0);

    // Listen for popup trigger events
    EventBus.on("show-ai-popup", this.showPopup.bind(this));

    // Handle window resize
    this.scene.scale.on("resize", this.handleResize, this);
  }

  private drawBackground(width: number, height: number): void {
    this.background.clear();

    // Draw semi-transparent background with border
    this.background.fillStyle(0x222222, 0.85);
    this.background.fillRoundedRect(0, 0, width, height, 10);

    this.background.lineStyle(2, 0x4287f5);
    this.background.strokeRoundedRect(0, 0, width, height, 10);
  }

  private showPopup(data: { itemId: string; content: string; duration: number }): void {
    // Update text content
    this.text.setText(data.content);

    // Show container with animation
    this.container.setVisible(true);
    this.container.setAlpha(0);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      y: this.scene.cameras.main.height - 170,
      duration: 300,
      ease: "Power2",
    });

    // Clear existing timer
    if (this.hideTimer) {
      this.hideTimer.remove();
    }

    // Set auto-hide timer
    this.hideTimer = this.scene.time.delayedCall(data.duration, () => {
      this.hide();
    });
  }

  private hide(): void {
    // Hide with animation
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      y: this.scene.cameras.main.height - 150,
      duration: 300,
      ease: "Power2",
      onComplete: () => {
        this.container.setVisible(false);
      },
    });

    // Clear timer
    if (this.hideTimer) {
      this.hideTimer.remove();
      this.hideTimer = null;
    }
  }

  private handleResize(): void {
    // Update position on screen resize
    this.container.setPosition(this.scene.cameras.main.width - 320, this.scene.cameras.main.height - 170);
  }

  public destroy(): void {
    // Clean up event listeners
    EventBus.off("show-ai-popup", this.showPopup);
    this.scene.scale.off("resize", this.handleResize, this);

    // Clean up timers
    if (this.hideTimer) {
      this.hideTimer.remove();
    }

    // Destroy container and all children
    this.container.destroy();
  }
}
