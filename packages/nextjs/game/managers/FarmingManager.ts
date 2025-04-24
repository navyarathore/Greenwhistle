import { EventBus } from "../EventBus";
import { Item, MaterialCategory } from "../resources/Item";
import { MaterialManager } from "./MaterialManager";

export interface Crop {
  seedId: string;
  cropId: string;
  growthTime: number; // in in-game days
  waterRequirement: number; // water needed per day
}

export interface PlantedCrop {
  id: string;
  position: { x: number; y: number };
  cropData: Crop;
  plantedDay: number;
  lastWateredDay: number;
  waterLevel: number;
  isWatered: boolean;
  isGrown: boolean;
}

/**
 * FarmingManager class responsible for managing crop planting, growth, and harvesting
 */
export class FarmingManager {
  private crops: Map<string, Crop> = new Map();
  private plantedCrops: Map<string, PlantedCrop> = new Map();
  private currentDay = 1;
  private farmableTiles: Set<string> = new Set();

  constructor(private materialManager: MaterialManager) {
    this.initializeEventListeners();
  }

  /**
   * Initialize event listeners
   */
  private initializeEventListeners(): void {
    // Listen for day changes to update crop growth
    EventBus.on("day-changed", this.onDayChanged.bind(this));

    // Listen for crop interaction events from the InteractionManager
    EventBus.on("crop-watered", (data: { position: { x: number; y: number } }) => {
      // Additional visual effects or state updates when crops are watered
      this.showCropState(data.position.x, data.position.y);
    });

    EventBus.on("crop-harvested", (data: { position: { x: number; y: number }; cropId: string }) => {
      // Additional effects or state updates when crops are harvested
      this.resetFarmTile(data.position.x, data.position.y);
    });
  }

  /**
   * Register a new crop type
   */
  public registerCrop(crop: Crop): void {
    this.crops.set(crop.seedId, crop);
  }

  /**
   * Load available crops from materials
   */
  public loadCrops(): void {
    // Get all seed type materials
    const seeds = this.materialManager.getMaterialByCategory(MaterialCategory.SEED);

    // For each seed, check if there's a corresponding crop
    seeds.forEach(seed => {
      // Try to find crop with an ID that might be related to the seed
      const cropId = seed.id.replace("seed_", "crop_");
      const crop = this.materialManager.getMaterial(cropId);

      if (crop && crop.type === MaterialCategory.CROP) {
        // Register the crop with default values
        this.registerCrop({
          seedId: seed.id,
          cropId: crop.id,
          growthTime: seed.growthTime || 3, // Default 3 days if not specified
          waterRequirement: seed.waterRequirement || 1, // Default 1 water per day if not specified
        });
      }
    });

    console.log(`Loaded ${this.crops.size} crops from materials`);
  }

  /**
   * Register a farmable tile position
   */
  public registerFarmableTile(x: number, y: number): void {
    this.farmableTiles.add(`${x},${y}`);
  }

  /**
   * Check if a tile is farmable
   */
  public isFarmableTile(x: number, y: number): boolean {
    return this.farmableTiles.has(`${x},${y}`);
  }

  /**
   * Plant a seed at the specified position
   */
  public plantSeed(seedItem: Item, x: number, y: number): boolean {
    // Check if the tile is farmable
    if (!this.isFarmableTile(x, y)) {
      return false;
    }

    // Check if the tile already has a crop
    const tileKey = `${x},${y}`;
    if (Array.from(this.plantedCrops.values()).some(crop => `${crop.position.x},${crop.position.y}` === tileKey)) {
      return false;
    }

    // Check if the seed is valid
    const cropData = this.crops.get(seedItem.type.id);
    if (!cropData) {
      return false;
    }

    // Create a new planted crop
    const plantedCrop: PlantedCrop = {
      id: `crop_${Date.now()}`,
      position: { x, y },
      cropData,
      plantedDay: this.currentDay,
      lastWateredDay: 0,
      waterLevel: 0,
      isWatered: false,
      isGrown: false,
    };

    // Add to planted crops
    this.plantedCrops.set(plantedCrop.id, plantedCrop);

    // Emit event that a crop was planted
    EventBus.emit("crop-planted", plantedCrop);

    return true;
  }

  /**
   * Water a crop at the specified position
   */
  public waterCrop(x: number, y: number): boolean {
    const tileKey = `${x},${y}`;
    const plantedCrop = Array.from(this.plantedCrops.values()).find(
      crop => `${crop.position.x},${crop.position.y}` === tileKey,
    );

    if (!plantedCrop || plantedCrop.lastWateredDay === this.currentDay) {
      return false;
    }

    // Update the crop's water level
    plantedCrop.waterLevel += 1;
    plantedCrop.lastWateredDay = this.currentDay;
    plantedCrop.isWatered = true;

    // Emit event that a crop was watered
    EventBus.emit("crop-watered", plantedCrop);

    return true;
  }

  /**
   * Harvest a crop at the specified position
   */
  public harvestCrop(x: number, y: number): Item | null {
    const tileKey = `${x},${y}`;
    const plantedCrop = Array.from(this.plantedCrops.values()).find(
      crop => `${crop.position.x},${crop.position.y}` === tileKey,
    );

    // Check if there's a crop and if it's fully grown
    if (!plantedCrop || !plantedCrop.isGrown) {
      return null;
    }

    // Get the crop material
    const cropMaterial = this.materialManager.getMaterial(plantedCrop.cropData.cropId);
    if (!cropMaterial) {
      return null;
    }

    // Remove the planted crop
    this.plantedCrops.delete(plantedCrop.id);

    // Emit event that a crop was harvested
    EventBus.emit("crop-harvested", {
      position: plantedCrop.position,
      cropId: plantedCrop.cropData.cropId,
    });

    // Return the harvested crop item
    return new Item(cropMaterial, 1);
  }

  /**
   * Handle day change for crop growth
   */
  private onDayChanged(day: number): void {
    this.currentDay = day;

    // Update all planted crops
    this.plantedCrops.forEach(crop => {
      // Reset watered status
      crop.isWatered = false;

      // Check if the crop has been watered enough today
      if (crop.waterLevel >= crop.cropData.waterRequirement) {
        // Calculate days since planted
        const daysSincePlanted = this.currentDay - crop.plantedDay;

        // Check if the crop is fully grown
        const wasGrown = crop.isGrown;
        crop.isGrown = daysSincePlanted >= crop.cropData.growthTime;

        // Emit event if the crop just finished growing
        if (!wasGrown && crop.isGrown) {
          EventBus.emit("crop-grown", crop);
        }
      }

      // Reduce water level for the new day
      crop.waterLevel = Math.max(0, crop.waterLevel - crop.cropData.waterRequirement);
    });
  }

  /**
   * Get all planted crops
   */
  public getPlantedCrops(): PlantedCrop[] {
    return Array.from(this.plantedCrops.values());
  }

  /**
   * Get a specific planted crop at position
   */
  public getPlantedCropAt(x: number, y: number): PlantedCrop | undefined {
    const tileKey = `${x},${y}`;
    return Array.from(this.plantedCrops.values()).find(crop => `${crop.position.x},${crop.position.y}` === tileKey);
  }

  /**
   * Show visual indication of crop state (visual feedback)
   */
  private showCropState(x: number, y: number): void {
    const crop = this.getPlantedCropAt(x, y);
    if (!crop) return;

    // Here you could trigger visual effects like:
    // - Water particles
    // - Growth stage changes
    // - Status indicators

    // For example, emit an event for the game scene to handle
    EventBus.emit("show-crop-state", {
      position: { x, y },
      isWatered: crop.isWatered,
      isGrown: crop.isGrown,
      growthProgress: (this.currentDay - crop.plantedDay) / crop.cropData.growthTime,
    });
  }

  /**
   * Reset a farm tile after harvesting
   */
  private resetFarmTile(x: number, y: number): void {
    // The tile remains farmable after harvesting
    // This method could handle any additional cleanup or state reset
  }
}
