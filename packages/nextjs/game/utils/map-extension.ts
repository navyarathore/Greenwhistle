// filepath: /run/media/abhigya/SSD/Github/Greenwhistle/packages/nextjs/game/utils/map-extension.ts
import { EventBus } from "../EventBus";
import SystemManager from "../SystemManager";
import Game from "../scenes/Game";
import { Position } from "grid-engine";

/**
 * Extends the Game class with methods that track map changes
 */
export default class MapExtension {
  /**
   * Initialize map change tracking for a Game instance
   * @param game The game instance to extend
   */
  static init(game: Game): void {
    // Store the original methods
    const originalPutTileAt = game.map.putTileAt;
    const originalRemoveTileAt = game.map.removeTileAt;

    // Override putTileAt to track changes
    game.map.putTileAt = function (
      tileIndex: number,
      x: number,
      y: number,
      recalculateFaces?: boolean,
      layer?: string | number,
    ) {
      // Call original method
      const result = originalPutTileAt.call(this, tileIndex, x, y, recalculateFaces, layer);

      // Get the actual layer name
      const layerName = typeof layer === "string" ? layer : this.layers[layer || 0].name;

      // Track the change
      const position: Position = { x, y };
      SystemManager.instance.mapStateTracker.trackTileChange(layerName, position, tileIndex);

      return result;
    };

    // Override removeTileAt to track changes
    game.map.removeTileAt = function (
      x: number,
      y: number,
      replaceWithNull?: boolean,
      recalculateFaces?: boolean,
      layer?: string | number,
    ) {
      // Get the tile before removing it to know what we're removing
      const targetLayer = typeof layer === "string" ? layer : this.layers[layer || 0].name;
      const existingTile = this.getTileAt(x, y, false, targetLayer);

      // Call original method
      const result = originalRemoveTileAt.call(this, x, y, replaceWithNull, recalculateFaces, layer);

      // Only track if there was actually a tile to remove
      if (existingTile) {
        // Track the removal with tileIndex -1 to indicate removal
        const position: Position = { x, y };
        SystemManager.instance.mapStateTracker.trackTileChange(
          targetLayer,
          position,
          -1, // -1 indicates tile removal
          existingTile.index, // Store the original index
        );
      }

      return result;
    };

    console.log("Map change tracking initialized");
  }
}
