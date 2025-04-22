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
        const layer = this.map.createLayer(i, "tileset", 0, 0);
        layer.scale = 3;
      }
    }

    this.sysManager = new SystemManager(this);
    this.sysManager.load();

    this.cursor = this.input.keyboard.createCursorKeys();
    this.player = new Player(this, this.cursor);

    const eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    eKey.on("up", () => {
      if (this.scene.isActive("InventoryMenu")) {
        this.scene.stop("InventoryMenu");
        this.player.enableMovement();
      } else {
        this.scene.launch("InventoryMenu", { inventoryManager: this.sysManager.getInventorySystem() });
        this.player.disableMovement();
      }
    });

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
