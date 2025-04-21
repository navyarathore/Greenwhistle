// src/game/systems/FarmingSystem.ts
import { EventBus } from "../EventBus";
import InventoryManager from "./InventoryManager";
import Phaser from "phaser";

interface ResourceConfig {
  id: string;
  type: string;
  position: { x: number; y: number };
  respawnDays: number;
  resourceAmount: number;
}

export class FarmingSystem {
  private resources: Map<string, any> = new Map();
  private currentDay = 1;
  private toolDurability: Map<string, number> = new Map();
  private inventorySystem: InventoryManager;

  constructor(
    private scene: any,
    inventorySystem: InventoryManager,
  ) {
    // Initialize inventory system
    this.inventorySystem = inventorySystem;

    // Initialize tool durability
    this.toolDurability.set("axe", 30);
    this.toolDurability.set("pickaxe", 25);

    // Listen for day change events
    EventBus.on("day-changed", this.handleDayChange.bind(this));
  }

  registerResource(config: ResourceConfig) {
    const resource = {
      id: config.id,
      type: config.type,
      position: { ...config.position },
      respawnDays: config.respawnDays,
      resourceAmount: config.resourceAmount,
      depleted: false,
      respawnDay: 0,
      sprite: null as Phaser.Physics.Arcade.Sprite | null,
    };

    this.resources.set(config.id, resource);
    return resource;
  }

  createResourceSprites() {
    this.resources.forEach(resource => {
      if (!resource.depleted && !resource.sprite) {
        // Create sprite based on resource type
        const spriteKey = "resources";
        let frame = 0;

        switch (resource.type) {
          case "tree":
            frame = 0;
            break;
          case "rock":
            frame = 1;
            break;
          case "ore":
            frame = 2;
            break;
        }

        resource.sprite = this.scene.physics.add.sprite(resource.position.x, resource.position.y, spriteKey, frame);

        resource.sprite.setDepth(5);
      }
    });
  }

  harvestResource(resourceId: string, toolType: string): { success: boolean; yield?: string; quantity?: number } {
    const resource = this.resources.get(resourceId);

    if (!resource || resource.depleted) {
      return { success: false };
    }

    // Check if correct tool is being used
    const correctTool = resource.type === "tree" ? "axe" : "pickaxe";

    if (toolType !== correctTool) {
      return { success: false };
    }

    // Get the tool from inventory using the tool's ID
    const toolItemId = toolType === "axe" ? "axe" : "pickaxe";

    // Check if the tool exists in inventory
    // if (!this.inventorySystem.hasItem(toolItemId)) {
    //   EventBus.emit("show-message", `You don't have a ${toolType}!`);
    //   return { success: false };
    // }

    // // Use the tool (this will reduce durability)
    // if (!this.inventorySystem.useItem(toolItemId)) {
    //   EventBus.emit("show-message", `Your ${toolType} is broken! Craft a new one.`);
    //   return { success: false };
    // }

    // Harvest the resource
    resource.resourceAmount--;

    // Visual feedback
    if (resource.sprite) {
      this.scene.tweens.add({
        targets: resource.sprite,
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 100,
        yoyo: true,
      });
    }

    // Determine yield
    let yieldType = "";
    const quantity = 1;

    switch (resource.type) {
      case "tree":
        yieldType = "wood";
        break;
      case "rock":
        yieldType = "stone";
        break;
      case "ore":
        yieldType = "ore";
        // Rare chance for special ore
        if (Math.random() < 0.1) {
          yieldType = "special_ore";
        }
        break;
    }

    // Check if resource is depleted
    if (resource.resourceAmount <= 0) {
      resource.depleted = true;
      resource.respawnDay = this.currentDay + resource.respawnDays;

      if (resource.sprite) {
        resource.sprite.setAlpha(0.5);
      }

      EventBus.emit("resource-depleted", {
        id: resource.id,
        type: resource.type,
        respawnDays: resource.respawnDays,
      });
    }

    // Emit item harvested event for the inventory system to handle
    EventBus.emit("item-harvested", {
      resourceId: resource.id,
      yield: yieldType,
      quantity,
    });

    return {
      success: true,
      yield: yieldType,
      quantity,
    };
  }

  private handleDayChange(day: number) {
    this.currentDay = day;

    // Check for resource respawns
    this.resources.forEach(resource => {
      if (resource.depleted && resource.respawnDay <= day) {
        resource.depleted = false;
        resource.resourceAmount = 3; // Reset to default amount

        if (resource.sprite) {
          resource.sprite.setAlpha(1);
        }

        EventBus.emit("resource-respawned", resource.id);
      }
    });
  }
}
