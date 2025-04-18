// src/game/systems/InventorySystem.ts
import { EventBus } from "../EventBus";
import { Game } from "../scenes/Game";

export interface InventoryItem {
  id: string;
  name: string;
  type: "resource" | "tool" | "seed" | "crop" | "fish" | "furniture" | "consumable";
  quantity: number;
  icon?: string;
  description?: string;
  stackable: boolean;
  maxStackSize?: number;
  durability?: number;
  maxDurability?: number;
  value?: number;
  tags?: string[];
}

export interface Inventory {
  id: string;
  name: string;
  maxSlots: number;
  items: Map<string, InventoryItem>;
}

export default class InventorySystem {
  private inventories: Map<string, Inventory> = new Map();
  private playerInventory = "player";

  constructor(private game: Game) {
    this.createInventory(this.playerInventory, "Player Inventory", 30);

    // Listen for inventory-related events
    EventBus.on("item-harvested", this.handleItemHarvested.bind(this));
    EventBus.on("item-used", this.handleItemUsed.bind(this));
    EventBus.on("item-dropped", this.handleItemDropped.bind(this));
    EventBus.on("item-crafted", this.handleItemCrafted.bind(this));
    EventBus.on("inventory-transfer", this.handleInventoryTransfer.bind(this));
  }

  // Create a new inventory container
  createInventory(id: string, name: string, maxSlots: number): Inventory {
    const inventory: Inventory = {
      id,
      name,
      maxSlots,
      items: new Map<string, InventoryItem>(),
    };

    this.inventories.set(id, inventory);
    return inventory;
  }

  // Get an inventory by ID
  getInventory(id: string = this.playerInventory): Inventory | undefined {
    return this.inventories.get(id);
  }

  // Get all items in an inventory
  getItems(inventoryId: string = this.playerInventory): InventoryItem[] {
    const inventory = this.getInventory(inventoryId);
    return inventory ? Array.from(inventory.items.values()) : [];
  }

  // Check if an inventory has an item
  hasItem(itemId: string, inventoryId: string = this.playerInventory): boolean {
    const inventory = this.getInventory(inventoryId);
    return inventory ? inventory.items.has(itemId) : false;
  }

  // Get an item from an inventory
  getItem(itemId: string, inventoryId: string = this.playerInventory): InventoryItem | undefined {
    const inventory = this.getInventory(inventoryId);
    return inventory ? inventory.items.get(itemId) : undefined;
  }

  // Check if an inventory has enough space
  hasSpace(inventoryId: string = this.playerInventory): boolean {
    const inventory = this.getInventory(inventoryId);
    return inventory ? inventory.items.size < inventory.maxSlots : false;
  }

  // Check if an item can be added to an inventory
  canAddItem(item: InventoryItem, inventoryId: string = this.playerInventory): boolean {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) return false;

    // Check if the item is already in the inventory and stackable
    const existingItem = inventory.items.get(item.id);
    if (existingItem && existingItem.stackable) {
      // Check if adding this item would exceed the max stack size
      if (existingItem.maxStackSize && existingItem.quantity + item.quantity > existingItem.maxStackSize) {
        return false;
      }
      return true;
    }

    // Otherwise, check if there's space for a new item
    return inventory.items.size < inventory.maxSlots;
  }

  // Add an item to an inventory
  addItem(item: InventoryItem, inventoryId: string = this.playerInventory): boolean {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) return false;

    // Check if the item is already in the inventory and stackable
    const existingItem = inventory.items.get(item.id);
    if (existingItem && existingItem.stackable) {
      // Check if adding this item would exceed the max stack size
      if (existingItem.maxStackSize && existingItem.quantity + item.quantity > existingItem.maxStackSize) {
        return false;
      }

      // Update the quantity
      existingItem.quantity += item.quantity;
      return true;
    }

    // Otherwise, add the item as a new entry
    if (inventory.items.size < inventory.maxSlots) {
      inventory.items.set(item.id, { ...item });

      // Emit an event
      EventBus.emit("item-added", {
        itemId: item.id,
        inventoryId,
        item,
      });

      return true;
    }

    return false;
  }

  // Remove an item from an inventory
  removeItem(itemId: string, quantity = 1, inventoryId: string = this.playerInventory): boolean {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) return false;

    const item = inventory.items.get(itemId);
    if (!item) return false;

    if (item.quantity > quantity) {
      // Reduce the quantity
      item.quantity -= quantity;

      // Emit an event
      EventBus.emit("item-removed", {
        itemId,
        inventoryId,
        quantity,
      });

      return true;
    } else if (item.quantity === quantity) {
      // Remove the item entirely
      inventory.items.delete(itemId);

      // Emit an event
      EventBus.emit("item-removed", {
        itemId,
        inventoryId,
        quantity,
      });

      return true;
    }

    return false;
  }

  // Transfer an item between inventories
  transferItem(itemId: string, quantity: number, sourceInventoryId: string, targetInventoryId: string): boolean {
    // Check if the item exists in the source inventory
    const sourceInventory = this.getInventory(sourceInventoryId);
    if (!sourceInventory) return false;

    const item = sourceInventory.items.get(itemId);
    if (!item || item.quantity < quantity) return false;

    // Check if the target inventory has space
    const targetInventory = this.getInventory(targetInventoryId);
    if (!targetInventory) return false;

    // Create a copy of the item with the specified quantity
    const itemToTransfer: InventoryItem = {
      ...item,
      quantity,
    };

    // Try to add the item to the target inventory
    if (this.addItem(itemToTransfer, targetInventoryId)) {
      // Remove the item from the source inventory
      this.removeItem(itemId, quantity, sourceInventoryId);

      // Emit an event
      EventBus.emit("item-transferred", {
        itemId,
        quantity,
        sourceInventoryId,
        targetInventoryId,
      });

      return true;
    }

    return false;
  }

  // Use an item (reduce durability or quantity)
  useItem(itemId: string, inventoryId: string = this.playerInventory): boolean {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) return false;

    const item = inventory.items.get(itemId);
    if (!item) return false;

    // If the item has durability, reduce it
    if (item.durability !== undefined) {
      item.durability -= 1;

      // Check if the item is broken
      if (item.durability <= 0) {
        // Remove the item
        inventory.items.delete(itemId);

        // Emit an event
        EventBus.emit("item-broken", {
          itemId,
          inventoryId,
        });
      } else {
        // Emit an event
        EventBus.emit("item-used", {
          itemId,
          inventoryId,
          durability: item.durability,
        });
      }

      return true;
    }
    // Otherwise, reduce the quantity
    else if (item.quantity > 0) {
      item.quantity -= 1;

      // Check if the item is depleted
      if (item.quantity <= 0) {
        // Remove the item
        inventory.items.delete(itemId);
      }

      // Emit an event
      EventBus.emit("item-used", {
        itemId,
        inventoryId,
        quantity: item.quantity,
      });

      return true;
    }

    return false;
  }

  // Check if an inventory has enough of a specific item
  hasEnoughItems(itemId: string, quantity: number, inventoryId: string = this.playerInventory): boolean {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) return false;

    const item = inventory.items.get(itemId);
    return item ? item.quantity >= quantity : false;
  }

  // Get the total quantity of an item across all inventories
  getTotalItemQuantity(itemId: string): number {
    let total = 0;

    this.inventories.forEach(inventory => {
      const item = inventory.items.get(itemId);
      if (item) {
        total += item.quantity;
      }
    });

    return total;
  }

  // Get all items of a specific type
  getItemsByType(type: string, inventoryId: string = this.playerInventory): InventoryItem[] {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) return [];

    return Array.from(inventory.items.values()).filter(item => item.type === type);
  }

  // Get all items with a specific tag
  getItemsByTag(tag: string, inventoryId: string = this.playerInventory): InventoryItem[] {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) return [];

    return Array.from(inventory.items.values()).filter(item => item.tags?.includes(tag));
  }

  // Sort inventory items
  sortInventory(
    inventoryId: string = this.playerInventory,
    sortBy: "name" | "type" | "quantity" | "value" = "name",
  ): void {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) return;

    const items = Array.from(inventory.items.values());

    // Sort the items
    items.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "type":
          return a.type.localeCompare(b.type);
        case "quantity":
          return b.quantity - a.quantity;
        case "value":
          return (b.value || 0) - (a.value || 0);
        default:
          return 0;
      }
    });

    // Clear the inventory
    inventory.items.clear();

    // Add the sorted items back
    items.forEach(item => {
      inventory.items.set(item.id, item);
    });

    // Emit an event
    EventBus.emit("inventory-sorted", {
      inventoryId,
      sortBy,
    });
  }

  // Get the total value of all items in an inventory
  getTotalValue(inventoryId: string = this.playerInventory): number {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) return 0;

    let total = 0;

    inventory.items.forEach(item => {
      total += (item.value || 0) * item.quantity;
    });

    return total;
  }

  // Event handlers
  private handleItemHarvested(data: { resourceId: string; yield: string; quantity: number }): void {
    // Create an item based on the harvested resource
    const item: InventoryItem = {
      id: data.yield,
      name: this.formatItemName(data.yield),
      type: "resource",
      quantity: data.quantity,
      stackable: true,
      maxStackSize: 99,
      value: this.getResourceValue(data.yield),
    };

    // Add the item to the player's inventory
    if (this.addItem(item)) {
      EventBus.emit("show-message", `Added ${data.quantity} ${item.name} to inventory`);
    } else {
      EventBus.emit("show-message", `Inventory full! Could not add ${item.name}`);
    }
  }

  private handleItemUsed(data: { itemId: string }): void {
    this.useItem(data.itemId);
  }

  private handleItemDropped(data: { itemId: string; quantity: number }): void {
    // Remove the item from the player's inventory
    if (this.removeItem(data.itemId, data.quantity)) {
      const item = this.getItem(data.itemId);
      if (item) {
        EventBus.emit("show-message", `Dropped ${data.quantity} ${item.name}`);
      }
    }
  }

  private handleItemCrafted(data: { recipe: any; result: any }): void {
    // Remove recipe ingredients from inventory
    const allIngredientsAvailable = data.recipe.ingredients.every((ingredient: any) => {
      return this.hasEnoughItems(ingredient.id, ingredient.quantity);
    });

    if (allIngredientsAvailable) {
      // Remove ingredients
      data.recipe.ingredients.forEach((ingredient: any) => {
        this.removeItem(ingredient.id, ingredient.quantity);
      });

      // Add crafted item
      const craftedItem: InventoryItem = {
        ...data.result,
        quantity: data.result.quantity || 1,
      };

      if (this.addItem(craftedItem)) {
        EventBus.emit("show-message", `Crafted ${craftedItem.name}`);
      } else {
        EventBus.emit("show-message", `Inventory full! Could not add ${craftedItem.name}`);
      }
    }
  }

  private handleInventoryTransfer(data: {
    itemId: string;
    quantity: number;
    sourceId: string;
    targetId: string;
  }): void {
    this.transferItem(data.itemId, data.quantity, data.sourceId, data.targetId);
  }

  // Utility methods
  private formatItemName(id: string): string {
    return id
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  private getResourceValue(resourceType: string): number {
    // Define base values for different resource types
    const valueMap: { [key: string]: number } = {
      wood: 5,
      stone: 7,
      ore: 10,
      special_ore: 25,
      crop: 15,
      fish: 20,
    };

    return valueMap[resourceType] || 1;
  }
}
