import { Material, MaterialCategory } from "../resources/Item";
import Resources from "../resources/resource.json";

const ITEMS_PER_ROW = 50;
const DEFAULT_MAX_STACK = 8;

/**
 * ItemManager class responsible for loading, managing, and providing access to game items
 */
export class ItemManager {
  private items: Map<number, Material> = new Map();

  /**
   * Load items from the resource.json file
   */
  public loadItems() {
    try {
      Object.entries(Resources.items).forEach(([_id, itemData]: [string, any]) => {
        const id = Number(_id);
        const zeroBasedIdx = id - 1;
        const item: Material = {
          ...itemData,
          id: id,
          name: itemData.name,
          type: itemData.type
            ? MaterialCategory[itemData.type.toUpperCase() as keyof typeof MaterialCategory]
            : MaterialCategory.OTHER,
          stackable: itemData.stackable !== undefined ? itemData.stackable : true,
          maxStackSize: itemData.maxStackSize || DEFAULT_MAX_STACK,
          icon: itemData.icon || {
            start: {
              x: zeroBasedIdx % ITEMS_PER_ROW,
              y: Math.floor(zeroBasedIdx / ITEMS_PER_ROW),
            },
            end: {
              x: zeroBasedIdx % ITEMS_PER_ROW,
              y: Math.floor(zeroBasedIdx / ITEMS_PER_ROW),
            },
          },
          description: itemData.description,
        };

        this.items.set(id, item);
      });

      console.log(`Loaded ${this.items.size} items from resource.json`);
    } catch (error) {
      console.error("Error loading items:", error);
    }
  }

  /**
   * Get all items
   */
  public getAllMaterials(): Material[] {
    return Array.from(this.items.values());
  }

  /**
   * Get an item by ID
   */
  public getMaterial(id: number): Material | undefined {
    return this.items.get(id);
  }

  /**
   * Get items by type
   */
  public getItemsByCategory(type: MaterialCategory): Material[] {
    return this.getAllMaterials().filter(item => item.type === type);
  }
}
