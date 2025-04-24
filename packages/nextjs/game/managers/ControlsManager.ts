import GridEngine, { Direction, Position } from "grid-engine";
import * as Phaser from "phaser";
import { EventBus } from "~~/game/EventBus";
import { SystemManager } from "~~/game/SystemManager";
import { SPRITE_ID } from "~~/game/entities/Player";
import { InputComponent } from "~~/game/input/InputComponent";
import { Item, MaterialCategory } from "~~/game/resources/Item";
import ResourceData from "~~/game/resources/resource.json";
import { Game } from "~~/game/scenes/Game";

export default class ControlsManager {
  private sysManager: SystemManager = SystemManager.instance;
  private itemUseKey?: Phaser.Input.Keyboard.Key;

  constructor(
    private game: Game,
    readonly inputComponent: InputComponent,
    private gridEngine: GridEngine,
  ) {}

  setupControls(): void {
    // Inventory controls
    this.inputComponent.inventoryKey.on("up", () => {
      if (this.game.scene.isActive("InventoryMenu")) {
        this.game.scene.stop("InventoryMenu");
        this.game.player.enableMovement();
      } else {
        this.game.scene.launch("InventoryMenu", {
          inventoryManager: this.sysManager.inventorySystem,
          craftingManager: this.sysManager.craftingManager,
        });
        this.game.player.disableMovement();
      }
    });

    // Action key
    this.inputComponent.actionKey.on("up", () => {
      const playerPosition = this.gridEngine.getPosition(SPRITE_ID);

      for (const res of ResourceData.pickup) {
        const { layer, id, method, result } = res;
        const tile = this.game.map.getTileAt(playerPosition.x, playerPosition.y, false, layer);

        if (tile && id.includes(tile.index)) {
          const combined = new Set(ResourceData.combined_blocks.filter(block => block.includes(tile.index)).flat());
          console.log(combined);
          const toRemove = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ].reduce<Position[]>(
            (pos, [deltaX, deltaY]) => {
              const deltaTile: Phaser.Tilemaps.Tile | null = this.game.map.getTileAt(
                tile.x + deltaX,
                tile.y + deltaY,
                false,
                layer,
              );
              if (deltaTile && combined.has(deltaTile.index)) {
                return [...pos, { x: deltaTile.x, y: deltaTile.y }];
              }
              return pos;
            },
            [{ x: tile.x, y: tile.y }],
          );

          const toAdd: Item[] = [];
          if (method === "random") {
            const randomResult = Phaser.Math.RND.pick(result);
            toAdd.push(new Item(this.sysManager.materialManager.getMaterial(randomResult.id)!, randomResult.amount));
          } else if (method === "direct") {
            toAdd.push(
              ...result.map(res => new Item(this.sysManager.materialManager.getMaterial(res.id)!, res.amount)),
            );
          }

          const added = this.sysManager.inventorySystem.addItems(toAdd);
          if (!added) return;

          for (const { x, y } of toRemove) {
            this.game.map.removeTileAt(x, y, false, true, layer);
          }

          EventBus.emit("item-picked-up", tile.properties);
          break;
        }
      }
    });

    // Hotbar number keys (1-5)
    this.setupHotbarControls();
  }

  private setupHotbarControls(): void {
    // Setup number keys (1-5) for hotbar selection using the input component
    for (let i = 0; i < 5; i++) {
      const keyCode = Phaser.Input.Keyboard.KeyCodes.ONE + i;
      const key = this.game.input.keyboard!.addKey(keyCode);
      key.on("down", () => {
        this.game.player.selectedHotbarSlot = i;
      });
    }

    // Setup mouse wheel for cycling through hotbar slots
    this.game.input.on("wheel", (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
      if (deltaY > 0) {
        this.game.player.selectNextHotbarSlot();
      } else if (deltaY < 0) {
        this.game.player.selectPreviousHotbarSlot();
      }
    });

    // Listen for hotbar selection changes to handle item usage
    EventBus.on("hotbar-selection-changed", (slotIndex: number) => {
      console.log(`Hotbar slot ${slotIndex + 1} selected`);
      // Use the selected item if applicable
      this.handleHotbarSelection();
    });
  }

  private handleHotbarSelection(): void {
    // Get the currently selected hotbar slot
    const selectedSlot = this.game.player.selectedHotbarSlot;

    // This method will be called whenever the player changes their hotbar selection
    console.log(`Player selected hotbar slot ${selectedSlot + 1}`);

    // Get the selected item from the inventory system
    const inventorySystem = this.sysManager.inventorySystem;
    const selectedItem = inventorySystem.getHotbarItem(selectedSlot);

    if (selectedItem) {
      // Show item name in console for debugging
      console.log(`Selected item: ${selectedItem.id}, quantity: ${selectedItem.quantity}`);

      // Update visual representation in HUD
      EventBus.emit("hotbar-item-selected", {
        slot: selectedSlot,
        item: selectedItem,
      });

      // Add a key listener for item usage
      this.setupItemUseKey(selectedSlot, selectedItem);
    }
  }

  private setupItemUseKey(slotIndex: number, item: Item): void {
    // Clear any previous item use key listeners
    if (this.itemUseKey) {
      this.itemUseKey.removeAllListeners();
    }

    // Use the Q key for item usage
    this.itemUseKey = this.game.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.itemUseKey.on("down", () => {
      this.useHotbarItem(slotIndex, item);
    });
  }

  /**
   * Use the item from the specified hotbar slot
   * @param slotIndex The index of the hotbar slot containing the item to use
   * @param item The item to use
   */
  private useHotbarItem(slotIndex: number, item: Item): void {
    console.log(`Using item ${item.id} from hotbar slot ${slotIndex + 1}`);

    // Different behavior based on item type
    switch (item.type.type) {
      case MaterialCategory.TOOL:
        this.useToolItem(item);
        break;
      case MaterialCategory.CONSUMABLE:
        this.useConsumableItem(item);
        break;
      case MaterialCategory.FURNITURE:
        this.usePlaceableItem(item);
        break;
      default:
        console.log(`Item ${item.id} cannot be used directly`);
        break;
    }
  }

  /**
   * Use a tool item (axe, pickaxe, etc.)
   */
  private useToolItem(item: Item): void {
    // Emit an event that the tool was used - other systems can react to this
    EventBus.emit("tool-used", {
      toolId: item.id,
      position: this.gridEngine.getPosition(SPRITE_ID),
    });

    // Tools don't get consumed when used
  }

  /**
   * Use a consumable item (food, potion, etc.)
   */
  private useConsumableItem(item: Item): void {
    // Apply the consumable effect (health, stamina, etc.)
    if (item.id.includes("berry") || item.id.includes("carrot") || item.id.includes("food")) {
      // Food items restore health
      this.game.player.health = Math.min(this.game.player.health + 1, this.game.player.maxHealth);

      // Consume one of the item
      this.consumeHotbarItem(item);
    }
  }

  /**
   * Use a placeable item (building block, furniture, etc.)
   */
  private usePlaceableItem(item: Item): void {
    const playerPosition = this.gridEngine.getPosition(SPRITE_ID);
    const facingDirection = this.gridEngine.getFacingDirection(SPRITE_ID);

    // Calculate position in front of player
    let targetX = playerPosition.x;
    let targetY = playerPosition.y;

    switch (facingDirection) {
      case Direction.UP:
        targetY--;
        break;
      case Direction.DOWN:
        targetY++;
        break;
      case Direction.LEFT:
        targetX--;
        break;
      case Direction.RIGHT:
        targetX++;
        break;
    }

    // Check if the target position is empty and can be built on
    const targetTile = this.game.map.getTileAt(targetX, targetY, false, 0);
    if (!targetTile || targetTile.index === -1) {
      // Placeholder for actual placement logic
      console.log(`Placing ${item.id} at position (${targetX}, ${targetY})`);

      // Emit an event that a placeable was used
      EventBus.emit("item-placed", {
        itemId: item.id,
        position: { x: targetX, y: targetY },
      });

      // Consume one of the item
      this.consumeHotbarItem(item);
    } else {
      console.log("Cannot place item here - position is occupied");
    }
  }

  /**
   * Consume one of an item from the hotbar (reduce quantity by 1)
   */
  private consumeHotbarItem(item: Item): void {
    const selectedSlot = this.game.player.selectedHotbarSlot;
    const inventorySystem = this.sysManager.inventorySystem;

    // Decrement the item quantity
    item.quantity--;

    // If this was the last one, remove it from the slot
    if (item.quantity <= 0) {
      inventorySystem.setHotbarItem(selectedSlot, null);
    } else {
      // Update the UI
      EventBus.emit("hotbar-item-changed", {
        hotbarIndex: selectedSlot,
        item: item,
      });
    }

    // Notify that inventory was updated
    EventBus.emit("inventory-updated", "player");
  }

  update(): void {
    if (!this.game.player.isMovementEnabled) return;

    if (this.inputComponent.isUpDown) {
      this.gridEngine.move(SPRITE_ID, Direction.UP);
    } else if (this.inputComponent.isDownDown) {
      this.gridEngine.move(SPRITE_ID, Direction.DOWN);
    } else if (this.inputComponent.isLeftDown) {
      this.gridEngine.move(SPRITE_ID, Direction.LEFT);
    } else if (this.inputComponent.isRightDown) {
      this.gridEngine.move(SPRITE_ID, Direction.RIGHT);
    }
  }
}
