import { EventBus } from "../EventBus";
import GridEngine, { GridEngineConfig } from "grid-engine";
import { Scene } from "phaser";

export class Game extends Scene {
  camera!: Phaser.Cameras.Scene2D.Camera;
  map!: Phaser.Tilemaps.Tilemap;
  player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  cursor!: Phaser.Types.Input.Keyboard.CursorKeys;
  gridEngine!: GridEngine;

  constructor() {
    super("Game");
  }

  create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x00ff00);

    this.map = this.make.tilemap({ key: "map" });
    const tileset = this.map.addTilesetImage("tileset", "tiles");

    if (tileset) {
      for (let i = 0; i < this.map.layers.length; i++) {
        this.map.createLayer(i, "tileset", 0, 0);
      }
    }

    this.player = this.add.sprite(640, 360, "ori", 0);
    this.camera.startFollow(this.player, true);
    this.camera.setFollowOffset(-this.player.width, -this.player.height);

    const gridEngineConfig: GridEngineConfig = {
      characters: [
        {
          id: "ori",
          sprite: this.player,
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

    this.gridEngine = (this as any).gridEngine;
    this.gridEngine.create(this.map, gridEngineConfig);
    this.camera.startFollow(this.player, true);
    this.camera.setZoom(2);

    this.cursor = this.input.keyboard.createCursorKeys();

    EventBus.emit("current-scene-ready", this);
  }

  update(): void {
    const gridEngine = (this as any).gridEngine;
    if (this.cursor.left.isDown) {
      gridEngine.move("ori", "left");
      // this.player.setFlipX(true);
      // this.player.anims.play("ori-walk-right", true);
    } else if (this.cursor.right.isDown) {
      gridEngine.move("ori", "right");
      // this.player.anims.play("ori-walk-right", true);
    } else if (this.cursor.up.isDown) {
      gridEngine.move("ori", "up");
      // this.player.anims.play("ori-walk-up", true);
    } else if (this.cursor.down.isDown) {
      gridEngine.move("ori", "down");
      // this.player.anims.play("ori-walk-down", true);
    } else {
      // this.player.anims.play("ori-idle-down", true);
    }
  }

  changeScene() {
    this.scene.start("GameOver");
  }
}
