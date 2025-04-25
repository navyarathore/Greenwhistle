import GridEngine, { GridEngineConfig, Position, WalkingAnimationMapping } from "grid-engine";
import * as Phaser from "phaser";
import InputComponent from "~~/game/input/InputComponent";
import Game from "~~/game/scenes/Game";
import { CustomGameObject } from "~~/game/types";

export type CharacterConfig = {
  scene: Game;
  gridEngine: GridEngine;
  position: Position;
  gridPosition: Position;
  assetKey: string;
  frame?: number;
  walkingAnimationMapping: number | WalkingAnimationMapping;
  inputComponent: InputComponent;
  speed: number;
  id: string;
  isPlayer: boolean;
  isInvulnerable?: boolean;
  invulnerableAfterHitAnimationDuration?: number;
  maxHealth: number;
  currentHealth?: number;
};

export default class Character extends Phaser.Physics.Arcade.Sprite implements CustomGameObject {
  protected _isPlayer: boolean;
  protected _currentHealth: number;
  protected _maxHealth: number;

  constructor(config: CharacterConfig) {
    super(config.scene, config.position.x, config.position.y, config.assetKey, config.frame || 0);
    config.scene.add.existing(this);

    const gridEngineConfig: GridEngineConfig = {
      characters: [
        {
          id: config.id,
          sprite: this,
          startPosition: {
            x: config.gridPosition.x,
            y: config.gridPosition.y,
          },
          walkingAnimationMapping: config.walkingAnimationMapping,
        },
      ],
    };

    config.gridEngine.create(config.scene.map, gridEngineConfig);

    this._currentHealth = config.currentHealth || config.maxHealth;
    this._maxHealth = config.maxHealth;

    this._isPlayer = config.isPlayer;
    if (!this._isPlayer) {
      this.disable();
    }
  }

  get isPlayer(): boolean {
    return this._isPlayer;
  }

  get health(): number {
    return this._currentHealth;
  }

  set health(value: number) {
    this._currentHealth = Math.max(0, Math.min(value, this._maxHealth - this._currentHealth));
    if (this._currentHealth <= 0) {
      this.disable();
    }
  }

  get maxHealth(): number {
    return this._maxHealth;
  }

  disable(): void {
    this.active = false;
    if (!this._isPlayer) {
      this.visible = false;
    }
  }

  enable(): void {
    this.active = true;
    this.visible = true;
  }
}
