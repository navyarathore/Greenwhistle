import { GridEngine } from "grid-engine";
import "phaser";

declare global {
  interface Window {
    GridEngine: typeof GridEngine;
  }
}

declare module "phaser" {
  namespace Phaser {
    interface Scene {
      gridEngine: GridEngine;
    }
  }
}
