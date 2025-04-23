import { EventBus } from "../EventBus";
import { Item, MaterialCategory } from "../resources/Item";
import { Game } from "../scenes/Game";

export interface InventorySlot {
  item: Item | null;
}

export interface Inventory {
  id: string;
  name: string;
  maxSlots: number;
  slots: InventorySlot[];
}

export const PLAYER_INVENTORY = "player";
export const PLAYER_INVENTORY_SIZE = 27;

export default class InventoryManager {
  private inventories: Map<string, Inventory> = new Map();

  constructor(private game: Game) {
    this.createInventory(PLAYER_INVENTORY, "Player Inventory", PLAYER_INVENTORY_SIZE);

    // Listen for inventory-related events
    EventBus.on("item-harvested", this.handleItemHarvested.bind(this));
    EventBus.on("item-used", this.handleItemUsed.bind(this));
    EventBus.on("item-dropped", this.handleItemDropped.bind(this));
    EventBus.on("item-crafted", this.handleItemCrafted.bind(this));
    EventBus.on("inventory-transfer", this.handleInventoryTransfer.bind(this));
  }

  // Create a new inventory container
  createInventory(id: string, name: string, maxSlots: number): Inventory {
    // Initialize inventory with empty slots
    const slots: InventorySlot[] = Array(maxSlots)
      .fill(null)
      .map(() => ({
        item: null,
      }));

    const inventory: Inventory = {
      id,
      name,
      maxSlots,
      slots,
    };

    this.inventories.set(id, inventory);
    return inventory;
  }

  // Get an inventory by ID
  getInventory(id: string = PLAYER_INVENTORY): Inventory | undefined {
    return this.inventories.get(id);
  }

  // Get all items in an inventory
  getItems(inventoryId: string = PLAYER_INVENTORY): Array<Item | null> {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) return [];

    return inventory.slots.map(slot => slot.item);
  }

  getItemsNotNull(inventoryId: string = PLAYER_INVENTORY): Item[] {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) return [];

    return inventory.slots.filter(slot => slot.item !== null).map(slot => slot.item as Item);
  }

  // Find the slot index of an item by its ID
  findItemSlot(itemId: string, inventoryId: string = PLAYER_INVENTORY): number {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) return -1;

    return inventory.slots.findIndex(slot => slot.item && slot.item.id === itemId);
  }

  // Find all slot indices containing a specific item
  findAllItemSlots(itemId: string, inventoryId: string = PLAYER_INVENTORY): number[] {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) return [];

    return inventory.slots.reduce<number[]>((indices, slot, index) => {
      if (slot.item && slot.item.id === itemId) {
        indices.push(index);
      }
      return indices;
    }, []);
  }

  // Check if an inventory has an item
  hasItem(itemId: string, inventoryId: string = PLAYER_INVENTORY): boolean {
    return this.findItemSlot(itemId, inventoryId) !== -1;
  }

  // Get an item from an inventory
  getItem(itemId: string, inventoryId: string = PLAYER_INVENTORY): Item | undefined {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) return undefined;

    const slotIndex = this.findItemSlot(itemId, inventoryId);
    return slotIndex !== -1 ? inventory.slots[slotIndex].item || undefined : undefined;
  }

  // Find the first empty slot in an inventory
  findEmptySlot(inventoryId: string = PLAYER_INVENTORY): number {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) return -1;

    return inventory.slots.findIndex(slot => slot.item === null);
  }

  // Find all empty slots in an inventory
  findAllEmptySlots(inventoryId: string = PLAYER_INVENTORY): number[] {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) return [];

    return inventory.slots.reduce<number[]>((indices, slot, index) => {
      if (slot.item === null) {
        indices.push(index);
      }
      return indices;
    }, []);
  }

  // Check if an inventory has enough space
  hasSpace(inventoryId: string = PLAYER_INVENTORY): boolean {
    return this.findEmptySlot(inventoryId) !== -1;
  }

  // Check if an item can be added to a specific slot
  canAddItemToSlot(newItem: Item, slotIndex: number, inventoryId: string = PLAYER_INVENTORY): boolean {
    const inventory = this.getInventory(inventoryId);
    if (!inventory || slotIndex < 0 || slotIndex >= inventory.maxSlots) return false;

    const slot = inventory.slots[slotIndex];

    // If the slot is empty, we can add the item
    if (slot.item === null) return true;

    // If the slot has the same item and it's stackable
    if (slot.item.id === newItem.id && newItem.isStackable) {
      return slot.item.quantity + newItem.quantity <= newItem.maxStackSize;
    }

    return false;
  }

  // Check if an item can be added to any slot in the inventory
  canAddItem(item: Item, inventoryId: string = PLAYER_INVENTORY): boolean {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) return false;

    // Check if the item exists in the inventory and is stackable
    const existingSlotIndex = this.findItemSlot(item.id, inventoryId);
    if (existingSlotIndex !== -1 && item.isStackable) {
      return this.canAddItemToSlot(item, existingSlotIndex, inventoryId);
    }

    // Otherwise check for an empty slot
    return this.hasSpace(inventoryId);
  }

  // Add an item to a specific slot
  addItemToSlot(newItem: Item, slotIndex: number, inventoryId: string = PLAYER_INVENTORY): boolean {
    const inventory = this.getInventory(inventoryId);
    if (!inventory || !this.canAddItemToSlot(newItem, slotIndex, inventoryId)) return false;

    const slot = inventory.slots[slotIndex];

    // If the slot is empty, add the item
    if (slot.item === null) {
      // Create a copy of the item to avoid reference issues
      slot.item = newItem.clone();
    } else {
      // If the slot has the same item, increment quantity
      slot.item.quantity += newItem.quantity;
    }

    // Emit events
    EventBus.emit("item-added", {
      itemId: newItem.id,
      inventoryId,
      slotIndex,
      item: newItem,
    });

    // Emit a generic inventory update event
    EventBus.emit("inventory-updated", {
      inventoryId,
      action: "add",
      items: this.getItems(inventoryId),
    });

    return true;
  }

  // Add an item to the first available slot or stack it with existing items
  addItem(item: Item, inventoryId: string = PLAYER_INVENTORY): boolean {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) return false;

    // Make a clone of the item to avoid modifying the original
    const itemToAdd = item.clone();
    let remainingQuantity = itemToAdd.quantity;

    // Try to fill existing slots with the same item if stackable
    if (itemToAdd.isStackable) {
      // Get all slots containing this item
      const existingSlotIndices = this.findAllItemSlots(itemToAdd.id, inventoryId);

      // Try to fill each existing slot first
      for (const slotIndex of existingSlotIndices) {
        const slot = inventory.slots[slotIndex];

        if (slot.item) {
          // Calculate how much we can add to this slot
          const spaceInSlot = (itemToAdd.maxStackSize || Infinity) - slot.item.quantity;

          if (spaceInSlot > 0) {
            // Determine how much to add to this slot
            const quantityToAdd = Math.min(remainingQuantity, spaceInSlot);

            // Create a temporary item with just the amount we're adding to this slot
            const tempItem = itemToAdd.clone();
            tempItem.quantity = quantityToAdd;

            // Add to the slot
            if (this.addItemToSlot(tempItem, slotIndex, inventoryId)) {
              remainingQuantity -= quantityToAdd;

              // If we've added everything, we're done
              if (remainingQuantity <= 0) {
                return true;
              }
            }
          }
        }
      }
    }

    // If we still have remaining quantity, find empty slots
    if (remainingQuantity > 0) {
      // Get all empty slots
      const emptySlotIndices = this.findAllEmptySlots(inventoryId);

      for (const slotIndex of emptySlotIndices) {
        // Create a temporary item for what we're adding to this slot
        const tempItem = itemToAdd.clone();

        if (itemToAdd.isStackable && itemToAdd.maxStackSize) {
          // Add maximum stack size or remaining quantity, whichever is smaller
          tempItem.quantity = Math.min(remainingQuantity, itemToAdd.maxStackSize);
        } else {
          tempItem.quantity = remainingQuantity;
        }

        // Add to the slot
        if (this.addItemToSlot(tempItem, slotIndex, inventoryId)) {
          remainingQuantity -= tempItem.quantity;

          // If we've added everything, we're done
          if (remainingQuantity <= 0) {
            return true;
          }
        }
      }
    }

    // Return true if we added all items, false if we couldn't add everything
    return remainingQuantity <= 0;
  }

  addItems(items: Item[], inventoryId: string = PLAYER_INVENTORY): boolean {
    let allAdded = true;

    for (const item of items) {
      const added = this.addItem(item, inventoryId);
      if (!added) {
        allAdded = false;
        break;
      }
    }

    return allAdded;
  }

  // Remove a quantity of an item from a specific slot
  removeItemFromSlot(slotIndex: number, quantity: number, inventoryId: string = PLAYER_INVENTORY): boolean {
    const inventory = this.getInventory(inventoryId);
    if (!inventory || slotIndex < 0 || slotIndex >= inventory.maxSlots) return false;

    const slot = inventory.slots[slotIndex];
    if (slot.item === null || slot.item.quantity < quantity) return false;

    // Get the item for event emission
    const item = slot.item;

    // Reduce the quantity
    item.quantity -= quantity;

    // If quantity is now 0, clear the slot
    if (item.quantity <= 0) {
      slot.item = null;
    }

    // Create a copy of the item with the removed quantity for the event
    const removedItem = { ...item, quantity: quantity };

    // Emit events
    EventBus.emit("item-removed", {
      item: removedItem,
      inventoryId,
      slotIndex,
      quantity,
    });

    // Emit a generic inventory update event
    EventBus.emit("inventory-updated", {
      inventoryId,
      action: "remove",
      items: this.getItems(inventoryId),
    });

    return true;
  }

  // Remove an item from an inventory
  removeItem(item: Item, inventoryId: string = PLAYER_INVENTORY): boolean {
    const slotIndex = this.findItemSlot(item.id, inventoryId);
    if (slotIndex === -1) return false;

    return this.removeItemFromSlot(slotIndex, item.quantity, inventoryId);
  }

  removeItems(items: Item[], inventoryId: string = PLAYER_INVENTORY): boolean {
    let allRemoved = true;

    for (const item of items) {
      const removed = this.removeItem(item, inventoryId);
      if (!removed) {
        allRemoved = false;
        break;
      }
    }

    return allRemoved;
  }

  // Transfer an item between inventories
  transferItem(item: Item, sourceInventoryId: string, targetInventoryId: string, sourceSlotIndex?: number): boolean {
    // Get the source inventory and find the item
    const sourceInventory = this.getInventory(sourceInventoryId);
    if (!sourceInventory) return false;

    // If source slot is not provided, find it
    if (sourceSlotIndex === undefined) {
      sourceSlotIndex = this.findItemSlot(item.id, sourceInventoryId);
    }

    if (sourceSlotIndex === -1) return false;

    const sourceSlot = sourceInventory.slots[sourceSlotIndex];
    if (sourceSlot.item === null || sourceSlot.item.quantity < item.quantity) return false;

    // Check if the target inventory can receive the item
    if (!this.canAddItem(item, targetInventoryId)) return false;

    // Create a copy of the item with the transfer quantity
    const transferItem = item.clone();

    // Try to add the item to the target inventory
    if (this.addItem(transferItem, targetInventoryId)) {
      // Remove the item from the source inventory
      this.removeItemFromSlot(sourceSlotIndex, item.quantity, sourceInventoryId);

      // Emit an event
      EventBus.emit("item-transferred", {
        item: transferItem,
        sourceInventoryId,
        targetInventoryId,
        sourceSlotIndex,
      });

      // Emit inventory update events for both source and target inventories
      EventBus.emit("inventory-updated", {
        inventoryId: sourceInventoryId,
        action: "transfer-out",
        items: this.getItems(sourceInventoryId),
      });

      EventBus.emit("inventory-updated", {
        inventoryId: targetInventoryId,
        action: "transfer-in",
        items: this.getItems(targetInventoryId),
      });

      return true;
    }

    return false;
  }

  // Move an item within the same inventory from one slot to another
  moveItem(
    fromSlotIndex: number,
    toSlotIndex: number,
    quantity: number,
    inventoryId: string = PLAYER_INVENTORY,
  ): boolean {
    const inventory = this.getInventory(inventoryId);
    if (
      !inventory ||
      fromSlotIndex < 0 ||
      fromSlotIndex >= inventory.maxSlots ||
      toSlotIndex < 0 ||
      toSlotIndex >= inventory.maxSlots ||
      fromSlotIndex === toSlotIndex
    ) {
      return false;
    }

    const fromSlot = inventory.slots[fromSlotIndex];
    const toSlot = inventory.slots[toSlotIndex];

    // Source slot must have an item and enough quantity
    if (fromSlot.item === null || fromSlot.item.quantity < quantity) return false;

    // Get a copy of the item with the specified quantity
    const itemToMove = { ...fromSlot.item, quantity: quantity };

    // If target slot is empty, simply move the item
    if (toSlot.item === null) {
      // Create a new item in the target slot with the moved quantity
      // toSlot.item = { ...fromSlot.item, quantity: quantity };
      toSlot.item = fromSlot.item.clone();
      toSlot.item.quantity = quantity;

      // Update source slot's quantity
      fromSlot.item.quantity -= quantity;

      // If source slot quantity is now 0, clear the slot
      if (fromSlot.item.quantity <= 0) {
        fromSlot.item = null;
      }

      // Emit event
      EventBus.emit("item-moved", {
        item: itemToMove,
        inventoryId,
        fromSlotIndex,
        toSlotIndex,
        quantity,
      });

      return true;
    }

    // If target slot has the same item and it's stackable
    if (toSlot.item.id === fromSlot.item.id && fromSlot.item.isStackable) {
      // Make sure we don't exceed max stack size
      const maxQuantityToMove = Math.min(quantity, (fromSlot.item.maxStackSize || Infinity) - toSlot.item.quantity);

      if (maxQuantityToMove <= 0) return false;

      // Move the quantity
      toSlot.item.quantity += maxQuantityToMove;
      fromSlot.item.quantity -= maxQuantityToMove;

      // Clear source slot if empty
      if (fromSlot.item.quantity <= 0) {
        fromSlot.item = null;
      }

      // Emit event
      EventBus.emit("item-moved", {
        item: { ...itemToMove, quantity: maxQuantityToMove },
        inventoryId,
        fromSlotIndex,
        toSlotIndex,
        quantity: maxQuantityToMove,
      });

      return true;
    }

    // If target slot has a different item, swap them
    const tempItem = toSlot.item.clone();

    // Set the target slot with the source item and moved quantity
    toSlot.item = fromSlot.item.clone();
    toSlot.item.quantity = quantity;

    // Reduce source quantity
    fromSlot.item.quantity -= quantity;

    // If source slot is now empty, replace with target item
    if (fromSlot.item.quantity <= 0) {
      fromSlot.item = tempItem;
    } else {
      // If there's still items in source slot and we're swapping, we need to check if there's room
      // This is a complex scenario that would need special handling
      return false;
    }

    // Emit event
    EventBus.emit("item-swapped", {
      inventoryId,
      fromSlotIndex,
      toSlotIndex,
      fromItem: fromSlot.item,
      toItem: toSlot.item,
    });

    return true;
  }

  // Use an item (reduce quantity) in a specific slot
  useItemInSlot(slotIndex: number, inventoryId: string = PLAYER_INVENTORY): boolean {
    const inventory = this.getInventory(inventoryId);
    if (!inventory || slotIndex < 0 || slotIndex >= inventory.maxSlots) return false;

    const slot = inventory.slots[slotIndex];
    if (slot.item === null || slot.item.quantity <= 0) return false;

    // Get the item ID for the event
    const itemId = slot.item.id;

    // Reduce quantity by 1
    slot.item.quantity -= 1;

    // Track the new quantity for the event
    const newQuantity = slot.item.quantity;

    // If quantity is now 0, clear the slot
    if (slot.item.quantity <= 0) {
      slot.item = null;
    }

    // Emit events
    EventBus.emit("item-used", {
      itemId,
      inventoryId,
      slotIndex,
      quantity: newQuantity,
    });

    // Emit a generic inventory update event
    EventBus.emit("inventory-updated", {
      inventoryId,
      action: "use",
      items: this.getItems(inventoryId),
    });

    return true;
  }

  // Use an item by its ID
  useItem(itemId: string, inventoryId: string = PLAYER_INVENTORY): boolean {
    const slotIndex = this.findItemSlot(itemId, inventoryId);
    if (slotIndex === -1) return false;

    return this.useItemInSlot(slotIndex, inventoryId);
  }

  // Check if an inventory has enough of a specific item
  hasEnoughItems(itemId: string, quantity: number, inventoryId: string = PLAYER_INVENTORY): boolean {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) return false;

    // Sum up quantities from all slots with this item
    let totalQuantity = 0;
    for (const slot of inventory.slots) {
      if (slot.item && slot.item.id === itemId) {
        totalQuantity += slot.item.quantity;
        if (totalQuantity >= quantity) return true;
      }
    }

    return false;
  }

  // Get the total quantity of an item in an inventory
  getItemQuantity(itemId: string, inventoryId: string = PLAYER_INVENTORY): number {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) return 0;

    let totalQuantity = 0;
    for (const slot of inventory.slots) {
      if (slot.item && slot.item.id === itemId) {
        totalQuantity += slot.item.quantity;
      }
    }

    return totalQuantity;
  }

  // Get the total quantity of an item across all inventories
  getTotalItemQuantity(itemId: string): number {
    let total = 0;

    this.inventories.forEach(inventory => {
      total += this.getItemQuantity(itemId, inventory.id);
    });

    return total;
  }

  // Get all items of a specific type
  getItemsByType(category: MaterialCategory, inventoryId: string = PLAYER_INVENTORY): Item[] {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) return [];

    return inventory.slots
      .filter(slot => slot.item !== null && slot.item.category === category)
      .map(slot => slot.item as Item);
  }

  // Event handlers
  private handleItemHarvested(data: { resourceId: number; yield: number; quantity: number }): void {
    // This is a placeholder - you'll need to implement logic to create an Item
    // based on your game's data and resource system
    // TODO get item from item manager
    // Add the item to the player's inventory
    // const item = this.game.itemManager.getItemById(data.resourceId);
    // if (item && this.addItem(item, PLAYER_INVENTORY)) {
    //   EventBus.emit("show-message", `Added ${data.quantity} ${item.name} to inventory`);
    // } else {
    //   EventBus.emit("show-message", `Inventory full! Could not add item`);
    // }
  }

  private handleItemUsed(data: { itemId: string }): void {
    this.useItem(data.itemId);
  }

  private handleItemDropped(item: Item): void {
    // Remove the item from the player's inventory
    const inventoryItem = this.getItem(item.id);
    if (this.removeItem(item) && inventoryItem) {
      EventBus.emit("show-message", `Dropped ${item.quantity} ${inventoryItem.name}`);
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
        // Create a temporary item with the same ID and quantity
        const itemToRemove = { id: ingredient.id, quantity: ingredient.quantity } as Item;
        this.removeItem(itemToRemove);
      });

      // Add crafted item
      if (this.addItem(data.result.item)) {
        EventBus.emit("show-message", `Crafted ${data.result.item.name}`);
      } else {
        EventBus.emit("show-message", `Inventory full! Could not add ${data.result.item.name}`);
      }
    }
  }

  private handleInventoryTransfer(data: {
    item: Item;
    sourceId: string;
    targetId: string;
    sourceSlotIndex?: number;
  }): void {
    this.transferItem(data.item, data.sourceId, data.targetId, data.sourceSlotIndex);
  }
}
