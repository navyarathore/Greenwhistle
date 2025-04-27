"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProtectedRoute } from "../wallet/ProtectedRoute";
import { Item } from "./types/item";
import { formatEther, parseEther } from "ethers";
import Resources from "~~/game/resources/resource.json";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";

export default function MarketplacePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get contract instances
  const { data: marketplaceContract } = useScaffoldContract({
    contractName: "VolatileMarketplace",
  });

  // Load items from contract
  useEffect(() => {
    if (!marketplaceContract) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const loadItems = async () => {
      try {
        // Get all unique items with their prices
        const [gameItems, quantities, prices] = await marketplaceContract.read.getAllUniqueItemsWithPrices();

        const loadedItems: Item[] = [];

        // Process game items
        for (let i = 0; i < gameItems.length; i++) {
          const gameItemId = gameItems[i];
          const resource = Resources.items[gameItemId as keyof typeof Resources.items];
          if (!resource) continue;

          loadedItems.push({
            id: gameItemId,
            name: resource.name,
            imageUrl: `/assets/icons${resource.icon.path}`,
            quantity: Number(quantities[i]),
            price: Number(formatEther(prices[i])),
            slug: gameItemId,
            // rarity: resource.rarity || "",
            category: resource.type || "other",
          });
        }

        if (isMounted) {
          setItems(loadedItems);
        }
      } catch (error) {
        console.error("Error loading marketplace items:", error);
        if (isMounted) {
          setError("Failed to load marketplace items. Please try again later.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadItems();

    return () => {
      isMounted = false;
    };
  }, [marketplaceContract?.address]);

  const [searchTerm, setSearchTerm] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Filter items based on search term and active category
  const filteredItems = items.filter(
    item => searchTerm === "" || item.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // Handle pagination
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Get unique categories list for the filter
  const categories = Array.from(new Set(items.map(item => item.category)));

  // Handle category selection
  const handleCategoryClick = (category: string) => {
    if (activeCategory === category) {
      setActiveCategory(null); // Deselect if clicking the active category
    } else {
      setActiveCategory(category);
    }
    setCurrentPage(1); // Reset to first page when changing category
  };

  return (
    <ProtectedRoute>
      <div className="bg-[#1b1b1b] text-white min-h-screen p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-['PixelHeading'] text-[#c6c607] mb-2">Marketplace</h1>
            </div>
            <Link
              href="/inventory"
              className="bg-[#c6c607] hover:bg-[#a3a305] text-[#1a1c2c] px-6 py-3 rounded-md font-bold transition-all duration-200 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Sell Item
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:order-first order-last">
              <div className="bg-[#1a1c2c] shadow-md overflow-hidden">
                {/* Search Section */}
                <div className="p-4 border-b-4 border-amber-300">
                  {/* <h3 className="font-bold text-lg mb-3">Search for Items</h3> */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search items or games..."
                      className="w-full bg-[#1a1c2c] hover:border hover:border-[#c6c607] p-2 pr-10 text-white placeholder-white"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                    <button className="absolute right-3 top-3 text-[#c6c607]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={5}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </button>
                  </div>
                  <button
                    className="text-white mt-3 pl-32 flex justify-end items-center text-xs hover:text-[#c6c607] transition-colors"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? "Hide" : "Show"} advanced options
                    <span className="ml-1">{showAdvanced ? "▲" : "▼"}</span>
                  </button>

                  {showAdvanced && (
                    <div className="mt-3  space-y-3">
                      <div>
                        <label className="block font-bold text-sm mb-1">Price Range</label>
                        <div className="flex gap-2">
                          <input type="number" placeholder="Min" className="w-1/2 pl-5 bg-[#1b1b1b] p-1 text-white" />
                          <input type="number" placeholder="Max" className="w-1/2 pl-5 bg-[#1b1b1b] p-1 text-white" />
                        </div>
                      </div>
                      <div>
                        <label className="block  font-bold text-sm mb-1">Sort By</label>
                        <select className="w-full bg-[#1b1b1b] p-2 text-white">
                          <option>Price: Low to High</option>
                          <option>Price: High to Low</option>
                          <option>Newest First</option>
                          <option>Name (A-Z)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Browse by Category */}
                <div className="p-4">
                  <h3 className="font-bold text-lg pl-3 mb-3">Browse by Category</h3>
                  <div className="space-y-2">
                    {categories.map(category => (
                      <div
                        key={category}
                        className={`${
                          activeCategory === category ? "text-amber-50" : "hover:bg-amber-400"
                        }  p-3 flex items-center cursor-pointer transition-colors`}
                        onClick={() => handleCategoryClick(category!)}
                      >
                        <span className="font-medium capitalize">{category}</span>
                      </div>
                    ))}
                  </div>
                  {activeCategory && (
                    <button
                      onClick={() => setActiveCategory(null)}
                      className="pl-3 pt-5 text-amber-800 text-sm hover:text-amber-600 transition-colors flex items-center"
                    >
                      <span className="mr-2">✕</span> Clear filter
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Active Category Filter Display */}
              {activeCategory && (
                <div className="mb-4 bg-amber-200 p-3 border border-amber-400 flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="font-medium">Filtered by: </span>
                    <span className="ml-2 bg-amber-500 text-amber-50 px-3 py-1  text-sm capitalize">
                      {activeCategory}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveCategory(null)}
                    className="text-amber-800 hover:text-amber-600 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              )}

              {/* Table Header */}
              <div className="grid grid-cols-12 bg-[#1a1c2c] p-4 border-amber-800 border-b-0 font-bold">
                <div className="col-span-6 md:col-span-7">NAME</div>
                <div className="col-span-3 md:col-span-2 text-right">QUANTITY</div>
                <div className="col-span-3 text-right">PRICE</div>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="p-8 text-center bg-[#1a1c2c]">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c6c607]"></div>
                  </div>
                  <p className="mt-4 text-white">Loading marketplace items...</p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="p-8 text-center bg-red-900 text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="mt-4">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-white text-red-900 font-bold rounded hover:bg-gray-200 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Items List */}
              {!isLoading && !error && (
                <div className="overflow-hidden">
                  {currentItems.length > 0 ? (
                    currentItems.map((item, index) => (
                      <Link href={`/marketplace/${item.slug}`} key={item.id} className="block">
                        <div
                          className={`grid grid-cols-12 bg-[#1a1c2c] hover:bg-[#c6c607] p-4 transition-colors group ${index !== currentItems.length - 1 ? "" : ""}`}
                        >
                          <div className="col-span-6 md:col-span-7 flex items-center">
                            <div className="h-16 w-16 relative mr-20 overflow-hidden">
                              <Image src={item.imageUrl} alt={item.name} fill objectFit="contain" />
                            </div>
                            <div>
                              <h3 className="font-bold text-[#c6c607] group-hover:text-[#1a1c2c]">{item.name}</h3>
                              <p className="text-white text-xs capitalize group-hover:text-[#1a1c2c]">
                                {item.category}
                              </p>
                            </div>
                          </div>
                          <div className="col-span-3 md:col-span-2 text-right flex items-center justify-end">
                            <span className="font-medium text-white group-hover:text-[#1a1c2c]">
                              {item.quantity.toLocaleString()}
                            </span>
                          </div>
                          <div className="col-span-3 text-right flex flex-col items-end justify-center">
                            <div className="text-xs text-amber-700 group-hover:text-[#1a1c2c]">Starting at:</div>
                            <div className="font-bold text-white group-hover:text-[#1a1c2c]">{item.price} MON</div>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="p-8 text-center text-amber-700 bg-amber-200">
                      No items found matching your search. Try different keywords or filters.
                    </div>
                  )}
                </div>
              )}

              {/* Pagination Controls */}
              {!isLoading && !error && filteredItems.length > 0 && (
                <div className="mt-6 flex justify-between items-center">
                  <div className="text-white ">
                    Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredItems.length)} of{" "}
                    {filteredItems.length} items
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 border-2 ${
                        currentPage === 1
                          ? "bg-[#1a1c2c] text-white cursor-not-allowed"
                          : "bg-[#1a1c2c] text-white hover:bg-amber-400"
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 border-2 ${
                        currentPage === totalPages
                          ? "bg-[#1a1c2c] text-white cursor-not-allowed"
                          : "bg-[#1a1c2c]  text-white hover:bg-amber-400"
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
