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
    <div className="bg-gray-900 text-white min-h-screen p-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Tabs */}
          <div className="flex mb-4">
            <button
              className={`px-6 py-3 ${activeTab === "popular" ? "bg-green-700" : "bg-gray-800"}`}
              onClick={() => setActiveTab("popular")}
            >
              Popular Items
            </button>
            <button
              className={`px-6 py-3 ${activeTab === "new" ? "bg-green-700" : "bg-gray-800"}`}
              onClick={() => setActiveTab("new")}
            >
              Newly Listed
            </button>
            <button
              className={`px-6 py-3 ${activeTab === "sold" ? "bg-green-700" : "bg-gray-800"}`}
              onClick={() => setActiveTab("sold")}
            >
              Recently Sold
            </button>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 bg-gray-800 p-4 mb-2">
            <div className="col-span-6 font-medium">NAME</div>
            <div className="col-span-3 font-medium text-right">QUANTITY</div>
            <div className="col-span-3 font-medium text-right">PRICE</div>
          </div>

          {/* Items List */}
          <div className="space-y-2">
            {filteredItems.map(item => (
              <Link href={`/marketplace/${item.slug}`} key={item.id}>
                <div className="grid grid-cols-12 bg-gray-800 hover:bg-gray-700 p-4 transition">
                  <div className="col-span-6 flex items-center">
                    <div className="h-16 w-16 relative mr-4">
                      <Image src={item.imageUrl} alt={item.name} layout="fill" objectFit="contain" />
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-300">{item.name}</h3>
                      <p className="text-gray-400">{item.game}</p>
                    </div>
                  </div>
                  <div className="col-span-3 text-right flex items-center justify-end">
                    {item.quantity.toLocaleString()}
                  </div>
                  <div className="col-span-3 text-right flex flex-col items-end justify-center">
                    <div className="text-sm text-gray-400">Starting at:</div>
                    <div className="font-medium">
                      ${item.price.amount.toFixed(2)} {item.price.currency}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="bg-gray-800 p-4 h-fit">
          <div className="mb-6">
            <p className="mb-2">
              <a href="#" className="text-blue-300 hover:underline">
                Read about security requirements
              </a>{" "}
              for using the Community Market.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="mb-3">Search for Items</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                className="w-full bg-gray-700 p-2 pr-10 text-white"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <button className="absolute right-2 top-2 text-gray-400">🔍</button>
            </div>
            <button className="text-gray-300 mt-2 flex items-center" onClick={() => setShowAdvanced(!showAdvanced)}>
              Show advanced options...
              <span className="ml-1">{showAdvanced ? "▲" : "▼"}</span>
            </button>
          </div>

          <div className="mb-6">
            <h3 className="mb-3">Browse by Game</h3>
            <div className="space-y-2">
              {games.map(game => (
                <div key={game} className="bg-gray-700 hover:bg-gray-600 p-3 flex items-center cursor-pointer">
                  <div className="h-6 w-6 bg-gray-500 mr-3"></div>
                  <span>{game}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
