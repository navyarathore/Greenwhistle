// src/game/systems/InventorySystem.ts
import { EventBus } from "../EventBus";
import { Item, ItemType } from "../resources/Item";
import { Game } from "../scenes/Game";

export interface InventoryItem {
  item: Item;
  quantity: number;
}

export interface Inventory {
  id: string;
  name: string;
  maxSlots: number;
  items: Map<number, InventoryItem>;
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
      items: new Map<number, InventoryItem>(),
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
  hasItem(itemId: number, inventoryId: string = this.playerInventory): boolean {
    const inventory = this.getInventory(inventoryId);
    return inventory ? inventory.items.has(itemId) : false;
  }

  // Get an item from an inventory
  getItem(itemId: number, inventoryId: string = this.playerInventory): InventoryItem | undefined {
    const inventory = this.getInventory(inventoryId);
    return inventory ? inventory.items.get(itemId) : undefined;
  }

  // Check if an inventory has enough space
  hasSpace(inventoryId: string = this.playerInventory): boolean {
    const inventory = this.getInventory(inventoryId);
    return inventory ? inventory.items.size < inventory.maxSlots : false;
  }

  // Check if an item can be added to an inventory
  canAddItem(item: Item, quantity: number, inventoryId: string = this.playerInventory): boolean {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) return false;

    // Check if the item is already in the inventory and stackable
    const existingInventoryItem = inventory.items.get(item.id);
    if (existingInventoryItem && item.stackable) {
      // Check if adding this item would exceed the max stack size
      if (existingInventoryItem.quantity + quantity > item.maxStackSize) {
        return false;
      }
      return true;
    }

    // Otherwise, check if there's space for a new item
    return inventory.items.size < inventory.maxSlots;
  }

  // Add an item to an inventory
  addItem(item: Item, quantity: number, inventoryId: string = this.playerInventory): boolean {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) return false;

    // Check if the item is already in the inventory and stackable
    const existingInventoryItem = inventory.items.get(item.id);
    if (existingInventoryItem && item.stackable) {
      // Check if adding this item would exceed the max stack size
      if (existingInventoryItem.quantity + quantity > item.maxStackSize) {
        return false;
      }

      // Update the quantity
      existingInventoryItem.quantity += quantity;
      return true;
    }

    // Otherwise, add the item as a new entry
    if (inventory.items.size < inventory.maxSlots) {
      const inventoryItem: InventoryItem = {
        item: item,
        quantity: quantity,
      };

      inventory.items.set(item.id, inventoryItem);

      // Emit an event
      EventBus.emit("item-added", {
        itemId: item.id,
        inventoryId,
        item: inventoryItem,
      });

      return true;
    }

    return false;
  }

  // Remove an item from an inventory
  removeItem(itemId: number, quantity = 1, inventoryId: string = this.playerInventory): boolean {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) return false;

    const inventoryItem = inventory.items.get(itemId);
    if (!inventoryItem) return false;

    if (inventoryItem.quantity > quantity) {
      // Reduce the quantity
      inventoryItem.quantity -= quantity;

      // Emit an event
      EventBus.emit("item-removed", {
        itemId,
        inventoryId,
        quantity,
      });

      return true;
    } else if (inventoryItem.quantity === quantity) {
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
  transferItem(itemId: number, quantity: number, sourceInventoryId: string, targetInventoryId: string): boolean {
    // Check if the item exists in the source inventory
    const sourceInventory = this.getInventory(sourceInventoryId);
    if (!sourceInventory) return false;

    const inventoryItem = sourceInventory.items.get(itemId);
    if (!inventoryItem || inventoryItem.quantity < quantity) return false;

    // Check if the target inventory has space
    const targetInventory = this.getInventory(targetInventoryId);
    if (!targetInventory) return false;

    // Try to add the item to the target inventory
    if (this.addItem(inventoryItem.item, quantity, targetInventoryId)) {
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

  // Use an item (reduce quantity)
  useItem(itemId: number, inventoryId: string = this.playerInventory): boolean {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) return false;

    const inventoryItem = inventory.items.get(itemId);
    if (!inventoryItem) return false;

    // Reduce the quantity
    if (inventoryItem.quantity > 0) {
      inventoryItem.quantity -= 1;

      // Check if the item is depleted
      if (inventoryItem.quantity <= 0) {
        // Remove the item
        inventory.items.delete(itemId);
      }

      // Emit an event
      EventBus.emit("item-used", {
        itemId,
        inventoryId,
        quantity: inventoryItem.quantity,
      });

      return true;
    }

    return false;
  }

  // Check if an inventory has enough of a specific item
  hasEnoughItems(itemId: number, quantity: number, inventoryId: string = this.playerInventory): boolean {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) return false;

    const inventoryItem = inventory.items.get(itemId);
    return inventoryItem ? inventoryItem.quantity >= quantity : false;
  }

  // Get the total quantity of an item across all inventories
  getTotalItemQuantity(itemId: number): number {
    let total = 0;

    this.inventories.forEach(inventory => {
      const inventoryItem = inventory.items.get(itemId);
      if (inventoryItem) {
        total += inventoryItem.quantity;
      }
    });

    return total;
  }

  // Get all items of a specific type
  getItemsByType(type: ItemType, inventoryId: string = this.playerInventory): InventoryItem[] {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) return [];

    return Array.from(inventory.items.values()).filter(inventoryItem => inventoryItem.item.type === type);
  }

  // Sort inventory items
  sortInventory(inventoryId: string = this.playerInventory, sortBy: "name" | "type" | "quantity" = "name"): void {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) return;

    const items = Array.from(inventory.items.values());

    // Sort the items
    items.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.item.name.localeCompare(b.item.name);
        case "type":
          return a.item.type.localeCompare(b.item.type);
        case "quantity":
          return b.quantity - a.quantity;
        default:
          return 0;
      }
    });

    // Clear the inventory
    inventory.items.clear();

    // Add the sorted items back
    items.forEach(inventoryItem => {
      inventory.items.set(inventoryItem.item.id, inventoryItem);
    });

    // Emit an event
    EventBus.emit("inventory-sorted", {
      inventoryId,
      sortBy,
    });
  }

  // Event handlers
  private handleItemHarvested(data: { resourceId: number; yield: number; quantity: number }): void {
    // This is a placeholder - you'll need to implement logic to create an Item
    // based on your game's data and resource system
    // TODO get item from item manager
    // Add the item to the player's inventory
    // if (this.addItem(item, data.quantity)) {
    //   EventBus.emit("show-message", `Added ${data.quantity} ${item.name} to inventory`);
    // } else {
    //   EventBus.emit("show-message", `Inventory full! Could not add ${item.name}`);
    // }
  }

  private handleItemUsed(data: { itemId: number }): void {
    this.useItem(data.itemId);
  }

  private handleItemDropped(data: { itemId: number; quantity: number }): void {
    // Remove the item from the player's inventory
    const inventoryItem = this.getItem(data.itemId);
    if (this.removeItem(data.itemId, data.quantity) && inventoryItem) {
      EventBus.emit("show-message", `Dropped ${data.quantity} ${inventoryItem.item.name}`);
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
      if (this.addItem(data.result.item, data.result.quantity || 1)) {
        EventBus.emit("show-message", `Crafted ${data.result.item.name}`);
      } else {
        EventBus.emit("show-message", `Inventory full! Could not add ${data.result.item.name}`);
      }
    }
  }

  private handleInventoryTransfer(data: {
    itemId: number;
    quantity: number;
    sourceId: string;
    targetId: string;
  }): void {
    this.transferItem(data.itemId, data.quantity, data.sourceId, data.targetId);
  }
}
