import { EventBus } from "../EventBus";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../config";
import { HotbarIndex } from "../managers/InventoryManager";
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
  selectedHotbarSlot?: HotbarIndex;
};

export const SPRITE_ID = "ori";

export default class Player extends Character {
  private readonly config: PlayerConfig;
  private movementEnabled = true;
  private previousInputEnabled?: boolean;
  private _selectedHotbarSlot: HotbarIndex = 0;
  readonly maxHotbarSlots: number = 5;

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
      maxHealth: data.maxHealth,
      currentHealth: data.health,
    });
    this.config = config;

    this.scale = 2.5;
    config.scene.camera.startFollow(this, true);
    config.scene.camera.setFollowOffset(-this.width, -this.height);

    // Emit event to get inventory system
    EventBus.emit("player-created", this);
  }

  get health(): number {
    return super.health;
  }

  set health(value: number) {
    super.health = value;
    EventBus.emit("player-health-changed", this.health);
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

  /**
   * Get the currently selected hotbar slot (0-based index)
   */
  get selectedHotbarSlot(): HotbarIndex {
    return this._selectedHotbarSlot;
  }

  /**
   * Set the currently selected hotbar slot and emit an event
   * @param slotIndex The 0-based index of the slot to select (0-4)
   */
  set selectedHotbarSlot(slotIndex: number) {
    // Ensure the index is within valid range and cast to HotbarIndex
    const validIndex = Math.max(0, Math.min(slotIndex, this.maxHotbarSlots - 1)) as HotbarIndex;

    // Only update if the selection has changed
    if (this._selectedHotbarSlot !== validIndex) {
      this._selectedHotbarSlot = validIndex;

      // Emit an event so other systems (like HUD) can react to the change
      EventBus.emit("hotbar-selection-changed", this._selectedHotbarSlot);
    }
  }

  /**
   * Select the next hotbar slot (cycling back to the first if at the end)
   */
  selectNextHotbarSlot(): void {
    const nextIndex = (this._selectedHotbarSlot + 1) % this.maxHotbarSlots;
    this.selectedHotbarSlot = nextIndex;
  }

  /**
   * Select the previous hotbar slot (cycling to the last if at the beginning)
   */
  selectPreviousHotbarSlot(): void {
    const prevIndex = (this._selectedHotbarSlot - 1 + this.maxHotbarSlots) % this.maxHotbarSlots;
    this.selectedHotbarSlot = prevIndex;
  }

  disable(): void {
    this.disableMovement();
    super.disable();

    this.config.scene.time.delayedCall(1000, () => {
      this.config.scene.changeScene();
    });
  }
}
