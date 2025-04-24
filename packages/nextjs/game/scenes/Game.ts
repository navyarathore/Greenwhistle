import { EventBus } from "../EventBus";
import { SystemManager } from "../SystemManager";
import Player from "../entities/Player";
import GridEngine from "grid-engine";
import { Scene } from "phaser";
import { loadLayerMapping } from "~~/game/utils/layer-utils";

export const MAP_SCALE = 3;

export class Game extends Scene {
  camera!: Phaser.Cameras.Scene2D.Camera;
  map!: Phaser.Tilemaps.Tilemap;
  player!: Player;
  cursor!: Phaser.Types.Input.Keyboard.CursorKeys;
  gridEngine!: GridEngine;

  constructor() {
    super("Game");
  }

  init() {
    this.gridEngine = (this as any).gridEngine;
  }

  preload() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x00ff00);
  }

  create() {
    this.map = this.make.tilemap({ key: "map" });
    const tileset = this.map.addTilesetImage("tileset", "tiles");

    if (tileset) {
      console.log(this.map.layers);
      for (let i = 0; i < this.map.layers.length; i++) {
        const layer = this.map.createLayer(i, "tileset", 0, 0)!;
        layer.scale = MAP_SCALE;
      }
    }

    SystemManager.instance.setup(this);

    this.player = new Player(
      {
        scene: this,
        gridEngine: this.gridEngine,
        gridPosition: {
          x: 12,
          y: 12,
        },
        controls: SystemManager.instance.controlsManager.inputComponent,
      },
      {
        maxHealth: 5,
        health: 5,
      },
    );

    console.log(this.map.getTileLayerNames());
    loadLayerMapping(this.map);

    this.scene.launch("HUD", {
      player: this.player,
      inventoryManager: SystemManager.instance.inventoryManager,
    });

    EventBus.emit("current-scene-ready", this);
  }

  update(time: number, delta: number): void {
    this.player.update();

    SystemManager.instance.update(time, delta);
  }

  changeScene() {
    this.scene.start("GameOver");
  }
}
