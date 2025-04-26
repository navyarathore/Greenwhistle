import { Position } from "grid-engine";

export interface CustomGameObject {
  enable(): void;
  disable(): void;
}

export type LayerPosition = Position & { layer: string };
