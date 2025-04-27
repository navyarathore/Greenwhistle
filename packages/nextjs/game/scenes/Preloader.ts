import { Scene } from "phaser";
import SystemManager from "~~/game/SystemManager";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "~~/game/config";
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
      "capsicum",
      "capsicum_seed",
      "celery",
      "celery_seed",
      "chilli",
      "chilli_seed",
      "corn",
      "corn_seed",
      "cucmber",
      "cucumber_seed",
      "garlic",
      "garlic_seed",
      "grape",
      "grape_seed",
      "lettuce",
      "lettuce_seed",
      "onion",
      "onion_seed",
      "potato",
      "potato_seed",
      "pumpkin",
      "pumpkin_seed",
      "radish",
      "radish_seed",
      "red_capsicum",
      "red_capsicum_seed",
      "red_radish",
      "red_radish_seed",
      "sunflower",
      "sunflower_seed",
      "turnip",
      "turnip_seed",
      "watermelon",
      "watermelon_seed",
      "watermelon_radish",
      "watermelon_radish_seed",
      "yellow_capsicum",
      "yellow_capsicum_seed",
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
    this.add.sprite(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, "background").play("background");

    this.add.rectangle(640, 384, 468, 32).setStrokeStyle(1, 0xffffff);
    const bar = this.add.rectangle(640 - 230, 384, 4, 28, 0xffffff);

    this.load.on("progress", (progress: number) => {
      bar.width = 4 + 460 * progress;
    });
  }

  preload() {
    this.load.setPath("assets");
    this.load.image("start_button", "/start2.png");

    this.load.tilemapTiledJSON("map", "/maps/albion.json");
    this.load.image("tiles", "/tilesets/albion_tileset.png");
    this.load.spritesheet(SPRITE_ID, "/player/player_movement.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("ori_actions", "/player/player_actions.png", {
      frameWidth: 32,
      frameHeight: 32,
    });

    // Load HUD assets
    this.load.image("heart-full", "/ui/heart-full.png");
    this.load.image("heart-empty", "/ui/heart-empty.png");
    this.load.image("hotbar", "/ui/hotbar.png");
    this.load.image("inventory", "/ui/inventory.png");
    this.loadAllIcons();
    SystemManager.instance.loadResources();
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

    const tools = ["water", "pickaxe", "hoe", "axe"];
    tools.forEach((tool, i) => {
      animations.forEach((anim, j) => {
        this.anims.create({
          key: `ori-${tool}-${anim}`,
          frames: [
            { key: "ori_actions", frame: i * 8 + j },
            { key: "ori_actions", frame: i * 8 + j + 4 },
          ],
          frameRate: 15,
          repeat: 0,
          yoyo: true,
          duration: 300, // Total animation duration in ms
        });
      });
    });

    this.scene.start("MainMenu");
  }
}
