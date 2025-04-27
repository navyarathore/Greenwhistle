// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title GameSave
 * @dev Contract for saving and loading game data to/from the blockchain
 */
contract GameSave is Ownable, ReentrancyGuard, Pausable {
    // Game data structure
    struct SaveData {
        uint256 version;
        uint256 timestamp;
        // Player data
        PlayerData player;
        // Arrays for different game elements
        InventoryItem[] inventory;
        FarmingData[] farming;
        MapChange[] mapChanges;
    }

    // Player data structure
    struct PlayerData {
        uint256 positionX;
        uint256 positionY;
        uint256 health;
        uint256 selectedHotbarSlot;
    }

    // Inventory item structure
    struct InventoryItem {
        uint256 slotIndex;
        string itemId;
        uint256 quantity;
    }

    // Farming data structure
    struct FarmingData {
        uint256 positionX;
        uint256 positionY;
        string cropId;
        uint256 growthStage;
        uint256 plantedTime;
        uint256 lastWateredTime;
    }

    // Map change structure
    struct MapChange {
        string layer;
        uint256 positionX;
        uint256 positionY;
        int256 tileIndex;
    }

    // Mapping from address to save data
    mapping(address => SaveData) private gameSaves;
    mapping(address => bool) private hasSave;

    // Events
    event GameSaved(address indexed player, uint256 timestamp);
    event SaveDeleted(address indexed player);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Save game data to the blockchain
     */
    function saveGame(
        address user,
        uint256 _version,
        uint256 _timestamp,
        PlayerData calldata _player,
        InventoryItem[] calldata _inventory,
        FarmingData[] calldata _farming,
        MapChange[] calldata _mapChanges
    ) external whenNotPaused nonReentrant {
        SaveData storage saveData = gameSaves[user];

        saveData.version = _version;
        saveData.timestamp = _timestamp;
        saveData.player = _player;

        // Clear existing arrays and replace with new data
        delete saveData.inventory;
        delete saveData.farming;
        delete saveData.mapChanges;

        // Save inventory items
        for (uint i = 0; i < _inventory.length; i++) {
            saveData.inventory.push(_inventory[i]);
        }

        // Save farming data
        for (uint i = 0; i < _farming.length; i++) {
            saveData.farming.push(_farming[i]);
        }

        // Save map changes
        for (uint i = 0; i < _mapChanges.length; i++) {
            saveData.mapChanges.push(_mapChanges[i]);
        }

        hasSave[user] = true;

        emit GameSaved(user, _timestamp);
    }

    function loadGame(address user)
        external
        view
        whenNotPaused
        returns (
            uint256 version,
            uint256 timestamp,
            PlayerData memory player,
            InventoryItem[] memory inventory,
            FarmingData[] memory farming,
            MapChange[] memory mapChanges
        )
    {
        require(hasSave[user], "No save data found for this address");

        SaveData storage saveData = gameSaves[user];

        return (
            saveData.version,
            saveData.timestamp,
            saveData.player,
            saveData.inventory,
            saveData.farming,
            saveData.mapChanges
        );
    }

    /**
     * @dev Check if the player has a saved game
     * @return Whether the player has a saved game
     */
    function hasSaveData(address user) external view returns (bool) {
        return hasSave[user];
    }

    /**
     * @dev Delete the current save
     */
    function deleteSaveData(address user) external whenNotPaused nonReentrant {
        require(hasSave[user], "No save data found for this address");

        delete gameSaves[user];
        hasSave[user] = false;

        emit SaveDeleted(user);
    }

    /**
     * @dev Pause the contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
