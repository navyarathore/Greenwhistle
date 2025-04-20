import { Item, ItemType } from "./Item";
import Resources from "./resource.json";

/**
 * ItemManager class responsible for loading, managing, and providing access to game items
 */
export class ItemManager {
  private items: Map<number, Item> = new Map();

  /**
   * Load items from the resource.json file
   */
  public loadItems() {
    try {
      Object.entries(Resources.items).forEach(([id, itemData]: [string, any]) => {
        const item: Item = {
          id: Number(id),
          name: itemData.name,
          type: ItemType[itemData.type.toUpperCase() as keyof typeof ItemType],
          stackable: itemData.stackable !== undefined ? itemData.stackable : true,
          maxStackSize: itemData.maxStackSize || 99,
          icon: itemData.icon,
          description: itemData.description,
          ...Object.entries(itemData)
            .filter(
              ([key]) => !["id", "name", "type", "stackable", "maxStackSize", "icon", "description"].includes(key),
            )
            .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {}),
        };

        this.items.set(Number(id), item);
      });

      console.log(`Loaded ${this.items.size} items from resource.json`);
    } catch (error) {
      console.error("Error loading items:", error);
    }
  }

  /**
   * Get all items
   */
  public getAllItems(): Item[] {
    return Array.from(this.items.values());
  }

  /**
   * Get an item by ID
   */
  public getItem(id: number): Item | undefined {
    return this.items.get(id);
  }

  /**
   * Get items by type
   */
  public getItemsByType(type: ItemType): Item[] {
    return this.getAllItems().filter(item => item.type === type);
  }
}
