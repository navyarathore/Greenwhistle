import { EventBus } from "../EventBus";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../config";
import { Game } from "../scenes/Game";
import GridEngine, { Direction } from "grid-engine";
import { Position } from "grid-engine";
import Character from "~~/game/entities/Character";
import { InputComponent } from "~~/game/input/InputComponent";

export type PlayerConfig = {
  scene: Game;
  gridEngine: GridEngine;
  gridPosition: Position;
  controls: InputComponent;
};

export type PlayerData = {
  health: number;
  maxHealth: number;
};

export const SPRITE_ID = "ori";

export default class Player extends Character {
  private config: PlayerConfig;
  private playerData: PlayerData;
  private movementEnabled = true;
  private previousInputEnabled?: boolean;

  constructor(config: PlayerConfig, data: PlayerData) {
    super({
      scene: config.scene,
      gridEngine: config.gridEngine,
      position: {
        x: SCREEN_WIDTH / 2,
        y: SCREEN_HEIGHT / 2,
      },
      gridPosition: config.gridPosition,
      assetKey: "ori",
      frame: 1,
      walkingAnimationMapping: 0,
      inputComponent: config.controls,
      speed: 1,
      id: "ori",
      isPlayer: true,
      maxLife: 5,
      currentLife: 5,
    });
    this.config = config;
    this.playerData = data;

    this.scale = 2.5;
    config.scene.camera.startFollow(this, true);
    config.scene.camera.setFollowOffset(-this.width, -this.height);

    // Emit event to get inventory system
    EventBus.emit("player-created", this);
  }

  get isMovementEnabled(): boolean {
    return this.movementEnabled;
  }

  disableMovement(): void {
    this.movementEnabled = false;

    this.config.scene.gridEngine.stopMovement(SPRITE_ID);

    this.previousInputEnabled = this.config.scene.input.enabled;
    this.config.scene.input.enabled = false;
  }

  enableMovement(): void {
    this.movementEnabled = true;

    if (this.previousInputEnabled !== undefined) {
      this.config.scene.input.enabled = this.previousInputEnabled;
    }
  }
}
