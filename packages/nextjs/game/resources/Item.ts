export const ItemType = {
  RESOURCE: "resource",
  TOOL: "tool",
  SEED: "seed",
  CROP: "crop",
  FISH: "fish",
  FURNITURE: "furniture",
  CONSUMABLE: "consumable",
  OTHER: "other",
} as const;

export type ItemType = (typeof ItemType)[keyof typeof ItemType];

export interface Item {
  id: number;
  name: string;
  type: ItemType;
  icon?: string;
  description?: string;
  stackable: boolean;
  maxStackSize: number;
  [key: string]: any;
}
