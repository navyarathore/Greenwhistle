// src/game/entities/Player.ts
import { EventBus } from "../EventBus";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../config";
import { Game } from "../scenes/Game";
import { Direction, GridEngineConfig } from "grid-engine";
import Phaser from "phaser";

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
          walkingAnimationMapping: {
            left: {
              leftFoot: 9,
              standing: 10,
              rightFoot: 11,
            },
            right: {
              leftFoot: 6,
              standing: 7,
              rightFoot: 8,
            },
            up: {
              leftFoot: 3,
              standing: 4,
              rightFoot: 5,
            },
            down: {
              leftFoot: 0,
              standing: 1,
              rightFoot: 2,
            },
          },
        },
      ],
    };

    this.scene.gridEngine.create(scene.map, gridEngineConfig);
    this.scene.camera.startFollow(this.sprite, true);
    this.scene.camera.setZoom(2);
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
