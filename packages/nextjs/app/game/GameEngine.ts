import {
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

    // Initialize game state
    this.state = {
      player: {
        position: { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 },
        direction: Direction.DOWN,
        speed: 0.15,
        inventory: INITIAL_INVENTORY,
        selectedItem: 0,
        energy: 100,
      },
      map: this.generateInitialMap(),
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

  private generateInitialMap(): Tile[][] {
    const map: Tile[][] = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
      map[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        // Create different biomes and areas
        if (this.isInRange(x, y, 0, 0, 20, 20)) {
          // Starting farm area
          map[y][x] = { type: TileType.GRASS, walkable: true, interactable: true };
        } else if (this.isInRange(x, y, 85, 5, 95, 15)) {
          // Marketplace
          map[y][x] = { type: TileType.PATH, walkable: true, interactable: true };
        } else if (this.isInRange(x, y, 30, 30, 50, 50)) {
          // Lake area
          map[y][x] = { type: TileType.WATER, walkable: false, interactable: true };
        } else if (this.isInRange(x, y, 60, 10, 70, 20)) {
          // Forest area
          map[y][x] = {
            type: Math.random() < 0.4 ? TileType.TREE : TileType.GRASS,
            walkable: true,
            interactable: true,
          };
        } else if (this.isInRange(x, y, 75, 40, 85, 50)) {
          // Stone quarry
          map[y][x] = { type: TileType.STONE, walkable: true, interactable: true };
        } else {
          // Random wilderness
          const rand = Math.random();
          if (rand < 0.1) {
            map[y][x] = { type: TileType.TREE, walkable: false, interactable: true };
          } else if (rand < 0.15) {
            map[y][x] = { type: TileType.FLOWER, walkable: true, interactable: true };
          } else {
            map[y][x] = { type: TileType.GRASS, walkable: true, interactable: true };
          }
        }

        // Add paths connecting areas
        if (this.isPath(x, y)) {
          map[y][x] = { type: TileType.PATH, walkable: true, interactable: false };
        }
      }
    }

    // Place NPCs on the map
    this.npcs.forEach(npc => {
      const { x, y } = npc.position;
      if (map[y] && map[y][x]) {
        map[y][x].npcId = npc.id;
      }
    });

    return map;
  }

  private isInRange(x: number, y: number, x1: number, y1: number, x2: number, y2: number): boolean {
    return x >= x1 && x <= x2 && y >= y1 && y <= y2;
  }

  private isPath(x: number, y: number): boolean {
    // Main paths connecting areas
    const isHorizontalPath = (y === 20 || y === 40) && x < MAP_WIDTH;
    const isVerticalPath = (x === 20 || x === 50) && y < MAP_HEIGHT;
    return isHorizontalPath || isVerticalPath;
  }

  private async loadSprites() {
    const spriteList = {
      // Ground tiles
      grass: "/assets/tiles/grass.png",
      dirt: "/assets/tiles/dirt.png",
      tilledSoil: "/assets/tiles/tilled_soil.png",
      wateredSoil: "/assets/tiles/watered_soil.png",
      tree: "/assets/tiles/tree.png",
      path: "",
      water: "/assets/tiles/water.png",
      stone: "/assets/tiles/stone.png",
      flower: "/assets/tiles/flower.png",
      house: "/assets/tiles/house.png",
      shop: "/assets/tiles/shop.png",

      // Player sprites - make sure these match your actual file names
      playerDown: "/assets/player/down.png",
      playerUp: "/assets/player/up.png",
      playerLeft: "/assets/player/left.png",
      playerRight: "/assets/player/right.png",

      // NPCs
      merchant: "/assets/sprites/merchant.png",
      farmer: "/assets/sprites/farmer.png",

      // Crops
      crop1: "/assets/sprites/crop.png",
      crop2: "/assets/sprites/crop.png",
      crop3: "/assets/sprites/crop.png",
      cropReady: "/assets/sprites/crop.png",
    };

    const loadImage = (key: string, path: string): Promise<void> => {
      return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
          this.sprites[key] = img;
          resolve();
        };
        img.onerror = () => {
          console.warn(`Failed to load sprite: ${path}`);
          resolve();
        };
        img.src = path;
      });
    };

    try {
      await Promise.all(Object.entries(spriteList).map(([key, path]) => loadImage(key, path)));
      console.log("Sprites loaded:", Object.keys(this.sprites));
    } catch (error) {
      console.error("Error loading sprites:", error);
    }
  }

  public movePlayer(direction: Direction) {
    const { position, speed } = this.state.player;
    const newPos = { ...position };
    const delta = 1; // For smooth movement

    switch (direction) {
      case Direction.UP:
        newPos.y = Math.max(0, position.y - speed * delta);
        break;
      case Direction.DOWN:
        newPos.y = Math.min(MAP_HEIGHT - 1, position.y + speed * delta);
        break;
      case Direction.LEFT:
        newPos.x = Math.max(0, position.x - speed * delta);
        break;
      case Direction.RIGHT:
        newPos.x = Math.min(MAP_WIDTH - 1, position.x + speed * delta);
        break;
    }

    if (this.isTileWalkable(newPos)) {
      this.state.player.position = newPos;
      this.state.player.direction = direction;
      this.updateCamera();
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

  public render() {
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

    // Add shadow under player
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    this.ctx.beginPath();
    this.ctx.ellipse(screenX + TILE_SIZE / 2, screenY + TILE_SIZE - 2, TILE_SIZE / 3, TILE_SIZE / 6, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Get the correct sprite based on direction
    const spriteKey = `player${direction}`;
    const playerSprite = this.sprites[spriteKey];

    if (playerSprite && playerSprite.complete && playerSprite.naturalWidth !== 0) {
      try {
        this.ctx.save();
        this.ctx.translate(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);

        const time = performance.now() * 0.001;
        const walkingRotation = Math.sin(time * 5) * 0.05;
        this.ctx.rotate(walkingRotation);

        this.ctx.drawImage(playerSprite, -TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
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
    // Fallback character if sprite not loaded
    this.ctx.fillStyle = "#4A90E2";
    this.ctx.beginPath();
    this.ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, TILE_SIZE / 2, 0, Math.PI * 2);
    this.ctx.fill();

    // Add eyes to make it look like a character
    this.ctx.fillStyle = "white";
    this.ctx.beginPath();
    this.ctx.arc(screenX + TILE_SIZE / 2 - 5, screenY + TILE_SIZE / 2 - 5, 3, 0, Math.PI * 2);
    this.ctx.arc(screenX + TILE_SIZE / 2 + 5, screenY + TILE_SIZE / 2 - 5, 3, 0, Math.PI * 2);
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
}
