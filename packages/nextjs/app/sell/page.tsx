"use client";

import { ChangeEvent, DragEvent, FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface FormData {
  name: string;
  description: string;
  price: string;
  quantity: string;
  category: string;
  image: File | null;
}

export default function SellPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    price: "",
    quantity: "1",
    category: "resources",
    image: null,
  });
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFormData(prev => ({ ...prev, image: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Here we would upload to IPFS and interact with smart contract
      // For now just simulating with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      router.push("/marketplace");
    } catch (error) {
      console.error("Error listing item:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: "resources", label: "Resources", icon: "🌲" },
    { value: "tools", label: "Tools", icon: "🔨" },
    { value: "weapons", label: "Weapons", icon: "⚔️" },
    { value: "farming", label: "Farming", icon: "🌱" },
    { value: "furniture", label: "Furniture", icon: "🪑" },
  ];

  const inputStyles =
    "block w-full rounded-lg border-0 px-4 py-3 bg-indigo-50 text-indigo-800 shadow-md ring-1 ring-inset ring-indigo-200 placeholder:text-indigo-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-all duration-200";

  return (
    <div className="min-h-screen bg-[#1a1c2c] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-indigo-900 rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white p-8">
            <h1 className="text-3xl font-bold text-center">List Your Item</h1>
            <p className="text-center text-indigo-100 mt-2">Create your listing to sell on the marketplace</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Image Upload */}
              <div className="space-y-6">
                <div
                  className={`relative border-2 ${dragActive ? "border-indigo-500 bg-indigo-100" : "border-dashed border-indigo-400 bg-indigo-50"} rounded-2xl flex flex-col items-center justify-center p-8 transition-all duration-200 h-80`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {previewUrl ? (
                    <div className="relative w-full h-full mb-4">
                      <Image src={previewUrl} alt="Item preview" fill className="rounded-xl object-contain" />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewUrl("");
                          setFormData(prev => ({ ...prev, image: null }));
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-indigo-500 text-6xl mb-4">📸</div>
                      <p className="text-indigo-700 text-center font-medium mb-2">Drag & drop your image here</p>
                      <p className="text-indigo-500 text-sm text-center mb-4">or</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer bg-[#c6c607] hover:bg-[#b2b206] text-indigo-900 px-6 py-3 rounded-lg font-medium transition-colors transform hover:scale-105 shadow-md"
                      >
                        Choose Image
                      </label>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-100 mb-2">Category</label>
                  <div className="grid grid-cols-5 gap-2">
                    {categories.map(cat => (
                      <div
                        key={cat.value}
                        onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                        className={`cursor-pointer flex flex-col items-center justify-center p-3 rounded-lg shadow-sm ${
                          formData.category === cat.value
                            ? "bg-indigo-200 border-0 text-indigo-800 shadow-md scale-105"
                            : "bg-indigo-800 text-indigo-200 hover:bg-indigo-700"
                        } transition-all duration-200`}
                      >
                        <span className="text-2xl mb-1">{cat.icon}</span>
                        <span className="text-xs font-medium">{cat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Details */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-indigo-100 mb-2">Item Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFormData(prev => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="What are you selling?"
                    className={inputStyles}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-100 mb-2">Description</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData(prev => ({ ...prev, description: e.target.value }))
                    }
                    rows={5}
                    placeholder="Describe your item in detail..."
                    className={inputStyles}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-indigo-100 mb-2">Price (ETH)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <span className="text-indigo-500 font-bold">Ξ</span>
                      </div>
                      <input
                        type="number"
                        step="0.001"
                        required
                        value={formData.price}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setFormData(prev => ({ ...prev, price: e.target.value }))
                        }
                        placeholder="0.00"
                        className={`${inputStyles} pl-8`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-indigo-100 mb-2">Quantity</label>
                    <div className="relative flex items-center">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData(prev => ({ ...prev, quantity: String(Math.max(1, Number(prev.quantity) - 1)) }))
                        }
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-l-lg px-4 py-3 transition-colors shadow-md"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formData.quantity}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setFormData(prev => ({ ...prev, quantity: e.target.value }))
                        }
                        className="block w-full text-center py-3 bg-indigo-50 text-indigo-800 border-0 ring-1 ring-inset ring-indigo-200 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, quantity: String(Number(prev.quantity) + 1) }))}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-r-lg px-4 py-3 transition-colors shadow-md"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 flex justify-between items-center pt-6 border-t border-indigo-800">
              <button
                type="button"
                onClick={() => router.back()}
                className="text-indigo-200 hover:text-indigo-100 font-medium flex items-center transition-colors py-2 px-4 rounded-lg hover:bg-indigo-800"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || !formData.image}
                className={`flex items-center justify-center px-8 py-3 rounded-lg font-medium shadow-lg transition-all duration-200 ${
                  loading || !formData.image
                    ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                    : "bg-[#c6c607] hover:bg-[#d7d708] text-indigo-900 transform hover:-translate-y-1"
                }`}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin mr-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    List for Sale
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 ml-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
