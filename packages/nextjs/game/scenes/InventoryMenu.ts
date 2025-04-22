import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../config";
import InventoryManager from "~~/game/managers/InventoryManager";

const FIRST_CELL_OFFSET_X = 152;
const FIRST_CELL_OFFSET_Y = 56;
const SCALE = 1.5;
const CELL_HORIZONTAL_OFFSET = 38;
const CELL_VERTICAL_OFFSET = 40;
const COLUMN_COUNT = 9;

export class InventoryMenu extends Phaser.Scene {
  private inventoryMenu!: Phaser.GameObjects.Image;
  private inventoryManager!: InventoryManager;

  constructor() {
    super({ key: "InventoryMenu" });
  }

  init(data: { inventoryManager: InventoryManager }) {
    this.inventoryManager = data.inventoryManager;
  }

  create() {
    this.inventoryMenu = this.add.image(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, "inventory");
    this.inventoryMenu.setScale(SCALE);

    const items = this.inventoryManager.getItems();
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const offsetX =
        SCREEN_WIDTH / 2 - FIRST_CELL_OFFSET_X * SCALE + (i % COLUMN_COUNT) * CELL_HORIZONTAL_OFFSET * SCALE;
      const offsetY =
        SCREEN_HEIGHT / 2 + FIRST_CELL_OFFSET_Y * SCALE + Math.floor(i / COLUMN_COUNT) * CELL_VERTICAL_OFFSET * SCALE;
      const img = this.add.image(offsetX, offsetY, item.type.tileset, item.id - 1);
      img.setScale(2);

      this.add.text(offsetX + 3, offsetY + 3, `x${item.quantity}`, {
        fontSize: 16,
        fontStyle: "bold",
      });
    }

    this.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, "Ori", {
      fontSize: 32,
      fontStyle: "bold",
    });

    // Add event listeners for crafting actions
    this.input.on("pointerdown", (pointer: any) => {
      if (this.inventoryMenu.getBounds().contains(pointer.x, pointer.y)) {
        // Handle crafting action
        console.log("Crafting action triggered");
      }
    });
  }

  update() {
    // Update the crafting menu if needed
  }
}
