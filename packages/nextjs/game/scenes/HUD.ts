import { EventBus } from "../EventBus";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../config";
import Player from "../entities/Player";
import InventoryManager, { HOTBAR_SIZE, HotbarIndex, PLAYER_INVENTORY } from "../managers/InventoryManager";
import { Item } from "../resources/Item";
import { Scene } from "phaser";
import { HotbarItemChangedEvent, InventoryUpdatedEvent, PlayerCreatedEvent } from "~~/game/EventTypes";

const SLOT_SIZE = 48;
const SLOT_PADDING = 7;

export class HUD extends Scene {
  private healthIcons: Phaser.GameObjects.Image[] = [];
  private player!: Player;

  // Hotbar properties
  private hotbarImage!: Phaser.GameObjects.Image;
  private hotbarItems: Phaser.GameObjects.Image[] = [];
  private selectedSlotIndicator!: Phaser.GameObjects.Rectangle;
  private inventoryManager?: InventoryManager;

  constructor() {
    super({ key: "HUD" });
  }

  init(data: { player: Player; inventoryManager?: InventoryManager } | undefined) {
    if (data) {
      this.player = data.player;
      this.inventoryManager = data.inventoryManager;
    }
  }

  create() {
    // Initialize if player is already available
    if (this.player) {
      this.createHealthDisplay();
      this.createHotbar();
      this.setupInteractionFeedback();
    } else {
      EventBus.once("player-created", this.handlePlayerCreated, this);
    }

    // Set up event listeners
    this.setupEventListeners();

    // Let the game scene know HUD is ready
    EventBus.emit("current-scene-ready", { scene: this });
  }

  private setupEventListeners(): void {
    // Health changes event
    EventBus.on("player-health-changed", this.handlePlayerHealthChanged, this);

    // Hotbar selection changes
    EventBus.on("hotbar-selection-changed", this.handleHotbarSelectionChanged, this);

    // Hotbar item changes
    EventBus.on("hotbar-item-changed", this.handleHotbarItemChanged, this);

    // Inventory updates
    EventBus.on("inventory-updated", this.handleInventoryUpdated, this);
  }

  private handlePlayerCreated(event: PlayerCreatedEvent): void {
    this.player = event.player;
    this.createHealthDisplay();
    this.createHotbar();
    this.setupInteractionFeedback();
  }

  private handlePlayerHealthChanged(): void {
    this.updateHealthDisplay();
  }

  private handleHotbarSelectionChanged(): void {
    if (this.selectedSlotIndicator) {
      this.updateHotbarSelection();
    }
  }

  private handleHotbarItemChanged(event: HotbarItemChangedEvent): void {
    this.updateHotbarItemAtIndex(event.slotIndex, event.item);
  }

  private handleInventoryUpdated(event: InventoryUpdatedEvent): void {
    if (event.inventoryId === PLAYER_INVENTORY) {
      this.updateHotbarItems();
    }
  }

  private createHealthDisplay() {
    // Create hearts for health display
    for (let i = 0; i < this.player.maxHealth; i++) {
      const heartIcon = this.add.image(20 + i * 40, 20, "heart-full").setScrollFactor(0);
      heartIcon.setScale(2);
      heartIcon.setDepth(1000);
      this.healthIcons.push(heartIcon);
    }

    this.updateHealthDisplay();
  }

  private updateHealthDisplay() {
    // Update hearts based on current health
    this.healthIcons.forEach((heart, index) => {
      if (index < this.player.health) {
        heart.setTexture("heart-full");
      } else {
        heart.setTexture("heart-empty");
      }
    });
  }

  private createHotbar() {
    const totalWidth = (SLOT_SIZE + SLOT_PADDING) * HOTBAR_SIZE - SLOT_PADDING;

    // Calculate the position for the hotbar
    const hotbarX = SCREEN_WIDTH / 2;
    const hotbarY = SCREEN_HEIGHT - 40;

    // Add the hotbar background image
    this.hotbarImage = this.add.image(hotbarX, hotbarY, "hotbar").setScrollFactor(0).setDepth(990);

    // Scale the hotbar image if needed
    this.hotbarImage.setScale(1.5);

    // Create item slots within the hotbar
    const slotStartX = hotbarX - totalWidth / 2 + SLOT_SIZE / 2;

    for (let i = 0; i < HOTBAR_SIZE; i++) {
      // Calculate the position for this slot
      const slotX = slotStartX + i * (SLOT_SIZE + SLOT_PADDING);

      // Add slot for an item
      const itemSlot = this.add
        .image(slotX, hotbarY, "iron_ore")
        .setScrollFactor(0)
        .setVisible(false) // Hide initially until we have items
        .setScale(1.2)
        .setDepth(991);

      this.hotbarItems.push(itemSlot);
    }

    // Create selection indicator as a yellow rectangle around the selected slot
    this.selectedSlotIndicator = this.add
      .rectangle(slotStartX, hotbarY, SLOT_SIZE + 4, SLOT_SIZE + 4, 0xffff00, 0)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setStrokeStyle(4, 0x58515c)
      .setDepth(993);

    // Initialize the selection to the first slot
    this.updateHotbarSelection();

    // Initialize hotbar items from inventory
    this.updateHotbarItems();
  }

  private updateHotbarSelection() {
    // Update the position of the selection indicator to highlight the selected slot
    if (!this.player) return;

    const totalWidth = (SLOT_SIZE + SLOT_PADDING) * HOTBAR_SIZE - SLOT_PADDING;
    const slotStartX = SCREEN_WIDTH / 2 - totalWidth / 2 + SLOT_SIZE / 2;

    // Position the selection indicator around the selected slot
    this.selectedSlotIndicator.setPosition(
      slotStartX + this.player.selectedHotbarSlot * (SLOT_SIZE + SLOT_PADDING),
      SCREEN_HEIGHT - 40,
    );

    // Scale up the selected item and scale down unselected items
    this.hotbarItems.forEach((itemSlot, index) => {
      if (index === this.player.selectedHotbarSlot) {
        // Scale up the selected item with a smooth animation
        this.tweens.add({
          targets: itemSlot,
          scale: 1.5, // Increased scale for selected item
          duration: 200,
          ease: "Power2",
        });
      } else {
        // Scale down unselected items
        this.tweens.add({
          targets: itemSlot,
          scale: 1.2, // Original scale for unselected items
          duration: 200,
          ease: "Power2",
        });
      }
    });
  }

  /**
   * Update all hotbar item slots based on the inventory
   */
  private updateHotbarItems(): void {
    if (!this.inventoryManager) return;

    // Get all items in the hotbar
    for (let i = 0; i < HOTBAR_SIZE; i++) {
      const hotbarItem = this.inventoryManager.getHotbarItem(i as HotbarIndex);
      this.updateHotbarItemAtIndex(i as HotbarIndex, hotbarItem);
    }
  }

  /**
   * Update a specific hotbar slot with an item
   * @param hotbarIndex The index in the hotbar (0-4)
   * @param item The item to display, or null to clear the slot
   */
  private updateHotbarItemAtIndex(hotbarIndex: HotbarIndex, item: Item | null): void {
    const itemSlot = this.hotbarItems[hotbarIndex];

    if (item) {
      // Set the image texture based on the item's id/type
      itemSlot.setTexture(item.id);
      itemSlot.setVisible(true);

      // Only show quantity for items with quantity > 1
      if (item.quantity > 1) {
        const textPosition = itemSlot.getBottomRight();

        // Check if this item slot already has a quantity text
        const existingText = itemSlot.getData("quantityText") as Phaser.GameObjects.Text;
        if (existingText) {
          existingText.setText(`x${item.quantity}`);
          existingText.setPosition(textPosition.x + 4, textPosition.y + 4);
        } else {
          const quantityText = this.add
            .text(textPosition.x + 4, textPosition.y + 4, `x${item.quantity}`, {
              fontSize: 16,
              color: "#ffffff",
              fontStyle: "bold",
            })
            .setOrigin(1, 1) // Set origin to bottom-right
            .setScrollFactor(0)
            .setDepth(992);

          // Store a reference to the text object for later updates
          itemSlot.setData("quantityText", quantityText);
        }
      } else {
        // Remove quantity text if it exists (for items with quantity = 1)
        const existingText = itemSlot.getData("quantityText") as Phaser.GameObjects.Text;
        if (existingText) {
          existingText.destroy();
          itemSlot.setData("quantityText", null);
        }
      }
    } else {
      // Clear the slot
      itemSlot.setVisible(false);

      // Remove quantity text if it exists
      const existingText = itemSlot.getData("quantityText") as Phaser.GameObjects.Text;
      if (existingText) {
        existingText.destroy();
        itemSlot.setData("quantityText", null);
      }
    }
  }

  /**
   * Set up event listeners for interaction feedback in the UI
   */
  private setupInteractionFeedback(): void {
    // For future interaction messages
    // EventBus.on("show-interaction-message", this.handleInteractionMessage, this);
  }

  /**
   * Show a temporary message in the center of the screen
   */
  private showTemporaryMessage(message: string, color = "#ffffff"): void {
    // Create message text in center of screen
    const messageText = this.add
      .text(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 100, message, {
        fontSize: "24px",
        color: color,
        stroke: "#000000",
        strokeThickness: 4,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1000);

    // Animate the message
    this.tweens.add({
      targets: messageText,
      alpha: { from: 1, to: 0 },
      y: "-=50",
      ease: "Power2",
      duration: 2000,
      onComplete: () => {
        messageText.destroy();
      },
    });
  }

  /**
   * Custom method to handle resource cleanup when the scene is stopped
   * Should be called when the scene is stopped or destroyed
   */
  cleanupResources(): void {
    console.log("Cleaning up HUD resources");

    // Remove event listeners
    EventBus.off("player-created", this.handlePlayerCreated, this);
    EventBus.off("player-health-changed", this.handlePlayerHealthChanged, this);
    EventBus.off("hotbar-selection-changed", this.handleHotbarSelectionChanged, this);
    EventBus.off("hotbar-item-changed", this.handleHotbarItemChanged, this);
    EventBus.off("inventory-updated", this.handleInventoryUpdated, this);

    // Destroy all game objects
    this.healthIcons.forEach(icon => {
      if (icon) icon.destroy();
    });
    this.healthIcons = [];

    this.hotbarItems.forEach(item => {
      // Remove associated quantity text
      const quantityText = item.getData("quantityText") as Phaser.GameObjects.Text;
      if (quantityText) quantityText.destroy();

      // Destroy the item image
      if (item) item.destroy();
    });
    this.hotbarItems = [];

    if (this.hotbarImage) this.hotbarImage.destroy();
    if (this.selectedSlotIndicator) this.selectedSlotIndicator.destroy();
  }

  shutdown(): void {
    this.cleanupResources();
  }
}
