import { EventBus } from "../EventBus";
import SystemManager from "../SystemManager";
import { SPRITE_ID } from "../entities/Player";
import { Item } from "../resources/Item";
import Game from "../scenes/Game";
import BlockchainSaveManager from "./BlockchainSaveManager";
import { HotbarIndex, PLAYER_INVENTORY } from "./InventoryManager";
import { Position } from "grid-engine";

const SAVE_KEY = "greenwhistle_save";
const AUTO_SAVE_INTERVAL = 30000; // 5 seconds

export interface GameSave {
  version: number;

  timestamp: number;

  player: {
    position: Position;
    health: number;
    selectedHotbarSlot: HotbarIndex;
  };

  inventory: Array<{
    slotIndex: number;
    itemId: string;
    quantity: number;
  }>;

  farming: Array<{
    position: Position;
    cropId: string;
    growthStage: number;
    plantedTime: number;
    lastWateredTime: number;
  }>;

  mapChanges: Array<{
    layer: string;
    position: Position;
    tileIndex: number;
  }>;
}

type DataAdaptorProvider = "localstorage" | "blockchain";

export default class SaveManager {
  private scene!: Game;
  private lastSaveTime = 0;
  private autoSaveTimerId: number | null = null;
  private isLoading = false;

  public setup(scene: Game): void {
    this.scene = scene;
  }

  /**
   * Start the auto-save timer
   */
  public startAutoSave(): void {
    this.autoSaveTimerId = this.scene.time.addEvent({
      delay: AUTO_SAVE_INTERVAL,
      callback: this.saveGameToBlockchain,
      callbackScope: this,
      loop: true,
    }).elapsed;

    EventBus.on("player-health-changed", this.saveGameToBlockchain.bind(this));
    EventBus.on("inventory-updated", this.saveGameToBlockchain.bind(this));
    EventBus.on("crop-planted", this.saveGameToBlockchain.bind(this));
    EventBus.on("crop-harvested", this.saveGameToBlockchain.bind(this));
  }

  /**
   * Stop the auto-save timer
   */
  private stopAutoSave(): void {
    if (this.autoSaveTimerId !== null) {
      this.scene.time.removeEvent(this.autoSaveTimerId as unknown as Phaser.Time.TimerEvent);
      this.autoSaveTimerId = null;
    }
  }

  async saveData(provider: DataAdaptorProvider, gameSave: GameSave): Promise<boolean> {
    try {
      if (provider === "localstorage") {
        localStorage.setItem(SAVE_KEY, JSON.stringify(gameSave));
        return true;
      } else {
        return await BlockchainSaveManager.saveToBlockchain(gameSave);
      }
    } catch (error) {
      console.error("Error saving game data:", error);
      return false;
    }
  }

  async retrieveData(provider: DataAdaptorProvider): Promise<GameSave | null> {
    if (provider === "localstorage") {
      const saveItem = localStorage.getItem(SAVE_KEY);
      if (saveItem) {
        return JSON.parse(saveItem) as GameSave;
      }
    } else {
      const saveData = await BlockchainSaveManager.loadFromBlockchain();
      if (saveData) {
        return saveData;
      }
    }
    return null;
  }

  async saveGame(provider: DataAdaptorProvider): Promise<boolean> {
    // Avoid saving during loading to prevent overwriting with partial data
    if (this.isLoading) return false;

    // Throttle saves to avoid excessive operations
    const now = Date.now();
    if (now - this.lastSaveTime < 1000) return false; // Don't save more than once per second

    this.lastSaveTime = now;

    try {
      const systemManager = SystemManager.instance;
      const player = this.scene.player;
      const gridEngine = this.scene.gridEngine;

      if (!player || !gridEngine) {
        console.warn("Unable to save: missing player or grid engine");
        return false;
      }

      // Create save data structure
      const saveData: GameSave = {
        version: 1,
        timestamp: now,
        player: {
          position: gridEngine.getPosition(SPRITE_ID),
          health: player.health,
          selectedHotbarSlot: player.selectedHotbarSlot,
        },
        inventory: this.packInventory(systemManager),
        farming: this.packFarmingData(systemManager),
        mapChanges: this.packMapChanges(),
      };

      const success = this.saveData(provider, saveData);
      if (!success) {
        console.error("Failed to save game data");
        return false;
      }
      console.log("Game saved successfully");
      return success;
    } catch (error) {
      console.error("Error saving game:", error);
      return false;
    }
  }

  /**
   * Save the current game state
   */
  async saveGameToLocal(): Promise<boolean> {
    return this.saveGame("localstorage");
  }

  /**
   * Save the current game state to the blockchain
   * @returns Promise that resolves to true if successful, false otherwise
   */
  async saveGameToBlockchain(): Promise<boolean> {
    return this.saveGame("blockchain");
  }

  async loadGame(provider: DataAdaptorProvider): Promise<boolean> {
    this.isLoading = true;
    try {
      const saveData = await this.retrieveData(provider);

      if (!saveData) {
        console.log("No save data found");
        this.isLoading = false;
        return false;
      }

      // Version check
      if (saveData.version !== 1) {
        console.warn("Save version mismatch, attempting to load anyway");
      }

      if (!this.unpackData(saveData)) {
        this.isLoading = false;
        return false;
      }

      console.log("Game loaded successfully");

      this.isLoading = false;
      return true;
    } catch (error) {
      console.error("Error loading game:", error);
      this.isLoading = false;
      return false;
    }
  }

  /**
   * Load game from saved state
   * @returns true if successful, false otherwise
   */
  async loadGameFromLocal(): Promise<boolean> {
    return this.loadGame("localstorage");
  }

  /**
   * Load game state from the blockchain
   * @returns Promise that resolves to true if successful, false otherwise
   */
  async loadGameFromBlockchain(): Promise<boolean> {
    return this.loadGame("blockchain");
  }

  /**
   * Pack inventory data into a compact format for saving
   */
  private packInventory(systemManager: SystemManager): GameSave["inventory"] {
    const inventoryManager = systemManager.inventoryManager;
    const playerInventory = inventoryManager.getInventory(PLAYER_INVENTORY);

    if (!playerInventory) return [];

    const packedInventory: GameSave["inventory"] = [];

    playerInventory.slots.forEach((slot, index) => {
      if (slot.item) {
        packedInventory.push({
          slotIndex: index,
          itemId: slot.item.id,
          quantity: slot.item.quantity || 1,
        });
      }
    });

    return packedInventory;
  }

  /**
   * Pack farming data into a compact format for saving
   */
  private packFarmingData(systemManager: SystemManager): GameSave["farming"] {
    return systemManager.farmingManager.getPlantedCrops().map(crop => ({
      position: crop.position,
      cropId: crop.cropData.seed.cropId || "",
      growthStage: crop.growthLevel,
      plantedTime: crop.plantedTimestamp,
      lastWateredTime: crop.lastWateredTime,
    }));
  }

  /**
   * Pack map changes into a compact format for saving
   */
  private packMapChanges(): GameSave["mapChanges"] {
    // Get changed tiles from the mapStateTracker
    const systemManager = SystemManager.instance;
    return systemManager.mapStateTracker.getAllChanges().map(change => ({
      layer: change.layer,
      position: change.position,
      tileIndex: change.tileIndex,
    }));
  }

  unpackData(saveData: GameSave): boolean {
    const systemManager = SystemManager.instance;
    const player = this.scene.player;
    const gridEngine = this.scene.gridEngine;

    if (!player || !gridEngine) {
      console.error("Unable to load: missing player or grid engine");
      this.isLoading = false;
      return false;
    }

    // Load player state
    gridEngine.setPosition(SPRITE_ID, saveData.player.position);
    player.health = saveData.player.health;
    player.selectedHotbarSlot = saveData.player.selectedHotbarSlot;

    // Load inventory
    this.unpackInventory(systemManager, saveData.inventory);

    // Load farming data
    this.unpackFarmingData(systemManager, saveData.farming);

    // Load map changes
    this.unpackMapChanges(saveData.mapChanges);
    return true;
  }

  /**
   * Unpack inventory data from save format and apply to game
   */
  private unpackInventory(systemManager: SystemManager, inventoryData: GameSave["inventory"]): void {
    const inventoryManager = systemManager.inventoryManager;
    const materialManager = systemManager.materialManager;

    // Clear current inventory by getting the inventory and setting all slots to null
    const inventory = inventoryManager.getInventory(PLAYER_INVENTORY);
    if (inventory) {
      inventory.slots.forEach(slot => {
        slot.item = null;
      });
    }

    // Add items from save data
    inventoryData.forEach(slotData => {
      // Find the item in the material list by ID
      const item = materialManager.getMaterial(slotData.itemId);

      if (item) {
        // Create a new item instance
        const itemCopy = new Item(item, slotData.quantity);

        // Add the item to the inventory
        // Check if we can add the item directly to the slot
        if (inventory && slotData.slotIndex >= 0 && slotData.slotIndex < inventory.slots.length) {
          inventoryManager.addItemToSlot(itemCopy, slotData.slotIndex, PLAYER_INVENTORY);
        }
      }
    });

    // Notify UI with a generic inventory update event
    EventBus.emit("inventory-updated", {
      inventoryId: PLAYER_INVENTORY,
      action: "load",
      items: inventory ? inventory.slots.map(slot => slot.item) : [],
    });
  }

  /**
   * Unpack farming data from save format and apply to game
   */
  private unpackFarmingData(systemManager: SystemManager, farmingData: GameSave["farming"]): void {
    const farmingManager = systemManager.farmingManager;

    // Clear existing crops first
    farmingManager.clearAllCrops();

    // Restore crops from save
    farmingData.forEach(crop => {
      farmingManager.restoreCrop(crop.position, crop.cropId, crop.growthStage, crop.plantedTime, crop.lastWateredTime);
    });
  }

  /**
   * Unpack map changes from save format and apply to game
   */
  private unpackMapChanges(mapChanges: GameSave["mapChanges"]): void {
    // Apply the saved map changes to the current map
    const map = this.scene.map;
    const systemManager = SystemManager.instance;

    // Clear any tracked changes before loading new ones
    systemManager.mapStateTracker.clearChanges();

    mapChanges.forEach(change => {
      const layer = map.getLayer(change.layer);
      if (layer) {
        // Apply the tile change to the map
        if (change.tileIndex >= 0) {
          // Place a tile
          map.putTileAt(change.tileIndex, change.position.x, change.position.y, false, change.layer);
        } else {
          // Remove a tile (tileIndex -1 represents a removed tile)
          map.removeTileAt(change.position.x, change.position.y, true, true, change.layer);
        }

        // Track the change in the map state tracker
        systemManager.mapStateTracker.trackTileChange(change.layer, change.position, change.tileIndex);
      }
    });
  }

  /**
   * Check if a save exists
   */
  hasSaveDataOnLocal(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  /**
   * Check if a save exists on the blockchain
   * @returns Promise that resolves to true if blockchain save exists
   */
  async hasSaveDataOnBlockchain(): Promise<boolean> {
    return await BlockchainSaveManager.hasSaveDataOnBlockchain();
  }

  /**
   * Delete the current save
   */
  deleteSaveDataFromLocal(): void {
    localStorage.removeItem(SAVE_KEY);
    console.log("Save data deleted");
  }

  /**
   * Delete the current save from the blockchain
   * @returns Promise that resolves to true if successful
   */
  async deleteSaveDataFromBlockchain(): Promise<boolean> {
    const success = await BlockchainSaveManager.deleteSaveDataFromBlockchain();
    if (success) {
      console.log("Save data deleted from blockchain");
      return true;
    }
    return false;
  }

  /**
   * Clean up resources when the scene is destroyed
   */
  destroy(): void {
    this.stopAutoSave();

    // Remove event listeners using properly bound functions
    EventBus.off("player-health-changed", this.saveGameToBlockchain);
    EventBus.off("inventory-updated", this.saveGameToBlockchain);
    EventBus.off("crop-planted", this.saveGameToBlockchain);
    EventBus.off("crop-harvested", this.saveGameToBlockchain);
  }
}
