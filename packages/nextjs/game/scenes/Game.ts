import { EventBus } from "../EventBus";
import SystemManager from "../SystemManager";
import Player from "../entities/Player";
import { GameSave } from "../managers/SaveManager";
import MapExtension from "../utils/map-extension";
import AIHelper from "./AIHelper";
import AIPopupUI from "./AIPopupUI";
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
  aiHelper!: AIHelper;
  aiPopupUI!: AIPopupUI;
  private gameData: GameSave | null = null;

  constructor() {
    super("Game");
  }

  init(data: { gameData: GameSave | null }) {
    this.gridEngine = (this as any).gridEngine;
    this.gameData = data.gameData;
  }

  preload() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x00ff00);

    try {
      this.load.image("ai_assistant_icon", "assets/ai.png");
    } catch (e) {
      console.warn("AI assistant icon not found, will use fallback");
    }
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
    this.aiHelper = AIHelper.getInstance();

    // Initialize AI popup UI
    this.aiPopupUI = new AIPopupUI(this);

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

    if (this.gameData) {
      SystemManager.instance.saveManager.unpackData(this.gameData);
      this.gameData = null;
    }

    // SystemManager.instance.saveManager.startAutoSave();

    this.events.once("destroy", async () => {
      console.log("Cleaning up Game scene resources");
      this.aiPopupUI.destroy();
      this.aiHelper.destroy();

      // Call the SystemManager's destroy method to clean up all managers
      await SystemManager.instance.saveManager.saveGameToBlockchain();
      SystemManager.instance.destroy();

      // Clean up event listeners from the HUD scene\
      EventBus.clearEventHistory();
      EventBus.destroy();

      // Destroy any remaining game objects
      this.children.removeAll(true);
    });

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
