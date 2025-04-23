export interface Item {
  id: string;
  name: string;
  game: string;
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
  // Add these new properties
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
    name: "Fever Case",
    game: "Counter-Strike 2",
    imageUrl: "/name.png",
    quantity: 148972,
    price: {
      amount: 1.03,
      currency: "ETH",
    },
    slug: "fever-case",
    description: "A case containing various weapon skins.",
    rarity: "common",
    // Add the properties
    type: "Container",
    levelRequired: 4,
    durability: {
      current: 100,
      max: 100,
    },
    weight: 1.5,
  },
  {
    id: "2",
    name: "Dreams & Nightmares Case",
    game: "Counter-Strike 2",
    imageUrl: "/town.png",
    quantity: 223451,
    price: {
      amount: 1.91,
      currency: "ETH",
    },
    slug: "dreams-nightmares-case",
    description: "A special case with rare dream-themed weapon skins.",
    rarity: "uncommon",
    // Add the properties
    type: "Container",
    levelRequired: 2,
    durability: {
      current: 100,
      max: 100,
    },
    weight: 1.5,
  },
  {
    id: "3",
    name: "Mann Co. Supply Crate Key",
    game: "Team Fortress 2",
    imageUrl: "/backpack.jpeg",
    quantity: 27123,
    price: {
      amount: 2.27,
      currency: "ETH",
    },
    slug: "mann-co-key",
    description: "Used to open Mann Co. Supply Crates.",
    rarity: "common",
    type: "Container",
    levelRequired: 4,
    durability: {
      current: 100,
      max: 100,
    },
    weight: 1.5,
  },
  {
    id: "4",
    name: "Kilowatt Case",
    game: "Counter-Strike 2",
    imageUrl: "/images/kilowatt-case.png",
    quantity: 273961,
    price: {
      amount: 0.61,
      currency: "ETH",
    },
    slug: "kilowatt-case",
    description: "An electrifying case of weapon skins.",
    rarity: "common",
    type: "Container",
    levelRequired: 4,
    durability: {
      current: 100,
      max: 100,
    },
    weight: 1.5,
  },
  {
    id: "5",
    name: "Fracture Case",
    game: "Counter-Strike 2",
    imageUrl: "/logo.png",
    quantity: 571396,
    price: {
      amount: 0.31,
      currency: "ETH",
    },
    slug: "fracture-case",
    description: "Contains fractured design weapon skins.",
    rarity: "common",
    type: "Container",
    levelRequired: 4,
    durability: {
      current: 100,
      max: 100,
    },
    weight: 1.5,
  },
  {
    id: "6",
    name: "Revolution Case",
    game: "Counter-Strike 2",
    imageUrl: "/images/revolution-case.png",
    quantity: 233061,
    price: {
      amount: 0.54,
      currency: "ETH",
    },
    slug: "revolution-case",
    description: "Revolutionary designs for your weapons.",
    rarity: "uncommon",
    type: "Container",
    levelRequired: 4,
    durability: {
      current: 100,
      max: 100,
    },
    weight: 1.5,
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

export const getItemsByGame = (game: string): Item[] => {
  return mockItems.filter(item => item.game === game);
};
