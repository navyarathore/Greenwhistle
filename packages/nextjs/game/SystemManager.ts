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
 * Using singleton pattern to ensure only one instance exists
 */
export class SystemManager {
  private static _instance: SystemManager;

  readonly inventorySystem: InventoryManager;
  readonly materialManager: MaterialManager;
  readonly craftingManager: CraftingManager;
  readonly farmingManager: FarmingManager;
  private _controlsManager!: ControlsManager;

  /**
   * Get the singleton instance of SystemManager
   */
  public static get instance(): SystemManager {
    if (!SystemManager._instance) {
      SystemManager._instance = new SystemManager();
    }
    return SystemManager._instance;
  }

  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor() {
    // Initialize systems in the correct order
    this.inventorySystem = new InventoryManager();
    this.materialManager = new MaterialManager();
    this.craftingManager = new CraftingManager();
    this.farmingManager = new FarmingManager(this.materialManager);
  }

  loadResources() {
    this.materialManager.loadItems();
    this.craftingManager.loadRecipes(this.materialManager);
    this.farmingManager.loadCrops();
  }

  setup(scene: Game): void {
    const inputComponent = new InputComponent(scene.input.keyboard!);
    this._controlsManager = new ControlsManager(scene, inputComponent, scene.gridEngine);
    this.controlsManager.setupControls();
    this.setupEventListeners();
  }

  get controlsManager(): ControlsManager {
    return this._controlsManager;
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
