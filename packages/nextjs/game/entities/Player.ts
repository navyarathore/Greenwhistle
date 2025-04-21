import { EventBus } from "../EventBus";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../config";
import ResourceData from "../resources/resource.json";
import { Game } from "../scenes/Game";
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

  constructor(
    private game: Game,
    private cursors: MovementCursor,
    x: number = SCREEN_WIDTH / 2,
    y: number = SCREEN_HEIGHT / 2,
  ) {
    this.sprite = game.add.sprite(x, y, SPRITE_ID, 0);
    this.game.camera.startFollow(this.sprite, true);
    this.game.camera.setFollowOffset(-this.sprite.width, -this.sprite.height);

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

    this.game.gridEngine.create(game.map, gridEngineConfig);
    this.game.camera.startFollow(this.sprite, true);
    this.game.camera.setZoom(2);

    // Add E key for item pickup
    this.eKey = this.game.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.configurePickup();

    // Emit event to get inventory system
    EventBus.emit("player-created", this);
  }

  update() {
    const gridEngine = this.game.gridEngine;
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
    this.eKey = this.game.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.eKey.on("up", () => {
      const playerPosition = this.game.gridEngine.getPosition(SPRITE_ID);

      for (const res of ResourceData.pickup) {
        const { layer, id } = res;
        const tile = this.game.map.getTileAt(playerPosition.x, playerPosition.y, false, layer);

        if (tile && id.includes(tile.index)) {
          this.game.map.removeTileAt(playerPosition.x, playerPosition.y, false, true, layer);
          this.game.sysManager
            .getInventorySystem()
            .addItem(this.game.sysManager.getItemManager().getItem(tile.index)!, 1);

          EventBus.emit("item-picked-up", tile.properties);
          break;
        }
      }
    });
  }

  setPosition(x: number, y: number) {
    this.game.gridEngine.setPosition(SPRITE_ID, { x, y });
  }

  selectTool(tool: string) {
    this.currentTool = tool;

    EventBus.emit("tool-selected", tool);
  }

  disableMovement(): void {
    this.movementEnabled = false;

    this.game.gridEngine.stopMovement(SPRITE_ID);

    this.previousInputEnabled = this.game.input.enabled;
    this.game.input.enabled = false;
  }

  enableMovement(): void {
    this.movementEnabled = true;

    if (this.previousInputEnabled !== undefined) {
      this.game.input.enabled = this.previousInputEnabled;
    }
  }
}
