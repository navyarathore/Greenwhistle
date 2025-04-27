import { Position } from "grid-engine";

interface LayerMapping {
  from: number;
  to: number;
}

export const HEIGHT_FIRST = 0;
export const HEIGHT_LAST = 5;
export const COLLISION_TILE_IDS = [1, 2, 3, 51, 52, 53, 101, 102, 151];

export const LayerName = {
  GROUND: "Ground",
  GROUND_TEXTURE: "Ground Texture",
  GRASS_TILE: "Grass Tile",
  POND: "Pond",
  FOUNTAIN_BASE: "Fountain Base",
  COLLISION_LAYER: "Collision Layer",
} as const;

export type LayerName = (typeof LayerName)[keyof typeof LayerName];

export const LAYER_MAPPING = new Map<string, LayerMapping>();
const LAYER_NAMES: string[] = [];

export const loadLayerMapping = (tilemap: Phaser.Tilemaps.Tilemap) => {
  const layers = tilemap.getTileLayerNames();
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i].split("#")[0];
    if (LAYER_MAPPING.has(layer)) {
      LAYER_MAPPING.get(layer)!.to = i + 1;
    } else {
      LAYER_MAPPING.set(layer, {
        from: i,
        to: i + 1,
      });
    }
  }
  LAYER_NAMES.push(...tilemap.getTileLayerNames());
};

export interface LayerCallback<T> {
  (layers: string[], tilemap: Phaser.Tilemaps.Tilemap): T;
}

export const loopLayerRecursively = <T>(
  tilemap: Phaser.Tilemaps.Tilemap,
  layer: string,
  callback: LayerCallback<T>,
): T => {
  const mapping = LAYER_MAPPING.get(layer);
  if (!mapping) {
    throw new Error(`Unable to load layer: ${layer}`);
  }
  return callback(LAYER_NAMES.slice(mapping.from, mapping.to), tilemap);
};

export const getTileRecursivelyAt = (
  position: Position,
  tilemap: Phaser.Tilemaps.Tilemap,
  layer: string,
  nonNull?: boolean,
): Phaser.Tilemaps.Tile | null => {
  return loopLayerRecursively(tilemap, layer, (layers, _) => {
    const tiles = [];
    for (const layer of layers) {
      const tile = tilemap.getTileAt(position.x, position.y, nonNull, layer);
      tiles.push(tile);
      if (tile) return tile;
    }

    return null;
  });
};

export const getMultipleTileRecursivelyAt = (
  position: Position,
  tilemap: Phaser.Tilemaps.Tilemap,
  layers: string[],
  nonNull?: boolean,
): Phaser.Tilemaps.Tile[] => {
  return layers.reduce<Phaser.Tilemaps.Tile[]>((tiles, layer) => {
    return loopLayerRecursively(tilemap, layer, (layers, _) => {
      for (const layer of layers) {
        const tile = tilemap.getTileAt(position.x, position.y, nonNull, layer);
        if (tile) {
          tiles.push(tile);
        }
      }

      return tiles;
    });
  }, []);
};

export const removeTileRecursivelyAt = (
  position: Position,
  tilemap: Phaser.Tilemaps.Tilemap,
  layer: string,
): Phaser.Tilemaps.Tile | null => {
  return loopLayerRecursively(tilemap, layer, (layers, _) => {
    for (const layer of layers) {
      const tile = tilemap.removeTileAt(position.x, position.y, true, true, layer);
      if (tile) return tile;
    }

    return null;
  });
};

export const isPositionEmpty = (tilemap: Phaser.Tilemaps.Tilemap, x: number, y: number): boolean => {
  const layers = {
    from: LAYER_MAPPING.get(`Height 0`)!.from,
    to: LAYER_MAPPING.get(`Height 1`)!.to,
  };

  for (let layer = layers.from; layer < layers.to; layer++) {
    const existingTile = tilemap.getTileAt(x, y, false, layer);
    if (existingTile) {
      console.log("Found existing tile at", x, y, `on layer ${existingTile.layer.name}`, existingTile);
      return false;
    }
  }

  return true;
};
