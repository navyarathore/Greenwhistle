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
      currency: "USD",
    },
    slug: "fever-case",
    description: "A case containing various weapon skins.",
    rarity: "common",
  },
  {
    id: "2",
    name: "Dreams & Nightmares Case",
    game: "Counter-Strike 2",
    imageUrl: "/town.png",
    quantity: 223451,
    price: {
      amount: 1.91,
      currency: "USD",
    },
    slug: "dreams-nightmares-case",
    description: "A special case with rare dream-themed weapon skins.",
    rarity: "uncommon",
  },
  {
    id: "3",
    name: "Mann Co. Supply Crate Key",
    game: "Team Fortress 2",
    imageUrl: "/images/mann-co-key.png",
    quantity: 27123,
    price: {
      amount: 2.27,
      currency: "USD",
    },
    slug: "mann-co-key",
    description: "Used to open Mann Co. Supply Crates.",
    rarity: "common",
  },
  {
    id: "4",
    name: "Kilowatt Case",
    game: "Counter-Strike 2",
    imageUrl: "/images/kilowatt-case.png",
    quantity: 273961,
    price: {
      amount: 0.61,
      currency: "USD",
    },
    slug: "kilowatt-case",
    description: "An electrifying case of weapon skins.",
    rarity: "common",
  },
  {
    id: "5",
    name: "Fracture Case",
    game: "Counter-Strike 2",
    imageUrl: "/images/fracture-case.png",
    quantity: 571396,
    price: {
      amount: 0.31,
      currency: "USD",
    },
    slug: "fracture-case",
    description: "Contains fractured design weapon skins.",
    rarity: "common",
  },
  {
    id: "6",
    name: "Revolution Case",
    game: "Counter-Strike 2",
    imageUrl: "/images/revolution-case.png",
    quantity: 233061,
    price: {
      amount: 0.54,
      currency: "USD",
    },
    slug: "revolution-case",
    description: "Revolutionary designs for your weapons.",
    rarity: "uncommon",
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
