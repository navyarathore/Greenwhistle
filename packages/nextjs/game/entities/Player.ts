// src/game/entities/Player.ts
import { EventBus } from "../EventBus";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../config";
import ResourceData from "../resources/resource.json";
import { Game } from "../scenes/Game";
import InventorySystem, { InventoryItem } from "../systems/InventorySystem";
import { Direction, GridEngineConfig } from "grid-engine";
import * as Phaser from "phaser";

export const SPRITE_ID = "ori";

export type MovementDirections = "up" | "down" | "left" | "right";

export type IsPressed = {
  isUp: boolean;
  isDown: boolean;
};

export type MovementCursor = {
  [K in MovementDirections]: IsPressed;
};

export default class Player {
  public sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  public currentTool = "axe";
  public isPerformingAction = false;
  public isHeavyAttack = false;
  private movementEnabled = true;
  private previousInputEnabled?: boolean;
  private eKey: Phaser.Input.Keyboard.Key;
  private inventory!: InventorySystem;

  constructor(
    private scene: Game,
    private cursors: MovementCursor,
    x: number = SCREEN_WIDTH / 2,
    y: number = SCREEN_HEIGHT / 2,
  ) {
    this.sprite = scene.add.sprite(x, y, SPRITE_ID, 0);
    this.scene.camera.startFollow(this.sprite, true);
    this.scene.camera.setFollowOffset(-this.sprite.width, -this.sprite.height);

    const gridEngineConfig: GridEngineConfig = {
      characters: [
        {
          id: SPRITE_ID,
          sprite: this.sprite,
          startPosition: {
            x: Math.floor(12),
            y: Math.floor(12),
          },
          walkingAnimationMapping: 0,
        },
      ],
    };

    this.scene.gridEngine.create(scene.map, gridEngineConfig);
    this.scene.camera.startFollow(this.sprite, true);
    this.scene.camera.setZoom(2);

    // Add E key for item pickup
    this.eKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Get reference to inventory system through the event bus
    EventBus.on("inventory-system-ready", (inventorySystem: any) => {
      this.inventory = inventorySystem;
    });

    this.configurePickup();

    // Emit event to get inventory system
    EventBus.emit("player-created", this);
  }

  update() {
    const gridEngine = this.scene.gridEngine;
    if (!this.movementEnabled) {
      return;
    }

    Object.keys(this.cursors).forEach(key => {
      const cursor = this.cursors[key as MovementDirections];
      if (cursor.isDown) {
        gridEngine.move(SPRITE_ID, Direction[key.toUpperCase() as keyof typeof Direction]);
      }
    });
  }

  private configurePickup() {
    this.eKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.eKey.on("up", () => {
      const playerPosition = this.scene.gridEngine.getPosition(SPRITE_ID);

      for (const res of ResourceData.pickup) {
        const { layer, id } = res;
        const tile = this.scene.map.getTileAt(playerPosition.x, playerPosition.y, false, layer);

        if (tile && id.includes(tile.index)) {
          this.scene.map.removeTileAt(playerPosition.x, playerPosition.y, false, true, layer);
          this.inventory.addItem(
            {
              id: tile.index,
              ...ResourceData.items[tile.index.toString() as keyof typeof ResourceData.items],
              quantity: 1,
            } as InventoryItem,
            "player",
          );

          EventBus.emit("item-picked-up", tile.properties);
          break;
        }
      }
    });
  }

  setPosition(x: number, y: number) {
    this.scene.gridEngine.setPosition(SPRITE_ID, { x, y });
  }

  selectTool(tool: string) {
    this.currentTool = tool;

    EventBus.emit("tool-selected", tool);
  }

  disableMovement(): void {
    this.movementEnabled = false;

    this.scene.gridEngine.stopMovement(SPRITE_ID);

    this.previousInputEnabled = this.scene.input.enabled;
    this.scene.input.enabled = false;
  }

  enableMovement(): void {
    this.movementEnabled = true;

    if (this.previousInputEnabled !== undefined) {
      this.scene.input.enabled = this.previousInputEnabled;
    }
  }
}
