import { wagmiConfig } from "../../services/web3/wagmiConfig";
import { HotbarIndex } from "./InventoryManager";
import { GameSave } from "./SaveManager";
import { readContract, writeContract } from "@wagmi/core";
import deployedContracts from "~~/contracts/deployedContracts";
import { getTargetNetworks } from "~~/utils/scaffold-eth";

/**
 * BlockchainSaveManager handles saving and loading game data to/from the blockchain
 * without requiring any UI components or event handling
 */
export default class BlockchainSaveManager {
  /**
   * Save game data to the blockchain
   * @param saveData Game save data to store
   * @returns Promise that resolves when the save is complete
   */
  public static async saveToBlockchain(saveData: GameSave): Promise<boolean> {
    try {
      const network = getTargetNetworks()[0];
      const deployedContractConfig = {
        address: deployedContracts[31337].GameSave.address as `0x${string}`,
        abi: deployedContracts[31337].GameSave.abi,
      };

      // Prepare player data
      const playerData = {
        positionX: BigInt(saveData.player.position.x),
        positionY: BigInt(saveData.player.position.y),
        health: BigInt(saveData.player.health),
        selectedHotbarSlot: BigInt(saveData.player.selectedHotbarSlot),
      };

      // Prepare inventory data
      const inventoryData = saveData.inventory.map(item => ({
        slotIndex: BigInt(item.slotIndex),
        itemId: item.itemId,
        quantity: BigInt(item.quantity),
      }));

      // Prepare farming data
      const farmingData = saveData.farming.map(crop => ({
        positionX: BigInt(crop.position.x),
        positionY: BigInt(crop.position.y),
        cropId: crop.cropId,
        growthStage: BigInt(crop.growthStage),
        plantedTime: BigInt(crop.plantedTime),
        lastWateredTime: BigInt(crop.lastWateredTime),
      }));

      // Prepare map changes data
      const mapChangesData = saveData.mapChanges.map(change => ({
        layer: change.layer,
        positionX: BigInt(change.position.x),
        positionY: BigInt(change.position.y),
        tileIndex: BigInt(change.tileIndex),
      }));

      // Write to the contract
      const hash = await writeContract(wagmiConfig, {
        ...deployedContractConfig,
        functionName: "saveGame",
        args: [
          BigInt(saveData.version),
          BigInt(saveData.timestamp),
          playerData,
          inventoryData,
          farmingData,
          mapChangesData,
        ],
      });

      console.log("Game saved to blockchain successfully, transaction hash:", hash);
      return true;
    } catch (error) {
      console.error("Error saving game to blockchain:", error);
      return false;
    }
  }

  /**
   * Load game data from the blockchain
   * @returns Promise that resolves with the loaded game data or null if failed
   */
  public static async loadFromBlockchain(): Promise<GameSave | null> {
    try {
      const deployedContractConfig = {
        address: deployedContracts[31337].GameSave.address as `0x${string}`,
        abi: deployedContracts[31337].GameSave.abi,
      };

      // Check if save exists
      const hasSave = await readContract(wagmiConfig, {
        ...deployedContractConfig,
        functionName: "hasSaveData",
      });

      if (!hasSave) {
        console.log("No blockchain save data found");
        return null;
      }

      // Read from the contract
      const saveData = await readContract(wagmiConfig, {
        ...deployedContractConfig,
        functionName: "loadGame",
      });

      if (!saveData) {
        console.error("Failed to load game from blockchain");
        return null;
      }

      // The returned data is an array of values, we need to restructure it
      const [version, timestamp, player, inventory, farming, mapChanges] = saveData;

      // Convert the blockchain data back to our GameSave format
      const gameSave: GameSave = {
        version: Number(version),
        timestamp: Number(timestamp),
        player: {
          position: {
            x: Number(player.positionX),
            y: Number(player.positionY),
          },
          health: Number(player.health),
          selectedHotbarSlot: Number(player.selectedHotbarSlot) as HotbarIndex,
        },
        inventory: inventory.map(item => ({
          slotIndex: Number(item.slotIndex),
          itemId: item.itemId,
          quantity: Number(item.quantity),
        })),
        farming: farming.map((crop: any) => ({
          position: {
            x: Number(crop.positionX),
            y: Number(crop.positionY),
          },
          cropId: crop.cropId,
          growthStage: Number(crop.growthStage),
          plantedTime: Number(crop.plantedTime),
          lastWateredTime: Number(crop.lastWateredTime),
        })),
        mapChanges: mapChanges.map((change: any) => ({
          layer: change.layer,
          position: {
            x: Number(change.positionX),
            y: Number(change.positionY),
          },
          tileIndex: Number(change.tileIndex),
        })),
      };
      console.log("Game loaded from blockchain successfully");
      return gameSave;
    } catch (error) {
      console.error("Error loading game from blockchain:", error);
      return null;
    }
  }

  /**
   * Check if a save exists on the blockchain
   * @returns Promise that resolves with a boolean indicating if a save exists
   */
  public static async hasSaveDataOnBlockchain(): Promise<boolean> {
    try {
      const network = getTargetNetworks()[0];
      const deployedContractConfig = {
        address: deployedContracts[31337].GameSave.address as `0x${string}`,
        abi: deployedContracts[31337].GameSave.abi,
      };

      return (await readContract(wagmiConfig, {
        ...deployedContractConfig,
        functionName: "hasSaveData",
      })) as boolean;
    } catch (error) {
      console.error("Error checking blockchain save:", error);
      return false;
    }
  }

  /**
   * Delete the current save from the blockchain
   * @returns Promise that resolves with a boolean indicating success
   */
  public static async deleteSaveDataFromBlockchain(): Promise<boolean> {
    try {
      const deployedContractConfig = {
        address: deployedContracts[31337].GameSave.address as `0x${string}`,
        abi: deployedContracts[31337].GameSave.abi,
      };

      const hash = await writeContract(wagmiConfig, {
        ...deployedContractConfig,
        functionName: "deleteSaveData",
      });

      console.log("Save data deleted from blockchain, transaction hash:", hash);
      return true;
    } catch (error) {
      console.error("Error deleting blockchain save:", error);
      return false;
    }
  }
}
