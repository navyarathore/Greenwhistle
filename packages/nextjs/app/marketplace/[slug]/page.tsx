// app/marketplace/[slug]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Item, getItemBySlug } from "../types/item";

// app/marketplace/[slug]/page.tsx

// app/marketplace/[slug]/page.tsx

// app/marketplace/[slug]/page.tsx

// app/marketplace/[slug]/page.tsx

// app/marketplace/[slug]/page.tsx

// app/marketplace/[slug]/page.tsx

// app/marketplace/[slug]/page.tsx

// app/marketplace/[slug]/page.tsx

// app/marketplace/[slug]/page.tsx

// app/marketplace/[slug]/page.tsx

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="bg-gray-900 text-white min-h-screen p-4 flex items-center justify-center">
        <p>Loading item details...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="bg-gray-900 text-white min-h-screen p-4 flex items-center justify-center">
        <p>Item not found</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/marketplace" className="text-blue-300 hover:underline">
            Marketplace
          </Link>
          <span className="mx-2">&gt;</span>
          <Link href={`/marketplace?game=${encodeURIComponent(item.game)}`} className="text-blue-300 hover:underline">
            {item.game}
          </Link>
          <span className="mx-2">&gt;</span>
          <span>{item.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Item Image */}
          <div className="bg-gray-800 p-6 flex items-center justify-center">
            <div className="relative h-64 w-64">
              <Image src={item.imageUrl} alt={item.name} layout="fill" objectFit="contain" />
            </div>
          </div>

          {/* Item Details */}
          <div className="md:col-span-2 bg-gray-800 p-6">
            <h1 className="text-2xl font-bold mb-2 text-blue-300">{item.name}</h1>
            <p className="text-gray-400 mb-4">{item.game}</p>

            {item.description && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Description</h3>
                <p>{item.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Quantity Available</h3>
                <p className="text-xl">{item.quantity.toLocaleString()}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Starting Price</h3>
                <p className="text-xl text-green-400">
                  ${item.price.amount.toFixed(2)} {item.price.currency}
                </p>
              </div>
            </div>

            {item.rarity && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Rarity</h3>
                <span
                  className={`px-3 py-1 rounded ${
                    item.rarity === "common"
                      ? "bg-gray-500"
                      : item.rarity === "uncommon"
                        ? "bg-blue-600"
                        : item.rarity === "rare"
                          ? "bg-purple-600"
                          : "bg-orange-500"
                  }`}
                >
                  {item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
                </span>
              </div>
            )}

            <div className="mt-8">
              <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-md">
                Purchase Now
              </button>
              <button className="ml-4 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-md">
                Add to Wishlist
              </button>
            </div>
          </div>
        </div>

        {/* Market History Section */}
        <div className="mt-8 bg-gray-800 p-6">
          <h2 className="text-xl font-bold mb-4">Market History</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Price History</h3>
              <div className="bg-gray-700 h-48 flex items-center justify-center">
                <p className="text-gray-400">Chart visualization would go here</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-3">Recent Sales</h3>
              <div className="bg-gray-700 p-4">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-600">
                      <td className="py-2">Apr 22, 2025</td>
                      <td>${(item.price.amount * 0.98).toFixed(2)}</td>
                    </tr>
                    <tr className="border-t border-gray-600">
                      <td className="py-2">Apr 21, 2025</td>
                      <td>${(item.price.amount * 1.02).toFixed(2)}</td>
                    </tr>
                    <tr className="border-t border-gray-600">
                      <td className="py-2">Apr 20, 2025</td>
                      <td>${(item.price.amount * 0.99).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
