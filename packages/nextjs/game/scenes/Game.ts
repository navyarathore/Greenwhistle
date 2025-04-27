import { EventBus } from "../EventBus";
import SystemManager from "../SystemManager";
import Player from "../entities/Player";
import MapExtension from "../utils/map-extension";
import GridEngine from "grid-engine";
import { Scene } from "phaser";
import { LayerName, loadLayerMapping } from "~~/game/utils/layer-utils";

export const MAP_SCALE = 3;

export default class Game extends Scene {
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
      for (let i = 0; i < this.map.layers.length; i++) {
        const layer = this.map.createLayer(i, "tileset", 0, 0)!;
        layer.scale = MAP_SCALE;
        if (layer.name === LayerName.COLLISION_LAYER) {
          layer.visible = false;
        }
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

    loadLayerMapping(this.map);

    // Initialize map change tracking
    MapExtension.init(this);

    this.scene.launch("HUD", {
      player: this.player,
      inventoryManager: SystemManager.instance.inventoryManager,
    });

    // Try to load saved game if it exists
    this.loadGameIfExists();

    SystemManager.instance.saveManager.startAutoSave();

    EventBus.emit("current-scene-ready", { scene: this });
  }

  update(time: number, delta: number): void {
    this.player.update();

    SystemManager.instance.update(time, delta);
  }

  changeScene() {
    this.scene.start("GameOver");
  }

  /**
   * Attempts to load a saved game if one exists
   * Called automatically when the game starts
   */
  private loadGameIfExists(): void {
    const saveManager = SystemManager.instance.saveManager;

    if (saveManager.hasSaveData()) {
      console.log("Found saved game data, loading...");
      const success = saveManager.loadGame();

      if (success) {
        console.log("Game loaded successfully on startup");
        // Show a brief notification to the player
        this.showLoadNotification();
      } else {
        console.warn("Failed to load saved game");
      }
    } else {
      console.log("No saved game found, starting new game");
    }
  }

  /**
   * Shows a brief on-screen notification that a game was loaded
   */
  private showLoadNotification(): void {
    const notification = this.add.text(this.cameras.main.centerX, this.cameras.main.height - 50, "Game Loaded", {
      fontSize: "18px",
      color: "#ffffff",
      backgroundColor: "#000000",
      padding: { x: 10, y: 5 },
    });
    notification.setOrigin(0.5);
    notification.setScrollFactor(0);
    notification.setDepth(1000);

    // Fade out and remove after 2 seconds
    this.tweens.add({
      targets: notification,
      alpha: 0,
      y: this.cameras.main.height - 70,
      duration: 2000,
      ease: "Power2",
      onComplete: () => notification.destroy(),
    });
  }
}
