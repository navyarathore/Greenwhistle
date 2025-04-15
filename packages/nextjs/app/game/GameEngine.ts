import {
  Character,
  Direction,
  GameState,
  INITIAL_INVENTORY,
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
  private sprites: { [key: string]: HTMLImageElement } = {};
  private camera: Position = { x: 0, y: 0 };
  private lastTimestamp = 0;
  private npcs: NPC[] = NPCS;
  private activeDialogue: { npc: NPC; dialogueIndex: number } | null = null;
  private notifications: { message: string; color: string; opacity: number; y: number }[] = [];
  private playerAnimation = { bounce: 0, speed: 0.1 };
  private particles: { x: number; y: number; color: string; size: number; velocity: Position; opacity: number }[] = [];

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
    // Initialize map with base terrain
    for (let y = 0; y < MAP_HEIGHT; y++) {
      map[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        map[y][x] = { type: TileType.GRASS, walkable: true, interactable: true };
      }
    }

    // Generate biomes in order
    // this.generateSnowRegion(map);
    this.generateWaterBodies(map);
    this.generateMountains(map);
    // this.generateSwamps(map);
    this.generateForests(map);
    // Add special locations and interactive elements
    this.addSpecialLocations(map);
    // this.addInteractiveElements(map);
    // Generate paths between locations
    this.generatePaths(map);
    // Add bridges over water
    this.addBridges(map);

    return map;
  }

  // private generateSnowRegion(map: Tile[][]): void {
  //   // Create a snow biome in the northern region
  //   const snowStartY = 5;
  //   const snowEndY = 20;
  //   for (let y = snowStartY; y < snowEndY; y++) {
  //     for (let x = 0; x < MAP_WIDTH; x++) {
  //       const snowChance = 1 - (y - snowStartY) / (snowEndY - snowStartY);
  //       if (Math.random() < snowChance) {
  //         const isIce = Math.random() < 0.2;
  //         map[y][x] = {
  //           type: isIce ? TileType.ICE : TileType.SNOW,
  //           walkable: true,
  //           interactable: true
  //         };
  //       }
  //     }
  //   }
  // Add hot springs in the snow region
  //   for (let i = 0; i < 3; i++) {
  //     const x = Math.floor(Math.random() * MAP_WIDTH);
  //     const y = snowStartY + Math.floor(Math.random() * (snowEndY - snowStartY));
  //     this.createHotSpring(map, x, y);
  //   }
  // }

  // private createHotSpring(map: Tile[][], centerX: number, centerY: number): void {
  //   const radius = 2;
  //   for (let y = -radius; y <= radius; y++) {
  //     for (let x = -radius; x <= radius; x++) {
  //       const currentX = centerX + x;
  //       const currentY = centerY + y;
  //       if (this.isInBounds(currentX, currentY)) {
  //         const distance = Math.sqrt(x * x + y * y);
  //         if (distance <= radius) {
  //           map[currentY][currentX] = {
  //             type: TileType.HOT_SPRING,
  //             walkable: false,
  //             interactable: true,
  //             resources: {
  //               type: "HERB",
  //               quantity: 1,
  //               respawnTime: 300,
  //             },
  //           };
  //         }
  //       }
  //     }
  //   }
  // }

  // private generateSwamps(map: Tile[][]): void {
  //   const swampCenters = [
  //     { x: 25, y: 60 },
  //     { x: 75, y: 30 },
  //   ];

  //   swampCenters.forEach(center => {
  //     const radius = 8;
  //     for (let y = -radius; y <= radius; y++) {
  //       for (let x = -radius; x <= radius; x++) {
  //         const currentX = center.x + x;
  //         const currentY = center.y + y;
  //         if (this.isInBounds(currentX, currentY) && map[currentY][currentX].type === TileType.GRASS) {
  //           const distance = Math.sqrt(x * x + y * y);
  //           if (distance <= radius) {
  //             const isSwamp = Math.random() < 0.7;
  //             if (isSwamp) {
  //               map[currentY][currentX] = {
  //                 type: TileType.SWAMP,
  //                 walkable: true,
  //                 interactable: true,
  //                 resources: Math.random() < 0.2 ? {
  //                   type: "MUSHROOM",
  //                   quantity: 1,
  //                   respawnTime: 120
  //                 } : undefined
  //               };
  //             }
  //           }
  //         }
  //       }
  //     }
  //   });
  // }

  // private addInteractiveElements(map: Tile[][]): void {
  //   // Add berry bushes in forest edges
  //   this.addResourceNodes(map, TileType.BERRY_BUSH, 20, tile =>
  //     this.isNearType(map, tile.x, tile.y, TileType.TREE));

  //   // Add mushrooms in forest and swamp
  //   this.addResourceNodes(map, TileType.MUSHROOM, 15, tile =>
  //     this.isNearType(map, tile.x, tile.y, TileType.TREE) ||
  //     this.isNearType(map, tile.x, tile.y, TileType.SWAMP));

  //   // Add fishing spots near water
  //   this.addResourceNodes(map, TileType.FISHING_SPOT, 10, tile =>
  //     this.isNearType(map, tile.x, tile.y, TileType.WATER));

  //   // Add mine entrances near mountains
  //   this.addResourceNodes(map, TileType.MINE_ENTRANCE, 5, tile =>
  //     this.isNearType(map, tile.x, tile.y, TileType.MOUNTAIN));

  //   // Add farm plots near the starting house
  //   this.addFarmPlots(map);
  // }

  // private addResourceNodes(
  //   map: Tile[][],
  //   type: TileType,
  //   count: number,
  //   locationCheck: (pos: { x: number; y: number }) => boolean
  // ): void {
  //   let placed = 0;
  //   let attempts = 0;
  //   const maxAttempts = count * 10;

  //   while (placed < count && attempts < maxAttempts) {
  //     const x = Math.floor(Math.random() * MAP_WIDTH);
  //     const y = Math.floor(Math.random() * MAP_HEIGHT);

  //     if (map[y][x].type === TileType.GRASS && locationCheck({ x, y })) {
  //       map[y][x] = {
  //         type,
  //         walkable: false,
  //         interactable: true,
  //         resources: {
  //           type: this.getResourceTypeForTile(type),
  //           quantity: Math.floor(Math.random() * 3) + 1,
  //           respawnTime: 180
  //         }
  //       };
  //       placed++;
  //     }
  //     attempts++;
  //   }
  // }

  // private getResourceTypeForTile(tileType: TileType): "BERRY" | "MUSHROOM" | "ORE" | "FISH" | "HERB" {
  //   switch (tileType) {
  //     case TileType.BERRY_BUSH: return "BERRY";
  //     case TileType.MUSHROOM: return "MUSHROOM";
  //     case TileType.MINE_ENTRANCE: return "ORE";
  //     case TileType.FISHING_SPOT: return "FISH";
  //     default: return "HERB";
  //   }
  // }

  // private isNearType(map: Tile[][], x: number, y: number, type: TileType): boolean {
  //   const radius = 2;
  //   for (let dy = -radius; dy <= radius; dy++) {
  //     for (let dx = -radius; dx <= radius; dx++) {
  //       const checkX = x + dx;
  //       const checkY = y + dy;
  //       if (
  //         this.isInBounds(checkX, checkY) &&
  //         map[checkY][checkX].type === type
  //       ) {
  //         return true;
  //       }
  //     }
  //   }
  //   return false;
  // }

  // private addFarmPlots(map: Tile[][]): void {
  //   // Add farm plots near the starting house
  //   const housePos = { x: 10, y: 10 };
  //   const farmRadius = 5;

  //   for (let y = -farmRadius; y <= farmRadius; y++) {
  //     for (let x = -farmRadius; x <= farmRadius; x++) {
  //       const plotX = housePos.x + x + 5; // Offset from house
  //       const plotY = housePos.y + y + 5;

  //       if (this.isInBounds(plotX, plotY) && map[plotY][plotX].type === TileType.GRASS) {
  //         map[plotY][plotX] = {
  //           type: TileType.FARM_PLOT,
  //           walkable: true,
  //           interactable: true
  //         };
  //       }
  //     }
  //   }
  // }

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

  private generateWaterBodies(map: Tile[][]): void {
    // Create lakes and rivers
    const lakes = [
      { centerX: 40, centerY: 40, radius: 8 },
      { centerX: 70, centerY: 20, radius: 5 },
      { centerX: 20, centerY: 70, radius: 6 },
    ];

    // Generate lakes
    lakes.forEach(lake => {
      for (let y = -lake.radius; y <= lake.radius; y++) {
        for (let x = -lake.radius; x <= lake.radius; x++) {
          const currentX = lake.centerX + x;
          const currentY = lake.centerY + y;
          if (this.isInBounds(currentX, currentY)) {
            const distance = Math.sqrt(x * x + y * y);
            if (distance <= lake.radius) {
              // Deep water in the center, regular water near edges
              const tileType = distance < lake.radius - 2 ? TileType.DEEP_WATER : TileType.WATER;
              map[currentY][currentX] = { type: tileType, walkable: false, interactable: true };
              // Add sand around the lake
              if (distance >= lake.radius - 0.5 && distance <= lake.radius + 1) {
                this.addSandAround(map, currentX, currentY);
              }
            }
          }
        }
      }
    });

    this.generateRiver(map, 0, 30, "horizontal");
    this.generateRiver(map, 60, MAP_HEIGHT - 1, "vertical");
  }

  private generateRiver(map: Tile[][], start: number, end: number, direction: "horizontal" | "vertical"): void {
    const riverWidth = 3;
    let x = direction === "horizontal" ? start : 40;
    let y = direction === "horizontal" ? 40 : start;
    while (direction === "horizontal" ? x < MAP_WIDTH : y < end) {
      const offset = Math.sin(x * 0.1) * 5;
      for (let w = -riverWidth; w <= riverWidth; w++) {
        const currentX = direction === "horizontal" ? x : x + w;
        const currentY = direction === "horizontal" ? y + w + Math.floor(offset) : y;
        if (this.isInBounds(currentX, currentY)) {
          map[currentY][currentX] = { type: TileType.WATER, walkable: false, interactable: true };
          this.addSandAround(map, currentX, currentY);
        }
      }
      if (direction === "horizontal") {
        x++;
      } else {
        y++;
      }
    }
  }

  private generateMountains(map: Tile[][]): void {
    const mountainRanges = [
      { startX: 80, startY: 10, length: 20, direction: "vertical" },
      { startX: 10, startY: 80, length: 15, direction: "horizontal" },
    ];

    mountainRanges.forEach(range => {
      let x = range.startX;
      let y = range.startY;
      for (let i = 0; i < range.length; i++) {
        const mountainWidth = 4 + Math.floor(Math.random() * 3);
        for (let w = -mountainWidth; w <= mountainWidth; w++) {
          for (let h = -mountainWidth; h <= mountainWidth; h++) {
            const currentX = x + w;
            const currentY = y + h;
            if (this.isInBounds(currentX, currentY)) {
              const distance = Math.sqrt(w * w + h * h);
              if (distance <= mountainWidth) {
                const isMountainPeak = distance < mountainWidth - 2;
                map[currentY][currentX] = {
                  type: isMountainPeak ? TileType.MOUNTAIN : TileType.STONE,
                  walkable: !isMountainPeak,
                  interactable: true,
                };
              }
            }
          }
        }
        if (range.direction === "vertical") {
          y++;
        } else {
          x++;
        }
      }
    });
  }

  private generateForests(map: Tile[][]): void {
    const forestCenters = [
      { x: 30, y: 20 },
      { x: 60, y: 70 },
      { x: 15, y: 50 },
    ];

    forestCenters.forEach(center => {
      const forestRadius = 10;
      for (let y = -forestRadius; y <= forestRadius; y++) {
        for (let x = -forestRadius; x <= forestRadius; x++) {
          const currentX = center.x + x;
          const currentY = center.y + y;
          if (this.isInBounds(currentX, currentY) && map[currentY][currentX].type === TileType.GRASS) {
            const distance = Math.sqrt(x * x + y * y);
            if (distance <= forestRadius) {
              const treeChance = 1 - distance / forestRadius;
              if (Math.random() < treeChance * 0.7) {
                map[currentY][currentX] = {
                  type: TileType.TREE,
                  walkable: false,
                  interactable: true,
                  variant: Math.floor(Math.random() * 3), // Different tree variants
                };
              }
            }
          }
        }
      }
    });
  }

  private addSpecialLocations(map: Tile[][]): void {
    const locations = [
      { x: 10, y: 10, type: TileType.HOUSE, size: 3 },
      { x: 85, y: 10, type: TileType.SHOP, size: 4 },
      // { x: 80, y: 45, type: TileType.CAVE, size: 2 },
    ];

    locations.forEach(loc => {
      for (let y = -loc.size; y <= loc.size; y++) {
        for (let x = -loc.size; x <= loc.size; x++) {
          const currentX = loc.x + x;
          const currentY = loc.y + y;
          if (this.isInBounds(currentX, currentY)) {
            map[currentY][currentX] = {
              type: loc.type,
              walkable: true,
              interactable: true,
            };
          }
        }
      }
    });
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
    const spriteNames = [
      "Grass",
      "water",
      "tree",
      "House",
      "path",
      "soil",
      "crop",
      "mountain",
      "flower",
      "shop",
      "fountain",
      "npc",
      "bridge",
      "sand",
      "swamp",
      "rock",
      "mushroom",
      "mine",
      "fishing_spot",
      "berry_bush",
      "cactus",
      "ice",
      "hot_spring",
      "bench",
      "cave",
    ];
    // Load basic sprites
    spriteNames.forEach(name => {
      const img = new Image();
      img.src = `/assets/tiles/${name}.png`;
      this.sprites[name] = img;
    });

    // Load player directional sprites
    const directions = ["up", "down", "left", "right"];
    directions.forEach(direction => {
      const img = new Image();
      img.src = `/assets/player/${direction}.png`;
      this.sprites[`player_${direction}`] = img;
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
    const tile = this.state.map[Math.floor(position.y)][Math.floor(position.x)];

    // Check for NPC interaction
    if (tile.npcId) {
      const npc = this.npcs.find(n => n.id === tile.npcId);
      if (npc) {
        this.activeDialogue = {
          npc,
          dialogueIndex: 0,
        };
        this.showNotification(`Talking to ${npc.name}`, "#4A90E2");
        return;
      }
    }

    // Normal tile interaction
    if (!tile.interactable) return;

    const item = inventory[selectedItem];
    switch (item.type) {
      case "TOOL":
        if (item.name === "Hoe" && tile.type === TileType.GRASS) {
          tile.type = TileType.TILLED_SOIL;
          this.showNotification("Tilled the soil!");
          this.addHarvestParticles(Math.floor(position.x), Math.floor(position.y));
        } else if (item.name === "Watering Can" && tile.type === TileType.TILLED_SOIL) {
          tile.type = TileType.WATERED_SOIL;
          tile.waterLevel = 100;
          this.showNotification("Watered the soil!", "#4A90E2");
        } else if (item.name === "Fishing Rod" && tile.type === TileType.WATER) {
          this.tryFishing();
        }
        break;
      case "SEED":
        if (tile.type === TileType.TILLED_SOIL || tile.type === TileType.WATERED_SOIL) {
          if (item.quantity > 0) {
            tile.type = TileType.GROWING_CROP;
            tile.growthStage = 0;
            inventory[selectedItem].quantity--;
            this.showNotification("Planted a seed!", "#8E44AD");
          } else {
            this.showNotification("Out of seeds!", "#E74C3C");
          }
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
      if (item.icon) {
        const icon = this.sprites[item.icon];
        if (icon) {
          this.ctx.drawImage(icon, x + 10, y + 10, 40, 40);
        }
      }

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

    // Draw base tile
    let sprite: HTMLImageElement | undefined;
    switch (tile.type) {
      case TileType.GRASS:
        sprite = this.sprites.grass;
        break;
      case TileType.DIRT:
        sprite = this.sprites.dirt;
        break;
      case TileType.TILLED_SOIL:
        sprite = this.sprites.tilledSoil;
        break;
      case TileType.WATERED_SOIL:
        sprite = this.sprites.wateredSoil;
        break;
      case TileType.PATH:
        sprite = this.sprites.path;
        break;
      case TileType.TREE:
        sprite = this.sprites.tree;
        break;
    }

    if (sprite && sprite.complete && sprite.naturalWidth !== 0) {
      try {
        this.ctx.drawImage(sprite, screenX, screenY, TILE_SIZE, TILE_SIZE);
      } catch (error) {
        console.warn(`Failed to draw sprite for tile type ${tile.type}:`, error);
        this.drawTileFallback(tile, screenX, screenY);
      }
    } else {
      this.drawTileFallback(tile, screenX, screenY);
    }

    // Draw crops if present
    if (tile.type === TileType.GROWING_CROP && tile.growthStage !== undefined) {
      const cropSprite = this.sprites[`crop${tile.growthStage + 1}`];
      if (cropSprite && cropSprite.complete && cropSprite.naturalWidth !== 0) {
        try {
          this.ctx.drawImage(cropSprite, screenX, screenY, TILE_SIZE, TILE_SIZE);
        } catch (error) {
          console.warn("Failed to draw crop sprite:", error);
        }
      }
    } else if (tile.type === TileType.READY_CROP) {
      const readyCropSprite = this.sprites.cropReady;
      if (readyCropSprite && readyCropSprite.complete && readyCropSprite.naturalWidth !== 0) {
        try {
          this.ctx.drawImage(readyCropSprite, screenX, screenY, TILE_SIZE, TILE_SIZE);
        } catch (error) {
          console.warn("Failed to draw ready crop sprite:", error);
        }
      }
    }
  }

  private drawTileFallback(tile: Tile, x: number, y: number) {
    switch (tile.type) {
      case TileType.GRASS:
        this.ctx.fillStyle = "#90EE90";
        break;
      case TileType.DIRT:
        this.ctx.fillStyle = "#8B4513";
        break;
      case TileType.TILLED_SOIL:
        this.ctx.fillStyle = "#654321";
        break;
      case TileType.WATERED_SOIL:
        this.ctx.fillStyle = "#483C32";
        break;
      case TileType.PATH:
        this.ctx.fillStyle = "#C2B280";
        break;
      case TileType.TREE:
        this.ctx.fillStyle = "#355E3B";
        break;
      default:
        this.ctx.fillStyle = "#000000";
    }
    this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
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

    if (playerSprite && playerSprite.complete && playerSprite.naturalWidth !== 0) {
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
}
