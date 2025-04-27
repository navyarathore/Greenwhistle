"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { formatEther } from "viem";
import Resources from "~~/game/resources/resource.json";
import { useScaffoldContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const formatPrice = (price: number): string => {
  return price.toFixed(4);
};

interface Item {
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
}

interface MarketStats {
  totalVolume: bigint;
  highestPrice: bigint;
  lowestPrice: bigint;
  lastSoldPrice: bigint;
  numberOfSales: bigint;
  totalListings: bigint;
  currentListings: bigint;
  avgSoldPrice: bigint;
}

interface Listing {
  listingId: bigint;
  seller: string;
  gameItemId: string;
  quantity: number;
  price: bigint; // Price per unit in wei
  listedAt: number; // Timestamp
  active: boolean;
}

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [showQuantityPopup, setShowQuantityPopup] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState<string>("0");
  const [mintError, setMintError] = useState<string | null>(null);
  const itemId = params.slug as string;

  // Get contract instance
  const { data: marketplaceContract } = useScaffoldContract({
    contractName: "VolatileMarketplace",
  });

  const { writeContractAsync } = useScaffoldWriteContract({
    contractName: "VolatileMarketplace",
  });

  // Update total price when quantity changes
  useEffect(() => {
    if (!listings.length) return;

    let remainingQty = quantity;
    let total = BigInt(0);

    for (const listing of listings) {
      if (remainingQty <= 0) break;
      const purchaseQty = Math.min(remainingQty, listing.quantity);
      total += listing.price * BigInt(purchaseQty);
      remainingQty -= purchaseQty;
    }

    setTotalPrice(formatEther(total));
  }, [quantity, listings]);

  // Handle quantity input change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!item) return;
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 1) {
      setQuantity(1);
    } else if (value > item.quantity) {
      setQuantity(item.quantity);
    } else {
      setQuantity(value);
    }
  };

  const handleMint = async () => {
    if (!marketplaceContract) {
      setMintError("Marketplace contract not found");
      return;
    }
    if (!item) {
      setMintError("Item not found");
      return;
    }
    if (quantity > item.quantity) {
      setMintError(`Only ${item.quantity} items available`);
      return;
    }

    try {
      setMintError(null);
      let rem = quantity;
      const toPurcahse = [];
      const purchaseQuantities = [];
      let price = BigInt(0);

      for (const list of listings) {
        if (rem === 0) break;
        toPurcahse.push(list.listingId);
        if (rem >= list.quantity) {
          purchaseQuantities.push(BigInt(list.quantity));
          rem -= Number(list.quantity);
          price += list.price * BigInt(list.quantity);
        } else {
          purchaseQuantities.push(BigInt(rem));
          price += list.price * BigInt(rem);
          rem = 0;
        }
      }

      await writeContractAsync({
        functionName: "buyGameItems",
        args: [toPurcahse, purchaseQuantities],
        value: price,
      });

      setShowQuantityPopup(false);
      setQuantity(1);
    } catch (error: any) {
      console.error("Error minting item:", error);
      if (error.message?.includes("Cannot buy your own listing")) {
        setMintError("Cannot buy your own listing");
      } else {
        setMintError("Failed to mint item. Please try again.");
      }
    }
  };

  // Load items from contract
  useEffect(() => {
    if (!marketplaceContract) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const loadItems = async () => {
      try {
        // Get resource details from resource.json
        const resource = Resources.items[itemId as keyof typeof Resources.items] as any;
        if (!resource) {
          setError("Item not found in resources");
          setIsLoading(false);
          return;
        }

        // Get marketplace stats for the item
        const [
          totalVolume,
          highestPrice,
          lowestPrice,
          lastSoldPrice,
          numberOfSales,
          totalListings,
          currentListings,
          avgSoldPrice,
        ] = await marketplaceContract.read.gameItemStats([itemId]);

        const [, listingPrice] = await marketplaceContract.read.getLowestPriceListingForGameItem([itemId]);

        const listingIds = await marketplaceContract.read.getActiveGameItemListings([itemId]);

        const listings = await Promise.all(listingIds.map(i => marketplaceContract.read.listings([i])));
        listings.sort((a, b) => Number(a[4] - b[4]));

        if (isMounted) {
          setItem({
            id: itemId,
            name: resource.name,
            imageUrl: `/assets/icons${resource.icon.path}`,
            quantity: Number(currentListings),
            price: Number(formatEther(listingPrice)),
            slug: itemId,
            rarity: resource.rarity || "common",
            category: resource.type || "other",
            description: resource.description || "A mysterious item from the game world.",
            type: resource.type || "Misc",
          });

          // Set market stats
          setMarketStats({
            totalVolume,
            highestPrice,
            lowestPrice,
            lastSoldPrice,
            numberOfSales,
            totalListings,
            currentListings,
            avgSoldPrice,
          });

          setListings(
            listings.map(list => ({
              listingId: list[0],
              seller: list[1],
              gameItemId: list[2],
              quantity: Number(list[3]),
              price: list[4],
              listedAt: Number(list[5]),
              active: list[6],
            })),
          );
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error loading item:", err);
          setError("Failed to load item details");
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
  }, [marketplaceContract?.address, itemId]);

  // Function to determine rarity color schemes
  const getRarityStyles = (rarity: string | undefined) => {
    switch (rarity) {
      case "common":
        return {
          bg: "bg-gray-800",
          text: "text-gray-300",
          border: "border-gray-600",
          glow: "shadow-[0_0_10px_rgba(156,163,175,0.5)]",
          badge: "bg-gray-700 text-gray-200",
        };
      case "uncommon":
        return {
          bg: "bg-green-800",
          text: "text-green-300",
          border: "border-green-600",
          glow: "shadow-[0_0_10px_rgba(34,197,94,0.5)]",
          badge: "bg-green-700 text-green-200",
        };
      case "rare":
        return {
          bg: "bg-blue-800",
          text: "text-blue-300",
          border: "border-blue-600",
          glow: "shadow-[0_0_10px_rgba(59,130,246,0.5)]",
          badge: "bg-blue-700 text-blue-200",
        };
      case "epic":
        return {
          bg: "bg-purple-800",
          text: "text-purple-300",
          border: "border-purple-600",
          glow: "shadow-[0_0_15px_rgba(168,85,247,0.6)]",
          badge: "bg-purple-700 text-purple-200",
        };
      case "legendary":
        return {
          bg: "bg-amber-800",
          text: "text-amber-300",
          border: "border-amber-600",
          glow: "shadow-[0_0_20px_rgba(245,158,11,0.7)]",
          badge: "bg-amber-700 text-amber-200",
        };
      default:
        return {
          bg: "bg-gray-800",
          text: "text-gray-300",
          border: "border-gray-600",
          glow: "shadow-[0_0_10px_rgba(156,163,175,0.5)]",
          badge: "bg-gray-700 text-gray-200",
        };
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#121212] text-white min-h-screen flex items-center justify-center font-mono">
        <div className="bg-[#1a1c2c] p-8 rounded-xl shadow-lg border-2 border-amber-400 max-w-md w-full">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-4 h-4 bg-amber-500 rounded-full animate-pulse"></div>
            <div className="w-4 h-4 bg-amber-500 rounded-full animate-pulse delay-75"></div>
            <div className="w-4 h-4 bg-amber-500 rounded-full animate-pulse delay-150"></div>
          </div>
          <p className="text-center mt-4 text-amber-300">Loading item details...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="bg-[#121212] text-white min-h-screen p-4 flex items-center justify-center font-mono">
        <div className="bg-[#1a1c2c] p-8 rounded-xl shadow-lg border-2 border-amber-400 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-amber-300 mb-2">Item Not Found</h2>
          <p className="text-amber-200 mb-6">The item you&apos;re looking for doesn&apos;t exist in our inventory.</p>
          <Link
            href="/marketplace"
            className="bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 px-6 rounded-lg shadow-md transition-all duration-150 inline-block"
          >
            Return to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const rarityStyles = getRarityStyles(item.rarity);

  return (
    <div className="bg-[#121212] text-white min-h-screen p-4 font-mono">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center">
          <Link
            href="/marketplace"
            className="text-amber-400 hover:text-amber-300 hover:underline font-bold flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Marketplace
          </Link>
          <span className="mx-2 text-amber-700">/</span>
          <span className="font-bold text-amber-300">{item.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Item Image */}
          <div className="lg:col-span-1">
            <div
              className={`bg-[#1a1c2c] p-6 rounded-xl shadow-lg border-2 ${rarityStyles.border} ${rarityStyles.glow}`}
            >
              <div className="relative rounded-lg overflow-hidden mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent z-10" />
                <div className="bg-[#13151f] p-6 rounded-lg flex items-center justify-center">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={256}
                    height={256}
                    className="p-2"
                    style={{ imageRendering: "pixelated" }}
                  />
                </div>
              </div>

              {/* Rarity Badge */}
              {item.rarity && (
                <div className="mb-4 text-center">
                  <span
                    className={`${rarityStyles.badge} px-4 py-1 rounded-full font-bold text-sm uppercase tracking-wider shadow-md`}
                  >
                    {item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
                  </span>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-[#13151f] rounded-lg text-center shadow-inner border border-amber-900/50 p-3">
                  <p className="text-xs text-amber-400 mb-1">Available</p>
                  <p className="text-lg font-bold text-amber-300">{item.quantity.toLocaleString()}</p>
                </div>
                <div className="bg-[#13151f] rounded-lg text-center shadow-inner border border-amber-900/50 p-3">
                  <p className="text-xs text-amber-400 mb-1">Category</p>
                  <p className="text-lg font-bold text-amber-300">{item.type || "Misc"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Item Details */}
          <div className="lg:col-span-2 flex flex-col">
            {/* Item Header */}
            <div className={`bg-[#1a1c2c] p-6 rounded-xl shadow-lg border-2 ${rarityStyles.border} mb-6`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                {/* Item Name */}
                <div>
                  <h1
                    className="text-3xl font-bold text-white mb-2"
                    style={{ textShadow: "0px 0px 8px rgba(251,191,36,0.5)" }}
                  >
                    {item.name}
                  </h1>
                  <p className={`${rarityStyles.text} text-sm`}>ID: #{item.id}</p>
                </div>

                {/* Price Box */}
                <div className="bg-gradient-to-r from-[#13151f] to-[#1a1c2c] px-5 py-3 rounded-lg shadow-lg border border-green-600 text-right w-full md:w-auto">
                  <p className="text-xs text-green-400">Current Price</p>
                  <div className="flex items-center justify-end">
                    <p className="text-2xl font-mono font-extrabold text-green-400">{item.price} MON </p>
                    <svg className="w-5 h-5 ml-1 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setShowQuantityPopup(true)}
                  className="bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-150 flex-1 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path
                      d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                  Mint Now
                </button>
                <button className="bg-[#13151f] hover:bg-[#1f2335] text-amber-400 font-bold py-3 px-6 rounded-lg shadow transition-all duration-150 border border-amber-700 flex-1 flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M19 21L12 17L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Add to Wishlist
                </button>
              </div>
            </div>

            {/* Quantity Selection Popup */}
            {showQuantityPopup && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-[#1a1c2c] p-6 rounded-xl shadow-lg border-2 border-amber-800 max-w-md w-full">
                  <h3 className="text-xl font-bold mb-4 text-amber-400">Select Quantity</h3>

                  {/* Error Message */}
                  {mintError && (
                    <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <p className="text-red-200 text-sm">{mintError}</p>
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-amber-300">Quantity:</label>
                      <span className="text-amber-400 text-sm">Available: {item.quantity}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="bg-amber-600 hover:bg-amber-700 text-white p-2 rounded"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.quantity}
                        value={quantity}
                        onChange={handleQuantityChange}
                        className="bg-[#13151f] border border-amber-700 text-amber-300 px-3 py-2 rounded w-20 text-center"
                      />
                      <button
                        onClick={() => setQuantity(Math.min(item.quantity, quantity + 1))}
                        className="bg-amber-600 hover:bg-amber-700 text-white p-2 rounded"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#13151f] p-4 rounded-lg mb-6">
                    <div className="flex justify-between text-amber-300 mb-2">
                      <span>Price per item:</span>
                      <span>{item?.price} MON</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-amber-400">
                      <span>Total Price:</span>
                      <span>{totalPrice} MON</span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => handleMint()}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold py-2 px-4 rounded transition-colors"
                    >
                      Confirm Purchase
                    </button>
                    <button
                      onClick={() => {
                        setShowQuantityPopup(false);
                        setMintError(null);
                      }}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs Navigation */}
            <div className="flex border-b-2 border-amber-800 mb-6">
              <button
                onClick={() => setActiveTab("details")}
                className={`py-3 px-6 font-bold rounded-t-lg transition-all duration-150 ${
                  activeTab === "details"
                    ? "bg-[#1a1c2c] text-amber-400 border-2 border-b-0 border-amber-800"
                    : "text-amber-500 hover:text-amber-400"
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`py-3 px-6 font-bold rounded-t-lg transition-all duration-150 ${
                  activeTab === "history"
                    ? "bg-[#1a1c2c] text-amber-400 border-2 border-b-0 border-amber-800"
                    : "text-amber-500 hover:text-amber-400"
                }`}
              >
                Market History
              </button>
            </div>

            {/* Tab Content */}
            <div className="bg-[#1a1c2c] p-6 rounded-xl shadow-lg border-2 border-amber-800 flex-grow">
              {activeTab === "details" && (
                <div>
                  <h3 className="text-xl font-bold mb-4 text-amber-400 border-b border-amber-700/50 pb-2">
                    Item Description
                  </h3>
                  <p className="text-amber-100 text-base leading-relaxed mb-6">
                    {item.description || "No description available for this item."}
                  </p>

                  <h3 className="text-xl font-bold mb-4 text-amber-400 border-b border-amber-700/50 pb-2">
                    Item Properties
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-[#13151f] p-4 rounded-lg shadow-inner border border-amber-900/50">
                      <p className="text-amber-500 text-sm mb-1">Type</p>
                      <p className="text-amber-300 font-bold">{item.type || "N/A"}</p>
                    </div>
                    {/* <div className="bg-[#13151f] p-4 rounded-lg shadow-inner border border-amber-900/50">
                      <p className="text-amber-500 text-sm mb-1">Rarity</p>
                      <p className="text-amber-300 font-bold">{item.rarity?.charAt(0).toUpperCase() + item.rarity?.slice(1) || "Common"}</p>
                    </div> */}
                    <div className="bg-[#13151f] p-4 rounded-lg shadow-inner border border-amber-900/50">
                      <p className="text-amber-500 text-sm mb-1">Category</p>
                      <p className="text-amber-300 font-bold">{item.category || "Other"}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "history" && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xl font-bold mb-4 text-amber-400 border-b border-amber-700/50 pb-2">
                        Market Stats
                      </h3>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-[#13151f] p-4 rounded-lg shadow-inner border border-amber-900/50">
                          <p className="text-amber-500 text-sm mb-1">Total Volume</p>
                          <p className="text-amber-300 font-bold">
                            {marketStats ? formatPrice(Number(formatEther(marketStats.totalVolume))) : "0.00"} MON
                          </p>
                        </div>
                        <div className="bg-[#13151f] p-4 rounded-lg shadow-inner border border-amber-900/50">
                          <p className="text-amber-500 text-sm mb-1">Highest Price</p>
                          <p className="text-amber-300 font-bold">
                            {marketStats ? formatPrice(Number(formatEther(marketStats.highestPrice))) : "0.00"} MON
                          </p>
                        </div>
                        <div className="bg-[#13151f] p-4 rounded-lg shadow-inner border border-amber-900/50">
                          <p className="text-amber-500 text-sm mb-1">Total Sales</p>
                          <p className="text-amber-300 font-bold">
                            {marketStats ? Number(marketStats.numberOfSales).toLocaleString() : "0"}
                          </p>
                        </div>
                        <div className="bg-[#13151f] p-4 rounded-lg shadow-inner border border-amber-900/50">
                          <p className="text-amber-500 text-sm mb-1">Avg. Price</p>
                          <p className="text-amber-300 font-bold">
                            {marketStats ? formatPrice(Number(formatEther(marketStats.avgSoldPrice))) : "0.00"} MON
                          </p>
                        </div>
                      </div>

                      <h3 className="text-xl font-bold mb-4 text-amber-400 border-b border-amber-700/50 pb-2">
                        Price History
                      </h3>
                      <div className="bg-[#13151f] h-64 rounded-lg shadow-inner border border-amber-900/50 p-4">
                        {/* Chart visualization */}
                        <div className="w-full h-full relative">
                          {/* X and Y axis */}
                          <div className="absolute left-0 bottom-0 w-full h-px bg-amber-700/50"></div>
                          <div className="absolute left-0 bottom-0 w-px h-full bg-amber-700/50"></div>

                          {/* Chart line */}
                          <svg className="absolute inset-4" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="rgb(245, 158, 11)" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="rgb(245, 158, 11)" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            <polyline
                              points="0,50 20,45 40,60 60,30 80,35 100,25"
                              fill="none"
                              stroke="#f59e0b"
                              strokeWidth="2"
                            />
                            <path
                              d="M0,50 20,45 40,60 60,30 80,35 100,25 L100,100 L0,100 Z"
                              fill="url(#gradient)"
                              stroke="none"
                            />
                          </svg>

                          {/* Price markers */}
                          <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-2 pr-2">
                            <span className="text-xs text-amber-500">{formatPrice(item.price * 1.5)} MON</span>
                            <span className="text-xs text-amber-500">{formatPrice(item.price)} MON</span>
                            <span className="text-xs text-amber-500">{formatPrice(item.price * 0.5)} MON</span>
                          </div>

                          {/* Date markers */}
                          <div className="absolute left-0 bottom-0 w-full flex justify-between px-2 pt-2">
                            <span className="text-xs text-amber-500">Apr 18</span>
                            <span className="text-xs text-amber-500">Apr 25</span>
                            <span className="text-xs text-amber-500">May 01</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mt-6 mb-4 text-amber-400 border-b border-amber-700/50 pb-2">
                        Recent Sales
                      </h3>
                      <div className="bg-[#13151f] rounded-lg shadow-inner border border-amber-900/50 overflow-hidden">
                        <table className="w-full font-mono text-sm">
                          <thead>
                            <tr className="text-left bg-[#1a1c2c]">
                              <th className="p-3 text-amber-400">Date</th>
                              <th className="p-3 text-amber-400">Buyer</th>
                              <th className="p-3 text-right text-amber-400">Price</th>
                            </tr>
                          </thead>
                          <tbody className="text-amber-200">
                            <tr className="border-b border-amber-900/30 hover:bg-[#1f2335]">
                              <td className="p-3">Apr 30, 2025</td>
                              <td className="p-3 text-amber-300">Pixel_Hero</td>
                              <td className="p-3 text-right text-green-400">{formatPrice(item.price * 0.98)} MON</td>
                            </tr>
                            <tr className="border-b border-amber-900/30 hover:bg-[#1f2335]">
                              <td className="p-3">Apr 28, 2025</td>
                              <td className="p-3 text-amber-300">DragonSlayer</td>
                              <td className="p-3 text-right text-green-400">{formatPrice(item.price * 1.02)} MON</td>
                            </tr>
                            <tr className="border-b border-amber-900/30 hover:bg-[#1f2335]">
                              <td className="p-3">Apr 25, 2025</td>
                              <td className="p-3 text-amber-300">QuestMaster</td>
                              <td className="p-3 text-right text-green-400">{formatPrice(item.price * 0.99)} MON</td>
                            </tr>
                            <tr className="hover:bg-[#1f2335]">
                              <td className="p-3">Apr 22, 2025</td>
                              <td className="p-3 text-amber-300">EpicTrader</td>
                              <td className="p-3 text-right text-green-400">{formatPrice(item.price * 1.05)} MON</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <h3 className="text-xl font-bold mt-6 mb-4 text-amber-400 border-b border-amber-700/50 pb-2">
                        Current Listings
                      </h3>
                      <div className="bg-[#13151f] rounded-lg shadow-inner border border-amber-900/50 overflow-hidden">
                        <table className="w-full font-mono text-sm">
                          <thead>
                            <tr className="text-left bg-[#1a1c2c]">
                              <th className="p-3 text-amber-400">Seller</th>
                              <th className="p-3 text-amber-400">Quantity</th>
                              <th className="p-3 text-right text-amber-400">Price</th>
                            </tr>
                          </thead>
                          <tbody className="text-amber-200">
                            <tr className="border-b border-amber-900/30 hover:bg-[#1f2335]">
                              <td className="p-3 text-amber-300">CryptoWizard</td>
                              <td className="p-3">3</td>
                              <td className="p-3 text-right text-green-400">{formatPrice(item.price)} MON</td>
                            </tr>
                            <tr className="border-b border-amber-900/30 hover:bg-[#1f2335]">
                              <td className="p-3 text-amber-300">MoonTrader</td>
                              <td className="p-3">1</td>
                              <td className="p-3 text-right text-green-400">{formatPrice(item.price * 1.05)} MON</td>
                            </tr>
                            <tr className="hover:bg-[#1f2335]">
                              <td className="p-3 text-amber-300">PixelKing</td>
                              <td className="p-3">5</td>
                              <td className="p-3 text-right text-green-400">{formatPrice(item.price * 1.1)} MON</td>
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
