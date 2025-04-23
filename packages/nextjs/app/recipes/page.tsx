// RecipePage.tsx
"use client";

import { useState } from "react";
import recipeData from "../../game/resources/recipes.json";
import resourceDataRaw from "../../game/resources/resource.json";
import { ArrowRight, X } from "lucide-react";

// RecipePage.tsx

// RecipePage.tsx

// RecipePage.tsx

// RecipePage.tsx

// RecipePage.tsx

// RecipePage.tsx

// RecipePage.tsx

// RecipePage.tsx

// RecipePage.tsx

// RecipePage.tsx

type ResourceItem = {
  name: string;
  type: string;
  icon: { path: string };
  stackable?: boolean;
  description?: string;
};
type ResourceData = {
  items: Record<string, ResourceItem>;
};

const resourceData = resourceDataRaw as ResourceData;
// Helper to get item details from resource.json
const getItemDetails = (id: string): ResourceItem => {
  return resourceData.items[id] || { name: id, type: "unknown", icon: { path: "/images/unknown.png" } };
};

const RecipePage: React.FC = () => {
  const [selectedRecipe, setSelectedRecipe] = useState<(typeof recipeData.recipes)[0] | null>(null);
  const recipes = recipeData.recipes;

  const openRecipeModal = (recipe: (typeof recipeData.recipes)[0]) => {
    setSelectedRecipe(recipe);
  };

  const closeRecipeModal = () => {
    setSelectedRecipe(null);
  };

  return (
    <div className="min-h-screen bg-amber-100 text-amber-900 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 text-amber-800">Crafting Recipes</h1>
          <p className="text-amber-700">Click on any item to see how to craft it</p>
        </header>
        {/* Grid of craftable items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          {recipes.map((recipe, index) => {
            const resultDetails = getItemDetails(recipe.result.id);
            return (
              <div
                key={index}
                className="bg-amber-200 rounded-lg p-4 shadow-lg hover:shadow-xl transition-all border-2 border-amber-300 cursor-pointer transform hover:scale-105"
                onClick={() => openRecipeModal(recipe)}
              >
                <div className="flex flex-col items-center">
                  <div className="bg-amber-300 rounded-lg p-4 w-32 h-32 flex items-center justify-center border-2 border-amber-400">
                    <img
                      src={`/assets/icons/${resultDetails.icon.path}`}
                      alt={resultDetails.name}
                      className="object-contain"
                      width={120}
                      height={120}
                    />
                  </div>
                  <h3 className="mt-4 text-xl font-medium text-amber-800 text-center">
                    {recipe.result.quantity > 1 ? `${recipe.result.quantity}x ` : ""}
                    {resultDetails.name}
                  </h3>
                  <p className="mt-1 text-amber-600 text-sm">Click to see recipe</p>
                </div>
              </div>
            );
          })}
        </div>
        {/* Recipe Modal */}
        {selectedRecipe && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-amber-100 rounded-lg w-full max-w-2xl relative animate-fadeIn">
              <button
                onClick={closeRecipeModal}
                className="absolute right-4 top-4 text-amber-800 hover:text-amber-900"
                aria-label="Close"
              >
                <X size={24} />
              </button>
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6 text-amber-800 text-center">
                  {getItemDetails(selectedRecipe.result.id).name} Recipe
                </h2>
                <div className="flex items-center justify-center flex-wrap md:flex-nowrap gap-8 p-4">
                  {/* Ingredients Section */}
                  <div className="flex-1 flex flex-col items-center">
                    <h3 className="text-lg font-semibold mb-3 text-amber-700">Ingredients</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedRecipe.ingredients.map((ingredient, idx) => {
                        const ingDetails = getItemDetails(ingredient.id);
                        return (
                          <div key={idx} className="flex flex-col items-center">
                            <div className="bg-amber-300 rounded-lg p-3 w-24 h-24 flex items-center justify-center border-2 border-amber-400">
                              <img
                                src={`/assets/icons/${ingDetails.icon.path}`}
                                alt={ingDetails.name}
                                className="object-contain"
                                width={80}
                                height={80}
                              />
                            </div>
                            <p className="mt-2 text-sm font-medium text-amber-800 text-center">
                              {ingredient.quantity}x {ingDetails.name}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* Arrow */}
                  <div className="flex items-center justify-center">
                    <ArrowRight size={40} className="text-amber-600" />
                  </div>
                  {/* Result Section */}
                  <div className="flex-1 flex flex-col items-center">
                    <h3 className="text-lg font-semibold mb-3 text-amber-700">Result</h3>
                    <div className="bg-amber-300 rounded-lg p-3 w-32 h-32 flex items-center justify-center relative border-2 border-amber-400">
                      <img
                        src={`/assets/icons/${getItemDetails(selectedRecipe.result.id).icon.path}`}
                        alt={getItemDetails(selectedRecipe.result.id).name}
                        className="object-contain"
                        width={100}
                        height={100}
                      />
                      <div className="absolute inset-0 rounded-lg bg-amber-500 opacity-20 animate-pulse"></div>
                    </div>
                    <p className="mt-2 text-lg font-medium text-amber-800">
                      {selectedRecipe.result.quantity}x {getItemDetails(selectedRecipe.result.id).name}
                    </p>
                  </div>
                </div>
                <div className="mt-6 bg-amber-50 rounded p-4 border border-amber-200">
                  <h3 className="text-lg font-semibold mb-2 text-amber-800">Crafting Instructions:</h3>
                  <p className="text-amber-700">
                    Collect{" "}
                    {selectedRecipe.ingredients
                      .map((ing, idx, arr) => {
                        const ingDetails = getItemDetails(ing.id);
                        return idx === arr.length - 1 && arr.length > 1
                          ? `and ${ing.quantity} ${ingDetails.name}`
                          : `${ing.quantity} ${ingDetails.name}${arr.length > 2 ? ", " : " "}`;
                      })
                      .join("")}{" "}
                    and arrange them in your crafting grid to create
                    {selectedRecipe.result.quantity > 1 ? ` ${selectedRecipe.result.quantity} ` : " a "}
                    powerful {getItemDetails(selectedRecipe.result.id).name}.
                  </p>
                </div>
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={closeRecipeModal}
                    className="bg-amber-500 hover:bg-amber-600 text-amber-50 font-bold py-2 px-6 rounded transition-colors border border-amber-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipePage;
