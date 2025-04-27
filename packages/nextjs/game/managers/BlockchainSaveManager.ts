import { HotbarIndex } from "./InventoryManager";
import { GameSave } from "./SaveManager";
import { getAccount, getPublicClient, readContract, writeContract } from "@wagmi/core";
import deployedContracts from "~~/contracts/deployedContracts";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";

/**
 * BlockchainSaveManager handles saving and loading game data to/from the blockchain
 * without requiring any UI components or event handling
 */
export default class BlockchainSaveManager {
  /**
   * Private helper method to set up common blockchain interaction requirements
   * @returns Object containing chainId and account address, or null if setup fails
   */
  private static async setupBlockchainInteraction(): Promise<{ chainId: number; accountAddress: string } | null> {
    try {
      // Get network info
      const publicClient = getPublicClient(wagmiConfig);
      const chainId = publicClient ? await publicClient.getChainId() : 31337;

      // Get current connected account
      const account = getAccount(wagmiConfig);
      if (!account.address) {
        console.error("No wallet connected");
        return null;
      }

      // Make sure contract exists on this network
      if (!deployedContracts[chainId as keyof typeof deployedContracts]?.GameSave) {
        console.error(`GameSave contract not found on chain ${chainId}`);
        return null;
      }

      return { chainId, accountAddress: account.address };
    } catch (error) {
      console.error("Error setting up blockchain interaction:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
      return null;
    }
  }

  /**
   * Save game data to the blockchain
   * @param saveData Game save data to store
   * @returns Promise that resolves when the save is complete
   */
  public static async saveToBlockchain(saveData: GameSave): Promise<boolean> {
    try {
      const setup = await this.setupBlockchainInteraction();
      if (!setup) {
        return false;
      }

      const { chainId, accountAddress } = setup;

      // Prepare player data with safe number conversion to avoid floating point issues
      const playerData = {
        positionX: BigInt(Math.floor(saveData.player.position.x)),
        positionY: BigInt(Math.floor(saveData.player.position.y)),
        health: BigInt(Math.floor(saveData.player.health)),
        selectedHotbarSlot: BigInt(saveData.player.selectedHotbarSlot),
      };

      // Prepare inventory data
      const inventoryData = saveData.inventory.map(item => ({
        slotIndex: BigInt(item.slotIndex),
        itemId: item.itemId,
        quantity: BigInt(Math.floor(item.quantity)),
      }));

      // Prepare farming data
      const farmingData = saveData.farming.map(crop => ({
        positionX: BigInt(Math.floor(crop.position.x)),
        positionY: BigInt(Math.floor(crop.position.y)),
        cropId: crop.cropId,
        growthStage: BigInt(Math.floor(crop.growthStage)),
        plantedTime: BigInt(Math.floor(crop.plantedTime)),
        lastWateredTime: BigInt(Math.floor(crop.lastWateredTime)),
      }));

      // Prepare map changes data
      const mapChangesData = saveData.mapChanges.map(change => ({
        layer: change.layer,
        positionX: BigInt(Math.floor(change.position.x)),
        positionY: BigInt(Math.floor(change.position.y)),
        tileIndex: BigInt(change.tileIndex), // This handles negative values correctly
      }));

      // Write to the contract
      const hash = await writeContract(wagmiConfig, {
        ...deployedContracts[chainId as keyof typeof deployedContracts].GameSave,
        functionName: "saveGame",
        args: [
          BigInt(Math.floor(saveData.version)),
          BigInt(Math.floor(Date.now() / 1000)), // Use current timestamp to ensure it's always up-to-date
          playerData,
          inventoryData,
          farmingData,
          mapChangesData,
        ],
        account: accountAddress,
      });

      console.log("Game saved to blockchain successfully, transaction hash:", hash);
      return true;
    } catch (error) {
      console.error("Error saving game to blockchain:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
      return false;
    }
  }

  /**
   * Load game data from the blockchain
   * @returns Promise that resolves with the loaded game data or null if failed
   */
  public static async loadFromBlockchain(): Promise<GameSave | null> {
    try {
      const setup = await this.setupBlockchainInteraction();
      if (!setup) {
        return null;
      }

      const { chainId, accountAddress } = setup;

      // Check if save exists
      const hasSave = await readContract(wagmiConfig, {
        ...deployedContracts[chainId as keyof typeof deployedContracts].GameSave,
        functionName: "hasSaveData",
        account: accountAddress,
      });

      if (!hasSave) {
        console.log("No blockchain save data found");
        return null;
      }

      // Read from the contract
      const saveData = await readContract(wagmiConfig, {
        ...deployedContracts[chainId as keyof typeof deployedContracts].GameSave,
        functionName: "loadGame",
        account: accountAddress,
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
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
      return null;
    }
  }

  /**
   * Check if a save exists on the blockchain
   * @returns Promise that resolves with a boolean indicating if a save exists
   */
  public static async hasSaveDataOnBlockchain(): Promise<boolean> {
    try {
      const setup = await this.setupBlockchainInteraction();
      if (!setup) {
        return false;
      }

      const { chainId, accountAddress } = setup;

      return (await readContract(wagmiConfig, {
        ...deployedContracts[chainId as keyof typeof deployedContracts].GameSave,
        functionName: "hasSaveData",
        account: accountAddress,
      })) as boolean;
    } catch (error) {
      console.error("Error checking blockchain save:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
      return false;
    }
  }

  /**
   * Delete the current save from the blockchain
   * @returns Promise that resolves with a boolean indicating success
   */
  public static async deleteSaveDataFromBlockchain(): Promise<boolean> {
    try {
      const setup = await this.setupBlockchainInteraction();
      if (!setup) {
        return false;
      }

      const { chainId, accountAddress } = setup;

      const hash = await writeContract(wagmiConfig, {
        ...deployedContracts[chainId as keyof typeof deployedContracts].GameSave,
        functionName: "deleteSaveData",
        account: accountAddress,
      });

      console.log("Save data deleted from blockchain, transaction hash:", hash);
      return true;
    } catch (error) {
      console.error("Error deleting blockchain save:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
      return false;
    }
  }
}
