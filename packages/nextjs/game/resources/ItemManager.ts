import { Item, ItemType } from "./Item";
import Resources from "./resource.json";

const ITEMS_PER_ROW = 50;

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
      Object.entries(Resources.items).forEach(([_id, itemData]: [string, any]) => {
        const id = Number(_id);
        const zeroBasedIdx = id - 1;
        const item: Item = {
          ...itemData,
          id: id,
          name: itemData.name,
          type: itemData.type ? ItemType[itemData.type.toUpperCase() as keyof typeof ItemType] : ItemType.OTHER,
          stackable: itemData.stackable !== undefined ? itemData.stackable : true,
          maxStackSize: itemData.maxStackSize || 99,
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
