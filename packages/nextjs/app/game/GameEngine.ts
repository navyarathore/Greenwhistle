import {
  Character,
  Direction,
  GameState,
  INITIAL_INVENTORY,
  InventoryItem,
  MAP_HEIGHT,
  MAP_WIDTH,
  NPC,
  NPCS,
  Position,
  TILE_SIZE,
  Tile,
  TileType,
} from "./types";

export class GameEngine {
  private state: GameState;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sprites: { [key: string]: HTMLImageElement | HTMLCanvasElement } = {};
  private camera: Position = { x: 0, y: 0 };
  private lastTimestamp = 0;
  private npcs: NPC[] = NPCS;
  private activeDialogue: { npc: NPC; dialogueIndex: number } | null = null;
  private notifications: { message: string; color: string; opacity: number; y: number }[] = [];
  private playerAnimation = { bounce: 0, speed: 0.1 };
  private particles: { x: number; y: number; color: string; size: number; velocity: Position; opacity: number }[] = [];
  private showMarketplace = false;
  private currentNPC: NPC | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");
    this.ctx = ctx;

    // Initialize game state with character stats
    this.state = {
      player: {
        position: { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 },
        direction: Direction.DOWN,
        speed: 0.15,
        inventory: INITIAL_INVENTORY,
        selectedItem: 0,
        energy: 100,
        character: {
          level: 1,
          experience: 0,
          stats: {
            strength: 5,
            agility: 5,
            stamina: 5,
            intelligence: 5,
          },
          skills: {
            farming: 1,
            mining: 1,
            fishing: 1,
            crafting: 1,
          },
        },
      },
      map: this.generateImprovedMap(),
      time: 0,
      money: 500,
      npcs: NPCS,
    };

    this.loadSprites();
  }

  public handleResize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  private generateImprovedMap(): Tile[][] {
    const map: Tile[][] = [];

    // Initialize map with grass and ground
    for (let y = 0; y < MAP_HEIGHT; y++) {
      map[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        const isGround = Math.random() < 0.3;
        map[y][x] = {
          type: isGround ? TileType.GROUND : TileType.GRASS,
          walkable: true,
          interactable: false,
        };
      }
    }

    // Generate water bodies
    this.generateWaterBodies(map);

    // Add paths
    this.generatePaths(map);

    // Add trees and flowers
    this.generateNature(map);

    // Add buildings and structures
    this.addStructures(map);

    return map;
  }

  private generateWaterBodies(map: Tile[][]): void {
    // Create lakes and rivers
    const lakes = [
      { centerX: 40, centerY: 40, radius: 8 },
      { centerX: 70, centerY: 20, radius: 5 },
      { centerX: 20, centerY: 70, radius: 6 },
    ];

    // Generate lakes with improved sand borders
    lakes.forEach(lake => {
      for (let y = -lake.radius - 2; y <= lake.radius + 2; y++) {
        for (let x = -lake.radius - 2; x <= lake.radius + 2; x++) {
          const currentX = lake.centerX + x;
          const currentY = lake.centerY + y;
          if (this.isInBounds(currentX, currentY)) {
            const distance = Math.sqrt(x * x + y * y);
            if (distance <= lake.radius) {
              // Deep water in the center, regular water near edges
              const tileType = distance < lake.radius - 2 ? TileType.DEEP_WATER : TileType.WATER;
              map[currentY][currentX] = { type: tileType, walkable: false, interactable: true };
            } else if (distance <= lake.radius + 1.5) {
              // Add sand around the water
              map[currentY][currentX] = { type: TileType.SAND, walkable: true, interactable: true };
            }
          }
        }
      }
    });

    // Generate river with sand banks
    this.generateRiver(map, 0, 30, "horizontal");
    this.generateRiver(map, 60, MAP_HEIGHT - 1, "vertical");
  }

  private generateRiver(map: Tile[][], start: number, end: number, direction: "horizontal" | "vertical"): void {
    const riverWidth = 3;
    const sandWidth = riverWidth + 1;
    let x = direction === "horizontal" ? start : 40;
    let y = direction === "horizontal" ? 40 : start;

    while (direction === "horizontal" ? x < MAP_WIDTH : y < end) {
      const offset = Math.sin(x * 0.1) * 5;

      // First add sand (wider than the river)
      for (let w = -sandWidth; w <= sandWidth; w++) {
        for (let h = -sandWidth; h <= sandWidth; h++) {
          const currentX = direction === "horizontal" ? x : x + w;
          const currentY = direction === "horizontal" ? y + w + Math.floor(offset) : y;
          if (this.isInBounds(currentX, currentY)) {
            map[currentY][currentX] = { type: TileType.SAND, walkable: true, interactable: true };
          }
        }
      }

      // Then add water (narrower than sand)
      for (let w = -riverWidth; w <= riverWidth; w++) {
        const currentX = direction === "horizontal" ? x : x + w;
        const currentY = direction === "horizontal" ? y + w + Math.floor(offset) : y;
        if (this.isInBounds(currentX, currentY)) {
          map[currentY][currentX] = { type: TileType.WATER, walkable: false, interactable: true };
        }
      }

      if (direction === "horizontal") {
        x++;
      } else {
        y++;
      }
    }
  }

  private generateNature(map: Tile[][]): void {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (map[y][x].type === TileType.GRASS) {
          // Add random trees
          if (Math.random() < 0.05) {
            map[y][x] = { type: TileType.TREE, walkable: false, interactable: true };
          }
          // Add random flowers
          else if (Math.random() < 0.03) {
            map[y][x] = { type: TileType.FLOWER, walkable: true, interactable: true };
          }
          // Add random long grass
          else if (Math.random() < 0.1) {
            map[y][x] = { type: TileType.LONG_GRASS, walkable: true, interactable: true };
          }
        }
      }
    }
  }

  private addStructures(map: Tile[][]): void {
    // Add player"s house
    this.addBuilding(map, 10, 10, TileType.HOUSE, 6);
    // Add farmer"s house
    this.addBuilding(map, 20, 20, TileType.HOUSE, 6);
    // Update farmer NPC position
    const farmer = this.npcs.find(npc => npc.id === "farmer");
    if (farmer) {
      farmer.position = { x: 22, y: 24 }; // Position in front of farmer"s house
      farmer.schedule = [
        { time: 6, position: { x: 22, y: 24 } },
        { time: 12, position: { x: 30, y: 30 } }, // Farm field
        { time: 20, position: { x: 22, y: 24 } },
      ];
    }

    // Add merchant"s house and shop
    this.addBuilding(map, 40, 10, TileType.HOUSE, 6);
    // Update merchant NPC position
    const merchant = this.npcs.find(npc => npc.id === "merchant");
    if (merchant) {
      merchant.position = { x: 42, y: 14 }; // Position in front of merchant"s house
      merchant.schedule = [
        { time: 8, position: { x: 42, y: 14 } },
        { time: 12, position: { x: 45, y: 14 } }, // Shop area
        { time: 18, position: { x: 42, y: 14 } },
      ];
    }

    // Add some stone formations
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(Math.random() * MAP_WIDTH);
      const y = Math.floor(Math.random() * MAP_HEIGHT);
      this.addStoneFormation(map, x, y);
    }

    // Create farm fields near farmer"s house
    this.createFarmFields(map, 30, 30, 5, 5);
  }

  private createFarmFields(map: Tile[][], x: number, y: number, width: number, height: number): void {
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const currentX = x + dx;
        const currentY = y + dy;
        if (this.isInBounds(currentX, currentY)) {
          map[currentY][currentX] = {
            type: TileType.DIRT,
            walkable: true,
            interactable: true,
          };
        }
      }
    }
  }

  private addStoneFormation(map: Tile[][], centerX: number, centerY: number): void {
    const radius = 2;
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        const currentX = centerX + x;
        const currentY = centerY + y;
        if (this.isInBounds(currentX, currentY)) {
          const distance = Math.sqrt(x * x + y * y);
          if (distance <= radius && Math.random() < 0.7) {
            map[currentY][currentX] = {
              type: TileType.STONE,
              walkable: false,
              interactable: true,
            };
          }
        }
      }
    }
  }

  private addBuilding(map: Tile[][], x: number, y: number, type: TileType, size: number): void {
    // Create a single large house tile at the center
    map[y][x] = {
      type: type,
      walkable: false,
      interactable: true,
      variant: 1, // Use variant to indicate it"s the main house tile
      size: 6, // Store the house size for rendering
    };

    // Mark surrounding tiles as part of the house but invisible
    for (let dy = -2; dy <= 3; dy++) {
      for (let dx = -2; dx <= 3; dx++) {
        if (dx === 0 && dy === 0) continue; // Skip the center tile
        const currentX = x + dx;
        const currentY = y + dy;
        if (this.isInBounds(currentX, currentY)) {
          map[currentY][currentX] = {
            type: type,
            walkable: false,
            interactable: false,
            variant: 0, // Use variant 0 to indicate it"s part of the house but shouldn"t be rendered
          };
        }
      }
    }
  }

  private addBridges(map: Tile[][]): void {
    // Find water bodies and add bridges where paths cross them
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (map[y][x].type === TileType.WATER) {
          // Check if there are paths on both sides
          if (this.shouldAddBridge(map, x, y)) {
            map[y][x] = {
              type: TileType.BRIDGE,
              walkable: true,
              interactable: false,
            };
          }
        }
      }
    }
  }

  private shouldAddBridge(map: Tile[][], x: number, y: number): boolean {
    // Check for paths on opposite sides
    const hasHorizontalPaths = this.isPathNearby(map, x - 1, y) && this.isPathNearby(map, x + 1, y);
    const hasVerticalPaths = this.isPathNearby(map, x, y - 1) && this.isPathNearby(map, x, y + 1);

    return hasHorizontalPaths || hasVerticalPaths;
  }

  private isPathNearby(map: Tile[][], x: number, y: number): boolean {
    if (!this.isInBounds(x, y)) return false;
    return map[y][x].type === TileType.PATH;
  }

  private generatePaths(map: Tile[][]): void {
    const pathPoints = [
      { x: 10, y: 10 }, // House
      { x: 85, y: 10 }, // Shop
      { x: 40, y: 40 }, // Lake
      { x: 80, y: 45 }, // Cave
      { x: 30, y: 20 }, // Forest
    ];

    // Connect all points with natural-looking paths
    for (let i = 0; i < pathPoints.length - 1; i++) {
      this.createNaturalPath(map, pathPoints[i], pathPoints[i + 1]);
    }
  }

  private createNaturalPath(map: Tile[][], start: Position, end: Position): void {
    let x = start.x;
    let y = start.y;
    const pathWidth = 2;

    while (x !== end.x || y !== end.y) {
      // Random path variation
      const shouldVaryPath = Math.random() < 0.2;
      if (shouldVaryPath) {
        if (Math.random() < 0.5) {
          x += x < end.x ? 1 : -1;
        } else {
          y += y < end.y ? 1 : -1;
        }
      } else {
        // Direct path
        if (Math.abs(x - end.x) > Math.abs(y - end.y)) {
          x += x < end.x ? 1 : -1;
        } else {
          y += y < end.y ? 1 : -1;
        }
      }

      // Create wider path with variation
      for (let w = -pathWidth; w <= pathWidth; w++) {
        for (let h = -pathWidth; h <= pathWidth; h++) {
          const pathX = x + w;
          const pathY = y + h;
          if (this.isInBounds(pathX, pathY)) {
            const distance = Math.sqrt(w * w + h * h);
            if (distance <= pathWidth) {
              map[pathY][pathX] = {
                type: TileType.PATH,
                walkable: true,
                interactable: false,
              };
            }
          }
        }
      }
    }
  }

  private addSandAround(map: Tile[][], x: number, y: number): void {
    const directions = [
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: -1 },
      { x: -1, y: 1 },
      { x: 1, y: -1 },
      { x: 1, y: 1 },
    ];

    directions.forEach(dir => {
      const newX = x + dir.x;
      const newY = y + dir.y;
      if (this.isInBounds(newX, newY) && map[newY][newX].type === TileType.GRASS) {
        map[newY][newX] = { type: TileType.SAND, walkable: true, interactable: true };
      }
    });
  }

  private isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT;
  }

  private loadSprites(): void {
    const requiredSprites = [
      // Terrain sprites
      "grass",
      "long_grass",
      "dirt",
      "soil",
      "tilled_soil",
      "path",
      "tree",
      "water",
      "deep_water",
      "flower",
      "stone",
      "house",
      "bridge",
      "ground",
      "sand",
      "watered_soil",
      "crop",
      "growing_crop",
      "ready_crop",
      "farmer",
      "merchant",
      "hoe",
      "watering_can",
      "seeds",
      "fishing_rod",
      "axe",
      "common_fish",
      "rare_fish",
      "legendary_fish",
      "coin",
      "energy",
      "inventory_bg",
    ];

    // Create a fallback colored rectangle for missing sprites
    const fallbackCanvas = document.createElement("canvas");
    fallbackCanvas.width = TILE_SIZE;
    fallbackCanvas.height = TILE_SIZE;
    const fallbackCtx = fallbackCanvas.getContext("2d");
    if (fallbackCtx) {
      fallbackCtx.fillStyle = "#FFD700";
      fallbackCtx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      fallbackCtx.strokeStyle = "#000000";
      fallbackCtx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
      fallbackCtx.beginPath();
      fallbackCtx.moveTo(0, 0);
      fallbackCtx.lineTo(TILE_SIZE, TILE_SIZE);
      fallbackCtx.moveTo(TILE_SIZE, 0);
      fallbackCtx.lineTo(0, TILE_SIZE);
      fallbackCtx.stroke();
    }

    // Load basic sprites with proper error handling
    requiredSprites.forEach(name => {
      const img = new Image();
      img.onerror = () => {
        console.warn(`Failed to load sprite: ${name}.png`);
        // Create a colored rectangle as fallback
        const fallbackImg = document.createElement("canvas");
        fallbackImg.width = TILE_SIZE;
        fallbackImg.height = TILE_SIZE;
        const ctx = fallbackImg.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#FFD700";
          ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = "#000000";
          ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
          // Add a crosshatch pattern
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(TILE_SIZE, TILE_SIZE);
          ctx.moveTo(TILE_SIZE, 0);
          ctx.lineTo(0, TILE_SIZE);
          ctx.stroke();
          // Add sprite name
          ctx.fillStyle = "#000000";
          ctx.font = "8px Arial";
          ctx.textAlign = "center";
          ctx.fillText(name, TILE_SIZE / 2, TILE_SIZE / 2);
        }
        this.sprites[name] = fallbackImg;
      };
      img.onload = () => {
        this.sprites[name] = img;
      };
      img.src = `/assets/tiles/${name}.png`;
    });

    // Load player directional sprites
    const directions = ["up", "down", "left", "right"];
    directions.forEach(direction => {
      const img = new Image();
      img.onerror = () => {
        console.warn(`Failed to load player sprite: ${direction}.png`);
        // Create a colored rectangle as fallback for player
        const fallbackImg = document.createElement("canvas");
        fallbackImg.width = TILE_SIZE;
        fallbackImg.height = TILE_SIZE;
        const ctx = fallbackImg.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#4A90E2";
          ctx.beginPath();
          ctx.arc(TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE / 3, 0, Math.PI * 2);
          ctx.fill();
          // Add eyes
          ctx.fillStyle = "white";
          ctx.beginPath();
          ctx.arc(TILE_SIZE / 2 - 4, TILE_SIZE / 2 - 2, 2, 0, Math.PI * 2);
          ctx.arc(TILE_SIZE / 2 + 4, TILE_SIZE / 2 - 2, 2, 0, Math.PI * 2);
          ctx.fill();
          // Add direction indicator
          ctx.strokeStyle = "white";
          ctx.beginPath();
          switch (direction) {
            case "up":
              ctx.moveTo(TILE_SIZE / 2, TILE_SIZE / 3);
              ctx.lineTo(TILE_SIZE / 2, TILE_SIZE / 6);
              break;
            case "down":
              ctx.moveTo(TILE_SIZE / 2, (TILE_SIZE * 2) / 3);
              ctx.lineTo(TILE_SIZE / 2, (TILE_SIZE * 5) / 6);
              break;
            case "left":
              ctx.moveTo(TILE_SIZE / 3, TILE_SIZE / 2);
              ctx.lineTo(TILE_SIZE / 6, TILE_SIZE / 2);
              break;
            case "right":
              ctx.moveTo((TILE_SIZE * 2) / 3, TILE_SIZE / 2);
              ctx.lineTo((TILE_SIZE * 5) / 6, TILE_SIZE / 2);
              break;
          }
          ctx.stroke();
        }
        this.sprites[`player_${direction}`] = fallbackImg;
      };
      img.onload = () => {
        this.sprites[`player_${direction}`] = img;
      };
      img.src = `/assets/player/${direction}.png`;
    });
  }

  public movePlayer(direction: Direction) {
    const { position, speed, character } = this.state.player;
    const newPos = { ...position };
    const delta = 1;
    // Apply agility bonus to speed
    const agilityBonus = character.stats.agility * 0.01;
    const adjustedSpeed = speed * (1 + agilityBonus);

    switch (direction) {
      case Direction.UP:
        newPos.y = Math.max(0, position.y - adjustedSpeed * delta);
        break;
      case Direction.DOWN:
        newPos.y = Math.min(MAP_HEIGHT - 1, position.y + adjustedSpeed * delta);
        break;
      case Direction.LEFT:
        newPos.x = Math.max(0, position.x - adjustedSpeed * delta);
        break;
      case Direction.RIGHT:
        newPos.x = Math.min(MAP_WIDTH - 1, position.x + adjustedSpeed * delta);
        break;
    }

    if (this.isTileWalkable(newPos)) {
      this.state.player.position = newPos;
      this.state.player.direction = direction;
      this.updateCamera();
      // Decrease energy based on stamina
      const energyCost = 0.1 / (1 + character.stats.stamina * 0.05);
      this.state.player.energy = Math.max(0, this.state.player.energy - energyCost);
    }
  }

  private updateCamera() {
    const { position } = this.state.player;
    const screenWidth = this.canvas.width / TILE_SIZE;
    const screenHeight = this.canvas.height / TILE_SIZE;

    // Center the camera on the player
    this.camera.x = position.x - screenWidth / 2;
    this.camera.y = position.y - screenHeight / 2;

    // Clamp camera to map bounds
    this.camera.x = Math.max(0, Math.min(this.camera.x, MAP_WIDTH - screenWidth));
    this.camera.y = Math.max(0, Math.min(this.camera.y, MAP_HEIGHT - screenHeight));
  }

  private isTileWalkable(position: Position): boolean {
    const tileX = Math.floor(position.x);
    const tileY = Math.floor(position.y);

    if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) {
      return false;
    }

    return this.state.map[tileY][tileX].walkable;
  }

  public interact() {
    const { position, selectedItem, inventory } = this.state.player;
    const tileX = Math.floor(position.x);
    const tileY = Math.floor(position.y);
    const tile = this.state.map[tileY][tileX];

    // Check for NPC interaction
    if (tile.npcId) {
      const npc = this.npcs.find(n => n.id === tile.npcId);
      if (npc) {
        this.showMarketplace = true;
        this.currentNPC = npc;
        this.showNotification(`Trading with ${npc.name}`, "#4A90E2");
        return;
      }
    }

    // Get the selected item
    const item = inventory[selectedItem];
    if (!item) return;

    // Tool interactions
    switch (item.type) {
      case "TOOL":
        switch (item.name) {
          case "Hoe":
            if (tile.type === TileType.GRASS || tile.type === TileType.DIRT) {
              this.state.map[tileY][tileX] = {
                type: TileType.TILLED_SOIL,
                walkable: true,
                interactable: true,
              };
              this.showNotification("Tilled the soil!", "#8E44AD");
              this.addHarvestParticles(tileX, tileY);
              this.gainExperience(5, "farming");
            }
            break;
          case "Watering Can":
            if (tile.type === TileType.TILLED_SOIL || tile.type === TileType.GROWING_CROP) {
              this.state.map[tileY][tileX] = {
                ...tile,
                type: tile.type === TileType.TILLED_SOIL ? TileType.WATERED_SOIL : tile.type,
                waterLevel: 100,
              };
              this.showNotification("Watered the soil!", "#4A90E2");
              this.gainExperience(2, "farming");
            }
            break;
          case "Fishing Rod":
            if (tile.type === TileType.WATER || tile.type === TileType.DEEP_WATER) {
              this.tryFishing();
            }
            break;
        }
        break;
      case "SEED":
        if ((tile.type === TileType.TILLED_SOIL || tile.type === TileType.WATERED_SOIL) && item.quantity > 0) {
          this.state.map[tileY][tileX] = {
            type: TileType.GROWING_CROP,
            walkable: true,
            interactable: true,
            growthStage: 0,
            waterLevel: tile.type === TileType.WATERED_SOIL ? 100 : 0,
          };
          inventory[selectedItem].quantity--;
          this.showNotification("Planted a seed!", "#8E44AD");
          this.gainExperience(3, "farming");
        }
        break;
    }
  }

  private tryFishing() {
    if (Math.random() < 0.3) {
      const earnings = Math.floor(Math.random() * 30) + 20;
      this.state.money += earnings;
      this.showNotification(`Caught a fish! Earned $${earnings}`, "#F1C40F");
      this.addHarvestParticles(Math.floor(this.state.player.position.x), Math.floor(this.state.player.position.y));
    } else {
      this.showNotification("The fish got away!", "#E74C3C");
    }
  }

  public update(timestamp: number) {
    const deltaTime = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    // Update game time (1 game minute per real second)
    this.state.time += deltaTime / 1000;

    // Update animations
    this.playerAnimation.bounce = Math.sin(timestamp * this.playerAnimation.speed) * 2;

    // Update particles and notifications
    this.updateParticles(deltaTime);
    this.updateNotifications(deltaTime);

    // Update NPCs
    this.updateNPCs();

    // Update crops
    this.updateCrops(deltaTime);
  }

  private updateNPCs() {
    this.npcs.forEach(npc => {
      // Clear old position
      const oldPos = npc.position;
      if (this.state.map[oldPos.y][oldPos.x].npcId === npc.id) {
        delete this.state.map[oldPos.y][oldPos.x].npcId;
      }

      // Update position based on schedule
      const currentHour = Math.floor(this.state.time / 60) % 24;
      const schedule = npc.schedule.find(s => s.time === currentHour);
      if (schedule) {
        npc.position = schedule.position;
      }

      // Set new position
      const newPos = npc.position;
      if (this.state.map[newPos.y][newPos.x].walkable) {
        this.state.map[newPos.y][newPos.x].npcId = npc.id;
      }
    });
  }

  private updateCrops(deltaTime: number) {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = this.state.map[y][x];
        if (tile.type === TileType.GROWING_CROP && tile.growthStage !== undefined) {
          if (tile.growthStage < 3) {
            const growthChance = tile.waterLevel && tile.waterLevel > 0 ? 0.002 : 0.0005;
            if (Math.random() < growthChance) {
              tile.growthStage++;
              if (tile.growthStage === 3) {
                tile.type = TileType.READY_CROP;
              }
            }
          }
          if (tile.waterLevel && tile.waterLevel > 0) {
            tile.waterLevel -= deltaTime / 10000;
          }
        }
      }
    }
  }

  private updateParticles(deltaTime: number) {
    this.particles = this.particles.filter(particle => {
      particle.x += particle.velocity.x * deltaTime;
      particle.y += particle.velocity.y * deltaTime;
      particle.opacity -= deltaTime * 0.001;
      particle.size -= deltaTime * 0.01;
      return particle.opacity > 0 && particle.size > 0;
    });
  }

  private addHarvestParticles(x: number, y: number) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: x * TILE_SIZE + TILE_SIZE / 2,
        y: y * TILE_SIZE + TILE_SIZE / 2,
        color: "#FFD700",
        size: 5,
        velocity: {
          x: (Math.random() - 0.5) * 0.2,
          y: (Math.random() - 0.5) * 0.2,
        },
        opacity: 1,
      });
    }
  }

  private showNotification(message: string, color = "#4CAF50") {
    this.notifications.push({
      message,
      color,
      opacity: 1,
      y: this.canvas.height - 150 - this.notifications.length * 40,
    });
  }

  private updateNotifications(deltaTime: number) {
    this.notifications = this.notifications.filter(notification => {
      notification.opacity -= deltaTime * 0.001;
      notification.y += (this.canvas.height - 150 - this.notifications.length * 40 - notification.y) * 0.1;
      return notification.opacity > 0;
    });
  }

  public render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw world
    this.drawWorld();

    // Draw particles
    this.drawParticles();

    // Draw UI
    this.drawUI();

    // Draw notifications
    this.drawNotifications();

    // Draw dialogue if active
    if (this.activeDialogue) {
      this.drawDialogue();
    }

    // Draw player with directional sprite
    const direction = this.state.player.direction.toLowerCase();
    const playerSprite = this.sprites[`player_${direction}`];
    if (playerSprite) {
      const bounce = Math.sin(this.playerAnimation.bounce) * 2;
      this.ctx.drawImage(
        playerSprite,
        0, // No frame offset for now, using full sprite
        0,
        TILE_SIZE,
        TILE_SIZE,
        this.state.player.position.x * TILE_SIZE,
        this.state.player.position.y * TILE_SIZE - bounce,
        TILE_SIZE,
        TILE_SIZE,
      );
    } else {
      console.warn(`Player sprite for direction ${direction} not loaded`);
    }
  }

  private drawWorld() {
    const startX = Math.floor(this.camera.x);
    const startY = Math.floor(this.camera.y);
    const endX = Math.ceil(this.camera.x + this.canvas.width / TILE_SIZE);
    const endY = Math.ceil(this.camera.y + this.canvas.height / TILE_SIZE);

    // Draw tiles and NPCs
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
          const tile = this.state.map[y][x];
          this.drawTile(x, y, tile);

          // Draw NPC if present
          if (tile.npcId) {
            const npc = this.npcs.find(n => n.id === tile.npcId);
            if (npc) {
              this.drawNPC(npc);
            }
          }
        }
      }
    }

    // Draw player
    this.drawPlayer();
  }

  private drawUI() {
    // Draw inventory with improved styling
    this.drawInventory();

    // Draw mini-map with better visibility
    this.drawMiniMap();

    // Draw time and money with better formatting
    this.drawStats();

    // Draw energy bar
    this.drawEnergyBar();
  }

  private drawInventory() {
    const inventoryHeight = 80; // Increased height for better visibility
    const padding = 15;
    const itemWidth = 60;
    const itemHeight = 60;
    const spacing = 15;

    // Draw inventory background with gradient
    const gradient = this.ctx.createLinearGradient(0, this.canvas.height - inventoryHeight, 0, this.canvas.height);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0.8)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.95)");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, this.canvas.height - inventoryHeight, this.canvas.width, inventoryHeight);

    // Draw items with improved styling
    this.state.player.inventory.forEach((item, index) => {
      const x = padding + index * (itemWidth + spacing);
      const y = this.canvas.height - inventoryHeight + padding;

      // Draw slot background with selection highlight
      this.ctx.fillStyle =
        this.state.player.selectedItem === index ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.1)";
      this.ctx.fillRect(x, y, itemWidth, itemHeight);

      // Draw item icon
      this.drawInventoryItem(item, x + 10, y + 10, 40);

      // Draw item name and quantity with better formatting
      this.ctx.fillStyle = "white";
      this.ctx.font = "bold 12px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText(item.name, x + itemWidth / 2, y + itemHeight - 5);

      if (item.quantity > 1) {
        this.ctx.fillStyle = "#FFD700";
        this.ctx.font = "bold 14px Arial";
        this.ctx.fillText(`x${item.quantity}`, x + itemWidth - 15, y + 20);
      }
    });
  }

  private drawInventoryItem(item: InventoryItem, x: number, y: number, size = 40): void {
    if (!item.icon) return;

    const sprite = this.sprites[item.icon];
    if (!sprite) return;

    this.drawSprite(sprite, x, y, size, size);
  }

  private drawSprite(
    sprite: HTMLImageElement | HTMLCanvasElement,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    try {
      if (sprite instanceof HTMLCanvasElement || this.isImageLoaded(sprite)) {
        this.ctx.drawImage(sprite, x, y, width, height);
      } else {
        // Draw fallback for unloaded images
        this.ctx.fillStyle = "#FFD700";
        this.ctx.fillRect(x, y, width, height);
        this.ctx.strokeStyle = "#000000";
        this.ctx.strokeRect(x, y, width, height);
      }
    } catch (error) {
      console.warn("Failed to draw sprite", error);
      // Draw fallback
      this.ctx.fillStyle = "#FFD700";
      this.ctx.fillRect(x, y, width, height);
      this.ctx.strokeStyle = "#000000";
      this.ctx.strokeRect(x, y, width, height);
    }
  }

  private isImageLoaded(sprite: HTMLImageElement | HTMLCanvasElement): boolean {
    if (sprite instanceof HTMLImageElement) {
      return sprite.complete && sprite.naturalWidth !== 0;
    }
    return true; // Canvas elements are always "loaded"
  }

  private drawMiniMap() {
    const mapSize = 150;
    const padding = 15;
    const tileSize = mapSize / Math.max(MAP_WIDTH, MAP_HEIGHT);

    // Draw background with border
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(this.canvas.width - mapSize - padding, padding, mapSize, mapSize);
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(this.canvas.width - mapSize - padding, padding, mapSize, mapSize);

    // Draw tiles with improved colors
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = this.state.map[y][x];
        const miniX = this.canvas.width - mapSize - padding + x * tileSize;
        const miniY = padding + y * tileSize;

        switch (tile.type) {
          case TileType.WATER:
            this.ctx.fillStyle = "#4A90E2";
            break;
          case TileType.TREE:
            this.ctx.fillStyle = "#2E7D32";
            break;
          case TileType.PATH:
            this.ctx.fillStyle = "#C2B280";
            break;
          case TileType.GRASS:
            this.ctx.fillStyle = "#7CB342";
            break;
          default:
            this.ctx.fillStyle = "#90EE90";
        }
        this.ctx.fillRect(miniX, miniY, tileSize, tileSize);
      }
    }

    // Draw player position with pulsing effect
    const playerX = this.canvas.width - mapSize - padding + this.state.player.position.x * tileSize;
    const playerY = padding + this.state.player.position.y * tileSize;
    const time = performance.now() * 0.001;
    const pulse = Math.sin(time * 5) * 0.2 + 0.8;

    this.ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
    this.ctx.beginPath();
    this.ctx.arc(playerX, playerY, 3, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawStats() {
    const hours = Math.floor(this.state.time / 60) % 24;
    const minutes = Math.floor(this.state.time % 60);
    const timeStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

    // Draw time with background
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(10, 10, 120, 50);

    this.ctx.fillStyle = "white";
    this.ctx.font = "bold 16px Arial";
    this.ctx.fillText(`Time: ${timeStr}`, 20, 35);

    // Draw money with icon
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(10, 70, 120, 50);

    this.ctx.fillStyle = "#FFD700";
    this.ctx.font = "bold 16px Arial";
    this.ctx.fillText(`💰 $${this.state.money}`, 20, 95);
  }

  private drawEnergyBar() {
    const energy = this.state.player.energy || 100;
    const barWidth = 200;
    const barHeight = 20;
    const x = this.canvas.width - barWidth - 20;
    const y = 20;

    // Draw background
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(x, y, barWidth, barHeight);

    // Draw energy level with gradient
    const gradient = this.ctx.createLinearGradient(x, y, x + barWidth, y);
    gradient.addColorStop(0, "#4CAF50");
    gradient.addColorStop(1, "#2E7D32");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x, y, (barWidth * energy) / 100, barHeight);

    // Draw border
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, barWidth, barHeight);

    // Draw energy text
    this.ctx.fillStyle = "white";
    this.ctx.font = "bold 14px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(`Energy: ${Math.floor(energy)}%`, x + barWidth / 2, y + 15);
  }

  private drawDialogue() {
    if (!this.activeDialogue) return;

    const { npc, dialogueIndex } = this.activeDialogue;
    const padding = 20;
    const width = this.canvas.width * 0.8;
    const height = 120;
    const x = (this.canvas.width - width) / 2;
    const y = this.canvas.height - height - padding;

    // Draw dialogue box with gradient
    const gradient = this.ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0.95)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.85)");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x, y, width, height);

    // Draw border with animation
    const borderWidth = 2;
    const time = performance.now() / 1000;
    this.ctx.strokeStyle = `hsl(${(time * 50) % 360}, 70%, 60%)`;
    this.ctx.lineWidth = borderWidth;
    this.ctx.strokeRect(x, y, width, height);

    // Draw NPC name with background
    this.ctx.fillStyle = `hsl(${(time * 50) % 360}, 70%, 30%)`;
    this.ctx.fillRect(x + padding, y - 20, 150, 30);
    this.ctx.fillStyle = "white";
    this.ctx.font = "bold 16px Arial";
    this.ctx.fillText(npc.name, x + padding + 10, y - 2);

    // Draw dialogue text with typewriter effect
    const fullText = npc.dialogue[dialogueIndex];
    const visibleLength = Math.floor((time * 20) % (fullText.length + 20));
    const visibleText = fullText.substring(0, visibleLength);

    this.ctx.font = "14px Arial";
    this.ctx.fillText(visibleText, x + padding, y + padding + 40);

    // Draw continue prompt with pulsing animation
    this.ctx.font = "12px Arial";
    this.ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(time * 4) * 0.5})`;
    this.ctx.fillText("Press E to continue...", x + width - 100, y + height - 10);
  }

  private drawTile(x: number, y: number, tile: Tile) {
    const screenX = (x - this.camera.x) * TILE_SIZE;
    const screenY = (y - this.camera.y) * TILE_SIZE;

    // Draw base tile (ground or grass as default)
    const baseSprite = this.sprites.ground || this.sprites.grass;
    if (baseSprite) {
      this.drawSprite(baseSprite, screenX, screenY, TILE_SIZE, TILE_SIZE);
    }

    // Special handling for house
    if (tile.type === TileType.HOUSE && tile.variant === 1) {
      const houseSprite = this.sprites.house;
      if (houseSprite) {
        const houseSize = (tile.size || 6) * TILE_SIZE;
        this.drawSprite(houseSprite, screenX - TILE_SIZE * 2, screenY - TILE_SIZE * 2, houseSize, houseSize);
        return;
      }
    }

    // Skip rendering for house tiles that are part of the larger house but not the main tile
    if (tile.type === TileType.HOUSE && tile.variant === 0) {
      return;
    }

    // Draw other tile specific sprites
    const sprite = this.sprites[tile.type.toLowerCase()];
    if (sprite) {
      this.drawSprite(sprite, screenX, screenY, TILE_SIZE, TILE_SIZE);
    } else {
      this.drawTileFallback(tile, screenX, screenY);
    }

    // Draw crops if present
    if (tile.type === TileType.GROWING_CROP && tile.growthStage !== undefined) {
      const cropSprite = this.sprites.crop;
      if (cropSprite) {
        // Scale the crop based on growth stage
        const scale = 0.5 + tile.growthStage * 0.25;
        const size = TILE_SIZE * scale;
        const offset = (TILE_SIZE - size) / 2;
        this.drawSprite(cropSprite, screenX + offset, screenY + offset, size, size);
      }
    } else if (tile.type === TileType.READY_CROP) {
      const readyCropSprite = this.sprites.ready_crop;
      if (readyCropSprite) {
        this.drawSprite(readyCropSprite, screenX, screenY, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  private drawTileFallback(tile: Tile, x: number, y: number) {
    // Use yellow color for missing assets
    this.ctx.fillStyle = "#FFD700";

    // Add a pattern or text to indicate missing asset
    this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    this.ctx.strokeStyle = "#000000";
    this.ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

    // Add crosshatch pattern
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE);
    this.ctx.moveTo(x + TILE_SIZE, y);
    this.ctx.lineTo(x, y + TILE_SIZE);
    this.ctx.stroke();
  }

  private drawPlayer() {
    const { position, direction } = this.state.player;
    const screenX = (position.x - this.camera.x) * TILE_SIZE;
    const screenY = (position.y - this.camera.y) * TILE_SIZE + this.playerAnimation.bounce;

    // Make player 1.5x larger than regular tiles
    const playerSize = TILE_SIZE * 1.5;
    const offsetX = (playerSize - TILE_SIZE) / 2;
    const offsetY = playerSize - TILE_SIZE;

    // Add shadow under player
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    this.ctx.beginPath();
    this.ctx.ellipse(
      screenX + TILE_SIZE / 2,
      screenY + TILE_SIZE - 2,
      TILE_SIZE / 2.5,
      TILE_SIZE / 5,
      0,
      0,
      Math.PI * 2,
    );
    this.ctx.fill();

    // Get the correct sprite based on direction
    const spriteKey = `player_${direction.toLowerCase()}`;
    const playerSprite = this.sprites[spriteKey];

    if (playerSprite) {
      try {
        this.ctx.save();
        this.ctx.translate(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);

        const time = performance.now() * 0.001;
        const walkingRotation = Math.sin(time * 5) * 0.05;
        this.ctx.rotate(walkingRotation);

        // Draw the player sprite larger than the tile size
        this.ctx.drawImage(playerSprite, -playerSize / 2, -playerSize / 2 - offsetY / 2, playerSize, playerSize);
        this.ctx.restore();
      } catch (error) {
        console.warn("Failed to draw player sprite:", error);
        this.drawPlayerFallback(screenX, screenY);
      }
    } else {
      this.drawPlayerFallback(screenX, screenY);
    }
  }

  private drawPlayerFallback(screenX: number, screenY: number) {
    // Make fallback character 1.5x larger than regular tiles
    const playerSize = TILE_SIZE * 1.5;
    const offsetX = (playerSize - TILE_SIZE) / 2;
    const offsetY = playerSize - TILE_SIZE;

    // Fallback character if sprite not loaded
    this.ctx.fillStyle = "#4A90E2";
    this.ctx.beginPath();
    this.ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2 - offsetY / 2, playerSize / 2, 0, Math.PI * 2);
    this.ctx.fill();

    // Add eyes to make it look like a character
    this.ctx.fillStyle = "white";
    this.ctx.beginPath();
    this.ctx.arc(screenX + TILE_SIZE / 2 - 7, screenY + TILE_SIZE / 2 - offsetY / 2 - 7, 4, 0, Math.PI * 2);
    this.ctx.arc(screenX + TILE_SIZE / 2 + 7, screenY + TILE_SIZE / 2 - offsetY / 2 - 7, 4, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawNPC(npc: NPC) {
    const { position } = npc;
    const screenX = (position.x - this.camera.x) * TILE_SIZE;
    const screenY = (position.y - this.camera.y) * TILE_SIZE;

    // Use the NPC"s sprite property
    const npcSprite = this.sprites[npc.type] || this.sprites.farmer;
    if (npcSprite) {
      this.ctx.drawImage(npcSprite, screenX, screenY, TILE_SIZE, TILE_SIZE);
    } else {
      // Fallback if sprite not loaded
      this.ctx.fillStyle = "black";
      this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }
  }

  private drawParticles() {
    this.particles.forEach(particle => {
      this.ctx.fillStyle = `rgba(${particle.color}, ${particle.opacity})`;
      this.ctx.beginPath();
      this.ctx.arc(
        particle.x - this.camera.x * TILE_SIZE,
        particle.y - this.camera.y * TILE_SIZE,
        particle.size,
        0,
        Math.PI * 2,
      );
      this.ctx.fill();
    });
  }

  private drawNotifications() {
    this.notifications.forEach(notification => {
      this.ctx.fillStyle = `rgba(0, 0, 0, ${notification.opacity * 0.7})`;
      this.ctx.fillRect(10, notification.y, this.canvas.width - 20, 30);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${notification.opacity})`;
      this.ctx.font = "16px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText(notification.message, this.canvas.width / 2, notification.y + 20);
    });
  }

  public getState(): GameState {
    return this.state;
  }

  public gainExperience(amount: number, skillType?: keyof Character["skills"]) {
    const { character } = this.state.player;
    character.experience += amount;

    // Level up if enough experience
    if (character.experience >= character.level * 100) {
      character.level++;
      character.experience = 0;

      // Increase stats on level up
      character.stats.strength += 1;
      character.stats.agility += 1;
      character.stats.stamina += 1;
      character.stats.intelligence += 1;

      this.showNotification(`Level Up! Now level ${character.level}`, "#FFD700");
    }

    // Increase skill if specified
    if (skillType) {
      const skillName = String(skillType);
      character.skills[skillType] += amount * 0.1;
      this.showNotification(`${skillName} skill increased!`, "#4CAF50");
    }
  }

  public isMarketplaceOpen(): boolean {
    return this.showMarketplace;
  }

  public getCurrentNPC(): NPC | null {
    return this.currentNPC;
  }

  public closeMarketplace(): void {
    this.showMarketplace = false;
    this.currentNPC = null;
  }

  public purchaseItem(item: any): void {
    if (this.state.money >= item.price) {
      this.state.money -= item.price;

      // Add item to inventory
      const existingItem = this.state.player.inventory.find(i => i.name === item.name);
      if (existingItem) {
        existingItem.quantity += item.quantity || 1;
      } else {
        this.state.player.inventory.push({
          name: item.name,
          type: item.type,
          quantity: item.quantity || 1,
          icon: item.name.toLowerCase(),
          description: item.description,
        });
      }

      this.showNotification(`Purchased ${item.name}!`, "#4CAF50");
    } else {
      this.showNotification("Not enough money!", "#E74C3C");
    }
  }
}
