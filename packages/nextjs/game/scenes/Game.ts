import { EventBus } from "../EventBus";
import { SystemManager } from "../SystemManager";
import Player from "../entities/Player";
import GridEngine from "grid-engine";
import { Scene } from "phaser";

export class Game extends Scene {
  camera!: Phaser.Cameras.Scene2D.Camera;
  map!: Phaser.Tilemaps.Tilemap;
  player!: Player;
  cursor!: Phaser.Types.Input.Keyboard.CursorKeys;
  gridEngine!: GridEngine;
  sysManager!: SystemManager;

  constructor() {
    super("Game");
  }

  init() {
    this.gridEngine = (this as any).gridEngine;
  }

  create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x00ff00);

    this.map = this.make.tilemap({ key: "map" });
    const tileset = this.map.addTilesetImage("tileset", "tiles");

    if (tileset) {
      for (let i = 0; i < this.map.layers.length; i++) {
        const layer = this.map.createLayer(i, "tileset", 0, 0)!;
        layer.scale = 3;
      }
    }

    this.sysManager = new SystemManager(this);
    this.sysManager.load();

    this.player = new Player(
      {
        scene: this,
        gridEngine: this.gridEngine,
        gridPosition: {
          x: 12,
          y: 12,
        },
        controls: this.sysManager.controlsManager.inputComponent,
      },
      {
        maxHealth: 5,
        health: 5,
      },
    );

    EventBus.emit("current-scene-ready", this);
  }

  update(time: number, delta: number): void {
    this.player.update();

    this.sysManager.update(time, delta);
  }

  changeScene() {
    this.scene.start("GameOver");
  }
}
