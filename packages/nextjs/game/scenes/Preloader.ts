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

    this.load.spritesheet("ori", "/player/player_movement.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  create() {
    const animations = ["idle", "down", "up", "right", "left"];
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

    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, you can define global animations here, so we can use them in other scenes.

    //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
    this.scene.start("MainMenu");
  }
}
