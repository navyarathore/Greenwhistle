import { EventBus } from "../EventBus";
import SystemManager from "../SystemManager";
import { SPRITE_ID } from "../entities/Player";
import { Item, MaterialCategory } from "../resources/Item";
import Game, { COLLISION_LAYER } from "../scenes/Game";
import GridEngine, { Direction, Position } from "grid-engine";
import {
  EventMap,
  HotbarSelectionChangedEvent,
  ItemPlacedEvent,
  ItemUsedEvent,
  PlayerMovedEvent,
  ToolUsedEvent,
} from "~~/game/EventTypes";
import CombinedBlocks from "~~/game/resources/combined-blocks.json";
import InteractionData from "~~/game/resources/interactable.json";
import { LayerPosition } from "~~/game/types";
import { getMultipleTileRecursivelyAt, getTileRecursivelyAt } from "~~/game/utils/layer-utils";

export const InteractionType = {
  TOOL_USE: "tool-use",
  ITEM_USE: "item-use",
  PLACE_ITEM: "place-item",
  HARVEST: "harvest",
  PLANT: "plant",
  WATER: "water",
  PICKUP: "pickup",
  TALK: "talk",
} as const;

export type InteractionType = (typeof InteractionType)[keyof typeof InteractionType];

export interface InteractionResult {
  success: boolean;
  message?: string;
  consumeItem?: boolean;
  affectedPosition?: Position;
}

const DIRECTION_DELTA = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export interface ResourceInteraction {
  layer: string;
  id: number[];
  crackCount?: number; // Optional since some interactions might not have this
  method: string;
  result: Array<{
    id: string;
    amount: number;
  }>;
}

const COOLDOWN_DURATION = 500;

/**
 * InteractionManager handles all interactions between the player and the game world,
 * including tool use, item placement, harvesting, and NPC interactions.
 */
export default class InteractionManager {
  private sysManager: SystemManager = SystemManager.instance;
  private interactionZones: Map<string, Position & { width: number; height: number; type: InteractionType }> =
    new Map();
  private interactionVisuals: Map<string, Phaser.GameObjects.GameObject> = new Map();
  private interactionCooldowns: Map<string, number> = new Map();

  constructor(
    private game: Game,
    private gridEngine: GridEngine,
  ) {
    // this.setupEventListeners();
  }

  // /**
  //  * Set up event listeners for interaction events
  //  */
  // private setupEventListeners(): void {
  //   EventBus.on("tool-used", this.handleToolUse.bind(this));
  //   EventBus.on("item-used", this.handleItemUse.bind(this));
  //   EventBus.on("item-placed", this.handleItemPlacement.bind(this));
  //
  //   // New interaction events
  //   EventBus.on("player-moved", this.checkForNearbyInteractables.bind(this));
  //   EventBus.on("hotbar-selection-changed", this.updateToolInteractionPreview.bind(this));
  //
  //   // Register custom interaction zones
  //   this.game.events.on("update", this.updateInteractionEffects, this);
  // }

  /**
   * Get the position in front of the player based on facing direction
   */
  public getPositionInFrontOfPlayer(): Position {
    const playerPosition = this.gridEngine.getPosition(SPRITE_ID);
    const facingDirection = this.gridEngine.getFacingDirection(SPRITE_ID);

    return this.getPositionInDirection(playerPosition, facingDirection);
  }

  private getPositionInDirection(position: Position, direction: Direction): Position {
    let targetX = position.x;
    let targetY = position.y;

    switch (direction) {
      case Direction.UP:
        targetY--;
        break;
      case Direction.DOWN:
        targetY++;
        break;
      case Direction.LEFT:
        targetX--;
        break;
      case Direction.RIGHT:
        targetX++;
        break;
    }

    return { x: targetX, y: targetY };
  }

  private findObject(tile: Position & { index: number; layer: { name: string } }): Array<LayerPosition> {
    const combined: Map<number, string> = new Map(
      CombinedBlocks.filter(block => Object.keys(block).includes(String(tile.index)))
        .flatMap(block => Object.entries(block))
        .map(([key, value]) => [parseInt(key), value as string]),
    );
    // collision tiles
    for (const tileIds of [1, 2, 3, 51, 52, 53, 101, 102, 151]) {
      combined.set(tileIds - 1, COLLISION_LAYER);
    }
    const layers = new Set(combined.values());

    return this.checkTiles(tile.x, tile.y, tile.layer.name, layers, combined, new Set());
  }

  private checkTiles(
    x: number,
    y: number,
    layer: string,
    layers: Set<string>,
    combined: Map<number, string>,
    visited: Set<string>,
    positions: Array<LayerPosition> = [],
  ): Array<LayerPosition> {
    const key = `${x}:${y}`;
    if (visited.has(key)) return positions;

    visited.add(key);
    positions.push({ x, y, layer });

    const remLayers = [...layers];
    remLayers.splice(remLayers.indexOf(layer), 1);
    const allTiles = getMultipleTileRecursivelyAt({ x, y }, this.game.map, remLayers, false);
    positions.push(...allTiles.map(t => ({ x: t.x, y: t.y, layer: t.layer.name })));

    if (layer === COLLISION_LAYER && !allTiles.length) {
      return positions;
    }

    for (const [dx, dy] of DIRECTION_DELTA) {
      const nextX = x + dx;
      const nextY = y + dy;
      for (const l of layers) {
        const nextTile = getTileRecursivelyAt({ x: nextX, y: nextY }, this.game.map, l, false);
        if (nextTile && combined.get(nextTile.index) === l) {
          this.checkTiles(nextX, nextY, nextTile.layer.name, layers, combined, visited, positions);
        }
      }
    }

    return positions;
  }

  private processItemCollection(
    position: Position,
    interactionData: ResourceInteraction[],
    eventName: keyof EventMap = "item-picked-up",
  ): boolean {
    for (const res of interactionData) {
      const { layer, id, method, result, crackCount } = res;
      const tile = getTileRecursivelyAt(position, this.game.map, layer, false);

      if (tile && id.includes(tile.index)) {
        const toRemove = this.findObject(tile);

        // Handle crack effect for destructible objects
        if (crackCount) {
          if (tile.properties.crackCount) {
            tile.properties.crackCount--;
          } else {
            tile.properties.crackCount = crackCount;
          }

          if (tile.properties.crackCount !== 0) {
            toRemove.forEach(value => {
              const targetTile = this.game.map.getTileAt(value.x, value.y, undefined, value.layer);
              if (targetTile) {
                targetTile.properties.crackCount = tile.properties.crackCount;
                if (value.layer !== COLLISION_LAYER) {
                  this.createCrackEffect(targetTile);
                }
              }
            });
            return true;
          }
        }

        // Generate items to add based on the method
        const toAdd: Item[] = [];
        if (method === "random") {
          const randomResult = Phaser.Math.RND.pick(result);
          toAdd.push(new Item(this.sysManager.materialManager.getMaterial(randomResult.id)!, randomResult.amount));
        } else if (method === "direct") {
          toAdd.push(...result.map(res => new Item(this.sysManager.materialManager.getMaterial(res.id)!, res.amount)));
        }

        // Try to add items to inventory
        const added = this.sysManager.inventoryManager.addItems(toAdd);
        if (!added) return false;

        // Remove the objects from the map
        for (const { x, y, layer } of toRemove) {
          this.game.map.removeTileAt(x, y, true, true, layer);
        }

        // Emit the appropriate event
        EventBus.emit(eventName, {
          items: toAdd,
          position: position,
          layer,
          actualLayer: tile.layer.name,
        });
        return true;
      }
    }
    return false;
  }

  pickupItem(): void {
    const playerPosition = this.gridEngine.getPosition(SPRITE_ID);
    this.processItemCollection(playerPosition, InteractionData.pickup);
  }

  useHotbarItem(slotIndex: number, item: Item): void {
    if (this.gridEngine.isMoving(SPRITE_ID)) return;

    // Different behavior based on item type
    const playerPosition = this.gridEngine.getPosition(SPRITE_ID);
    const facingDirection = this.gridEngine.getFacingDirection(SPRITE_ID);
    const interactionId = `item_${item.id}_${playerPosition.x}_${playerPosition.y}`;

    if (this.isInteractionOnCooldown(interactionId)) return;
    this.setInteractionCooldown(interactionId);

    switch (item.type.category) {
      case MaterialCategory.TOOL:
        this.useToolItem(item, playerPosition, facingDirection);
        break;
      case MaterialCategory.CONSUMABLE:
        // this.useConsumableItem(item);
        break;
      case MaterialCategory.FURNITURE:
        // this.usePlaceableItem(item);
        break;
      default:
        console.log(`Item ${item.id} cannot be used directly`);
        break;
    }
  }

  private useToolItem(item: Item, playerPosition: Position, direction: Direction): void {
    // Get the position in front of the player
    const targetPosition = this.getPositionInDirection(playerPosition, direction);
    const animations = ["down", "left", "right", "up"];

    if (item.id === "axe") {
      const animationKey = `ori-axe-${direction}`;

      const player = this.game.player;
      player.disableMovement();
      player.anims.play(animationKey, true);

      player.once("animationcomplete", () => {
        this.game.time.delayedCall(200, () => {
          player.enableMovement();
          player.setTexture(SPRITE_ID, animations.indexOf(direction) * 3 + 1);
        });
      });

      this.game.time.delayedCall(150, () => {
        const processed =
          this.processItemCollection(playerPosition, InteractionData.tools.axe) ||
          this.processItemCollection(targetPosition, InteractionData.tools.axe);
      });
    }

    // If no specific interaction was triggered, emit a generic tool-used event
    EventBus.emit("tool-used", {
      toolId: item.id,
      position: playerPosition,
      targetPosition: targetPosition,
    });
  }

  //,
  // /**
  //  * Handle tool use (e.g., axe, pickaxe, hoe)
  //  */
  // private handleToolUse(event: ToolUsedEvent): void {
  //   const { toolId, targetPosition } = event;
  //
  //   // Check if this tool interaction is on cooldown
  //   const interactionId = `tool_${toolId}_${targetPosition.x}_${targetPosition.y}`;
  //   if (this.isInteractionOnCooldown(interactionId)) {
  //     // Show a "too soon" message
  //     this.showFloatingText(targetPosition, "Too soon!", 0xff0000);
  //     return;
  //   }
  //
  //   // Set interaction cooldown to prevent spam clicking
  //   this.setInteractionCooldown(interactionId);
  //
  //   // Create tool use animation/effect
  //   this.createToolUseEffect(toolId, targetPosition);
  //
  //   // Handle the specific tool action
  //   let result: InteractionResult = { success: false };
  //
  //   if (toolId.includes("axe")) {
  //     result = this.chopTree(targetPosition);
  //   } else if (toolId.includes("pickaxe")) {
  //     result = this.mineResource(targetPosition);
  //   } else if (toolId.includes("hoe")) {
  //     result = this.tillSoil(targetPosition);
  //   } else if (toolId.includes("shovel")) {
  //     result = this.digGround(targetPosition);
  //   } else if (toolId.includes("water")) {
  //     result = this.waterCrop(targetPosition);
  //   }
  //
  //   // Handle the result
  //   if (!result.success) {
  //     // Show success message
  //     this.showFloatingText(targetPosition, result.message || "Can't use that here", 0xff0000);
  //   }
  // }
  //
  // /**
  //  * Handle general item use
  //  */
  // private handleItemUse(event: ItemUsedEvent): void {
  //   const { item } = event;
  //   const targetPosition = this.getPositionInFrontOfPlayer();
  //
  //   // Check if this item interaction is on cooldown
  //   const interactionId = `item_${item.id}_${targetPosition.x}_${targetPosition.y}`;
  //   if (this.isInteractionOnCooldown(interactionId)) {
  //     this.showFloatingText(targetPosition, "Too soon!", 0xff0000);
  //     return;
  //   }
  //
  //   // Set interaction cooldown to prevent spam
  //   this.setInteractionCooldown(interactionId);
  //
  //   // Create use animation/effect
  //   this.createItemUseEffect(item, targetPosition);
  //
  //   // Handle the specific item action
  //   let result: InteractionResult;
  //
  //   // Check item category and handle accordingly
  //   switch (item.type.type) {
  //     case MaterialCategory.SEED:
  //       result = this.plantSeed(item, targetPosition);
  //       break;
  //     case MaterialCategory.CONSUMABLE:
  //       result = this.consumeFood(item);
  //       break;
  //     case MaterialCategory.FURNITURE:
  //       result = this.placeItem(item, targetPosition);
  //       break;
  //     default:
  //       console.log(`No specific interaction for item ${item.id}`);
  //       result = {
  //         success: false,
  //         message: `Can't use ${item.name} here`,
  //       };
  //       break;
  //   }
  //
  //   // Handle the result
  //   if (result.success) {
  //     // Show success message
  //     this.showFloatingText(targetPosition, result.message || "Success!", 0x00ff00);
  //
  //     // Consume the item if needed
  //     if (result.consumeItem) {
  //       this.consumeItem(item);
  //     }
  //   } else {
  //     // Show failure message
  //     this.showFloatingText(targetPosition, result.message || "Can't use that here", 0xff0000);
  //   }
  // }
  //
  // /**
  //  * Handle the placement of items in the world
  //  */
  // private handleItemPlacement(event: ItemPlacedEvent): void {
  //   const { item, position } = event;
  //
  //   const targetTile = this.game.map.getTileAt(position.x, position.y, false, 0);
  //
  //   if (!targetTile || targetTile.index === -1) {
  //     // Place the item at the specified position
  //     // This is a placeholder for actual placement logic
  //     console.log(`Placing ${item.id} at position (${position.x}, ${position.y})`);
  //
  //     // In a real implementation, you would:
  //     // 1. Update the tilemap with the appropriate tile
  //     // 2. Register the placed object in appropriate systems
  //     // 3. Update any relevant state
  //
  //     EventBus.emit("item-placed-success", {
  //       item,
  //       position,
  //     });
  //   } else {
  //     EventBus.emit("item-placed-failed", {
  //       item,
  //       position,
  //       reason: "Position is occupied",
  //     });
  //   }
  // }
  //
  // /**
  //  * Chop a tree at the specified position
  //  */
  // private chopTree(position: Position): InteractionResult {
  //   // Get the tile at the position
  //   const targetLayer = this.game.map.getLayer(0)?.name || "ground"; // Default to 'ground' if null
  //   const tile = this.game.map.getTileAt(position.x, position.y, false, targetLayer);
  //
  //   if (!tile || !this.isTreeTile(tile.index)) {
  //     return {
  //       success: false,
  //       message: "No tree to chop here",
  //     };
  //   }
  //
  //   // Your game logic for tree chopping
  //   // 1. Remove the tree tile
  //   // 2. Spawn drops
  //   // 3. Play effects
  //
  //   // Placeholder for actual implementation
  //   const treeItems = [
  //     { id: "branches", amount: 3 },
  //     { id: "wood", amount: 2 },
  //   ];
  //
  //   // Create item instances to add to inventory
  //   const materialManager = this.sysManager.materialManager;
  //   const itemsToAdd = treeItems
  //     .map(item => {
  //       const material = materialManager.getMaterial(item.id);
  //       return material ? new Item(material, item.amount) : null;
  //     })
  //     .filter(item => item !== null);
  //
  //   // Add items to inventory
  //   const addedSuccessfully = this.sysManager.inventoryManager.addItems(itemsToAdd);
  //
  //   if (addedSuccessfully) {
  //     // Remove the tree from the map
  //     this.game.map.removeTileAt(position.x, position.y, false, true, targetLayer);
  //
  //     // Emit event for sound/particles
  //     EventBus.emit("tree-chopped", {
  //       position,
  //       items: itemsToAdd,
  //     });
  //
  //     return {
  //       success: true,
  //       message: "You chopped down the tree",
  //       affectedPosition: position,
  //     };
  //   } else {
  //     return {
  //       success: false,
  //       message: "Your inventory is full",
  //     };
  //   }
  // }
  //
  // /**
  //  * Mine a resource at the specified position
  //  */
  // private mineResource(position: { x: number; y: number }): InteractionResult {
  //   // Get the tile at the position
  //   const targetLayer = this.game.map.getLayer(0)?.name || "ground"; // Default to 'ground' if null
  //   const tile = this.game.map.getTileAt(position.x, position.y, false, targetLayer);
  //
  //   if (!tile || !this.isResourceTile(tile.index)) {
  //     return {
  //       success: false,
  //       message: "No mineable resource here",
  //     };
  //   }
  //
  //   // Your game logic for resource mining
  //   // Similar to tree chopping but with ore/stone resources
  //
  //   // Placeholder for resource items based on tile type
  //   let resourceItems: Array<{ id: string; amount: number }> = [];
  //
  //   if (this.isOreTile(tile.index)) {
  //     resourceItems = [{ id: "iron_ore", amount: 1 }];
  //   } else if (this.isStoneTile(tile.index)) {
  //     resourceItems = [{ id: "rock", amount: 2 }];
  //   }
  //
  //   // Create and add items to inventory (similar to chopping)
  //   const materialManager = this.sysManager.materialManager;
  //   const itemsToAdd = resourceItems
  //     .map(item => {
  //       const material = materialManager.getMaterial(item.id);
  //       return material ? new Item(material, item.amount) : null;
  //     })
  //     .filter(item => item !== null) as Item[];
  //
  //   const addedSuccessfully = this.sysManager.inventoryManager.addItems(itemsToAdd);
  //
  //   if (addedSuccessfully) {
  //     // Remove the resource from the map
  //     this.game.map.removeTileAt(position.x, position.y, false, true, targetLayer);
  //
  //     // Emit event for sound/particles
  //     EventBus.emit("resource-mined", {
  //       position,
  //       items: itemsToAdd,
  //     });
  //
  //     return {
  //       success: true,
  //       message: "You mined the resource",
  //       affectedPosition: position,
  //     };
  //   } else {
  //     return {
  //       success: false,
  //       message: "Your inventory is full",
  //     };
  //   }
  // }
  //
  // /**
  //  * Till soil at the specified position
  //  */
  // private tillSoil(position: { x: number; y: number }): InteractionResult {
  //   // Check if the tile is tillable
  //   const targetLayer = this.game.map.getLayer(0)?.name || "ground"; // Default to 'ground' if null
  //   const tile = this.game.map.getTileAt(position.x, position.y, false, targetLayer);
  //
  //   if (!tile || !this.isTillableTile(tile.index)) {
  //     return {
  //       success: false,
  //       message: "Can't till this surface",
  //     };
  //   }
  //
  //   // Replace the regular ground tile with a tilled soil tile
  //   // You'll need to define the tilled soil tile index in your tileset
  //   const tilledSoilTileIndex = 123; // Replace with your actual tilled soil tile index
  //
  //   this.game.map.putTileAt(tilledSoilTileIndex, position.x, position.y, true, targetLayer);
  //
  //   // Register this tile as farmable
  //   this.sysManager.farmingManager.registerFarmableTile(position.x, position.y);
  //
  //   // Emit event for sound/visual effects
  //   EventBus.emit("soil-tilled", {
  //     position,
  //   });
  //
  //   return {
  //     success: true,
  //     message: "You tilled the soil",
  //     affectedPosition: position,
  //   };
  // }
  //
  // /**
  //  * Dig the ground at the specified position
  //  */
  // private digGround(position: { x: number; y: number }): InteractionResult {
  //   // Implementation depends on your game's digging mechanics
  //   // This could create holes, find buried items, etc.
  //
  //   return {
  //     success: true,
  //     message: "You dug the ground",
  //     affectedPosition: position,
  //   };
  // }
  //
  // /**
  //  * Plant a seed at the specified position
  //  */
  // private plantSeed(seed: Item, position: { x: number; y: number }): InteractionResult {
  //   // Check if the farmingManager exists and the tile is farmable
  //   if (!this.sysManager.farmingManager.isFarmableTile(position.x, position.y)) {
  //     return {
  //       success: false,
  //       message: "This soil isn't prepared for planting",
  //     };
  //   }
  //
  //   // Attempt to plant the seed
  //   const plantingResult = this.sysManager.farmingManager.plantSeed(seed, position.x, position.y);
  //
  //   if (plantingResult) {
  //     return {
  //       success: true,
  //       message: `You planted ${seed.name}`,
  //       consumeItem: true,
  //       affectedPosition: position,
  //     };
  //   } else {
  //     return {
  //       success: false,
  //       message: "Couldn't plant the seed here",
  //     };
  //   }
  // }
  //
  // /**
  //  * Water a crop at the specified position
  //  */
  // private waterCrop(position: { x: number; y: number }): InteractionResult {
  //   // Attempt to water the crop using farming manager
  //   const wateringResult = this.sysManager.farmingManager.waterCrop(position.x, position.y);
  //
  //   if (wateringResult) {
  //     // Emit event for sound/particles
  //     EventBus.emit("crop-watered", {
  //       position,
  //     });
  //
  //     return {
  //       success: true,
  //       message: "You watered the crop",
  //       affectedPosition: position,
  //     };
  //   } else {
  //     return {
  //       success: false,
  //       message: "No crop to water here",
  //     };
  //   }
  // }
  //
  // /**
  //  * Consume a food item for health or other effects
  //  */
  // private consumeFood(item: Item): InteractionResult {
  //   // Apply food effects (health, buffs, etc.)
  //   // For this example, we'll just add health
  //
  //   // Get health restore value from item properties or use default value
  //   const healthRestored = item.type["healthRestored"] || 1;
  //
  //   // Update player health
  //   this.game.player.health = Math.min(this.game.player.health + healthRestored, this.game.player.maxHealth);
  //
  //   // Emit event for UI/sound
  //   EventBus.emit("food-consumed", {
  //     item,
  //     healthRestored,
  //   });
  //
  //   return {
  //     success: true,
  //     message: `You ate ${item.name} and restored ${healthRestored} health`,
  //     consumeItem: true,
  //   };
  // }
  //
  // /**
  //  * Place an item in the world
  //  */
  // private placeItem(item: Item, position: { x: number; y: number }): InteractionResult {
  //   // Check if the position is valid for placement
  //   const targetLayer = this.game.map.getLayer(0)?.name || "ground"; // Default to 'ground' if null
  //   const tile = this.game.map.getTileAt(position.x, position.y, false, targetLayer);
  //
  //   if (tile && tile.index !== -1) {
  //     return {
  //       success: false,
  //       message: "Can't place item here",
  //     };
  //   }
  //
  //   // For placeable items, we need to get the corresponding tile index
  //   // This could come from item properties or a mapping
  //   const placeableTileIndex = this.getPlaceableTileIndex(item.id);
  //
  //   if (placeableTileIndex === -1) {
  //     return {
  //       success: false,
  //       message: `${item.name} can't be placed in the world`,
  //     };
  //   }
  //
  //   // Place the item in the world
  //   this.game.map.putTileAt(placeableTileIndex, position.x, position.y, true, targetLayer);
  //
  //   // For special placeables like chests, you might want to register them in other systems
  //   if (item.id.includes("chest")) {
  //     // Register a new inventory for this chest
  //     const chestId = `chest_${position.x}_${position.y}`;
  //     this.sysManager.inventoryManager.createInventory(chestId, "Chest", 9);
  //   }
  //
  //   // Emit event
  //   EventBus.emit("item-placed-success", {
  //     item: item,
  //     position,
  //   });
  //
  //   return {
  //     success: true,
  //     message: `You placed ${item.name}`,
  //     consumeItem: true,
  //     affectedPosition: position,
  //   };
  // }
  //
  // /**
  //  * Helper method to get placeable tile index from item ID
  //  */
  // private getPlaceableTileIndex(itemId: string): number {
  //   // This would map item IDs to tile indices in your tileset
  //   // In a real implementation, this could come from a config or database
  //   const placeableMap: Record<string, number> = {
  //     wooden_chest: 150,
  //     workbench: 151,
  //     anvil: 152,
  //     furnace: 153,
  //     bed: 154,
  //   };
  //
  //   return placeableMap[itemId] || -1;
  // }
  //
  // /**
  //  * Check if a tile is a tree
  //  */
  // private isTreeTile(tileIndex: number): boolean {
  //   // This should contain all tree tile indices
  //   const treeTileIndices = [10, 11, 12, 13, 14]; // Replace with actual tree tile indices
  //   return treeTileIndices.includes(tileIndex);
  // }
  //
  // /**
  //  * Check if a tile is a resource (ore/stone)
  //  */
  // private isResourceTile(tileIndex: number): boolean {
  //   return this.isOreTile(tileIndex) || this.isStoneTile(tileIndex);
  // }
  //
  // /**
  //  * Check if a tile is an ore
  //  */
  // private isOreTile(tileIndex: number): boolean {
  //   const oreTileIndices = [20, 21, 22]; // Replace with actual ore tile indices
  //   return oreTileIndices.includes(tileIndex);
  // }
  //
  // /**
  //  * Check if a tile is stone
  //  */
  // private isStoneTile(tileIndex: number): boolean {
  //   const stoneTileIndices = [30, 31, 32]; // Replace with actual stone tile indices
  //   return stoneTileIndices.includes(tileIndex);
  // }
  //
  // /**
  //  * Check if a tile is tillable soil
  //  */
  // private isTillableTile(tileIndex: number): boolean {
  //   const tillableTileIndices = [40, 41, 42]; // Replace with actual soil tile indices
  //   return tillableTileIndices.includes(tileIndex);
  // }
  //
  // /**
  //  * Update method to be called every frame
  //  */
  public update(time: number, delta: number): void {
    // Handle any ongoing interactions or animations here
    // This method is intentionally left mostly empty as most interactions
    // are event-driven rather than requiring continuous updates
  }
  //
  // /**
  //  * Check for nearby interactable objects when the player moves
  //  * This highlights interactive objects and tiles around the player
  //  */
  // private checkForNearbyInteractables(event: PlayerMovedEvent): void {
  //   const { position } = event;
  //   // Clear previous highlights
  //   this.clearInteractionHighlights();
  //
  //   // Get a 3x3 area around the player to check for interactable objects
  //   const range = 1;
  //   for (let y = position.y - range; y <= position.y + range; y++) {
  //     for (let x = position.x - range; x <= position.x + range; x++) {
  //       this.checkTileForInteractions({ x, y });
  //     }
  //   }
  // }
  //
  // /**
  //  * Check if a specific tile has any interactive properties and highlight it if needed
  //  */
  // private checkTileForInteractions(position: Position): void {
  //   const groundLayer = this.game.map.getLayer(0)?.name || "ground";
  //   const objectLayer = this.game.map.getLayer(1)?.name || "objects";
  //
  //   // Check ground layer for interactable tiles (tillable soil, etc.)
  //   const groundTile = this.game.map.getTileAt(position.x, position.y, false, groundLayer);
  //   if (groundTile && this.isTillableTile(groundTile.index)) {
  //     this.highlightInteractableTile(position, InteractionType.PLANT);
  //   }
  //
  //   // Check object layer for interactable objects (trees, rocks, etc.)
  //   const objectTile = this.game.map.getTileAt(position.x, position.y, false, objectLayer);
  //   if (objectTile) {
  //     if (this.isTreeTile(objectTile.index)) {
  //       this.highlightInteractableTile(position, InteractionType.TOOL_USE);
  //     } else if (this.isResourceTile(objectTile.index)) {
  //       this.highlightInteractableTile(position, InteractionType.TOOL_USE);
  //     }
  //   }
  //
  //   // Check for registered interaction zones
  //   this.interactionZones.forEach((zone, id) => {
  //     if (
  //       position.x >= zone.x &&
  //       position.x < zone.x + zone.width &&
  //       position.y >= zone.y &&
  //       position.y < zone.y + zone.height
  //     ) {
  //       this.highlightInteractableTile(position, zone.type);
  //     }
  //   });
  // }
  //
  // /**
  //  * Highlight a tile to indicate it can be interacted with
  //  */
  // private highlightInteractableTile(position: { x: number; y: number }, type: InteractionType): void {
  //   // Create a highlight effect based on interaction type
  //   let tint = 0xffffff; // Default white
  //
  //   switch (type) {
  //     case InteractionType.TOOL_USE:
  //       tint = 0xffaa00; // Orange for tool use
  //       break;
  //     case InteractionType.PLANT:
  //       tint = 0x00ff00; // Green for planting
  //       break;
  //     case InteractionType.HARVEST:
  //       tint = 0xffff00; // Yellow for harvesting
  //       break;
  //     case InteractionType.TALK:
  //       tint = 0x00ffff; // Cyan for talking
  //       break;
  //   }
  //
  //   // Create a rectangle highlight
  //   const worldX = position.x * 32 + 16; // Convert tile to world coordinates
  //   const worldY = position.y * 32 + 16; // Assuming 32x32 tiles
  //
  //   const highlight = this.game.add
  //     .rectangle(worldX, worldY, 32, 32, tint, 0.3)
  //     .setDepth(100)
  //     .setOrigin(0.5, 0.5)
  //     .setStrokeStyle(2, tint);
  //
  //   // Add subtle animation to the highlight
  //   this.game.tweens.add({
  //     targets: highlight,
  //     alpha: 0.1,
  //     duration: 800,
  //     yoyo: true,
  //     repeat: -1,
  //   });
  //
  //   // Store the highlight for later removal
  //   const highlightId = `highlight_${position.x}_${position.y}`;
  //   this.interactionVisuals.set(highlightId, highlight);
  // }
  //
  // /**
  //  * Clear all interaction highlights
  //  */
  // private clearInteractionHighlights(): void {
  //   this.interactionVisuals.forEach(visual => {
  //     visual.destroy();
  //   });
  //   this.interactionVisuals.clear();
  // }
  //
  // /**
  //  * Update the interaction preview based on the currently selected tool
  //  */
  // private updateToolInteractionPreview(event: HotbarSelectionChangedEvent): void {
  //   // Clear previous previews
  //   this.clearInteractionHighlights();
  //
  //   // Get the currently selected item
  //   const selectedItem = this.sysManager.inventoryManager.getHotbarItem(event.slotIndex);
  //   if (!selectedItem) return;
  //
  //   // If it's a tool, show what it can interact with
  //   if (selectedItem.type.type === MaterialCategory.TOOL) {
  //     const position = this.getPositionInFrontOfPlayer();
  //
  //     if (selectedItem.id.includes("axe")) {
  //       // Highlight trees in front of player
  //       const groundLayer = this.game.map.getLayer(0)?.name || "ground";
  //       const objectLayer = this.game.map.getLayer(1)?.name || "objects";
  //       const objectTile = this.game.map.getTileAt(position.x, position.y, false, objectLayer);
  //
  //       if (objectTile && this.isTreeTile(objectTile.index)) {
  //         this.highlightInteractableTile(position, InteractionType.TOOL_USE);
  //       }
  //     } else if (selectedItem.id.includes("hoe")) {
  //       // Highlight tillable soil
  //       const groundLayer = this.game.map.getLayer(0)?.name || "ground";
  //       const tile = this.game.map.getTileAt(position.x, position.y, false, groundLayer);
  //
  //       if (tile && this.isTillableTile(tile.index)) {
  //         this.highlightInteractableTile(position, InteractionType.PLANT);
  //       }
  //     }
  //   }
  // }
  //
  //
  // /**
  //  * Register an interaction zone in the game world
  //  * Use this to create areas that the player can interact with
  //  */
  // public registerInteractionZone(id: string, x: number, y: number, width = 1, height = 1, type: InteractionType): void {
  //   this.interactionZones.set(id, { x, y, width, height, type });
  // }
  //
  // /**
  //  * Remove an interaction zone
  //  */
  // public removeInteractionZone(id: string): void {
  //   this.interactionZones.delete(id);
  // }
  //
  /**
   * Check if an interaction is currently on cooldown
   */
  private isInteractionOnCooldown(interactionId: string): boolean {
    const time = this.interactionCooldowns.get(interactionId);
    if (time && this.game.time.now >= time) {
      this.interactionCooldowns.delete(interactionId);
      return false;
    }

    return time !== undefined;
  }

  /**
   * Set a cooldown for an interaction to prevent spam
   */
  private setInteractionCooldown(interactionId: string): void {
    this.interactionCooldowns.set(interactionId, this.game.time.now + COOLDOWN_DURATION);
  }

  // /**
  //  * Create a floating text message above a position
  //  * @param position The position to show the text at
  //  * @param message The message to display
  //  * @param color The color of the text (hexadecimal)
  //  */
  // private showFloatingText(position: { x: number; y: number }, message: string, color = 0xffffff): void {
  //   // Convert tile position to world coordinates
  //   const worldX = position.x * 32 + 16; // Assuming 32x32 tiles
  //   const worldY = position.y * 32;
  //
  //   // Create the text object
  //   const text = this.game.add
  //     .text(worldX, worldY, message, {
  //       fontSize: "16px",
  //       color: `#${color.toString(16).padStart(6, "0")}`,
  //       stroke: "#000000",
  //       strokeThickness: 3,
  //       fontStyle: "bold",
  //     })
  //     .setOrigin(0.5, 1)
  //     .setDepth(1000);
  //
  //   // Animate the text floating upward and fading out
  //   this.game.tweens.add({
  //     targets: text,
  //     y: worldY - 40,
  //     alpha: 0,
  //     duration: 1500,
  //     ease: "Power2",
  //     onComplete: () => {
  //       text.destroy();
  //     },
  //   });
  // }
  //

  private createCrackEffect(targetTile: Phaser.Tilemaps.Tile): void {
    const originalX = targetTile.pixelX;

    // Create a shake animation
    this.game.tweens.add({
      targets: targetTile,
      pixelX: originalX + 2,
      yoyo: true,
      repeat: 3,
      duration: 50,
      ease: "Sine.easeInOut",
      onComplete: () => {
        // Reset position when done
        targetTile.pixelX = originalX;
      },
    });

    // Create a few particles for visual feedback
    this.createSimpleParticles(
      targetTile.getCenterX(this.game.camera),
      targetTile.getCenterY(this.game.camera),
      0x8b4513, // Brown dust color
      5,
    );
  }

  /**
   * Create visual effects for tool use
   * @param toolId The ID of the tool being used
   * @param position The position where the tool is used
   */
  private createToolUseEffect(toolId: string, position: Position): void {
    // Convert tile position to world coordinates
    const worldX = position.x * 32 + 16;
    const worldY = position.y * 32 + 16;

    // Create visual effect based on tool type
    if (toolId.includes("axe")) {
      // Axe swing effect with bronze color
      this.createSwingEffect(worldX, worldY, 0xcd7f32);
    } else if (toolId.includes("pickaxe")) {
      // Pickaxe effect with sparkles
      this.createSwingEffect(worldX, worldY, 0xc0c0c0);
      this.createSimpleParticles(worldX, worldY, 0xffff00, 10);
    } else if (toolId.includes("hoe")) {
      // Hoe effect with soil particles
      this.createSwingEffect(worldX, worldY, 0x8b4513);
      this.createSimpleParticles(worldX, worldY, 0x8b4513, 8);
    } else if (toolId.includes("water")) {
      // Water can effect with water droplets
      this.createSimpleParticles(worldX, worldY, 0x0000ff, 15);
    }

    // Play sound effect
    // this.game.sound.play(toolId + '_use');
  }

  /**
   * Create visual effects for item use
   * @param item The item being used
   * @param position The position where the item is used
   */
  private createItemUseEffect(item: Item, position: { x: number; y: number }): void {
    // Convert tile position to world coordinates
    const worldX = position.x * 32 + 16;
    const worldY = position.y * 32 + 16;

    // Create different effects based on item type
    switch (item.type.type) {
      case MaterialCategory.SEED:
        // Seed planting effect (green particles)
        this.createParticleEffect(worldX, worldY, 0x00ff00, 5);
        break;
      case MaterialCategory.CONSUMABLE:
        // Food consumption effect (hearts or stars)
        this.createHeartEffect(worldX, worldY - 16);
        break;
      case MaterialCategory.FURNITURE:
        // Furniture placement effect (dust/construction particles)
        this.createParticleEffect(worldX, worldY, 0xcdcdcd, 8);
        break;
      default:
        // Generic item use effect
        this.createParticleEffect(worldX, worldY, 0xffffff, 3);
        break;
    }

    // Play sound effect based on item type
    // this.game.sound.play(item.type.type + '_use');
  }

  /**
   * Create a heart effect for healing/eating
   */
  private createHeartEffect(x: number, y: number): void {
    // Create a heart shape/image
    const heart = this.game.add.text(x, y, "❤", {
      fontSize: "24px",
      color: "#FF0000",
    });
    heart.setOrigin(0.5, 0.5);
    heart.setDepth(1000);

    // Animate the heart floating up
    this.game.tweens.add({
      targets: heart,
      y: y - 30,
      alpha: 0,
      scale: 1.5,
      duration: 800,
      onComplete: () => {
        heart.destroy();
      },
    });
  }

  /**
   * Consume an item (reduce quantity by 1)
   * @param item The item to consume
   */
  private consumeItem(item: Item): void {
    // Get the player's selected hotbar slot
    const selectedSlot = this.game.player.selectedHotbarSlot;
    const inventorySystem = this.sysManager.inventoryManager;

    // Decrement the item quantity
    item.quantity--;

    // If this was the last one, remove it from the slot
    if (item.quantity <= 0) {
      inventorySystem.setHotbarItem(selectedSlot, null);
    } else {
      // Update the UI
      EventBus.emit("hotbar-item-changed", {
        slotIndex: selectedSlot,
        item: item,
      });
    }

    // Notify that inventory was updated
    EventBus.emit("inventory-updated", {
      inventoryId: "player",
      action: "update",
      items: inventorySystem.getItems(),
    });
  }

  /**
   * Create a swing effect for tools
   */
  private createSwingEffect(x: number, y: number, color: number): void {
    // Create an arc shape that animates in a swing motion
    const arc = this.game.add.graphics();
    arc.lineStyle(3, color, 1);
    arc.beginPath();
    arc.arc(x, y, 20, 0, Math.PI, false);
    arc.strokePath();
    arc.setDepth(990);

    // Animate the arc
    this.game.tweens.add({
      targets: arc,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        arc.destroy();
      },
    });
  }

  /**
   * Create simple particle effects
   */
  private createSimpleParticles(x: number, y: number, color: number, count: number): void {
    // Create simple particle visuals instead of using the particle system
    for (let i = 0; i < count; i++) {
      // Create a small circle for each particle
      const particle = this.game.add.circle(x, y, 2, color, 0.8);
      particle.setDepth(990);

      // Randomize the direction and speed
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 30;
      const velocityX = Math.cos(angle) * speed;
      const velocityY = Math.sin(angle) * speed;

      // Animate the particle
      this.game.tweens.add({
        targets: particle,
        x: x + velocityX,
        y: y + velocityY,
        alpha: 0,
        scale: 0,
        duration: 400 + Math.random() * 200,
        onComplete: () => {
          particle.destroy();
        },
      });
    }
  }

  /**
   * Alias for createSimpleParticles for backwards compatibility
   */
  private createParticleEffect(x: number, y: number, color: number, count: number): void {
    this.createSimpleParticles(x, y, color, count);
  }
}
