import { Material, MaterialCategory } from "../resources/Item";
import Resources from "../resources/resource.json";

const DEFAULT_MAX_STACK = 8;

/**
 * ItemManager class responsible for loading, managing, and providing access to game items
 */
export class MaterialManager {
  private items: Map<string, Material> = new Map();

  /**
   * Load items from the resource.json file
   */
  public loadItems() {
    try {
      Object.entries(Resources.items).forEach(([id, itemData]: [string, any]) => {
        const item: Material = {
          ...itemData,
          id: id,
          name: itemData.name,
          type: itemData.type
            ? MaterialCategory[itemData.type.toUpperCase() as keyof typeof MaterialCategory]
            : MaterialCategory.OTHER,
          stackable: itemData.stackable !== undefined ? itemData.stackable : true,
          maxStackSize: itemData.maxStackSize || DEFAULT_MAX_STACK,
          icon: {
            id: itemData.icon.id || id,
            path: `/assets/icons/${itemData.icon.path}`,
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
   * Get all materials
   */
  public getAllMaterials(): Material[] {
    return Array.from(this.items.values());
  }

  /**
   * Get an material by ID
   */
  public getMaterial(id: string): Material | undefined {
    return this.items.get(id);
  }

  /**
   * Get materials by type
   */
  public getMaterialByCategory(type: MaterialCategory): Material[] {
    return this.getAllMaterials().filter(item => item.type === type);
  }
}
