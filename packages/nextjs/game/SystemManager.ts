import { EventBus } from "./EventBus";
import InventoryManager from "./managers/InventoryManager";
import MaterialManager from "./managers/MaterialManager";
import SaveManager from "./managers/SaveManager";
import Game from "./scenes/Game";
import MapStateTracker from "./utils/MapStateTracker";
import InputComponent from "~~/game/input/InputComponent";
import ControlsManager from "~~/game/managers/ControlsManager";
import CraftingManager from "~~/game/managers/CraftingManager";
import FarmingManager from "~~/game/managers/FarmingManager";
import InteractionManager from "~~/game/managers/InteractionManager";

/**
 * SystemManager class to initialize and manage all game systems
 * Using singleton pattern to ensure only one instance exists
 */
export default class SystemManager {
  private static _instance: SystemManager;

  readonly inventoryManager: InventoryManager;
  readonly materialManager: MaterialManager;
  readonly craftingManager: CraftingManager;
  readonly mapStateTracker: MapStateTracker;
  readonly saveManager: SaveManager;
  private _farmingManager!: FarmingManager;
  private _interactionManager!: InteractionManager;
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
    this.inventoryManager = new InventoryManager();
    this.materialManager = new MaterialManager();
    this.craftingManager = new CraftingManager(this.inventoryManager);
    this.mapStateTracker = new MapStateTracker();
    this.saveManager = new SaveManager();
  }

  loadResources() {
    this.materialManager.loadItems();
    this.craftingManager.loadRecipes(this.materialManager);
  }

  setup(scene: Game): void {
    this._farmingManager = new FarmingManager(scene, this.materialManager);
    this.farmingManager.loadCrops();

    const inputComponent = new InputComponent(scene.input.keyboard!);
    this._controlsManager = new ControlsManager(scene, inputComponent, scene.gridEngine);
    this._interactionManager = new InteractionManager(scene, scene.gridEngine);
    this.controlsManager.setupControls();

    this.saveManager.setup(scene);

    EventBus.emit("systems-ready", { systemManager: this });
  }

  get farmingManager(): FarmingManager {
    return this._farmingManager;
  }

  get controlsManager(): ControlsManager {
    return this._controlsManager;
  }

  get interactionManager(): InteractionManager {
    return this._interactionManager;
  }

  /**
   * Update method called every frame
   */
  public update(time: number, delta: number): void {
    // Update controls first to capture player input
    this.controlsManager.update();

    // Update interaction manager to handle all interaction effects and animations
    this.interactionManager.update(time, delta);

    this.farmingManager.update(time, delta);

    // Emit a system update event for any systems that need to respond
  }

  /**
   * Clean up all systems and resources
   * Called when the game is destroyed
   */
  public destroy(): void {
    console.log("Cleaning up SystemManager resources");

    // Clean up all managers in reverse order of creation
    if (this.saveManager) {
      this.saveManager.destroy();
    }

    if (this._interactionManager) {
      this._interactionManager.destroy();
    }

    if (this._controlsManager) {
      this._controlsManager.destroy();
    }

    if (this._farmingManager) {
      this._farmingManager.destroy();
    }

    // Clean up core systems
    this.craftingManager.destroy();
    this.mapStateTracker.destroy();
    this.materialManager.destroy();
    this.inventoryManager.destroy();

    // Reset the singleton instance to null instead of undefined to avoid type issues
    SystemManager._instance = null as unknown as SystemManager;
  }
}
