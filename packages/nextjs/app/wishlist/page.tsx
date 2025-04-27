"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface WishlistItem {
  id: string;
  name: string;
  imageUrl: string;
  quantity: number;
  price: number;
  slug: string;
  rarity?: string;
  category: string;
  type?: string;
  description?: string;
  addedAt: number;
}

const getRarityStyles = (rarity: string | undefined) => {
  switch (rarity) {
    case "common":
      return {
        bg: "bg-gray-800",
        text: "text-gray-300",
        border: "border-gray-600",
        glow: "shadow-[0_0_10px_rgba(156,163,175,0.5)]",
      };
    case "uncommon":
      return {
        bg: "bg-green-800",
        text: "text-green-300",
        border: "border-green-600",
        glow: "shadow-[0_0_10px_rgba(34,197,94,0.5)]",
      };
    case "rare":
      return {
        bg: "bg-blue-800",
        text: "text-blue-300",
        border: "border-blue-600",
        glow: "shadow-[0_0_10px_rgba(59,130,246,0.5)]",
      };
    case "epic":
      return {
        bg: "bg-purple-800",
        text: "text-purple-300",
        border: "border-purple-600",
        glow: "shadow-[0_0_15px_rgba(168,85,247,0.6)]",
      };
    case "legendary":
      return {
        bg: "bg-amber-800",
        text: "text-amber-300",
        border: "border-amber-600",
        glow: "shadow-[0_0_20px_rgba(245,158,11,0.7)]",
      };
    default:
      return {
        bg: "bg-gray-800",
        text: "text-gray-300",
        border: "border-gray-600",
        glow: "shadow-[0_0_10px_rgba(156,163,175,0.5)]",
      };
  }
};

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [sortBy, setSortBy] = useState<"recent" | "price" | "name">("recent");

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem("wishlist") || "[]") as WishlistItem[];
    setWishlistItems(items);
  }, []);

  const removeFromWishlist = (itemId: string) => {
    const updatedWishlist = wishlistItems.filter(item => item.id !== itemId);
    setWishlistItems(updatedWishlist);
    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
  };

  const sortedItems = [...wishlistItems].sort((a, b) => {
    switch (sortBy) {
      case "price":
        return b.price - a.price;
      case "name":
        return a.name.localeCompare(b.name);
      case "recent":
      default:
        return b.addedAt - a.addedAt;
    }
  });

  return (
    <div className="bg-[#121212] text-white min-h-screen p-4 font-mono">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-amber-400 mb-2">My Wishlist</h1>
            <p className="text-amber-300">{wishlistItems.length} items saved</p>
          </div>
        </div>

        {/* Wishlist Grid */}
        {wishlistItems.length === 0 ? (
          <div className="text-center py-16 bg-[#1a1c2c] rounded-xl border-2 border-amber-800">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-amber-400 mb-4">Your wishlist is empty</h2>
            <p className="text-amber-300 mb-6">Start adding items from the marketplace!</p>
            <Link
              href="/marketplace"
              className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedItems.map(item => {
              const rarityStyles = getRarityStyles(item.rarity);
              return (
                <div
                  key={item.id}
                  className={`bg-[#1a1c2c] rounded-xl overflow-hidden border-2 ${rarityStyles.border} ${rarityStyles.glow} transition-transform hover:scale-[1.02] relative group`}
                >
                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="absolute top-2 right-2 z-10 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove from wishlist"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <Link href={`/marketplace/${item.slug}`}>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent z-10" />
                      <div className="bg-[#13151f] p-4">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={200}
                          height={200}
                          className="w-full h-48 object-contain"
                          style={{ imageRendering: "pixelated" }}
                        />
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="text-lg font-bold text-amber-300 mb-2">{item.name}</h3>

                      <div className="flex justify-between items-center mb-3">
                        {/* <span className={`${rarityStyles.text} text-sm`}>
                          {item.rarity?.charAt(0).toUpperCase() + item.rarity?.slice(1) || "Common"}
                        </span> */}
                        <span className="text-green-400 font-bold">{item.price} MON</span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-amber-400">{item.type || "Misc"}</span>
                        <span className="text-amber-300">{new Date(item.addedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
