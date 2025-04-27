import { EventBus } from "../EventBus";
import { Item } from "../resources/Item";
import { Position } from "grid-engine";

// Define interface for the AI popup event data
interface AIPopupEvent {
  itemId: string;
  content: string;
  duration: number;
}

interface AIResponse {
  content: string;
  duration: number;
}

// Add the event type to make TypeScript happy
// This should be placed in a separate file that defines all event types
// But for this fix, we'll declare it inline with a module augmentation
declare module "../EventBus" {
  interface EventMap {
    "show-ai-popup": AIPopupEvent;
  }
}

export default class AIHelper {
  private static instance: AIHelper;
  private apiKey: string | null = null;
  private isActive = true;
  private lastItemId: string | null = null;
  private interactionCooldown = 1000; // 1 second cooldown
  private lastInteractionTime = 0;

  // Cache for item descriptions to minimize API calls
  private itemDescriptionCache: Map<string, string> = new Map();

  private constructor() {
    // Initialize API key from environment variable
    this.apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || null;
    console.log("API Key available:", !!this.apiKey);

    // Listen for interaction events
    EventBus.on("item-picked-up", this.handleItemPickup.bind(this));
    EventBus.on("tool-used", this.handleToolUse.bind(this));
    EventBus.on("seed-planted", this.handleSeedPlanted.bind(this));

    // Listen for settings changes
    EventBus.on("ai-helper-toggle", (data: { enabled: boolean }) => {
      this.isActive = data.enabled;
      console.log(`AI Helper ${this.isActive ? "enabled" : "disabled"}`);
    });
  }

  public static getInstance(): AIHelper {
    if (!AIHelper.instance) {
      AIHelper.instance = new AIHelper();
    }
    return AIHelper.instance;
  }

  // Method to set API key manually
  public setApiKey(key: string): void {
    this.apiKey = key;
    console.log("API Key set manually");
  }

  private async handleItemPickup(data: { items: Item[]; position: Position }): Promise<void> {
    if (!this.isActive || !data.items || data.items.length === 0) return;

    const item = data.items[0]; // Take the first item if multiple were picked up
    await this.processItemInteraction(item.id, "pickup", item.type.name);
  }

  private async handleToolUse(data: { toolId: string; position: Position; targetPosition: Position }): Promise<void> {
    if (!this.isActive) return;

    await this.processItemInteraction(data.toolId, "tool", data.toolId);
  }

  private async handleSeedPlanted(data: { seedId: string; position: Position }): Promise<void> {
    if (!this.isActive) return;

    await this.processItemInteraction(data.seedId, "plant", `${data.seedId} seed`);
  }

  private async processItemInteraction(itemId: string, action: string, itemName: string): Promise<void> {
    const currentTime = Date.now();
    if (currentTime - this.lastInteractionTime < this.interactionCooldown) return;

    // Skip if it's the same item as last time
    if (this.lastItemId === itemId && action !== "tool") return;

    this.lastItemId = itemId;
    this.lastInteractionTime = currentTime;

    // Check if we have a cached description
    const cacheKey = `${action}-${itemId}`;
    if (this.itemDescriptionCache.has(cacheKey)) {
      this.showAIPopup(itemId, this.itemDescriptionCache.get(cacheKey)!);
      return;
    }

    // Generate item description
    try {
      const response = await this.generateInteractionTip(itemId, action, itemName);
      this.itemDescriptionCache.set(cacheKey, response.content);
      this.showAIPopup(itemId, response.content, response.duration);
    } catch (error) {
      console.error("Failed to generate interaction tip:", error);
    }
  }

  private async generateInteractionTip(itemId: string, action: string, itemName: string): Promise<AIResponse> {
    // Check if API key is available
    if (!this.apiKey) {
      console.warn("No Groq API key available. Using fallback response.");
      return this.getFallbackResponse(itemName);
    }

    try {
      // Construct the prompt based on the interaction type
      let prompt = "";

      switch (action) {
        case "pickup":
          prompt = `The player just picked up a ${itemName} in the farming game. Provide a brief, helpful tip about this resource in 2-3 short sentences. Focus on its uses or benefits.`;
          break;
        case "tool":
          prompt = `The player just used the ${itemName} tool in the farming game. Provide a brief, helpful tip about effective ways to use this tool in 2-3 short sentences.`;
          break;
        case "plant":
          prompt = `The player just planted a ${itemName} in the farming game. Provide a brief, helpful tip about growing this crop in 2-3 short sentences. Focus on care tips or harvest information.`;
          break;
        default:
          prompt = `The player just interacted with a ${itemName} in the farming game. Provide a brief, helpful tip in 2-3 short sentences.`;
      }

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [
            {
              role: "system",
              content: this.getSystemPrompt(),
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Groq API error:", error);
        return this.getFallbackResponse(itemName);
      }

      const data = await response.json();
      return {
        content: data.choices[0].message.content.trim(),
        duration: 6000,
      };
    } catch (error) {
      console.error("Error calling Groq API:", error);
      return this.getFallbackResponse(itemName);
    }
  }

  private getFallbackResponse(itemName: string): AIResponse {
    // Provide more informative fallback responses based on item type
    const fallbackResponses: { [key: string]: string } = {
      // Tools
      hoe: "Use the hoe to till soil before planting seeds. Properly tilled soil leads to faster growth.",
      axe: "The axe is perfect for chopping trees and collecting wood. Gather wood to build and upgrade farm structures.",
      pickaxe: "Use your pickaxe on rocks to gather stone resources. These are essential for building and upgrading.",
      watering_can:
        "Water your crops daily with the watering can. Plants will wither and die if left unwatered for too long.",

      // Common crops and seeds
      wheat: "Wheat grows quickly and can be ground into flour. Great crop for beginners!",
      wheat_seed: "Wheat grows relatively quickly and is a staple crop. Plant in tilled soil and water daily.",
      corn: "Corn sells for a good price and can be used in many recipes. A profitable summer crop!",
      corn_seed: "Corn takes longer to grow but yields multiple harvests. Plant in warm seasons for best results.",
      blueberry: "Blueberries are valuable and can be used in preserves or sold for profit. They make excellent jams!",
      tomato: "Tomatoes grow on vines and produce multiple harvests. Great for cooking or selling at market.",
      strawberry: "Strawberries are valuable berries that can regrow after harvesting. They make excellent preserves!",
    };

    // Return custom response if available, otherwise use generic
    return {
      content:
        fallbackResponses[itemName.toLowerCase()] ||
        `This is a ${itemName}. It will be useful in your farming journey.`,
      duration: 5000,
    };
  }

  private showAIPopup(itemId: string, content: string, duration = 6000): void {
    // Emit an event that will be handled by the UI system
    EventBus.emit("show-ai-popup", {
      itemId,
      content,
      duration,
    } as AIPopupEvent);
  }

  private getSystemPrompt(): string {
    return `You are a helpful AI assistant in a farming game. Your role is to give players brief, useful advice about items they interact with.
    
    The game has various items including:
    - Seeds (wheat_seed, corn_seed, etc.) - These can be planted to grow crops
    - Tools (hoe, axe, pickaxe, watering_can) - Used for farming tasks
    - Resources (branches, stones, wheat, etc.) - Can be used for crafting or selling
    - Crops (strawberry, wheat, etc.) - Can be harvested, sold, or used in recipes
    
    Keep your responses concise (2-3 short sentences), friendly, and focused on gameplay utility. 
    Don't introduce yourself or use phrases like "In this game" or "As your assistant."
    Just provide the tip directly as if you're a friendly advisor.`;
  }

  public destroy(): void {
    // Use handler references to properly unregister events
    const boundHandleItemPickup = this.handleItemPickup.bind(this);
    const boundHandleToolUse = this.handleToolUse.bind(this);
    const boundHandleSeedPlanted = this.handleSeedPlanted.bind(this);

    EventBus.off("item-picked-up", boundHandleItemPickup);
    EventBus.off("tool-used", boundHandleToolUse);
    EventBus.off("seed-planted", boundHandleSeedPlanted);
    EventBus.off("ai-helper-toggle");
    this.itemDescriptionCache.clear();
  }
}
