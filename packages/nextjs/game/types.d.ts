import * as Phaser from "phaser";

export interface CustomGameObject {
  enable(): void;
  disable(): void;
}

export type GameObject = Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;
