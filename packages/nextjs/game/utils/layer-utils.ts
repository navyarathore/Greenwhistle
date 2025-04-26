import { Position } from "grid-engine";

interface LayerMapping {
  from: number;
  to: number;
}

const layerMapping = new Map<string, LayerMapping>();
const layerNames: string[] = [];

export const loadLayerMapping = (tilemap: Phaser.Tilemaps.Tilemap) => {
  const layers = tilemap.getTileLayerNames();
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i].split("#")[0];
    if (layerMapping.has(layer)) {
      layerMapping.get(layer)!.to = i + 1;
    } else {
      layerMapping.set(layer, {
        from: i,
        to: i + 1,
      });
    }
  }
  layerNames.push(...tilemap.getTileLayerNames());
};

export interface LayerCallback<T> {
  (layers: string[], tilemap: Phaser.Tilemaps.Tilemap): T;
}

export const loopLayerRecursively = <T>(
  tilemap: Phaser.Tilemaps.Tilemap,
  layer: string,
  callback: LayerCallback<T>,
): T => {
  const mapping = layerMapping.get(layer);
  if (!mapping) {
    throw new Error(`Unable to load layer: ${layer}`);
  }
  return callback(layerNames.slice(mapping.from, mapping.to), tilemap);
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
