import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  type: "SEED" | "TOOL" | "CROP" | "FISH";
  quantity?: number;
}

interface MarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  npcType: "merchant" | "farmer";
  playerMoney: number;
  onPurchase: (item: Item) => void;
}

const MERCHANT_ITEMS: Item[] = [
  {
    id: "premium_hoe",
    name: "Premium Hoe",
    description: "A high-quality hoe that tills soil faster",
    price: 100,
    image: "/assets/tiles/hoe.png",
    type: "TOOL",
  },
  {
    id: "golden_watering_can",
    name: "Golden Watering Can",
    description: "Waters multiple crops at once",
    price: 200,
    image: "/assets/tiles/watering_can.png",
    type: "TOOL",
  },
  {
    id: "rare_seeds",
    name: "Rare Seeds",
    description: "Grows into valuable crops",
    price: 50,
    image: "/assets/tiles/seeds.png",
    type: "SEED",
    quantity: 5,
  },
];

const FARMER_ITEMS: Item[] = [
  {
    id: "basic_seeds",
    name: "Basic Seeds",
    description: "Standard crop seeds",
    price: 10,
    image: "/assets/tiles/seeds.png",
    type: "SEED",
    quantity: 10,
  },
  {
    id: "fertilizer",
    name: "Fertilizer",
    description: "Makes crops grow faster",
    price: 30,
    image: "/assets/tiles/fertilizer.png",
    type: "TOOL",
  },
];

export const MarketplaceModal = ({ isOpen, onClose, npcType, playerMoney, onPurchase }: MarketplaceModalProps) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const items = npcType === "merchant" ? MERCHANT_ITEMS : FARMER_ITEMS;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-gray-800 rounded-lg p-6 w-[800px] max-h-[80vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-blue-400">
                {npcType === "merchant" ? "Merchant's Shop" : "Farmer's Market"}
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-yellow-400 flex items-center">
                  <img src="/assets/tiles/coin.png" alt="coins" className="w-6 h-6 mr-2" />
                  {playerMoney}
                </span>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                  ✕
                </button>
              </div>
            </div>

            {/* Main content */}
            <div className="flex gap-6 flex-1 overflow-hidden">
              {/* Items list */}
              <div className="w-2/3 overflow-y-auto pr-4">
                <div className="grid grid-cols-2 gap-4">
                  {items.map(item => (
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedItem(item)}
                      className={`bg-gray-700 rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedItem?.id === item.id ? "ring-2 ring-blue-400" : ""
                      }`}
                    >
                      <div className="flex gap-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-contain bg-gray-800 rounded-lg p-2"
                        />
                        <div>
                          <h3 className="font-bold text-white">{item.name}</h3>
                          <p className="text-sm text-gray-400">{item.description}</p>
                          <div className="flex items-center mt-2">
                            <img src="/assets/tiles/coin.png" alt="price" className="w-4 h-4 mr-1" />
                            <span className="text-yellow-400">{item.price}</span>
                            {item.quantity && <span className="ml-2 text-gray-400">x{item.quantity}</span>}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Item details */}
              <div className="w-1/3 bg-gray-700 rounded-lg p-4">
                {selectedItem ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
                    <img
                      src={selectedItem.image}
                      alt={selectedItem.name}
                      className="w-full h-48 object-contain bg-gray-800 rounded-lg p-4 mb-4"
                    />
                    <h3 className="text-xl font-bold text-white mb-2">{selectedItem.name}</h3>
                    <p className="text-gray-400 mb-4">{selectedItem.description}</p>
                    <div className="flex items-center mb-4">
                      <img src="/assets/tiles/coin.png" alt="price" className="w-6 h-6 mr-2" />
                      <span className="text-yellow-400 text-xl">{selectedItem.price}</span>
                      {selectedItem.quantity && (
                        <span className="ml-2 text-gray-400">Quantity: {selectedItem.quantity}</span>
                      )}
                    </div>
                    <button
                      onClick={() => onPurchase(selectedItem)}
                      disabled={playerMoney < selectedItem.price}
                      className={`mt-auto py-2 px-4 rounded-lg font-bold transition-colors ${
                        playerMoney >= selectedItem.price
                          ? "bg-blue-500 hover:bg-blue-600 text-white"
                          : "bg-gray-600 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {playerMoney >= selectedItem.price ? "Purchase" : "Not enough coins"}
                    </button>
                  </motion.div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    Select an item to view details
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
