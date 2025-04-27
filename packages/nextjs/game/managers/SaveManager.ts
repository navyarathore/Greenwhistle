// filepath: /run/media/abhigya/SSD/Github/Greenwhistle/packages/nextjs/game/managers/SaveManager.ts
import { EventBus } from "../EventBus";
import SystemManager from "../SystemManager";
import { SPRITE_ID } from "../entities/Player";
import { Item } from "../resources/Item";
import Game from "../scenes/Game";
import { HotbarIndex, PLAYER_INVENTORY } from "./InventoryManager";
import { Position } from "grid-engine";

const SAVE_KEY = "greenwhistle_save";
const AUTO_SAVE_INTERVAL = 5000; // 5 seconds

interface GameSave {
  version: number;

  timestamp: number;

  player: {
    position: Position;
    health: number;
    selectedHotbarSlot: HotbarIndex;
  };

  inventory: {
    slotIndex: number;
    itemId: string;
    quantity: number;
  }[];

  farming: {
    position: Position;
    cropId: string;
    growthStage: number;
    plantedTime: number;
    lastWateredTime: number;
  }[];

  mapChanges: {
    layer: string;
    position: Position;
    tileIndex: number;
  }[];
}

export default class SaveManager {
  private scene: Game;
  private lastSaveTime = 0;
  private autoSaveTimerId: number | null = null;
  private isLoading = false;

  constructor(scene: Game) {
    this.scene = scene;

    // Listen for events that should trigger a save
    EventBus.on("player-health-changed", () => this.saveGame());
    EventBus.on("inventory-updated", () => this.saveGame());
    EventBus.on("crop-planted", () => this.saveGame());
    EventBus.on("crop-harvested", () => this.saveGame());
  }

  /**
   * Start the auto-save timer
   */
  public startAutoSave(): void {
    this.autoSaveTimerId = this.scene.time.addEvent({
      delay: AUTO_SAVE_INTERVAL,
      callback: this.saveGame,
      callbackScope: this,
      loop: true,
    }).elapsed;
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

  /**
   * Save the current game state
   */
  saveGame(): void {
    // Avoid saving during loading to prevent overwriting with partial data
    if (this.isLoading) return;

    // Throttle saves to avoid excessive operations
    const now = Date.now();
    if (now - this.lastSaveTime < 1000) return; // Don't save more than once per second

    this.lastSaveTime = now;

    try {
      const systemManager = SystemManager.instance;
      const player = this.scene.player;
      const gridEngine = this.scene.gridEngine;

      if (!player || !gridEngine) {
        console.warn("Unable to save: missing player or grid engine");
        return;
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

      // Save to localStorage
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));

      console.log("Game saved successfully");
    } catch (error) {
      console.error("Error saving game:", error);
    }
  }

  /**
   * Load game from saved state
   * @returns true if successful, false otherwise
   */
  loadGame(): boolean {
    try {
      this.isLoading = true;

      const saveJson = localStorage.getItem(SAVE_KEY);
      if (!saveJson) {
        console.log("No save data found");
        this.isLoading = false;
        return false;
      }

      const saveData: GameSave = JSON.parse(saveJson);
      console.log(saveData);

      // Version check
      if (saveData.version !== 1) {
        console.warn("Save version mismatch, attempting to load anyway");
      }

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
  hasSaveData(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  /**
   * Delete the current save
   */
  deleteSaveData(): void {
    localStorage.removeItem(SAVE_KEY);
    console.log("Save data deleted");
    EventBus.emit("system-update", { time: Date.now(), delta: 0 });
  }

  /**
   * Clean up resources when the scene is destroyed
   */
  destroy(): void {
    this.stopAutoSave();

    // Remove event listeners using properly bound functions
    EventBus.off("player-health-changed", this.saveGame);
    EventBus.off("inventory-updated", this.saveGame);
    EventBus.off("crop-planted", this.saveGame);
    EventBus.off("crop-harvested", this.saveGame);
  }
}
