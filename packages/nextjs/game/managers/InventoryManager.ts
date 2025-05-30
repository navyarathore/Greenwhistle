import { EventBus } from "../EventBus";
import { Item, MaterialCategory } from "../resources/Item";
import { ItemDroppedEvent, ItemHarvestedEvent, ItemUsedEvent } from "~~/game/EventTypes";

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
export const HOTBAR_SIZE = 5;

/**
 * Valid indices for the hotbar (0-4)
 * Using this type ensures that hotbar indices are always within the valid range
 */
export type HotbarIndex = 0 | 1 | 2 | 3 | 4;

export default class InventoryManager {
  private inventories: Map<string, Inventory> = new Map();
  // Assuming a 9x3 inventory grid (27 slots), the lower left 5 slots would be slots 18, 19, 20, 21, 22
  private hotbarSlots: number[] = [18, 19, 20, 21, 22]; // Lower left 5 slots of player inventory assigned to hotbar

  constructor() {
    this.createInventory(PLAYER_INVENTORY, "Player Inventory", PLAYER_INVENTORY_SIZE);
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

  toInventoryIndex(hotbarIndex: HotbarIndex): number {
    return this.hotbarSlots[hotbarIndex];
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
  removeItemFromSlot(slotIndex: number, quantity?: number, inventoryId: string = PLAYER_INVENTORY): boolean {
    const inventory = this.getInventory(inventoryId);
    if (!inventory || slotIndex < 0 || slotIndex >= inventory.maxSlots) return false;

    const slot = inventory.slots[slotIndex];
    if (slot.item === null || (quantity && slot.item.quantity < quantity)) return false;

    // Get the item for event emission
    const item = slot.item;

    // Reduce the quantity
    item.quantity -= quantity || item.quantity;

    // If quantity is now 0, clear the slot
    if (item.quantity <= 0) {
      slot.item = null;
    }

    // Emit events
    EventBus.emit("item-removed", {
      item: new Item(item.type, quantity),
      inventoryId,
      slotIndex,
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
    quantity?: number,
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

    if (!quantity) {
      quantity = fromSlot.item?.quantity || 0;
    }

    if (quantity <= 0) return false;

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
        item: new Item(itemToMove.type, quantity),
        inventoryId,
        fromSlotIndex,
        toSlotIndex,
      });

      EventBus.emit("inventory-updated", {
        inventoryId,
        action: "add",
        items: this.getItems(inventoryId),
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
        item: new Item(itemToMove.type, maxQuantityToMove),
        inventoryId,
        fromSlotIndex,
        toSlotIndex,
      });

      EventBus.emit("inventory-updated", {
        inventoryId,
        action: "add",
        items: this.getItems(inventoryId),
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

    EventBus.emit("inventory-updated", {
      inventoryId,
      action: "add",
      items: this.getItems(inventoryId),
    });

    return true;
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

  // HOTBAR METHODS

  /**
   * Get an item from the hotbar at the specified index
   * @param hotbarIndex The index in the hotbar (0-4)
   * @returns The item in the specified hotbar slot, or null if empty
   */
  getHotbarItem(hotbarIndex: HotbarIndex): Item | null {
    const inventory = this.getInventory(PLAYER_INVENTORY);
    if (!inventory) return null;

    const inventorySlotIndex = this.hotbarSlots[hotbarIndex];
    return inventory.slots[inventorySlotIndex].item;
  }

  /**
   * Set an item in the hotbar at the specified index
   * @param hotbarIndex The index in the hotbar (0-4)
   * @param item The item to place in the hotbar slot, or null to clear it
   * @returns True if successful, false otherwise
   */
  setHotbarItem(hotbarIndex: HotbarIndex, item: Item | null): boolean {
    const inventory = this.getInventory(PLAYER_INVENTORY);
    if (!inventory) return false;

    const inventorySlotIndex = this.hotbarSlots[hotbarIndex];
    inventory.slots[inventorySlotIndex].item = item;

    // Emit event to update the hotbar UI
    EventBus.emit("hotbar-item-changed", { slotIndex: hotbarIndex, item });

    return true;
  }

  /**
   * Move an item from the inventory to the hotbar
   * @param inventorySlotIndex The index in the inventory to move from
   * @param hotbarIndex The index in the hotbar to move to
   * @returns True if successful, false otherwise
   */
  moveItemToHotbar(inventorySlotIndex: number, hotbarIndex: HotbarIndex): boolean {
    const inventory = this.getInventory(PLAYER_INVENTORY);
    if (!inventory) return false;

    if (inventorySlotIndex < 0 || inventorySlotIndex >= inventory.slots.length) return false;

    const hotbarSlotIndex = this.hotbarSlots[hotbarIndex];
    this.moveItem(inventorySlotIndex, hotbarSlotIndex, undefined, PLAYER_INVENTORY);

    return true;
  }

  /**
   * Get all items currently in the hotbar
   * @returns An array of items in the hotbar (can contain null for empty slots)
   */
  getAllHotbarItems(): Array<Item | null> {
    const inventory = this.getInventory(PLAYER_INVENTORY);
    if (!inventory) return Array(HOTBAR_SIZE).fill(null);

    return this.hotbarSlots.map(slotIndex => inventory.slots[slotIndex].item);
  }

  public destroy(): void {
    // Clear all inventories
    this.inventories.clear();
  }
}
