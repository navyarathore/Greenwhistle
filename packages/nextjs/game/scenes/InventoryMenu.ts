import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../config";
import CraftingManager from "~~/game/managers/CraftingManager";
import InventoryManager, { PLAYER_INVENTORY_SIZE } from "~~/game/managers/InventoryManager";

const FIRST_CELL_OFFSET_X = 150;
const FIRST_CELL_OFFSET_Y = 58;
const CELL_HORIZONTAL_OFFSET = 37.6;
const CELL_VERTICAL_OFFSET = 40;

const CRAFT_CELL_OFFSET_X = 86;
const CRAFT_CELL_OFFSET_Y = 118;
const CRAFT_CELL_HORIZONTAL_OFFSET = 43;
const CRAFT_CELL_VERTICAL_OFFSET = 52;

const SCALE = 1.5;
const COLUMN_COUNT = 9;
const CRAFT_COLUMN_COUNT = 5;

type UiItem = {
  image: Phaser.GameObjects.Image;
  box: Phaser.GameObjects.Rectangle;
  slotIndex?: number;
  quantityText?: Phaser.GameObjects.Text;
};

// Consolidated drag state type
type DragState = {
  item: Phaser.GameObjects.Image | null;
  originalPosition: { x: number; y: number };
  slotIndex: number;
};

export class InventoryMenu extends Phaser.Scene {
  private inventoryMenu!: Phaser.GameObjects.Image;
  private inventoryManager!: InventoryManager;
  private craftingManager!: CraftingManager;
  private inventoryItems: Array<UiItem | null> = [];
  private recipeItems: Array<UiItem> = [];
  private inventorySlots: Phaser.GameObjects.Rectangle[] = [];

  // Consolidated drag state
  private dragState: DragState = {
    item: null,
    originalPosition: { x: 0, y: 0 },
    slotIndex: -1,
  };

  private tooltip!: {
    container: Phaser.GameObjects.Container;
    background: Phaser.GameObjects.Rectangle;
    text: Phaser.GameObjects.Text;
  };

  constructor() {
    super({ key: "InventoryMenu" });
  }

  init(data: { inventoryManager: InventoryManager; craftingManager: CraftingManager }) {
    this.inventoryManager = data.inventoryManager;
    this.craftingManager = data.craftingManager;
    this.inventoryItems = [];
    this.recipeItems = [];
    this.inventorySlots = [];

    // Reset drag state
    this.dragState = {
      item: null,
      originalPosition: { x: 0, y: 0 },
      slotIndex: -1,
    };
  }

  create() {
    this.inventoryMenu = this.add.image(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, "inventory");
    this.inventoryMenu.setScale(SCALE);

    // Configure drag and drop
    this.input.on("dragstart", this.onDragStart, this);
    this.input.on("drag", this.onDrag, this);
    this.input.on("dragend", this.onDragEnd, this);

    // Create tooltip container (initially hidden)
    const tooltipBackground = this.add.rectangle(0, 0, 200, 80, 0x000000, 0.8);
    const tooltipText = this.add.text(0, 0, "", {
      fontSize: "14px",
      color: "#ffffff",
      wordWrap: { width: 190 },
    });
    this.tooltip = {
      container: this.add.container(0, 0, [tooltipBackground, tooltipText]).setVisible(false),
      background: tooltipBackground,
      text: tooltipText,
    };

    // Add hover handlers to show tooltips
    const showTooltip = (
      item: { type: { name: string; description?: string }; quantity: number },
      x: number,
      y: number,
    ) => {
      const tooltipContent = `${item.type.name}\n${item.type.description || ""}`;
      this.tooltip.text.setText(tooltipContent);

      // Adjust background size based on text
      const padding = 10;
      const bounds = this.tooltip.text.getBounds();
      this.tooltip.background.setSize(bounds.width + padding * 2, bounds.height + padding * 2);

      // Position tooltip relative to item
      this.tooltip.text.setPosition(-bounds.width / 2, -bounds.height / 2);
      this.tooltip.container.setPosition(x, y - 50);
      this.tooltip.container.setVisible(true);
    };

    const hideTooltip = () => {
      this.tooltip.container.setVisible(false);
    };

    // Create inventory slots and items
    const items = this.inventoryManager.getItems();
    for (let i = 0; i < PLAYER_INVENTORY_SIZE; i++) {
      // Get position for this slot
      const position = this.getSlotPosition(i);

      // Create the slot hitbox (for all slots, even empty ones)
      const slotBox = this.add.rectangle(position.x, position.y, 40, 40, 0x555555, 0.1);
      slotBox.setData("slotIndex", i);
      slotBox.setInteractive();
      this.inventorySlots.push(slotBox);

      // Add item to the slot if it exists
      const item = i < items.length ? items[i] : null;
      if (item === null) {
        this.inventoryItems.push(null);
        continue;
      }

      // Create the item image
      const img = this.add.image(position.x, position.y, item.type.icon.id);
      img.setData("slotIndex", i);
      img.setData("itemId", item.id);
      img.setData("quantity", item.quantity);

      // Make item draggable
      img.setInteractive({ draggable: true, useHandCursor: true });

      // Create highlight effect
      const rectangle = this.add.rectangle(position.x, position.y, 36, 36, 0xffffff, 0.2);
      rectangle.setVisible(false);
      img.on("pointerover", () => {
        if (!this.dragState.item) {
          rectangle.setVisible(true);
          const itemData = items[i];
          if (itemData) {
            showTooltip(itemData, img.x, img.y);
          }
        }
      });
      img.on("pointerout", () => {
        rectangle.setVisible(false);
        hideTooltip();
      });

      // Create quantity text
      const quantityText = this.add.text(position.x + 4, position.y + 4, `x${item.quantity}`, {
        fontSize: 16,
        fontStyle: "bold",
      });

      this.inventoryItems.push({
        image: img,
        box: rectangle,
        slotIndex: i,
        quantityText: quantityText,
      });
    }

    const recipes = this.craftingManager.getRecipes();
    for (let i = 0; i < recipes.length; i++) {
      const recipe = recipes[i];
      const offsetX =
        SCREEN_WIDTH / 2 -
        CRAFT_CELL_OFFSET_X * SCALE +
        (i % CRAFT_COLUMN_COUNT) * CRAFT_CELL_HORIZONTAL_OFFSET * SCALE;
      const offsetY =
        SCREEN_HEIGHT / 2 -
        CRAFT_CELL_OFFSET_Y * SCALE +
        Math.floor(i / CRAFT_COLUMN_COUNT) * CRAFT_CELL_VERTICAL_OFFSET * SCALE;

      const img = this.add.image(offsetX, offsetY, recipe.result.type.icon.id);

      const rectangle = this.add.rectangle(offsetX, offsetY, 40, 40, 0xffffff, 0.2);
      rectangle.setVisible(false);

      img.setInteractive();
      img.on("pointerover", () => {
        rectangle.setVisible(true);
        // Show recipe tooltip
        const tooltipContent = `${recipe.result.type.name}\nRequires:\n${recipe.ingredients
          .map(ing => `${ing.quantity}x ${ing.type.name}`)
          .join("\n")}`;
        this.tooltip.text.setText(tooltipContent);

        const padding = 10;
        const bounds = this.tooltip.text.getBounds();
        this.tooltip.background.setSize(bounds.width + padding * 2, bounds.height + padding * 2);

        this.tooltip.text.setPosition(-bounds.width / 2, -bounds.height / 2);
        this.tooltip.container.setPosition(offsetX, offsetY - 50);
        this.tooltip.container.setVisible(true);
      });

      img.on("pointerout", () => {
        rectangle.setVisible(false);
        this.tooltip.container.setVisible(false);
      });
      img.on("pointerdown", () => {
        const itemsNotNull = this.inventoryManager.getItemsNotNull();
        if (this.craftingManager.canCraft(recipe.id, itemsNotNull)) {
          this.craftingManager.craftItem(recipe.id);
          // Refresh the inventory display
          this.scene.restart({
            inventoryManager: this.inventoryManager,
            craftingManager: this.craftingManager,
          });
        } else {
          // Visual feedback that crafting is not possible
          this.cameras.main.shake(200, 0.005);
        }
      });

      this.recipeItems.push({
        image: img,
        box: rectangle,
      });

      this.add.text(offsetX + 4, offsetY + 4, `x${recipe.result.quantity}`, {
        fontSize: 16,
        fontStyle: "bold",
      });
    }
  }

  update() {
    // Update the crafting menu if needed
  }

  private onDragStart(pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image) {
    // Update drag state
    this.dragState = {
      item: gameObject,
      originalPosition: { x: gameObject.x, y: gameObject.y },
      slotIndex: gameObject.getData("slotIndex"),
    };

    // Increase size slightly and bring to top
    gameObject.setScale(1.3);
    this.children.bringToTop(gameObject);

    // Also bring quantity text to top if it exists
    const itemData = this.inventoryItems.find(item => item?.image === gameObject);
    if (itemData?.quantityText) {
      this.children.bringToTop(itemData.quantityText);
    }

    // Highlight all possible drop zones
    for (const slot of this.inventorySlots) {
      slot.setStrokeStyle(2, 0x88ff88, 0.5);
    }
  }

  private onDrag(pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image, dragX: number, dragY: number) {
    gameObject.x = dragX;
    gameObject.y = dragY;

    // Also move the quantity text
    const itemData = this.inventoryItems.find(item => item?.image === gameObject);
    if (itemData?.quantityText) {
      itemData.quantityText.x = dragX + 4;
      itemData.quantityText.y = dragY + 4;
    }
  }

  /**
   * Calculates the position of an inventory slot based on its index
   */
  private getSlotPosition(slotIndex: number): { x: number; y: number } {
    return {
      x: SCREEN_WIDTH / 2 - FIRST_CELL_OFFSET_X * SCALE + (slotIndex % COLUMN_COUNT) * CELL_HORIZONTAL_OFFSET * SCALE,
      y:
        SCREEN_HEIGHT / 2 +
        FIRST_CELL_OFFSET_Y * SCALE +
        Math.floor(slotIndex / COLUMN_COUNT) * CELL_VERTICAL_OFFSET * SCALE,
    };
  }

  /**
   * Finds the slot under a pointer position
   */
  private findSlotUnderPointer(pointer: Phaser.Input.Pointer): {
    slot: Phaser.GameObjects.Rectangle | null;
    index: number;
  } {
    for (const slot of this.inventorySlots) {
      const slotBounds = slot.getBounds();
      if (
        pointer.x >= slotBounds.left &&
        pointer.x <= slotBounds.right &&
        pointer.y >= slotBounds.top &&
        pointer.y <= slotBounds.bottom
      ) {
        return {
          slot,
          index: slot.getData("slotIndex"),
        };
      }
    }
    return { slot: null, index: -1 };
  }

  private onDragEnd(pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image) {
    // Find if we're hovering over a slot
    // Clear all slot highlighting
    this.inventorySlots.forEach(slot => slot.setStrokeStyle(0));

    // Check which slot we're over
    const { slot: targetSlot, index: targetIndex } = this.findSlotUnderPointer(pointer);

    // If we found a target slot and it's different from the source
    if (targetSlot && targetIndex !== -1 && targetIndex !== this.dragState.slotIndex) {
      // Get the source item
      const items = this.inventoryManager.getItems();
      const sourceItem = items[this.dragState.slotIndex];

      if (sourceItem) {
        // Move the item in the inventory manager
        const sourceQuantity = sourceItem.quantity;
        const success = this.inventoryManager.moveItem(this.dragState.slotIndex, targetIndex, sourceQuantity);

        if (success) {
          // Play a success sound if available
          // this.sound.play('item_move');

          // Refresh the inventory display
          this.scene.restart({
            inventoryManager: this.inventoryManager,
            craftingManager: this.craftingManager,
          });
          return; // Early return to avoid resetting position
        } else {
          // Visual feedback for failed move
          this.cameras.main.shake(200, 0.005);
        }
      }
    }

    // Reset to original position if no valid drop or if move failed
    gameObject.x = this.dragState.originalPosition.x;
    gameObject.y = this.dragState.originalPosition.y;
    gameObject.setScale(1);

    // Reset quantity text position
    const itemData = this.inventoryItems.find(item => item?.image === gameObject);
    if (itemData?.quantityText) {
      itemData.quantityText.x = this.dragState.originalPosition.x + 4;
      itemData.quantityText.y = this.dragState.originalPosition.y + 4;
    }

    // Reset drag state
    this.dragState = {
      item: null,
      originalPosition: { x: 0, y: 0 },
      slotIndex: -1,
    };
  }

  /**
   * Custom method to clean up all resources when the scene is stopped
   * Should be called when the scene is about to be shut down
   */
  cleanupResources(): void {
    console.log("Cleaning up InventoryMenu resources");

    // Clean up all inventory items
    this.inventoryItems.forEach(itemData => {
      if (itemData) {
        if (itemData.image) itemData.image.destroy();
        if (itemData.box) itemData.box.destroy();
        if (itemData.quantityText) itemData.quantityText.destroy();
      }
    });
    this.inventoryItems = [];

    // Clean up all recipe items
    this.recipeItems.forEach(itemData => {
      if (itemData.image) itemData.image.destroy();
      if (itemData.box) itemData.box.destroy();
      if (itemData.quantityText) itemData.quantityText.destroy();
    });
    this.recipeItems = [];

    // Clean up inventory slots
    this.inventorySlots.forEach(slot => {
      if (slot) slot.destroy();
    });
    this.inventorySlots = [];

    // Clean up the inventory menu background
    if (this.inventoryMenu) this.inventoryMenu.destroy();

    // Clean up tooltip
    if (this.tooltip) {
      this.tooltip.background.destroy();
      this.tooltip.text.destroy();
      this.tooltip.container.destroy();
    }

    // Reset drag state
    this.dragState.item = null;
  }

  /**
   * This method is called automatically when the scene is being shut down
   * Clean up all resources to prevent memory leaks
   */
  shutdown(): void {
    this.cleanupResources();
  }
}
