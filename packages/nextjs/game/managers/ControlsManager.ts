import GridEngine, { Direction, Position } from "grid-engine";
import * as Phaser from "phaser";
import { EventBus } from "~~/game/EventBus";
import SystemManager from "~~/game/SystemManager";
import { SPRITE_ID } from "~~/game/entities/Player";
import InputComponent from "~~/game/input/InputComponent";
import { Item, MaterialCategory } from "~~/game/resources/Item";
import ResourceData from "~~/game/resources/resource.json";
import Game from "~~/game/scenes/Game";
import { getTileRecursivelyAt } from "~~/game/utils/layer-utils";

export default class ControlsManager {
  private sysManager: SystemManager = SystemManager.instance;

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
          inventoryManager: this.sysManager.inventoryManager,
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
        const tile = getTileRecursivelyAt(playerPosition, this.game.map, layer, false);

        if (tile && id.includes(tile.index)) {
          const combined: Map<number, string> = new Map(
            ResourceData.combined_blocks
              .filter(block => Object.keys(block).includes(String(tile.index)))
              .flatMap(block => Object.entries(block))
              .map(([key, value]) => [parseInt(key), value as string]),
          );
          // collision tiles
          combined.set(403, "Height 0");
          combined.set(404, "Height 0");
          combined.set(405, "Height 0");
          combined.set(454, "Height 0");
          const layers = new Set(combined.values());

          const delta = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ];
          const checkTiles = (
            x: number,
            y: number,
            layer: string,
            visited: Set<string>,
            positions: Array<Position & { layer: string }> = [],
          ): Array<Position & { layer: string }> => {
            const key = `${x}:${y}`;
            if (visited.has(key)) return positions;

            visited.add(key);
            positions.push({ x, y, layer });

            for (const [dx, dy] of delta) {
              const nextX = x + dx;
              const nextY = y + dy;
              for (const l of layers) {
                const nextTile = getTileRecursivelyAt({ x: nextX, y: nextY }, this.game.map, l, false);
                if (nextTile && combined.get(nextTile.index) === l) {
                  checkTiles(nextX, nextY, nextTile.layer.name, visited, positions);
                  break;
                }
              }
            }

            return positions;
          };

          const toRemove = checkTiles(tile.x, tile.y, tile.layer.name, new Set<string>());

          const toAdd: Item[] = [];
          if (method === "random") {
            const randomResult = Phaser.Math.RND.pick(result);
            toAdd.push(new Item(this.sysManager.materialManager.getMaterial(randomResult.id)!, randomResult.amount));
          } else if (method === "direct") {
            toAdd.push(
              ...result.map(res => new Item(this.sysManager.materialManager.getMaterial(res.id)!, res.amount)),
            );
          }

          const added = this.sysManager.inventoryManager.addItems(toAdd);
          if (!added) return;

          for (const { x, y, layer } of toRemove) {
            this.game.map.removeTileAt(x, y, false, true, layer);
          }

          EventBus.emit("item-picked-up", {
            items: toAdd,
            position: playerPosition,
            layer,
            actualLayer: tile.layer.name,
          });
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
      const index = i; // Capture the current index in closure
      this.inputComponent.hotbarKeys[i].on("down", () => {
        this.game.player.selectedHotbarSlot = index;
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
    EventBus.on("hotbar-selection-changed", _ => {
      this.handleHotbarSelection();
    });

    // Check for hotbar keys at regular intervals
    this.game.events.on("update", this.checkHotbarKeyPresses, this);
  }

  private handleHotbarSelection(): void {
    // Get the currently selected hotbar slot
    const selectedSlot = this.game.player.selectedHotbarSlot;

    // Get the selected item from the inventory system
    const inventorySystem = this.sysManager.inventoryManager;
    const selectedItem = inventorySystem.getHotbarItem(selectedSlot);

    if (selectedItem) {
      // Update visual representation in HUD
      EventBus.emit("hotbar-item-selected", {
        slotIndex: selectedSlot,
        item: selectedItem,
      });
    }
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
    // Get the position in front of the player
    const targetPosition = this.sysManager.interactionManager.getPositionInFrontOfPlayer();

    // Emit an event that the tool was used - the InteractionManager will handle the details
    EventBus.emit("tool-used", {
      toolId: item.id,
      position: this.gridEngine.getPosition(SPRITE_ID),
      targetPosition: targetPosition,
    });
  }

  /**
   * Use a consumable item (food, potion, etc.)
   */
  private useConsumableItem(item: Item): void {
    // Emit an event for the InteractionManager to handle consumable effects
    // EventBus.emit("item-used", {
    //   item: item,
    // });
    // The InteractionManager now handles all consumable effects, including:
    // - Health restoration
    // - Visual effects (particles, animations)
    // - Sound effects
    // - Inventory management (consuming the item)
  }

  /**
   * Use a placeable item (building block, furniture, etc.)
   */
  private usePlaceableItem(item: Item): void {
    // Get the position in front of the player from the InteractionManager
    const targetPosition = this.sysManager.interactionManager.getPositionInFrontOfPlayer();

    // Emit an event that a placeable was used - InteractionManager will handle the details
    EventBus.emit("item-placed", {
      item: item,
      position: targetPosition,
    });

    // InteractionManager now handles all the placement logic, visual effects,
    // and inventory management when items are successfully placed
  }

  /**
   * Consume one of an item from the hotbar (reduce quantity by 1)
   * This is now a proxy to the InteractionManager's item consumption functionality
   */
  private consumeHotbarItem(item: Item): void {
    // Let the InteractionManager handle item consumption for consistency
    // This method remains for backward compatibility with existing code

    const selectedSlot = this.game.player.selectedHotbarSlot;
    const inventorySystem = this.sysManager.inventoryManager;

    // Decrement the item quantity
    item.quantity--;

    // If this was the last one, remove it from the slot
    if (item.quantity <= 0) {
      inventorySystem.setHotbarItem(selectedSlot, null);
    } else {
      // Update the UI
      EventBus.emit("hotbar-item-changed", {
        slotIndex: selectedSlot,
        item: item,
      });
    }

    // Notify that inventory was updated
    EventBus.emit("inventory-updated", {
      inventoryId: "player",
      action: "update",
      items: this.sysManager.inventoryManager.getItems(),
    });
  }

  /**
   * Check for hotbar key presses during the game update cycle
   */
  private checkHotbarKeyPresses(): void {
    // We only check for hotbar keys if movement is enabled
    if (!this.game.player.isMovementEnabled) return;

    // Check each hotbar key
    for (let i = 0; i < this.inputComponent.hotbarKeys.length; i++) {
      if (this.inputComponent.isHotbarKeyJustDown(i)) {
        this.game.player.selectedHotbarSlot = i;
      }
    }
  }

  update(): void {
    if (!this.game.player.isMovementEnabled) return;

    // Check for movement input
    if (this.inputComponent.isUpDown) {
      this.gridEngine.move(SPRITE_ID, Direction.UP);
    } else if (this.inputComponent.isDownDown) {
      this.gridEngine.move(SPRITE_ID, Direction.DOWN);
    } else if (this.inputComponent.isLeftDown) {
      this.gridEngine.move(SPRITE_ID, Direction.LEFT);
    } else if (this.inputComponent.isRightDown) {
      this.gridEngine.move(SPRITE_ID, Direction.RIGHT);
    }

    // Check for item use key press
    if (this.inputComponent.isItemUseKeyJustDown) {
      // Get the currently selected hotbar slot
      const selectedSlot = this.game.player.selectedHotbarSlot;

      // Get the item directly from inventory
      const selectedItem = this.sysManager.inventoryManager.getHotbarItem(selectedSlot);

      // Use the item if one exists
      if (selectedItem) {
        this.useHotbarItem(selectedSlot, selectedItem);
      }
    }
  }
}
