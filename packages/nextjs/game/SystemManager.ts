// src/game/SystemManager.ts
import { EventBus } from "./EventBus";
import { FarmingSystem } from "./managers/FarmingSystem";
import InventoryManager from "./managers/InventoryManager";
import { ItemManager } from "./managers/MaterialManager";
import { Game } from "./scenes/Game";
import { InputComponent } from "~~/game/input/InputComponent";
import ControlsManager from "~~/game/managers/ControlsManager";

/**
 * SystemManager class to initialize and manage all game systems
 */
export class SystemManager {
  readonly farmingSystem: FarmingSystem;
  readonly inventorySystem: InventoryManager;
  readonly itemManager: ItemManager;
  readonly controlsManager: ControlsManager;

  constructor(private scene: Game) {
    // Initialize systems in the correct order
    this.inventorySystem = new InventoryManager(scene);
    this.farmingSystem = new FarmingSystem(scene, this.inventorySystem);
    this.itemManager = new ItemManager();

    const inputComponent = new InputComponent(scene.input.keyboard!);

    this.controlsManager = new ControlsManager(scene, inputComponent, scene.gridEngine);
  }

  load(): void {
    this.itemManager.loadItems();
    this.controlsManager.setupControls();
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for player creation to provide inventory system
    EventBus.on("player-created", (_: any) => {
      EventBus.emit("inventory-system-ready", this.inventorySystem);
    });

    // Listen for player interaction events
    EventBus.on("player-interact", this.handlePlayerInteraction.bind(this));

    // Listen for day change
    EventBus.on("day-change", (day: number) => {
      EventBus.emit("day-changed", day);
    });

    // Listen for inventory UI updates
    EventBus.on("inventory-updated", this.handleInventoryUpdate.bind(this));
  }

  /**
   * Handle player interaction with the world
   */
  private handlePlayerInteraction(data: any): void {
    const { objectId, toolType } = data;

    // Check if this is a resource interaction
    if (objectId.startsWith("tree_") || objectId.startsWith("rock_") || objectId.startsWith("ore_")) {
      const result = this.farmingSystem.harvestResource(objectId, toolType);

      if (result.success) {
        EventBus.emit("show-message", `Harvested ${result.quantity} ${result.yield}!`);
      } else {
        EventBus.emit("show-message", "Cannot harvest this resource right now.");
      }
    }
  }

  /**
   * Handle inventory updates
   */
  private handleInventoryUpdate(): void {
    EventBus.emit("update-inventory-ui", this.inventorySystem.getItems());
  }

  /**
   * Update method called every frame
   */
  public update(time: number, delta: number): void {
    // Add any per-frame system updates here
  }
}
