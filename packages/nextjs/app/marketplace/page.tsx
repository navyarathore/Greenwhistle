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

  const filteredItems = items.filter(
    item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.game.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Get unique game list for the filter
  const games = Array.from(new Set(items.map(item => item.game)));

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

              {/* Browse by Game */}
              <div className="p-4">
                <h3 className="font-bold text-lg mb-3">Browse by Game</h3>
                <div className="space-y-2">
                  {games.map(game => (
                    <div
                      key={game}
                      className="bg-amber-300 hover:bg-amber-400 rounded-md p-3 flex items-center cursor-pointer transition-colors border border-amber-500"
                    >
                      <div className="h-6 w-6 bg-amber-600 mr-3 rounded-md flex items-center justify-center text-amber-100 text-xs font-bold">
                        {game.charAt(0)}
                      </div>
                      <span className="font-medium">{game}</span>
                    </div>
                  ))}
                </div>
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
              {["popular", "new", "sold"].map(tab => {
                const labels = { popular: "Popular Items", new: "Newly Listed", sold: "Recently Sold" };
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

            {/* Table Header */}
            <div className="grid grid-cols-12 bg-amber-300 p-4 rounded-t-lg border-2 border-amber-800 border-b-0 font-bold">
              <div className="col-span-6 md:col-span-7">NAME</div>
              <div className="col-span-3 md:col-span-2 text-right">QUANTITY</div>
              <div className="col-span-3 text-right">PRICE</div>
            </div>

            {/* Items List */}
            <div className="border-2 border-amber-800 rounded-b-lg overflow-hidden">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
                  <Link href={`/marketplace/${item.slug}`} key={item.id} className="block">
                    <div
                      className={`grid grid-cols-12 bg-amber-200 hover:bg-amber-300 p-4 transition-colors ${
                        index !== filteredItems.length - 1 ? "border-b border-amber-400" : ""
                      }`}
                    >
                      <div className="col-span-6 md:col-span-7 flex items-center">
                        <div className="h-16 w-16 relative mr-4 bg-amber-100 rounded-md border-2 border-amber-500 overflow-hidden">
                          <Image src={item.imageUrl} alt={item.name} layout="fill" objectFit="contain" />
                        </div>
                        <div>
                          <h3 className="font-bold text-amber-900">{item.name}</h3>
                          <p className="text-amber-700 text-sm">{item.game}</p>
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
                  No items found matching your search. Try different keywords.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
