import { EventBus } from "./EventBus";
import InventoryManager from "./managers/InventoryManager";
import { MaterialManager } from "./managers/MaterialManager";
import { Game } from "./scenes/Game";
import { InputComponent } from "~~/game/input/InputComponent";
import ControlsManager from "~~/game/managers/ControlsManager";
import { CraftingManager } from "~~/game/managers/CraftingManager";
import { FarmingManager } from "~~/game/managers/FarmingManager";

/**
 * SystemManager class to initialize and manage all game systems
 */
export class SystemManager {
  readonly inventorySystem: InventoryManager;
  readonly materialManager: MaterialManager;
  readonly craftingManager: CraftingManager;
  readonly controlsManager: ControlsManager;
  readonly farmingManager: FarmingManager;

  constructor(private scene: Game) {
    // Initialize systems in the correct order
    this.inventorySystem = new InventoryManager(scene);
    this.materialManager = new MaterialManager();
    this.craftingManager = new CraftingManager();
    this.farmingManager = new FarmingManager(scene, this.materialManager);

    const inputComponent = new InputComponent(scene.input.keyboard!);

    this.controlsManager = new ControlsManager(scene, inputComponent, scene.gridEngine);
  }

  load(): void {
    this.materialManager.loadItems();
    this.craftingManager.loadRecipes(this.materialManager);
    this.farmingManager.loadCrops();
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

    // Listen for day change
    EventBus.on("day-change", (day: number) => {
      EventBus.emit("day-changed", day);
    });

    // Listen for inventory UI updates
    EventBus.on("inventory-updated", this.handleInventoryUpdate.bind(this));
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
    this.controlsManager.update();
  }
}
