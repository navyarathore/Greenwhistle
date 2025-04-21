export const MaterialCategory = {
  RESOURCE: "resource",
  TOOL: "tool",
  SEED: "seed",
  CROP: "crop",
  FISH: "fish",
  FURNITURE: "furniture",
  CONSUMABLE: "consumable",
  OTHER: "other",
} as const;

export type MaterialCategory = (typeof MaterialCategory)[keyof typeof MaterialCategory];

export interface MaterialIcon {
  start: {
    x: number;
    y: number;
  };
  end: {
    x: number;
    y: number;
  };
}

export interface Material {
  id: number;
  name: string;
  type: MaterialCategory;
  icon: MaterialIcon;
  description?: string;
  stackable: boolean;
  maxStackSize: number;
  [key: string]: any;
}

export class Item {
  readonly type: Material;
  quantity: number;

  constructor(material: Material, quantity = 1) {
    this.type = material;
    this.quantity = quantity;
  }

  get id(): number {
    return this.type.id;
  }

  get name(): string {
    return this.type.name;
  }

  get category(): MaterialCategory {
    return this.type.type;
  }

  get description(): string | undefined {
    return this.type.description;
  }

  get isStackable(): boolean {
    return this.type.stackable;
  }

  get maxStackSize(): number {
    return this.type.maxStackSize;
  }

  clone(): Item {
    return new Item(this.type, this.quantity);
  }
}
