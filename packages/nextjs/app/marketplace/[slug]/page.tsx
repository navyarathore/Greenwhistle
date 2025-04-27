"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Item, getItemBySlug } from "../types/item";

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    if (params.slug) {
      const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
      const foundItem = getItemBySlug(slug);
      if (foundItem) {
        setItem(foundItem);
      } else {
        // Handle item not found
        router.push("/marketplace");
      }
      setLoading(false);
    }
  }, [params.slug, router]);

  if (loading) {
    return (
      <div className="bg-amber-300 text-amber-900 min-h-screen flex items-center justify-center font-mono">
        <div className="bg-amber-200 p-8 rounded-xl shadow-md border-2 border-amber-400 max-w-md w-full">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 bg-amber-600 rounded-full animate-pulse"></div>
            <div className="w-4 h-4 bg-amber-600 rounded-full animate-pulse delay-75"></div>
            <div className="w-4 h-4 bg-amber-600 rounded-full animate-pulse delay-150"></div>
          </div>
          <p className="text-center mt-4 text-amber-800">Loading item details...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="bg-amber-300 text-amber-900 min-h-screen p-4 flex items-center justify-center font-mono">
        <div className="bg-amber-200 p-8 rounded-xl shadow-md border-2 border-amber-400 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-amber-800 mb-2">Item Not Found</h2>
          <p className="text-amber-700 mb-6">The item you&apos;re looking for doesn&apos;t exist in our inventory.</p>
          <Link
            href="/marketplace"
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-6 rounded shadow-md transition-all duration-150 inline-block"
          >
            Return to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  // Function to determine rarity color schemes
  const getRarityStyles = (rarity: string | undefined) => {
    switch (rarity) {
      case "common":
        return {
          bg: "bg-gray-200",
          text: "text-gray-800",
          border: "border-gray-400",
          glow: "shadow-md",
        };
      case "uncommon":
        return {
          bg: "bg-green-200",
          text: "text-green-800",
          border: "border-green-400",
          glow: "shadow-md",
        };
      case "rare":
        return {
          bg: "bg-blue-200",
          text: "text-blue-800",
          border: "border-blue-400",
          glow: "shadow-md",
        };
      case "epic":
        return {
          bg: "bg-purple-200",
          text: "text-purple-800",
          border: "border-purple-400",
          glow: "shadow-md",
        };
      case "legendary":
        return {
          bg: "bg-orange-200",
          text: "text-orange-800",
          border: "border-orange-400",
          glow: "shadow-md",
        };
      default:
        return {
          bg: "bg-gray-200",
          text: "text-gray-800",
          border: "border-gray-400",
          glow: "shadow-md",
        };
    }
  };

  const rarityStyles = item.rarity ? getRarityStyles(item.rarity) : getRarityStyles("common");

  return (
    <div className="bg-[#1b1b1b] text-white min-h-screen p-4 font-mono">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm bg-amber-200 p-3 rounded-lg shadow-md inline-block">
          <Link href="/marketplace" className="text-amber-700 hover:text-amber-900 hover:underline font-bold">
            Marketplace
          </Link>
          <span className="mx-2 text-amber-500">&gt;</span>
          <Link
            href={`/marketplace?game=${encodeURIComponent(item.game)}`}
            className="text-amber-700 hover:text-amber-900 hover:underline font-bold"
          >
            {item.game}
          </Link>
          <span className="mx-2 text-amber-500">&gt;</span>
          <span className="font-bold text-amber-800">{item.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Item Image with Frame */}
          <div
            className="bg-[#1a1c2c] p-6 rounded-xl shadow-md border-2 border-amber-400 flex flex-col"
            style={{ imageRendering: "pixelated" }}
          >
            <div
              className={`relative h-64 w-full rounded-lg overflow-hidden mb-4 ${rarityStyles.border} border-4 ${rarityStyles.glow}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100/30 to-transparent z-10"></div>
              <Image
                src={item.imageUrl}
                alt={item.name}
                layout="fill"
                objectFit="contain"
                className="p-2"
                style={{ imageRendering: "pixelated" }}
              />
            </div>

            {/* Rarity Badge */}
            {item.rarity && (
              <div className="mb-4 text-center">
                <span
                  className={`${rarityStyles.bg} ${rarityStyles.text} px-4 py-1 rounded-full font-bold text-sm uppercase tracking-wider ${rarityStyles.glow}`}
                >
                  {item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
                </span>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 mt-auto">
              <div className="bg-amber-100 mb-[300px] rounded text-center shadow-inner border border-amber-300">
                <p className="text-xs text-amber-700 mb-1">Quantity</p>
                <p className="text-lg font-bold text-amber-900">{item.quantity.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Item Details with Tabs */}
          <div className="lg:col-span-2 flex flex-col">
            {/* Item Header */}
            <div className="bg-[#1a1c2c] p-6 rounded-2xl shadow-lg border-2 border-amber-400 mb-6">
              <div className="flex justify-between items-start mb-6">
                {/* Item Name */}
                <div>
                  <h1
                    className="text-3xl font-['PixelHeading'] text-white"
                    style={{ textShadow: "1px 1px 0 rgba(251,191,36,0.5)" }}
                  >
                    {item.name}
                  </h1>
                </div>

                {/* Price Box */}
                <div className="bg-gradient-to-r from-green-100 to-green-200 px-5 py-3 rounded-lg shadow border border-green-300 text-right">
                  <p className="text-xs text-green-700">Current Price</p>
                  <p className="text-2xl font-mono font-extrabold text-green-900">
                    ${item.price.amount.toFixed(2)} {item.price.currency}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow transition-all duration-150 flex-1">
                  Mint Now
                </button>
                <button className="bg-amber-400 hover:bg-amber-500 text-amber-900 font-bold py-3 px-6 rounded-lg shadow transition-all duration-150 border border-amber-500 flex-1">
                  Add to Wishlist
                </button>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b-2 border-amber-400 mb-6">
              <button
                onClick={() => setActiveTab("details")}
                className={`py-2 px-4 font-bold ${activeTab === "details" ? "text-[#c6c607] -mb-0.5" : "text-[white]"}`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`py-2 px-4 font-bold ${activeTab === "history" ? "text-[#c6c607] -mb-0.5" : "text-[white]"}`}
              >
                Market History
              </button>
            </div>

            {/* Tab Content */}
            <div className="bg-[#1a1c2c] p-6 rounded-xl shadow-md border-2 border-amber-400 flex-grow">
              {activeTab === "details" && (
                <div>
                  <h3 className="text-xl font-bold mb-4 text-white border-b border-amber-300 pb-2">Item Description</h3>
                  <p className="text-white text-base leading-relaxed mb-6">
                    {item.description || "No description available for this item."}
                  </p>

                  <h3 className="text-xl font-bold mb-4 text-white border-b border-amber-300 pb-2">Item Properties</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-amber-100 p-3 rounded shadow-inner border border-amber-300">
                      <p className="text-amber-700 text-sm">Type</p>
                      <p className="text-amber-900 font-bold">{item.type || "N/A"}</p>
                    </div>
                    <div className="bg-amber-100 p-3 rounded shadow-inner border border-amber-300">
                      <p className="text-amber-700 text-sm">Level Required</p>
                      <p className="text-amber-900 font-bold">{item.levelRequired || "N/A"}</p>
                    </div>
                    <div className="bg-amber-100 p-3 rounded shadow-inner border border-amber-300">
                      <p className="text-amber-700 text-sm">Durability</p>
                      <p className="text-amber-900 font-bold">
                        {item.durability ? `${item.durability.current}/${item.durability.max}` : "N/A"}
                      </p>
                    </div>
                    <div className="bg-amber-100 p-3 rounded shadow-inner border border-amber-300">
                      <p className="text-amber-700 text-sm">Weight</p>
                      <p className="text-amber-900 font-bold">{item.weight ? `${item.weight}` : "N/A"}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "history" && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xl font-bold mb-4 text-white border-b border-amber-300 pb-2">
                        Price History
                      </h3>
                      <div className="bg-white h-64 rounded shadow-md border border-amber-300 p-4">
                        {/* Simple line chart visualization */}
                        <div className="w-full h-full relative">
                          {/* X and Y axis */}
                          <div className="absolute left-0 bottom-0 w-full h-px bg-amber-400"></div>
                          <div className="absolute left-0 bottom-0 w-px h-full bg-amber-400"></div>

                          {/* Chart line */}
                          <svg className="absolute inset-4" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <polyline
                              points="0,50 20,45 40,60 60,30 80,35 100,25"
                              fill="none"
                              stroke="#d97706"
                              strokeWidth="2"
                            />
                            <polyline
                              points="0,50 20,45 40,60 60,30 80,35 100,25"
                              fill="rgba(217,119,6,0.1)"
                              stroke="none"
                              strokeWidth="0"
                            />
                          </svg>

                          {/* Price markers */}
                          <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-2 pr-2">
                            <span className="text-xs text-amber-600">$50</span>
                            <span className="text-xs text-amber-600">$25</span>
                            <span className="text-xs text-amber-600">$0</span>
                          </div>

                          {/* Date markers */}
                          <div className="absolute left-0 bottom-0 w-full flex justify-between px-2 pt-2">
                            <span className="text-xs text-amber-600">Apr 18</span>
                            <span className="text-xs text-amber-600">Apr 22</span>
                          </div>

                          <div className="absolute top-2 left-0 w-full text-center text-amber-700 text-sm font-bold">
                            Price Trend
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-4  text-white border-b border-amber-300 pb-2">
                        Recent Sales
                      </h3>
                      <div className="bg-white rounded shadow-md border border-amber-300">
                        <table className="w-full font-mono text-sm">
                          <thead>
                            <tr className="text-left text-white border-b border-amber-300">
                              <th className="p-3">Date</th>
                              <th className="p-3">Buyer</th>
                              <th className="p-3 text-right">Price</th>
                            </tr>
                          </thead>
                          <tbody className="text-amber-900">
                            <tr className="border-b border-amber-200 hover:bg-amber-100">
                              <td className="p-3">Apr 22, 2025</td>
                              <td className="p-3 text-amber-800">Pixel_Hero</td>
                              <td className="p-3 text-right text-green-700">
                                ${(item.price.amount * 0.98).toFixed(2)}
                              </td>
                            </tr>
                            <tr className="border-b border-amber-200 hover:bg-amber-100">
                              <td className="p-3">Apr 21, 2025</td>
                              <td className="p-3 text-amber-800">DragonSlayer</td>
                              <td className="p-3 text-right text-green-700">
                                ${(item.price.amount * 1.02).toFixed(2)}
                              </td>
                            </tr>
                            <tr className="border-b border-amber-200 hover:bg-amber-100">
                              <td className="p-3">Apr 20, 2025</td>
                              <td className="p-3 text-amber-800">QuestMaster</td>
                              <td className="p-3 text-right text-green-700">
                                ${(item.price.amount * 0.99).toFixed(2)}
                              </td>
                            </tr>
                            <tr className="hover:bg-amber-100">
                              <td className="p-3">Apr 19, 2025</td>
                              <td className="p-3 text-amber-800">EpicTrader</td>
                              <td className="p-3 text-right text-green-700">
                                ${(item.price.amount * 1.05).toFixed(2)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
