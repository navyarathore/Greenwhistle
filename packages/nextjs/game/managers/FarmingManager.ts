import { EventBus } from "../EventBus";
import { Item, Material, MaterialCategory } from "../resources/Item";
import MaterialManager from "./MaterialManager";
import { Position } from "grid-engine";
import Resources from "~~/game/resources/resource.json";
import Game from "~~/game/scenes/Game";
import { LayerName, isPositionEmpty } from "~~/game/utils/layer-utils";

export interface Crop {
  name: string;
  seed: Material;
  tileIndex: number;
  growthTime: number;
  yield: Record<string, number>;
}

export interface PlantedCrop {
  id: string;
  position: Position;
  cropData: Crop;
  plantedTimestamp: number;
  lastWateredTime: number;
  growthLevel: number;
}

const FARMABLE_TILE_ID = 413;

/**
 * FarmingManager class responsible for managing crop planting, growth, and harvesting
 */
export default class FarmingManager {
  private crops: Map<string, Crop> = new Map();
  private plantedCrops: Map<string, PlantedCrop> = new Map();

  constructor(
    private game: Game,
    private materialManager: MaterialManager,
  ) {}

  /**
   * Register a new crop type
   */
  public registerCrop(id: string, crop: Crop): void {
    this.crops.set(id, crop);
  }

  /**
   * Load available crops from materials
   */
  public loadCrops(): void {
    try {
      Object.entries(Resources.crops).forEach(([id, cropData]: [string, any]) => {
        const crop: Crop = {
          ...cropData,
          seed: this.materialManager.getMaterial(cropData.seed)!,
        };

        this.registerCrop(id, crop);
      });

      console.log(`Loaded ${this.crops.size} crops from resource.json`);
    } catch (error) {
      console.error("Error loading crops:", error);
    }
  }

  public getCrop(id: string): Crop | undefined {
    return this.crops.get(id);
  }

  public getCrops(): Crop[] {
    return Array.from(this.crops.values());
  }

  public getPlantedCropAt(x: number, y: number): PlantedCrop | undefined {
    const tileKey = `${x}:${y}`;
    return this.plantedCrops.get(tileKey);
  }

  public getPlantedCrops(): PlantedCrop[] {
    return Array.from(this.plantedCrops.values());
  }

  public setFarmableTile(x: number, y: number): void {
    if (!isPositionEmpty(this.game.map, x, y)) {
      throw new Error("Cannot set farmable tile, tile on other layers already exists");
    }

    [LayerName.GROUND_TEXTURE, LayerName.GRASS_TILE].forEach(layer => {
      this.game.map.removeTileAt(x, y, true, true, layer);
    });
    this.game.map.putTileAt(FARMABLE_TILE_ID, x, y, false, LayerName.GROUND);
  }

  /**
   * Check if a tile is farmable
   */
  public isFarmableTile(x: number, y: number): boolean {
    return this.game.map.getTileAt(x, y, false, LayerName.GROUND)?.index === FARMABLE_TILE_ID;
  }

  /**
   * Plant a seed at the specified position
   */
  public plantSeed(seedItem: Item, x: number, y: number): boolean {
    if (seedItem.type.category !== MaterialCategory.SEED || !seedItem.type.cropId) {
      throw new Error("Invalid seed item");
    }

    // Check if the seed is valid
    const cropData = this.crops.get(seedItem.type.cropId);
    if (!cropData) {
      throw new Error(`Invalid crop ID: ${seedItem.type.cropId}`);
    }

    if (this.plantedCrops.has(`${x}:${y}`)) {
      return false;
    }

    if (!this.isFarmableTile(x, y)) {
      return false;
    }

    this.game.map.putTileAt(cropData.tileIndex, x, y, true, "Height 1");

    const time = new Date().getTime();
    const plantedCrop: PlantedCrop = {
      id: `${x}:${y}`,
      position: { x, y },
      cropData,
      plantedTimestamp: time,
      lastWateredTime: time,
      growthLevel: 0,
    };

    this.plantedCrops.set(`${x}:${y}`, plantedCrop);

    // Emit event that a crop was planted
    EventBus.emit("crop-planted", {
      position: { x, y },
      crop: plantedCrop,
    });

    return true;
  }

  /**
   * Water a crop at the specified position
   */
  public waterCrop(x: number, y: number): boolean {
    const plantedCrop = this.getPlantedCropAt(x, y);

    if (!plantedCrop) {
      return false;
    }

    // Update the crop's water level
    plantedCrop.lastWateredTime = new Date().getTime();

    // Emit event that a crop was watered
    EventBus.emit("crop-watered", {
      crop: plantedCrop,
    });

    return true;
  }

  public update(time: number, delta: number): void {
    this.plantedCrops.forEach(crop => {
      if (crop.growthLevel === 3) return;
      const time = new Date().getTime();
      const timeSincePlanting = time - crop.plantedTimestamp;
      const timeSinceWatering = time - crop.lastWateredTime;
      const growthProgress = timeSincePlanting / crop.cropData.growthTime;
      const isWateredRecently = timeSinceWatering < 24000; // Consider watered if within last 24 seconds

      // Only grow if the crop has been watered recently
      if (isWateredRecently) {
        // Calculate new growth level (0-3 representing growth stages)
        const newGrowthLevel = Math.min(3, Math.floor(growthProgress * 4));

        if (newGrowthLevel > crop.growthLevel) {
          crop.growthLevel = newGrowthLevel;

          const tileIndex = crop.cropData.tileIndex + crop.growthLevel;
          this.game.map.putTileAt(tileIndex, crop.position.x, crop.position.y, true, "Height 1");

          if (crop.growthLevel === 3) {
            EventBus.emit("crop-grown", {
              crop: crop,
            });
          }
        }
      }
    });
  }
}
