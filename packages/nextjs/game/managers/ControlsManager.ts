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
