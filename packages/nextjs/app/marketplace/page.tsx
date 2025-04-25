"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Item, getItems } from "./types/item";

export default function MarketplacePage() {
  const items = getItems();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState("popular");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Filter items based on search term and active category
  const filteredItems = items.filter(
    item =>
      (searchTerm === "" ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.game.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (activeCategory === null || item.category === activeCategory),
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
    <div className="bg-amber-100 text-amber-900 min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-amber-900 mb-2">Marketplace</h1>
          <p className="text-amber-800">Discover and trade unique game items from the Greenwhistle universe</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:order-first order-last">
            <div className="bg-amber-200 rounded-lg border-2 border-amber-800 shadow-md overflow-hidden">
              {/* Search Section */}
              <div className="p-4 border-b-2 border-amber-300">
                <h3 className="font-bold text-lg mb-3">Search for Items</h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search items or games..."
                    className="w-full bg-amber-50 border-2 border-amber-400 rounded-md p-2 pr-10 text-amber-900 placeholder-amber-500 focus:outline-none focus:border-amber-600"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                  <button className="absolute right-3 top-3 text-amber-600">
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
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>
                </div>
                <button
                  className="text-amber-800 mt-3 flex items-center text-sm hover:text-amber-600 transition-colors"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  {showAdvanced ? "Hide" : "Show"} advanced options
                  <span className="ml-1">{showAdvanced ? "▲" : "▼"}</span>
                </button>

                {showAdvanced && (
                  <div className="mt-3 pt-3 border-t border-amber-300 space-y-3">
                    <div>
                      <label className="block text-sm mb-1">Price Range</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          className="w-1/2 bg-amber-50 border-2 border-amber-400 rounded-md p-1 text-amber-900"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          className="w-1/2 bg-amber-50 border-2 border-amber-400 rounded-md p-1 text-amber-900"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Sort By</label>
                      <select className="w-full bg-amber-50 border-2 border-amber-400 rounded-md p-1 text-amber-900">
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
                <h3 className="font-bold text-lg mb-3">Browse by Category</h3>
                <div className="space-y-2">
                  {categories.map(category => (
                    <div
                      key={category}
                      className={`${
                        activeCategory === category
                          ? "bg-amber-500 border-amber-700 text-amber-50"
                          : "bg-amber-300 border-amber-500 hover:bg-amber-400"
                      } rounded-md p-3 flex items-center cursor-pointer transition-colors border`}
                      onClick={() => handleCategoryClick(category!)}
                    >
                      <span className="font-medium capitalize">{category}</span>
                    </div>
                  ))}
                </div>
                {activeCategory && (
                  <button
                    onClick={() => setActiveCategory(null)}
                    className="mt-4 text-amber-800 text-sm hover:text-amber-600 transition-colors flex items-center"
                  >
                    <span className="mr-1">✕</span> Clear filter
                  </button>
                )}
              </div>

              {/* Info Box */}
              <div className="p-4 bg-amber-300 border-t-2 border-amber-500">
                <p className="text-sm">
                  <Link href="#" className="text-amber-800 font-medium hover:underline">
                    Read about security requirements
                  </Link>{" "}
                  for using the Community Market.
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="flex rounded-t-lg overflow-hidden border-2 border-amber-800 mb-4">
              {["popular", "new"].map(tab => {
                const labels = { popular: "Popular Items", new: "Newly Listed" };
                return (
                  <button
                    key={tab}
                    className={`px-6 py-3 flex-1 font-medium text-center transition-colors ${
                      activeTab === tab
                        ? "bg-amber-500 text-amber-50"
                        : "bg-amber-300 text-amber-800 hover:bg-amber-400"
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {labels[tab as keyof typeof labels]}
                  </button>
                );
              })}
            </div>

            {/* Active Category Filter Display */}
            {activeCategory && (
              <div className="mb-4 bg-amber-200 p-3 rounded-lg border border-amber-400 flex justify-between items-center">
                <div className="flex items-center">
                  <span className="font-medium">Filtered by: </span>
                  <span className="ml-2 bg-amber-500 text-amber-50 px-3 py-1 rounded-full text-sm capitalize">
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
            <div className="grid grid-cols-12 bg-amber-300 p-4 rounded-t-lg border-2 border-amber-800 border-b-0 font-bold">
              <div className="col-span-6 md:col-span-7">NAME</div>
              <div className="col-span-3 md:col-span-2 text-right">QUANTITY</div>
              <div className="col-span-3 text-right">PRICE</div>
            </div>

            {/* Items List */}
            <div className="border-2 border-amber-800 rounded-b-lg overflow-hidden">
              {currentItems.length > 0 ? (
                currentItems.map((item, index) => (
                  <Link href={`/marketplace/${item.slug}`} key={item.id} className="block">
                    <div
                      className={`grid grid-cols-12 bg-amber-200 hover:bg-amber-300 p-4 transition-colors ${
                        index !== currentItems.length - 1 ? "border-b border-amber-400" : ""
                      }`}
                    >
                      <div className="col-span-6 md:col-span-7 flex items-center">
                        <div className="h-16 w-16 relative mr-4 bg-amber-100 rounded-md border-2 border-amber-500 overflow-hidden">
                          <Image src={item.imageUrl} alt={item.name} layout="fill" objectFit="contain" />
                        </div>
                        <div>
                          <h3 className="font-bold text-amber-900">{item.name}</h3>
                          <p className="text-amber-700 text-sm">{item.game}</p>
                          <p className="text-amber-700 text-xs capitalize">{item.category}</p>
                        </div>
                      </div>
                      <div className="col-span-3 md:col-span-2 text-right flex items-center justify-end">
                        <span className="font-medium">{item.quantity.toLocaleString()}</span>
                      </div>
                      <div className="col-span-3 text-right flex flex-col items-end justify-center">
                        <div className="text-xs text-amber-700">Starting at:</div>
                        <div className="font-bold text-amber-900">
                          ${item.price.amount.toFixed(2)} {item.price.currency}
                        </div>
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

            {/* Pagination Controls */}
            {filteredItems.length > 0 && (
              <div className="mt-6 flex justify-between items-center">
                <div className="text-amber-800">
                  Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredItems.length)} of{" "}
                  {filteredItems.length} items
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded border-2 ${
                      currentPage === 1
                        ? "bg-amber-200 border-amber-300 text-amber-500 cursor-not-allowed"
                        : "bg-amber-300 border-amber-500 text-amber-900 hover:bg-amber-400"
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded border-2 ${
                      currentPage === totalPages
                        ? "bg-amber-200 border-amber-300 text-amber-500 cursor-not-allowed"
                        : "bg-amber-300 border-amber-500 text-amber-900 hover:bg-amber-400"
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
  );
}
