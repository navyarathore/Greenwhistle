import { EventBus } from "../EventBus";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../config";
import { Item } from "../resources/Item";
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
  public isHeavyAttack = false;
  private movementEnabled = true;
  private previousInputEnabled?: boolean;
  private fKey: Phaser.Input.Keyboard.Key;

  constructor(
    private game: Game,
    private cursors: MovementCursor,
    x: number = SCREEN_WIDTH / 2,
    y: number = SCREEN_HEIGHT / 2,
  ) {
    this.sprite = game.add.sprite(x, y, SPRITE_ID, 0);
    this.sprite.scale = 2.5;
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

    this.fKey = this.game.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

    this.configureKeys();

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

  private configureKeys() {
    this.fKey.on("up", () => {
      const playerPosition = this.game.gridEngine.getPosition(SPRITE_ID);

      for (const res of ResourceData.pickup) {
        const { layer, id, method, result } = res;
        const tile = this.game.map.getTileAt(playerPosition.x, playerPosition.y, false, layer);

        if (tile && id.includes(tile.index)) {
          const toAdd: Item[] = [];
          if (method === "random") {
            const randomResult = result[Math.floor(Math.random() * result.length)];
            toAdd.push(
              new Item(this.game.sysManager.getItemManager().getMaterial(randomResult.id)!, randomResult.amount),
            );
          } else if (method === "direct") {
            toAdd.push(
              ...result.map(res => new Item(this.game.sysManager.getItemManager().getMaterial(res.id)!, res.amount)),
            );
          }
          this.game.map.removeTileAt(playerPosition.x, playerPosition.y, false, true, layer);
          this.game.sysManager.getInventorySystem().addItems(toAdd);

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
