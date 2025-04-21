import React from "react";

interface TileRangeProps {
  tilesetUrl: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  tileSize?: number;
  scale?: number;
  className?: string;
}

/**
 * TileRange - A component that renders a specific range of tiles from a tileset image
 *
 * @param tilesetUrl - URL to the tileset image
 * @param startX - Starting X position of the tile in the tileset (0-indexed)
 * @param startY - Starting Y position of the tile in the tileset (0-indexed)
 * @param endX - Ending X position of the tile in the tileset (0-indexed, inclusive)
 * @param endY - Ending Y position of the tile in the tileset (0-indexed, inclusive)
 * @param tileSize - Size of each tile in pixels (assumes square tiles)
 * @param scale - Scale factor for rendering the tile (default: 1)
 * @param className - Additional CSS classes to add to the container
 */
export const TileRange: React.FC<TileRangeProps> = ({
  tilesetUrl,
  startX = 0,
  startY = 0,
  endX = 0,
  endY = 0,
  tileSize = 16,
  scale = 1,
  className = "",
}) => {
  // Calculate width and height in tiles
  const widthInTiles = endX - startX + 1;
  const heightInTiles = endY - startY + 1;

  // Get Tailwind classes for dimensions based on pixel size
  const getSizeClasses = (): string => {
    const totalWidth = widthInTiles * tileSize * scale;
    const totalHeight = heightInTiles * tileSize * scale;

    // Map to closest Tailwind width class
    let widthClass = "w-64";
    if (totalWidth <= 16) widthClass = "w-4";
    else if (totalWidth <= 24) widthClass = "w-6";
    else if (totalWidth <= 32) widthClass = "w-8";
    else if (totalWidth <= 48) widthClass = "w-12";
    else if (totalWidth <= 64) widthClass = "w-16";
    else if (totalWidth <= 80) widthClass = "w-20";
    else if (totalWidth <= 96) widthClass = "w-24";
    else if (totalWidth <= 128) widthClass = "w-32";
    else if (totalWidth <= 160) widthClass = "w-40";
    else if (totalWidth <= 192) widthClass = "w-48";

    // Map to closest Tailwind height class
    let heightClass = "h-64";
    if (totalHeight <= 16) heightClass = "h-4";
    else if (totalHeight <= 24) heightClass = "h-6";
    else if (totalHeight <= 32) heightClass = "h-8";
    else if (totalHeight <= 48) heightClass = "h-12";
    else if (totalHeight <= 64) heightClass = "h-16";
    else if (totalHeight <= 80) heightClass = "h-20";
    else if (totalHeight <= 96) heightClass = "h-24";
    else if (totalHeight <= 128) heightClass = "h-32";
    else if (totalHeight <= 160) heightClass = "h-40";
    else if (totalHeight <= 192) heightClass = "h-48";

    return `${widthClass} ${heightClass}`;
  };

  // Custom styles that cannot be handled by Tailwind classes
  const imagePositionStyle: React.CSSProperties = {
    position: "absolute",
    top: -startY * tileSize,
    left: -startX * tileSize,
    width: "auto",
    height: "auto",
    transform: `scale(${scale})`,
    transformOrigin: "top left",
    imageRendering: "pixelated",
  };

  return (
    <div className={`relative overflow-hidden inline-block ${getSizeClasses()} ${className}`}>
      <img
        src={tilesetUrl}
        alt={`Tiles from position (${startX},${startY}) to (${endX},${endY})`}
        className="absolute"
        style={imagePositionStyle}
      />
    </div>
  );
};
