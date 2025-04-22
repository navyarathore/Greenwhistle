import GridEngine, { Direction, Position } from "grid-engine";
import * as Phaser from "phaser";
import { EventBus } from "~~/game/EventBus";
import { SPRITE_ID } from "~~/game/entities/Player";
import { InputComponent } from "~~/game/input/InputComponent";
import { Item } from "~~/game/resources/Item";
import ResourceData from "~~/game/resources/resource.json";
import { Game } from "~~/game/scenes/Game";

export default class ControlsManager {
  constructor(
    private game: Game,
    readonly inputComponent: InputComponent,
    private gridEngine: GridEngine,
  ) {}

  setupControls(): void {
    this.inputComponent.inventoryKey.on("up", () => {
      if (this.game.scene.isActive("InventoryMenu")) {
        this.game.scene.stop("InventoryMenu");
        this.game.player.enableMovement();
      } else {
        this.game.scene.launch("InventoryMenu", { inventoryManager: this.game.sysManager.inventorySystem });
        this.game.player.disableMovement();
      }
    });

    this.inputComponent.actionKey.on("up", () => {
      const playerPosition = this.gridEngine.getPosition(SPRITE_ID);

      for (const res of ResourceData.pickup) {
        const { layer, id, method, result } = res;
        const tile = this.game.map.getTileAt(playerPosition.x, playerPosition.y, false, layer);

        if (tile && id.includes(tile.index)) {
          const combined = new Set(ResourceData.combined_blocks.filter(block => block.includes(tile.index)).flat());
          console.log(combined);
          const toRemove = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ].reduce<Position[]>(
            (pos, [deltaX, deltaY]) => {
              const deltaTile: Phaser.Tilemaps.Tile | null = this.game.map.getTileAt(
                tile.x + deltaX,
                tile.y + deltaY,
                false,
                layer,
              );
              if (deltaTile && combined.has(deltaTile.index)) {
                return [...pos, { x: deltaTile.x, y: deltaTile.y }];
              }
              return pos;
            },
            [{ x: tile.x, y: tile.y }],
          );

          const toAdd: Item[] = [];
          if (method === "random") {
            const randomResult = Phaser.Math.RND.pick(result);
            toAdd.push(new Item(this.game.sysManager.itemManager.getMaterial(randomResult.id)!, randomResult.amount));
          } else if (method === "direct") {
            toAdd.push(
              ...result.map(res => new Item(this.game.sysManager.itemManager.getMaterial(res.id)!, res.amount)),
            );
          }

          const added = this.game.sysManager.inventorySystem.addItems(toAdd);
          if (!added) return;

          for (const { x, y } of toRemove) {
            this.game.map.removeTileAt(x, y, false, true, layer);
          }

          EventBus.emit("item-picked-up", tile.properties);
          break;
        }
      }
    });
  }

  update(): void {
    if (!this.game.player.isMovementEnabled) return;

    if (this.inputComponent.isUpDown) {
      this.gridEngine.move(SPRITE_ID, Direction.UP);
    } else if (this.inputComponent.isDownDown) {
      this.gridEngine.move(SPRITE_ID, Direction.DOWN);
    } else if (this.inputComponent.isLeftDown) {
      this.gridEngine.move(SPRITE_ID, Direction.LEFT);
    } else if (this.inputComponent.isRightDown) {
      this.gridEngine.move(SPRITE_ID, Direction.RIGHT);
    }
  }
}
