"use client";

import { useEffect, useRef, useState } from "react";
import { GameEngine } from "./GameEngine";
import { Direction } from "./types";

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      if (gameEngineRef.current) {
        gameEngineRef.current.handleResize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial size

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize game engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isInitialized) return;

    try {
      // Initialize game engine
      const gameEngine = new GameEngine(canvas);
      gameEngineRef.current = gameEngine;

      // Game loop
      const gameLoop = (timestamp: number) => {
        if (gameEngineRef.current) {
          gameEngineRef.current.update(timestamp);
          gameEngineRef.current.render();
          requestAnimationFrame(gameLoop);
        }
      };

      requestAnimationFrame(gameLoop);
      setIsInitialized(true);
    } catch (error) {
      console.error("Failed to initialize game:", error);
    }
  }, [isInitialized]);

  // Handle keyboard input
  useEffect(() => {
    if (!isInitialized) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameEngineRef.current) return;

      switch (e.key) {
        case "ArrowUp":
        case "w":
          gameEngineRef.current.movePlayer(Direction.UP);
          break;
        case "ArrowDown":
        case "s":
          gameEngineRef.current.movePlayer(Direction.DOWN);
          break;
        case "ArrowLeft":
        case "a":
          gameEngineRef.current.movePlayer(Direction.LEFT);
          break;
        case "ArrowRight":
        case "d":
          gameEngineRef.current.movePlayer(Direction.RIGHT);
          break;
        case " ":
        case "e":
          gameEngineRef.current.interact();
          break;
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
          const state = gameEngineRef.current.getState();
          state.player.selectedItem = parseInt(e.key) - 1;
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isInitialized]);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white p-4 rounded-lg">
        <div className="text-center space-y-1 text-sm">
          <p>WASD or Arrow keys to move | E or Space to interact | 1-5 to select items</p>
          <p>🌱 Hoe: Till soil | 💧 Water: Nurture crops | 🌾 Seeds: Plant crops | 🪓 Axe: Clear trees</p>
        </div>
      </div>
    </div>
  );
}
