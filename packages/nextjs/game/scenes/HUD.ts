import { EventBus } from "../EventBus";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../config";
import Player from "../entities/Player";
import InventoryManager, { HOTBAR_SIZE, HotbarIndex, PLAYER_INVENTORY } from "../managers/InventoryManager";
import { Item } from "../resources/Item";
import { Scene } from "phaser";

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
    // Subscribe to player-created event to get player data
    if (this.player) {
      this.createHealthDisplay();
      this.createHotbar();
      this.setupInteractionFeedback();
    } else {
      EventBus.once("player-created", (player: Player) => {
        this.player = player;
        this.createHealthDisplay();
        this.createHotbar();
        this.setupInteractionFeedback();
      });
    }

    // Subscribe to player health changes
    EventBus.on("player-health-changed", (_: number) => {
      this.updateHealthDisplay();
    });

    // Subscribe to hotbar selection changes
    EventBus.on("hotbar-selection-changed", (_: number) => {
      if (this.selectedSlotIndicator) {
        this.updateHotbarSelection();
      }
    });

    // Let the game scene know HUD is ready
    EventBus.emit("hud-ready", this);
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
    console.log(this.player.health);
    console.log(this.player);
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

    // Listen for inventory and hotbar updates
    EventBus.on("hotbar-item-changed", (data: { hotbarIndex: HotbarIndex; item: Item | null }) => {
      this.updateHotbarItemAtIndex(data.hotbarIndex, data.item);
    });

    EventBus.on("inventory-updated", (data: { inventoryId: string; action: string; items: Array<Item | null> }) => {
      if (data.inventoryId === PLAYER_INVENTORY) {
        this.updateHotbarItems();
      }
    });
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

    // Get all items in the hotbar from the inventory
    const hotbarItems = this.inventoryManager.getAllHotbarItems();

    // Update each hotbar slot with its corresponding item
    hotbarItems.forEach((item, index) => {
      // Cast the numeric index to HotbarIndex type
      this.updateHotbarItemAtIndex(index as HotbarIndex, item);
    });
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
    // Listen for interaction messages to display them
    EventBus.on("show-interaction-message", (data: { message: string; color?: string }) => {
      this.showTemporaryMessage(data.message, data.color || "#ffffff");
    });
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
}
