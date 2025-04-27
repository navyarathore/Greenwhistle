"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { CubeIcon } from "@heroicons/react/24/outline";
import Resources from "~~/game/resources/resource.json";
import { useScaffoldContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface InventoryItem {
  id: string;
  slotIndex: number;
  name: string;
  imageUrl: string;
  quantity: number;
  description?: string;
  rarity?: string;
}

const rarityColors = {
  common: "bg-gray-500 text-white",
  uncommon: "bg-green-500 text-white",
  rare: "bg-blue-500 text-white",
  epic: "bg-purple-500 text-white",
  legendary: "bg-yellow-500 text-black",
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [listingPrice, setListingPrice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState("name");
  const [listingQuantity, setListingQuantity] = useState(1);

  const { address } = useAccount();

  // Get contract instances
  const { data: gameSaveContract } = useScaffoldContract({
    contractName: "GameSave",
  });

  const { writeContractAsync: listItemOnMarketplace } = useScaffoldWriteContract({
    contractName: "VolatileMarketplace",
  });

  // Load inventory items
  useEffect(() => {
    if (!gameSaveContract || !address) return;

    const loadInventory = async () => {
      try {
        setIsLoading(true);
        const saveData = await gameSaveContract.read.loadGame([address]);

        const loadedItems: InventoryItem[] = [];
        const [, , , inventoryData] = saveData;

        // Process inventory items
        inventoryData.forEach((item: { slotIndex: bigint; itemId: string; quantity: bigint }) => {
          const resourceItem = (Resources.items as Record<string, any>)[item.itemId];
          if (resourceItem) {
            loadedItems.push({
              id: item.itemId,
              slotIndex: Number(item.slotIndex),
              name: resourceItem.name,
              imageUrl: `/assets/icons${resourceItem.icon.path}`,
              quantity: Number(item.quantity),
              description: resourceItem.description,
              rarity: resourceItem.rarity || "common",
            });
          }
        });

        setItems(loadedItems);
      } catch (error) {
        console.error("Error loading inventory:", error);
        setError("Failed to load inventory items");
      } finally {
        setIsLoading(false);
      }
    };

    loadInventory();
  }, [gameSaveContract?.address, address]);

  // Sort items based on selected option
  const sortedItems = [...items].sort((a, b) => {
    if (sortOption === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortOption === "quantity") {
      return b.quantity - a.quantity;
    } else if (sortOption === "rarity") {
      const rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
      return (
        (rarityOrder[b.rarity as keyof typeof rarityOrder] || 0) -
        (rarityOrder[a.rarity as keyof typeof rarityOrder] || 0)
      );
    }
    return 0;
  });

  // Handle quantity input change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedItem) return;
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 1) {
      setListingQuantity(1);
    } else if (value > selectedItem.quantity) {
      setListingQuantity(selectedItem.quantity);
    } else {
      setListingQuantity(value);
    }
  };

  // Handle listing item on marketplace
  const handleListItem = async () => {
    if (!selectedItem || !listingPrice || !listItemOnMarketplace) return;

    try {
      const price = parseEther(listingPrice);
      await listItemOnMarketplace({
        functionName: "listGameItem",
        args: [selectedItem.id, BigInt(listingQuantity), price],
      });

      // Reset form
      setSelectedItem(null);
      setListingPrice("");
      setListingQuantity(1);

      // Refresh inventory
      window.location.reload();
    } catch (error) {
      console.error("Error listing item:", error);
      setError("Failed to list item on marketplace");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <span className="ml-3">Loading inventory...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-500/20 p-4 rounded-lg border border-red-500">
          <p className="text-red-500 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-4xl font-['PixelGame'] font-bold text-[#c6c607]">Your Inventory</h1>
        {/* <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          Your Inventory
        </h1> */}

        <div className="mt-4 md:mt-0 flex items-center">
          <label className="mr-2 text-sm font-medium">Sort by:</label>
          <select
            className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={sortOption}
            onChange={e => setSortOption(e.target.value)}
          >
            <option value="name">Name</option>
            <option value="quantity">Quantity</option>
            <option value="rarity">Rarity</option>
          </select>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-gray-800/30 rounded-lg p-8 text-center">
          <p className="text-gray-400 text-lg mb-4">Your inventory is empty. Collect items by playing the game!</p>
          <a
            href="/game"
            className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg font-medium text-white transition-colors"
          >
            Play Game
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {sortedItems.map(item => (
            <div
              key={`${item.id}-${item.slotIndex}`}
              className="bg-gradient-to-b from-gray-800/70 to-gray-900/70 rounded-xl overflow-hidden shadow-lg hover:shadow-purple-500/20 transition-all duration-300 hover:scale-105 border border-gray-700/50"
              onClick={() => setSelectedItem(item)}
            >
              <div className="relative">
                <div className="relative w-full aspect-square p-4 bg-gray-800/50">
                  <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-4" priority />
                </div>
                <div className="absolute top-2 right-2">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${rarityColors[item.rarity as keyof typeof rarityColors] || rarityColors.common}`}
                  >
                    {item.rarity}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold truncate">{item.name}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-300 flex items-center">
                    {/* <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg> */}
                    <CubeIcon className="h-5 w-5" /> &nbsp; x{item.quantity}
                  </span>
                  <button className="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors">
                    Sell
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-xl max-w-md w-full shadow-2xl border border-gray-700/50">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                List Item on Marketplace
              </h2>
              <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex items-center mb-6">
              <div className="relative w-20 h-20 mr-4 bg-gray-700/50 rounded-lg overflow-hidden">
                <Image src={selectedItem.imageUrl} alt={selectedItem.name} fill className="object-contain p-2" />
              </div>
              <div>
                <p className="text-xl font-medium">{selectedItem.name}</p>
                <div className="flex items-center mt-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${rarityColors[selectedItem.rarity as keyof typeof rarityColors] || rarityColors.common}`}
                  >
                    {selectedItem.rarity}
                  </span>
                  <span className="text-sm text-gray-400 ml-2">Quantity: {selectedItem.quantity}</span>
                </div>
              </div>
            </div>

            {selectedItem.description && (
              <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <p className="text-sm text-gray-300">{selectedItem.description}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-300">Set Your Price (MON)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.0001"
                  className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={listingPrice}
                  onChange={e => setListingPrice(e.target.value)}
                  placeholder="0.0000"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-400"></span>
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Quantity to List</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setListingQuantity(Math.max(1, listingQuantity - 1))}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={selectedItem.quantity}
                  value={listingQuantity}
                  onChange={handleQuantityChange}
                  className="w-20 px-3 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-center appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                />
                <button
                  onClick={() => setListingQuantity(Math.min(selectedItem.quantity, listingQuantity + 1))}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded"
                >
                  +
                </button>
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Total Items:</span>
                <span>{listingQuantity}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total Value:</span>
                <span>{listingPrice ? (Number(listingPrice) * listingQuantity).toFixed(4) : "0.0000"} MON</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                onClick={handleListItem}
              >
                List for Sale
              </button>
              <button
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                onClick={() => setSelectedItem(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
