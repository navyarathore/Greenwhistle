import { EventBus } from "../EventBus";
import { Item } from "../resources/Item";
import Recipes from "../resources/recipes.json";
import { MaterialManager } from "~~/game/managers/MaterialManager";

interface Recipe {
  id: string;
  ingredients: Item[];
  result: Item;
}

export class CraftingManager {
  private recipes: Map<string, Recipe> = new Map();

  constructor(initialRecipes: Recipe[] = []) {
    initialRecipes.forEach(recipe => this.registerRecipe(recipe));
  }

  loadRecipes(materialManager: MaterialManager): void {
    const convertItem = (item: { id: number; quantity: number }): Item => {
      return new Item(materialManager.getMaterial(item.id)!, item.quantity);
    };

    try {
      Recipes.recipes.forEach((recipe, index) => {
        this.registerRecipe({
          id: String(index),
          ingredients: recipe.ingredients.map(item => convertItem(item)),
          result: convertItem(recipe.result),
        });
      });
      console.log(`Loaded ${this.recipes.size} recipes from recipes.json.`);
    } catch (error) {
      console.error("Error loading recipes", error);
    }
  }

  // Register a new crafting recipe
  public registerRecipe(recipe: Recipe): void {
    this.recipes.set(recipe.id, recipe);
  }

  // Get all available recipes
  public getRecipes(): Recipe[] {
    return Array.from(this.recipes.values());
  }

  // Check if player has required ingredients for a recipe
  public canCraft(recipeId: string, playerInventory: Item[]): boolean {
    const recipe = this.recipes.get(recipeId);

    if (!recipe) return false;

    // Check if player has all required ingredients
    return recipe.ingredients.every(
      ingredient =>
        playerInventory
          .filter(item => item.type.id === ingredient.type.id)
          .reduce((total, item) => total + item.quantity, 0) >= ingredient.quantity,
    );
  }

  public craftItem(
    recipeId: string,
    playerInventory: Item[],
    consumeIngredients: (items: Item[]) => boolean,
    addItemToInventory: (item: Item) => void,
  ): boolean {
    const recipe = this.recipes.get(recipeId);

    if (!recipe) return false;
    if (!this.canCraft(recipeId, playerInventory)) return false;

    // Consume ingredients
    const success = consumeIngredients(recipe.ingredients);
    if (!success) return false;

    // Add crafted item to inventory immediately
    addItemToInventory(recipe.result);

    EventBus.emit("craft-item", recipe.result);

    return true;
  }
}
