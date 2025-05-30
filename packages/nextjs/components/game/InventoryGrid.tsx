// A React component to display the inventory grid using the InventorySystem types
import React from "react";
import Image from "next/image";
import { Item } from "~~/game/resources/Item";

interface InventoryGridProps {
  items: Item[];
  maxSlots?: number;
  tilesetUrl?: string;
}

export const InventoryGrid: React.FC<InventoryGridProps> = ({ items, maxSlots = 16 }) => {
  const renderItemIcon = (item: Item) => {
    return (
      <Image
        src={item.type.icon.path}
        alt={item.type.name}
        width={40}
        height={40}
        className="object-contain mb-1"
        priority
      />
    );
  };

  return (
    <div className="inventory-container bg-gray-800/50 p-4 rounded-lg backdrop-blur-sm border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-3 flex items-center">
        <span className="mr-2">📦</span> Inventory
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {items.map(invItem => (
          <div
            key={invItem.id}
            className="inventory-slot bg-gray-900/80 rounded p-2 flex flex-col items-center justify-center border border-gray-700 hover:border-purple-500 cursor-pointer transition-all hover:scale-105"
          >
            {renderItemIcon(invItem)}
            <div className="item-name text-white text-sm">{invItem.name}</div>
            <div className="item-quantity text-blue-300 text-xs">x{invItem.quantity}</div>
          </div>
        ))}
        {/* Empty inventory slots */}
        {Array.from({ length: Math.max(0, maxSlots - items.length) }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="inventory-slot bg-gray-900/40 rounded p-2 flex items-center justify-center border border-gray-800 min-h-[80px]"
          >
            <div className="text-gray-600 text-xs">Empty</div>
          </div>
        ))}
      </div>
    </div>
  );
};
