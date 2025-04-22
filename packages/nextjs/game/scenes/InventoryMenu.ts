import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../config";
import { CraftingManager } from "~~/game/managers/CraftingManager";
import InventoryManager from "~~/game/managers/InventoryManager";

const FIRST_CELL_OFFSET_X = 150;
const FIRST_CELL_OFFSET_Y = 58;
const CELL_HORIZONTAL_OFFSET = 37.5;
const CELL_VERTICAL_OFFSET = 40;

const CRAFT_CELL_OFFSET_X = 92;
const CRAFT_CELL_OFFSET_Y = 126;
const CRAFT_CELL_HORIZONTAL_OFFSET = 43;
const CRAFT_CELL_VERTICAL_OFFSET = 53;

const SCALE = 1.5;
const COLUMN_COUNT = 9;
const CRAFT_COLUMN_COUNT = 5;

type UiItem = {
  image: Phaser.GameObjects.Image;
  box: Phaser.GameObjects.Rectangle;
};

export class InventoryMenu extends Phaser.Scene {
  private inventoryMenu!: Phaser.GameObjects.Image;
  private inventoryManager!: InventoryManager;
  private craftingManager!: CraftingManager;
  private inventoryItems: Array<UiItem | null> = [];
  private recipeItems: Array<UiItem> = [];

  constructor() {
    super({ key: "InventoryMenu" });
  }

  init(data: { inventoryManager: InventoryManager; craftingManager: CraftingManager }) {
    this.inventoryManager = data.inventoryManager;
    this.craftingManager = data.craftingManager;
  }

  create() {
    this.inventoryMenu = this.add.image(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, "inventory");
    this.inventoryMenu.setScale(SCALE);

    const items = this.inventoryManager.getItems();
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item === null) {
        this.inventoryItems.push(null);
        continue;
      }
      const offsetX =
        SCREEN_WIDTH / 2 - FIRST_CELL_OFFSET_X * SCALE + (i % COLUMN_COUNT) * CELL_HORIZONTAL_OFFSET * SCALE;
      const offsetY =
        SCREEN_HEIGHT / 2 + FIRST_CELL_OFFSET_Y * SCALE + Math.floor(i / COLUMN_COUNT) * CELL_VERTICAL_OFFSET * SCALE;
      const img = this.add.image(offsetX, offsetY, item.type.tileset, item.id - 1);
      img.setScale(2);

      const rectangle = this.add.rectangle(offsetX, offsetY, 36, 36, 0xffffff, 0.2);
      rectangle.setVisible(false);

      img.setInteractive();
      img.on("pointerover", () => {
        rectangle.setVisible(true);
      });
      img.on("pointerout", () => {
        rectangle.setVisible(false);
      });

      this.inventoryItems.push({
        image: img,
        box: rectangle,
      });

      this.add.text(offsetX + 4, offsetY + 4, `x${item.quantity}`, {
        fontSize: 16,
        fontStyle: "bold",
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

      const img = this.add.image(offsetX, offsetY, recipe.result.type.tileset, recipe.result.id - 1);
      img.setScale(3);

      const rectangle = this.add.rectangle(offsetX + 10, offsetY + 10, 40, 40, 0xffffff, 0.2);
      rectangle.setVisible(false);

      img.setInteractive();
      img.on("pointerover", () => {
        rectangle.setVisible(true);
      });
      img.on("pointerout", () => {
        rectangle.setVisible(false);
      });

      this.recipeItems.push({
        image: img,
        box: rectangle,
      });

      this.add.text(offsetX + 10, offsetY + 12, `x${recipe.result.quantity}`, {
        fontSize: 16,
        fontStyle: "bold",
      });
    }

    this.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, "Ori", {
      fontSize: 32,
      fontStyle: "bold",
    });
  }

  update() {
    // Update the crafting menu if needed
  }
}
