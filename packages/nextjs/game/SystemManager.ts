// src/game/SystemManager.ts
import { EventBus } from "./EventBus";
import { ItemManager } from "./resources/ItemManager";
import { Game } from "./scenes/Game";
import { FarmingSystem } from "./systems/FarmingSystem";
import InventorySystem from "./systems/InventorySystem";

/**
 * SystemManager class to initialize and manage all game systems
 */
export class SystemManager {
  private farmingSystem: FarmingSystem;
  private inventorySystem: InventorySystem;
  private itemManager: ItemManager;

  constructor(private scene: Game) {
    // Initialize systems in the correct order
    this.inventorySystem = new InventorySystem(scene);
    this.farmingSystem = new FarmingSystem(scene, this.inventorySystem);
    this.itemManager = new ItemManager();
  }

  load() {
    this.setupEventListeners();
    this.itemManager.loadItems();
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
    // Refresh UI elements related to inventory
    const playerInventory = this.inventorySystem.getInventory("player");
    if (playerInventory) {
      // You can emit an event with the updated inventory data
      // that your UI components can listen for
      EventBus.emit("update-inventory-ui", Array.from(playerInventory.items.values()));
    }
  }

  /**
   * Get the inventory system
   */
  public getInventorySystem(): InventorySystem {
    return this.inventorySystem;
  }

  /**
   * Get the farming system
   */
  public getFarmingSystem(): FarmingSystem {
    return this.farmingSystem;
  }

  public getItemManager(): ItemManager {
    return this.itemManager;
  }

  /**
   * Update method called every frame
   */
  public update(time: number, delta: number): void {
    // Add any per-frame system updates here
  }
}
