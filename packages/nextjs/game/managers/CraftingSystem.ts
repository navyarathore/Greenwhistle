import { Item } from "../resources/Item";

interface Recipe {
  id: string;
  ingredients: Item[];
  result: Item;
}

export class CraftingSystem {
  private recipes: Map<string, Recipe> = new Map();

  constructor(initialRecipes: Recipe[] = []) {
    // Register initial recipes
    initialRecipes.forEach(recipe => this.registerRecipe(recipe));
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
    return recipe.ingredients.every(ingredient => {
      const playerItems = playerInventory.filter(item => item.id === ingredient.id);
      const totalQuantity = playerItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
      return totalQuantity >= ingredient.quantity;
    });
  }

  // Craft item immediately
  public craftItem(
    recipeId: string,
    playerId: string,
    playerInventory: Item[],
    consumeIngredients: (playerId: string, items: Item[]) => boolean,
    addItemToInventory: (playerId: string, item: Item) => void,
  ): boolean {
    const recipe = this.recipes.get(recipeId);

    if (!recipe) return false;
    if (!this.canCraft(recipeId, playerInventory)) return false;

    // Consume ingredients
    const success = consumeIngredients(playerId, recipe.ingredients);
    if (!success) return false;

    // Add crafted item to inventory immediately
    addItemToInventory(playerId, recipe.result);

    return true;
  }
}
