import SystemManager from "./SystemManager";
import Player from "./entities/Player";
import { HotbarIndex } from "./managers/InventoryManager";
import { Item } from "./resources/Item";
import { Direction, Position } from "grid-engine";
import { Recipe } from "~~/game/managers/CraftingManager";
import { PlantedCrop } from "~~/game/managers/FarmingManager";

/**
 * Types for all events used in the Greenwhistle game
 */

// System events
export interface SystemsReadyEvent {
  systemManager: SystemManager;
}

export interface SystemUpdateEvent {
  time: number;
  delta: number;
}

// Scene events
export interface CurrentSceneReadyEvent {
  scene: Phaser.Scene;
}

// Player events
export interface PlayerCreatedEvent {
  player: Player;
}

export interface PlayerMovementStartedEvent {
  position: Position;
  direction: Direction;
}

export interface PlayerMovedEvent {
  position: Position;
  direction: Direction;
}

export interface CheckPositionInteractionsEvent {
  position: Position;
  direction?: Direction;
}

export interface PlayerHealthChangedEvent {
  health: number;
}

// Interaction events
export interface ToolUsedEvent {
  toolId: string;
  position: Position;
  targetPosition: Position;
}

export interface ItemUsedEvent {
  item: Item;
  inventoryId: string;
  slotIndex: number;
}

export interface ItemPlacedEvent {
  item: Item;
  position: Position;
}

export interface ItemPlacedSuccessEvent {
  item: Item;
  position: Position;
}

export interface ItemPlacedFailedEvent {
  item: Item;
  position: Position;
  reason: string;
}

export interface TreeChoppedEvent {
  position: Position;
  items: Item[];
}

export interface ResourceMinedEvent {
  position: Position;
  items: Item[];
}

export interface SoilTilledEvent {
  position: Position;
}

export interface CropHarvestedEvent {
  position: Position;
  cropId: string;
}

export interface FoodConsumedEvent {
  item: Item;
  healthRestored: number;
}

// Inventory events
export interface HotbarSelectionChangedEvent {
  slotIndex: HotbarIndex;
}

export interface HotbarItemChangedEvent {
  slotIndex: HotbarIndex;
  item: Item | null;
}

export interface HotbarItemSelectedEvent {
  slotIndex: HotbarIndex;
  item: Item | null;
}

export interface InventoryUpdatedEvent {
  inventoryId: string;
  action: string;
  items: Array<Item | null>;
}

export interface ItemHarvestedEvent {
  item: Item;
}

export interface ItemDroppedEvent {
  item: Item;
  slotIndex: number;
}

export interface ItemPickedUpEvent {
  items: Item[];
  position: Position;
  layer: string;
  actualLayer: string;
}

export interface InventoryTransferEvent {
  sourceInventoryId: string;
  targetInventoryId: string;
  itemIndex: number;
  quantity: number;
}

export interface ItemAddedEvent {
  inventoryId: string;
  slotIndex: number;
  item: Item;
}

export interface ItemRemovedEvent {
  item: Item;
  inventoryId: string;
  slotIndex: number;
}

export interface ItemTransferredEvent {
  item: Item;
  sourceInventoryId: string;
  targetInventoryId: string;
  sourceSlotIndex: number;
}

export interface ItemMovedEvent {
  item: Item;
  inventoryId: string;
  fromSlotIndex: number;
  toSlotIndex: number;
}

export interface ItemSwappedEvent {
  inventoryId: string;
  fromSlotIndex: number;
  toSlotIndex: number;
  fromItem: Item;
  toItem: Item;
}

// Farming events
export interface CropPlantedEvent {
  position: Position;
  crop: PlantedCrop;
}

export interface CropWateredEvent {
  crop: PlantedCrop;
}

export interface CropGrownEvent {
  crop: PlantedCrop;
}

// Crafting events
export interface CraftItemEvent {
  result: Item;
  recipe: Recipe;
}

// Event type mapping
export interface EventMap {
  "systems-ready": SystemsReadyEvent;
  "system-update": SystemUpdateEvent;
  "current-scene-ready": CurrentSceneReadyEvent;
  "player-created": PlayerCreatedEvent;
  "player-movement-started": PlayerMovementStartedEvent;
  "player-moved": PlayerMovedEvent;
  "check-position-interactions": CheckPositionInteractionsEvent;
  "player-health-changed": PlayerHealthChangedEvent;
  "tool-used": ToolUsedEvent;
  "item-used": ItemUsedEvent;
  "item-placed": ItemPlacedEvent;
  "item-placed-success": ItemPlacedSuccessEvent;
  "item-placed-failed": ItemPlacedFailedEvent;
  "tree-chopped": TreeChoppedEvent;
  "resource-mined": ResourceMinedEvent;
  "soil-tilled": SoilTilledEvent;
  "crop-watered": CropWateredEvent;
  "crop-harvested": CropHarvestedEvent;
  "crop-grown": CropGrownEvent;
  "food-consumed": FoodConsumedEvent;
  "hotbar-selection-changed": HotbarSelectionChangedEvent;
  "hotbar-item-changed": HotbarItemChangedEvent;
  "hotbar-item-selected": HotbarItemSelectedEvent;
  "inventory-updated": InventoryUpdatedEvent;
  "item-harvested": ItemHarvestedEvent;
  "item-dropped": ItemDroppedEvent;
  "item-picked-up": ItemPickedUpEvent;
  "inventory-transfer": InventoryTransferEvent;
  "crop-planted": CropPlantedEvent;
  "craft-item": CraftItemEvent;
  "item-added": ItemAddedEvent;
  "item-removed": ItemRemovedEvent;
  "item-transferred": ItemTransferredEvent;
  "item-moved": ItemMovedEvent;
  "item-swapped": ItemSwappedEvent;
}
