import { Position } from "grid-engine";

export interface TileChange {
  layer: string;
  position: Position;
  tileIndex: number;
  original?: number; // Original tile index before change, if available
  timestamp: number; // When the change occurred
}

/**
 * MapStateTracker tracks changes to the game map tiles for saving/loading
 */
export default class MapStateTracker {
  // Store changes by position and layer for efficient lookups
  private changes: Map<string, TileChange> = new Map();

  constructor() {}

  /**
   * Track a tile change
   * @param layer The layer name where the change occurred
   * @param position The position of the changed tile
   * @param tileIndex The new tile index value (-1 for removed tiles)
   * @param original Optional original tile index before change
   */
  public trackTileChange(layer: string, position: Position, tileIndex: number, original?: number): void {
    const key = this.getChangeKey(layer, position);

    this.changes.set(key, {
      layer,
      position,
      tileIndex,
      original,
      timestamp: Date.now(),
    });
  }

  /**
   * Get all tracked tile changes
   */
  public getAllChanges(): TileChange[] {
    return Array.from(this.changes.values());
  }

  /**
   * Clear all tracked changes
   */
  public clearChanges(): void {
    this.changes.clear();
  }

  /**
   * Get a unique key for a tile change
   */
  private getChangeKey(layer: string, position: Position): string {
    return `${layer}:${position.x},${position.y}`;
  }
}
