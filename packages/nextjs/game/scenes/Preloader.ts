import { Scene } from "phaser";
import { SPRITE_ID } from "~~/game/entities/Player";

// Define icon paths for recursive loading
const ICON_PATHS = {
  items: {
    pickup: [
      "blueberry",
      "branches",
      "carrot",
      "carrot_seed",
      "diamond_bar",
      "diamond_ore",
      "iron_bar",
      "iron_ore",
      "rock",
      "stone_bar",
      "strawberry",
      "tomato",
      "tomato_seed",
      "wheat",
      "wheat_seed",
    ],
    placeable: ["anvil", "wooden_chest", "workbench"],
  },
  placeable: ["bed", "bed_vertical", "cook_vertical", "furnace_vertical", "log"],
  tools: ["axe", "hoe", "pickaxe", "shovel", "sword"],
};

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

    this.load.spritesheet(SPRITE_ID, "/player/player_movement.png", {
      frameWidth: 32,
      frameHeight: 32,
    });

    this.load.image("inventory", "/ui/inventory.png");

    this.loadAllIcons();
  }

  private loadAllIcons() {
    ICON_PATHS.items.pickup.forEach(icon => {
      this.load.image(icon, `/icons/items/pickup/${icon}.png`);
    });

    ICON_PATHS.items.placeable.forEach(icon => {
      this.load.image(icon, `/icons/items/placeable/${icon}.png`);
    });

    ICON_PATHS.placeable.forEach(icon => {
      this.load.image(icon, `/icons/placeable/${icon}.png`);
    });

    ICON_PATHS.tools.forEach(icon => {
      this.load.image(icon, `/icons/tools/${icon}.png`);
    });
  }

  create() {
    const animations = ["down", "left", "right", "up"];
    const numberOfFramesPerCol = 3;

    animations.forEach((anim, index) => {
      this.anims.create({
        key: `ori-${anim}`,
        frames: this.anims.generateFrameNumbers(SPRITE_ID, {
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
