export enum TileType {
  GRASS = "grass",
  LONG_GRASS = "long_grass",
  DIRT = "dirt",
  SOIL = "soil",
  TILLED_SOIL = "tilled_soil",
  PATH = "path",
  TREE = "tree",
  WATER = "water",
  DEEP_WATER = "deep_water",
  FLOWER = "flower",
  STONE = "stone",
  HOUSE = "house",
  BRIDGE = "bridge",
  GROUND = "ground",
  CROP = "crop",
  GROWING_CROP = "growing_crop",
  READY_CROP = "ready_crop",
  WATERED_SOIL = "watered_soil",
  SAND = "sand",
}

export enum Direction {
  UP = "UP",
  DOWN = "DOWN",
  LEFT = "LEFT",
  RIGHT = "RIGHT",
}

export interface Position {
  x: number;
  y: number;
}

export interface Tile {
  type: TileType;
  walkable: boolean;
  interactable: boolean;
  npcId?: string;
  growthStage?: number;
  waterLevel?: number;
  variant?: number; // For visual variation of the same tile type, or to indicate special tiles like house parts
  size?: number; // For tiles that represent larger structures like houses
}

export interface Character {
  level: number;
  experience: number;
  stats: {
    strength: number;
    agility: number;
    stamina: number;
    intelligence: number;
  };
  skills: {
    farming: number;
    mining: number;
    fishing: number;
    crafting: number;
  };
}

export interface Player {
  position: Position;
  direction: Direction;
  speed: number;
  inventory: InventoryItem[];
  selectedItem: number;
  energy: number;
  character: Character;
  animation?: {
    frame: number;
    frameCount: number;
    frameDuration: number;
    lastFrameTime: number;
  };
}

export interface InventoryItem {
  name: string;
  type: "TOOL" | "SEED" | "CROP" | "FISH";
  quantity: number;
  icon?: string;
  description?: string;
}

export interface GameState {
  player: Player;
  map: Tile[][];
  npcs: NPC[];
  time: number;
  money: number;
}

export interface NPC {
  id: string;
  name: string;
  type: string;
  position: Position;
  dialogue: string[];
  schedule: { time: number; position: Position }[];
}

export const TILE_SIZE = 32;
export const MAP_WIDTH = 100;
export const MAP_HEIGHT = 100;

export const INITIAL_INVENTORY: InventoryItem[] = [
  { name: "Hoe", type: "TOOL", quantity: 1, icon: "hoe", description: "Used to till soil" },
  { name: "Watering Can", type: "TOOL", quantity: 1, icon: "watering_can", description: "Used to water crops" },
  { name: "Seeds", type: "SEED", quantity: 10, icon: "seeds", description: "Plant to grow crops" },
  { name: "Fishing Rod", type: "TOOL", quantity: 1, icon: "fishing_rod", description: "Used to catch fish" },
  { name: "Axe", type: "TOOL", quantity: 1, icon: "axe", description: "Used to chop trees" },
];

export const NPCS: NPC[] = [
  {
    id: "merchant",
    name: "Merchant",
    type: "merchant",
    position: { x: 90, y: 10 },
    dialogue: ["Hello there!", "Welcome to my shop!", "I have the best prices in town.", "Come back anytime!"],
    schedule: [
      { time: 8, position: { x: 90, y: 10 } },
      { time: 18, position: { x: 90, y: 10 } },
    ],
  },
  {
    id: "farmer",
    name: "Farmer",
    type: "farmer",
    position: { x: 20, y: 20 },
    dialogue: ["Hello there!", "Need help with farming?", "I can teach you a thing or two!"],
    schedule: [
      { time: 6, position: { x: 20, y: 20 } },
      { time: 20, position: { x: 20, y: 20 } },
    ],
  },
];
