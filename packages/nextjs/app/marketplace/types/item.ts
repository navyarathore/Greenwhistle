export interface Item {
  id: string;
  name: string;
  imageUrl: string;
  quantity: number;
  price: {
    amount: number;
    currency: string;
  };
  slug: string;
  description?: string;
  category?: string;
  rarity?: string;
  type?: string;
  levelRequired?: number;
  durability?: {
    current: number;
    max: number;
  };
  weight?: number;
}

export const mockItems: Item[] = [
  {
    id: "1",
    name: "Iron Axe",
    imageUrl: "/assets/icons/tools/axe.png",
    quantity: 78,
    price: {
      amount: 0.05,
      currency: "ETH",
    },
    slug: "iron-axe",
    description: "A sturdy iron axe for chopping trees efficiently.",
    category: "tools",
    rarity: "common",
    type: "Tool",
    levelRequired: 1,
    durability: {
      current: 100,
      max: 100,
    },
    weight: 2.0,
  },
  {
    id: "2",
    name: "Stone Pickaxe",
    imageUrl: "/assets/icons/tools/pickaxe.png",
    quantity: 125,
    price: {
      amount: 0.03,
      currency: "ETH",
    },
    slug: "stone-pickaxe",
    description: "Basic mining tool for harvesting stone and iron ore.",
    category: "tools",
    rarity: "common",
    type: "Tool",
    levelRequired: 1,
    durability: {
      current: 100,
      max: 100,
    },
    weight: 2.5,
  },
  {
    id: "3",
    name: "Iron Hoe",
    imageUrl: "/assets/icons/tools/hoe.png",
    quantity: 92,
    price: {
      amount: 0.04,
      currency: "ETH",
    },
    slug: "iron-hoe",
    description: "Essential for preparing soil to plant seeds.",
    category: "tools",
    rarity: "common",
    type: "Tool",
    levelRequired: 1,
    durability: {
      current: 100,
      max: 100,
    },
    weight: 1.5,
  },
  {
    id: "4",
    name: "Diamond Ore",
    imageUrl: "/assets/icons/items/pickup/diamond_ore.png",
    quantity: 42,
    price: {
      amount: 0.12,
      currency: "ETH",
    },
    slug: "diamond-ore",
    description: "Valuable raw material used to craft high-tier items.",
    category: "resources",
    rarity: "rare",
    type: "Resource",
    levelRequired: 0,
    weight: 3.0,
  },
  {
    id: "5",
    name: "Diamond Bar",
    imageUrl: "/assets/icons/items/pickup/diamond_bar.png",
    quantity: 31,
    price: {
      amount: 0.25,
      currency: "ETH",
    },
    slug: "diamond-bar",
    description: "Refined diamond, ready for crafting powerful tools and equipment.",
    category: "resources",
    rarity: "rare",
    type: "Resource",
    levelRequired: 0,
    weight: 2.0,
  },
  {
    id: "6",
    name: "Iron Ore",
    imageUrl: "/assets/icons/items/pickup/iron_ore.png",
    quantity: 215,
    price: {
      amount: 0.02,
      currency: "ETH",
    },
    slug: "iron-ore",
    description: "Raw iron that needs to be refined in a furnace.",
    category: "resources",
    rarity: "common",
    type: "Resource",
    levelRequired: 0,
    weight: 3.0,
  },
  {
    id: "7",
    name: "Iron Bar",
    imageUrl: "/assets/icons/items/pickup/iron_bar.png",
    quantity: 173,
    price: {
      amount: 0.03,
      currency: "ETH",
    },
    slug: "iron-bar",
    description: "Refined iron, perfect for crafting tools and structures.",
    category: "resources",
    rarity: "common",
    type: "Resource",
    levelRequired: 0,
    weight: 2.0,
  },
  {
    id: "8",
    name: "Wooden Chest",
    imageUrl: "/assets/icons/items/placeable/wooden_chest.png",
    quantity: 62,
    price: {
      amount: 0.02,
      currency: "ETH",
    },
    slug: "wooden-chest",
    description: "Storage container for keeping your items safe.",
    category: "furniture",
    rarity: "common",
    type: "Placeable",
    levelRequired: 1,
    durability: {
      current: 100,
      max: 100,
    },
    weight: 5.0,
  },
  {
    id: "9",
    name: "Iron Sword",
    imageUrl: "/assets/icons/tools/sword.png",
    quantity: 54,
    price: {
      amount: 0.06,
      currency: "ETH",
    },
    slug: "iron-sword",
    description: "Standard weapon for defending yourself against monsters.",
    category: "weapons",
    rarity: "common",
    type: "Weapon",
    levelRequired: 1,
    durability: {
      current: 100,
      max: 100,
    },
    weight: 2.5,
  },
  {
    id: "10",
    name: "Workbench",
    imageUrl: "/assets/icons/items/placeable/workbench.png",
    quantity: 38,
    price: {
      amount: 0.04,
      currency: "ETH",
    },
    slug: "workbench",
    description: "Essential crafting station for creating basic tools and items.",
    category: "furniture",
    rarity: "common",
    type: "Placeable",
    levelRequired: 1,
    durability: {
      current: 100,
      max: 100,
    },
    weight: 4.5,
  },
  {
    id: "11",
    name: "Wheat Seeds",
    imageUrl: "/assets/icons/items/pickup/wheat_seed.png",
    quantity: 320,
    price: {
      amount: 0.01,
      currency: "ETH",
    },
    slug: "wheat-seeds",
    description: "Plant these to grow wheat for food and crafting.",
    category: "farming",
    rarity: "common",
    type: "Seed",
    levelRequired: 0,
    weight: 0.1,
  },
  {
    id: "12",
    name: "Stone Bar",
    imageUrl: "/assets/icons/items/pickup/stone_bar.png",
    quantity: 195,
    price: {
      amount: 0.01,
      currency: "ETH",
    },
    slug: "stone-bar",
    description: "Processed stone for building and crafting.",
    category: "resources",
    rarity: "common",
    type: "Resource",
    levelRequired: 0,
    weight: 2.5,
  },
];

// Helper function to fetch items
export const getItems = () => {
  // In a real app, this would be an API call
  return mockItems;
};

// Helper function to get item by slug
export const getItemBySlug = (slug: string): Item | undefined => {
  return mockItems.find(item => item.slug === slug);
};

export const getItemsByCategory = (category: string): Item[] => {
  return mockItems.filter(item => item.category === category);
};
