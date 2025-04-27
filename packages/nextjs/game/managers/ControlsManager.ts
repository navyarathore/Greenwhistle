import GridEngine, { Direction } from "grid-engine";
import { EventBus } from "~~/game/EventBus";
import { HotbarSelectionChangedEvent } from "~~/game/EventTypes";
import SystemManager from "~~/game/SystemManager";
import { SPRITE_ID } from "~~/game/entities/Player";
import InputComponent from "~~/game/input/InputComponent";
import { Item } from "~~/game/resources/Item";
import Game from "~~/game/scenes/Game";

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
      this.sysManager.interactionManager.pickupItem();
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
    EventBus.on("hotbar-selection-changed", this.handleHotbarSelection.bind(this));
  }

  private handleHotbarSelection(event: HotbarSelectionChangedEvent): void {
    // Get the currently selected hotbar slot
    const selectedSlot = event.slotIndex;

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

  update(): void {
    if (this.game.player.isMovementEnabled) {
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
    }

    for (let i = 0; i < this.inputComponent.hotbarKeys.length; i++) {
      if (this.inputComponent.isHotbarKeyJustDown(i)) {
        this.game.player.selectedHotbarSlot = i;
      }
    }

    // Check for item use key press
    if (this.inputComponent.isItemUseKeyJustDown) {
      const selectedSlot = this.game.player.selectedHotbarSlot;
      const selectedItem = this.sysManager.inventoryManager.getHotbarItem(selectedSlot);
      if (selectedItem) {
        this.sysManager.interactionManager.useHotbarItem(selectedSlot, selectedItem);
      }
    }
  }

  /**
   * Clean up resources when the manager is destroyed
   */
  destroy(): void {
    // Clean up event listeners bound to input keys
    if (this.inputComponent.inventoryKey) {
      this.inputComponent.inventoryKey.removeAllListeners();
    }

    if (this.inputComponent.actionKey) {
      this.inputComponent.actionKey.removeAllListeners();
    }

    // Clean up hotbar keys
    this.inputComponent.hotbarKeys.forEach(key => {
      if (key) key.removeAllListeners();
    });

    // Clean up any other input keys
    if (this.inputComponent.itemUseKey) {
      this.inputComponent.itemUseKey.removeAllListeners();
    }
  }
}
