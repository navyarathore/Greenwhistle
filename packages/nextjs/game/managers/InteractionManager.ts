import { EventBus } from "../EventBus";
import SystemManager from "../SystemManager";
import { SPRITE_ID } from "../entities/Player";
import { Item, MaterialCategory } from "../resources/Item";
import Game from "../scenes/Game";
import GridEngine, { Direction, Position } from "grid-engine";
import { EventMap } from "~~/game/EventTypes";
import { HotbarIndex } from "~~/game/managers/InventoryManager";
import CombinedBlocks from "~~/game/resources/combined-blocks.json";
import InteractionData from "~~/game/resources/interactable.json";
import { LayerPosition } from "~~/game/types";
import {
  COLLISION_TILE_IDS,
  LayerName,
  getMultipleTileRecursivelyAt,
  getTileRecursivelyAt,
  isPositionEmpty,
} from "~~/game/utils/layer-utils";

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
  private interactionCooldowns: Map<string, number> = new Map();

  constructor(
    private game: Game,
    private gridEngine: GridEngine,
  ) {}

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
    for (const tileIds of COLLISION_TILE_IDS) {
      combined.set(tileIds - 1, LayerName.COLLISION_LAYER);
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
    const allTiles = getMultipleTileRecursivelyAt({ x, y }, this.game.map, remLayers, false).filter(
      t => combined.get(t.index) === layer,
    );
    positions.push(...allTiles.map(t => ({ x: t.x, y: t.y, layer: t.layer.name })));

    if (layer === LayerName.COLLISION_LAYER && !allTiles.length) {
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

  private tryInteractTile(
    position: Position,
    interactionData: ResourceInteraction[],
    removeCollidables = true,
    eventName: keyof EventMap = "item-picked-up",
  ): boolean {
    for (const res of interactionData) {
      const { layer, id, method, result, crackCount } = res;
      const tile = getTileRecursivelyAt(position, this.game.map, layer, false);

      if (tile && id.includes(tile.index)) {
        const toRemove = this.findObject(tile);
        const actualTiles = toRemove.filter(value => value.layer !== LayerName.COLLISION_LAYER);

        // Handle crack effect for destructible objects
        if (crackCount) {
          if (tile.properties.crackCount) {
            tile.properties.crackCount--;
          } else {
            tile.properties.crackCount = crackCount;
          }

          if (tile.properties.crackCount !== 0) {
            actualTiles.forEach(value => {
              const targetTile = this.game.map.getTileAt(value.x, value.y, undefined, value.layer);
              if (targetTile) {
                targetTile.properties.crackCount = tile.properties.crackCount;
                this.createCrackEffect(targetTile);
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
        for (const { x, y, layer } of removeCollidables ? toRemove : actualTiles) {
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
    this.tryInteractTile(playerPosition, InteractionData.pickup);
  }

  useHotbarItem(slotIndex: HotbarIndex, item: Item): void {
    if (this.gridEngine.isMoving(SPRITE_ID)) return;
    if (item.quantity <= 0) return;

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
      case MaterialCategory.SEED:
        this.usePlaceableItem(item, slotIndex, playerPosition, facingDirection);
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

    const animationKey = `ori-${item.id}-${direction}`;

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
      if (item.id === "axe" || item.id === "pickaxe") {
        const processed =
          this.tryInteractTile(playerPosition, InteractionData.tools.axe) ||
          this.tryInteractTile(targetPosition, InteractionData.tools.axe);
      } else if (item.id === "hoe") {
        if (!isPositionEmpty(this.game.map, targetPosition.x, targetPosition.y)) {
          const processed = this.tryInteractTile(playerPosition, InteractionData.tools.hoe);
          return;
        }
        this.sysManager.farmingManager.setFarmableTile(targetPosition.x, targetPosition.y);
      }
    });

    // If no specific interaction was triggered, emit a generic tool-used event
    EventBus.emit("tool-used", {
      toolId: item.id,
      position: playerPosition,
      targetPosition: targetPosition,
    });
  }

  // private usePlaceableItem(item: Item, slotIndex: HotbarIndex, playerPosition: Position, direction: Direction): void {
  //   if (item.category === MaterialCategory.SEED) {
  //     if (!this.sysManager.farmingManager.isFarmableTile(playerPosition.x, playerPosition.y)) return;
  //     this.sysManager.farmingManager.plantSeed(item, playerPosition.x, playerPosition.y);
  //     this.sysManager.inventoryManager.removeItemFromSlot(
  //       this.sysManager.inventoryManager.toInventoryIndex(slotIndex),
  //       1,
  //     );
  //   }
  // }
  private usePlaceableItem(item: Item, slotIndex: HotbarIndex, playerPosition: Position, direction: Direction): void {
    if (item.category === MaterialCategory.SEED) {
      if (!this.sysManager.farmingManager.isFarmableTile(playerPosition.x, playerPosition.y)) return;
      this.sysManager.farmingManager.plantSeed(item, playerPosition.x, playerPosition.y);
      this.sysManager.inventoryManager.removeItemFromSlot(
        this.sysManager.inventoryManager.toInventoryIndex(slotIndex),
        1,
      );

      // Add this line to emit an event for the AI helper
      EventBus.emit("seed-planted", {
        seedId: item.id,
        position: playerPosition,
      });
    }
  }
  /**
   * Update method to be called every frame
   */
  public update(time: number, delta: number): void {
    // Handle any ongoing interactions or animations here
    // This method is intentionally left mostly empty as most interactions
    // are event-driven rather than requiring continuous updates
  }

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
  private createItemUseEffect(item: Item, position: Position): void {
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

  /**
   * Clean up resources when the manager is destroyed
   */
  destroy(): void {
    // Clear all stored interaction cooldowns and zones
    this.interactionCooldowns.clear();
  }
}
