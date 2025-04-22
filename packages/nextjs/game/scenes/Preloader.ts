import { Scene } from "phaser";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {
    this.anims.create({
      key: "background",
      frames: this.anims.generateFrameNumbers("background", {
        start: 0,
        end: 35,
      }),
      frameRate: 10,
      repeat: -1,
    });
    this.add.sprite(640, 360, "background").play("background");

    this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);
    const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

    this.load.on("progress", (progress: number) => {
      bar.width = 4 + 460 * progress;
    });
  }

  preload() {
    this.load.setPath("assets");

    this.load.tilemapTiledJSON("map", "/maps/albion.json");
    this.load.image("tiles", "/tilesets/albion_tileset.png");
    this.load.spritesheet("tiles-sprite", "/tilesets/albion_tileset.png", {
      frameWidth: 16,
      frameHeight: 16,
    });

    this.load.spritesheet("ori", "/player/player_movement.png", {
      frameWidth: 32,
      frameHeight: 32,
    });

    this.load.image("crafting", "/ui/crafting.png");
  }

  create() {
    const animations = ["down", "left", "right", "up"];
    const numberOfFramesPerCol = 3;

    animations.forEach((anim, index) => {
      this.anims.create({
        key: `ori-${anim}`,
        frames: this.anims.generateFrameNumbers("ori", {
          start: index * numberOfFramesPerCol,
          end: (index + 1) * numberOfFramesPerCol - 1,
        }),
        frameRate: 20,
        repeat: -1,
      });
    });

    this.scene.start("MainMenu");
  }
}
