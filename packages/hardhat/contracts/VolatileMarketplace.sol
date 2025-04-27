// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { Counters } from "openzeppelin/contracts/utils/Counters.sol";
import "./GameSave.sol";

/**
 * @title VolatileMarketplace
 * @dev A marketplace contract for trading in-game items with supply and demand dynamics
 * similar to the Steam marketplace. All transactions are conducted with native MON.
 */
contract VolatileMarketplace is Ownable, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;

    // Contract dependencies
    GameSave private gameSave;

    // Listing counter
    Counters.Counter private _listingIds;

    // Fee structure
    uint256 public marketplaceFeePercentage = 250; // 2.5% (using basis points: 10000 = 100%)
    address public feeCollector;

    // Listing structure
    struct Listing {
        uint256 listingId;
        address seller;
        string gameItemId;
        uint256 quantity;
        uint256 price; // Price per unit in wei
        uint256 listedAt;
        bool active;
    }

    // History of sold items for price tracking
    struct SaleRecord {
        uint256 timestamp;
        uint256 price;
        uint256 quantity;
    }

    // Market statistics
    struct MarketStats {
        uint256 totalVolume; // Total volume traded
        uint256 highestPrice; // Highest price ever sold
        uint256 lowestPrice; // Lowest price ever sold (if not 0)
        uint256 lastSoldPrice; // Last sold price
        uint256 numberOfSales; // Number of completed sales
        uint256 totalListings; // Total times listed
        uint256 currentListings; // Current active listings count
        uint256 avgSoldPrice; // Average selling price (rolling)
    }

    // Mappings
    mapping(uint256 => Listing) public listings;
    mapping(address => uint256[]) public sellerListings;
    mapping(string => MarketStats) public gameItemStats;
    mapping(string => SaleRecord[]) public gameItemSaleHistory;

    mapping(string => uint256) public lowestPriceListingForGameItem;

    // Track unique game items that are listed
    mapping(string => bool) public listedGameItems;
    string[] public uniqueGameItemIds;
    
    mapping(address => mapping(string => uint256)) private userGameItemEscrow;

    // Events
    event ItemListed(
        uint256 indexed listingId,
        address indexed seller,
        string gameItemId,
        uint256 price,
        uint256 quantity
    );
    event ListingCancelled(uint256 indexed listingId, address indexed seller);
    event ItemSold(
        uint256 indexed listingId,
        address indexed seller,
        address indexed buyer,
        string gameItemId,
        uint256 price,
        uint256 quantity
    );
    event MarketplaceFeeUpdated(uint256 newFeePercentage);
    event FeeCollectorUpdated(address newFeeCollector);
    event PriceChanged(uint256 indexed listingId, uint256 oldPrice, uint256 newPrice);

    /**
     * @dev Constructor to initialize the marketplace with required contract addresses
     * @param _gameSave Address of the game save contract
     */
    constructor(address _gameSave) Ownable(msg.sender) {
        require(_gameSave != address(0), "Invalid GameSave address");

        gameSave = GameSave(_gameSave);

        feeCollector = msg.sender;
    }

    /**
     * @dev List a game item on the marketplace
     * @param gameItemId The ID of the game item as used in the game
     * @param quantity The quantity of the item to list
     * @param price The price per unit in MON (wei)
     */
    function listGameItem(
        string memory gameItemId,
        uint256 quantity,
        uint256 price
    ) external whenNotPaused nonReentrant {
        require(quantity > 0, "Quantity must be greater than 0");
        require(price > 0, "Price must be greater than 0");

        // Verify that the user has the item in their inventory
        bool hasItem = _verifyGameItemOwnership(msg.sender, gameItemId, quantity);
        require(hasItem, "You don't own enough of this item");

        // Remove the item from the user's inventory
        bool removed = _removeItemFromInventory(msg.sender, gameItemId, quantity);
        require(removed, "Failed to remove item from inventory");

        // Add the item to escrow
        _escrowGameItem(msg.sender, gameItemId, quantity);

        // Create the listing
        _listingIds.increment();
        uint256 newListingId = _listingIds.current();

        listings[newListingId] = Listing({
            listingId: newListingId,
            seller: msg.sender,
            gameItemId: gameItemId,
            quantity: quantity,
            price: price,
            listedAt: block.timestamp,
            active: true
        });

        // Add to seller's listings
        sellerListings[msg.sender].push(newListingId);

        // Update market stats
        gameItemStats[gameItemId].totalListings++;
        gameItemStats[gameItemId].currentListings++;

        // Track unique game item if not already tracked
        if (!listedGameItems[gameItemId]) {
            listedGameItems[gameItemId] = true;
            uniqueGameItemIds.push(gameItemId);
        }

        // Update lowest price listing if applicable
        _updateLowestPriceGameItemListing(gameItemId, newListingId, price);

        emit ItemListed(newListingId, msg.sender, gameItemId, price, quantity);
    }



    /**
     * @dev Cancel a listing
     * @param listingId The ID of the listing to cancel
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];

        require(listing.active, "Listing is not active");
        require(listing.seller == msg.sender || owner() == msg.sender, "Not authorized");

        listing.active = false;

        // Update market stats
        gameItemStats[listing.gameItemId].currentListings--;

        // Check if this was the last listing for this item and remove from unique items if so
        if (gameItemStats[listing.gameItemId].currentListings == 0) {
            _removeUniqueGameItem(listing.gameItemId);
        }

        // Update lowest price listing if this was the lowest price
        if (lowestPriceListingForGameItem[listing.gameItemId] == listingId) {
            _recalculateLowestPriceGameItemListing(listing.gameItemId);
        }

        // Release item from escrow
        bool released = _releaseGameItemFromEscrow(listing.seller, listing.gameItemId, listing.quantity);
        require(released, "Failed to release item from escrow");

        // Add item back to seller's inventory
        _addItemToInventory(listing.seller, listing.gameItemId, listing.quantity);

        emit ListingCancelled(listingId, msg.sender);
    }

    /**
     * @dev Change the price of a listing
     * @param listingId The ID of the listing
     * @param newPrice The new price
     */
    function changeListingPrice(uint256 listingId, uint256 newPrice) external nonReentrant {
        require(newPrice > 0, "Price must be greater than 0");

        Listing storage listing = listings[listingId];

        require(listing.active, "Listing is not active");
        require(listing.seller == msg.sender, "Not the seller");

        uint256 oldPrice = listing.price;
        listing.price = newPrice;

        // Update lowest price listing if necessary
        if (lowestPriceListingForGameItem[listing.gameItemId] == listingId && newPrice > oldPrice) {
            _recalculateLowestPriceGameItemListing(listing.gameItemId);
        } else if (newPrice < _getLowestPriceForGameItem(listing.gameItemId)) {
            _updateLowestPriceGameItemListing(listing.gameItemId, listingId, newPrice);
        }

        emit PriceChanged(listingId, oldPrice, newPrice);
    }

    /**
     * @dev Buy multiple game items from the marketplace at once
     * @param listingIds Array of listing IDs to purchase
     * @param quantities Array of quantities to buy for each listing
     */
    function buyGameItems(uint256[] calldata listingIds, uint256[] calldata quantities) external payable whenNotPaused nonReentrant {
        require(listingIds.length > 0, "Must provide at least one listing");
        require(listingIds.length == quantities.length, "Arrays length mismatch");
        
        uint256 totalCost = 0;
        
        // Calculate total cost first
        for (uint256 i = 0; i < listingIds.length; i++) {
            Listing storage listing = listings[listingIds[i]];
            
            require(listing.active, "Listing is not active");
            require(quantities[i] > 0 && quantities[i] <= listing.quantity, "Invalid quantity");
            require(listing.seller != msg.sender, "Cannot buy your own listing");
            
            totalCost += listing.price * quantities[i];
        }
        
        // Check if buyer has sent enough MON
        require(msg.value >= totalCost, "Insufficient funds sent");
        
        uint256 remainingValue = msg.value;
        
        // Process each purchase
        for (uint256 i = 0; i < listingIds.length; i++) {
            uint256 listingId = listingIds[i];
            uint256 quantity = quantities[i];
            Listing storage listing = listings[listingId];
            
            uint256 itemCost = listing.price * quantity;
            uint256 fee = (itemCost * marketplaceFeePercentage) / 10000;
            uint256 sellerAmount = itemCost - fee;
            
            // Transfer MON to seller and marketplace
            (bool sellerTransferSuccess, ) = payable(listing.seller).call{value: sellerAmount}("");
            require(sellerTransferSuccess, "MON transfer to seller failed");
            
            (bool feeTransferSuccess, ) = payable(feeCollector).call{value: fee}("");
            require(feeTransferSuccess, "Fee transfer failed");
            
            remainingValue -= itemCost;
            
            // Update listing
            if (quantity == listing.quantity) {
                listing.active = false;
                gameItemStats[listing.gameItemId].currentListings--;
                
                // Check if this was the last listing for this item and remove from unique items if so
                if (gameItemStats[listing.gameItemId].currentListings == 0) {
                    _removeUniqueGameItem(listing.gameItemId);
                }
                
                // Update lowest price listing if this was the lowest price
                if (lowestPriceListingForGameItem[listing.gameItemId] == listingId) {
                    _recalculateLowestPriceGameItemListing(listing.gameItemId);
                }
            } else {
                listing.quantity -= quantity;
            }
            
            // Release item from escrow
            bool released = _releaseGameItemFromEscrow(listing.seller, listing.gameItemId, quantity);
            require(released, "Failed to release item from escrow");
            
            // Record sale in history
            SaleRecord memory record = SaleRecord({ timestamp: block.timestamp, price: listing.price, quantity: quantity });
            gameItemSaleHistory[listing.gameItemId].push(record);
            
            // Update market stats
            MarketStats storage stats = gameItemStats[listing.gameItemId];
            stats.totalVolume += itemCost;
            stats.numberOfSales++;
            stats.lastSoldPrice = listing.price;
            
            // Update highest/lowest price if applicable
            if (listing.price > stats.highestPrice) {
                stats.highestPrice = listing.price;
            }
            if (stats.lowestPrice == 0 || listing.price < stats.lowestPrice) {
                stats.lowestPrice = listing.price;
            }
            
            // Update average price (simple rolling average)
            stats.avgSoldPrice = (stats.avgSoldPrice * (stats.numberOfSales - 1) + listing.price) / stats.numberOfSales;
            
            emit ItemSold(listingId, listing.seller, msg.sender, listing.gameItemId, listing.price, quantity);
        }
        
        // Refund excess MON if any
        if (remainingValue > 0) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: remainingValue}("");
            require(refundSuccess, "Refund of excess MON failed");
        }
    }

    /**
     * @dev Set the marketplace fee percentage (in basis points)
     * @param newFeePercentage The new fee percentage (100 = 1%, 10000 = 100%)
     */
    function setMarketplaceFee(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= 3000, "Fee too high"); // Max 30%
        marketplaceFeePercentage = newFeePercentage;
        emit MarketplaceFeeUpdated(newFeePercentage);
    }

    /**
     * @dev Set the fee collector address
     * @param newFeeCollector The new fee collector address
     */
    function setFeeCollector(address newFeeCollector) external onlyOwner {
        require(newFeeCollector != address(0), "Invalid address");
        feeCollector = newFeeCollector;
        emit FeeCollectorUpdated(newFeeCollector);
    }

    /**
     * @dev Pause the marketplace
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the marketplace
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ==================== View Functions ====================

    /**
     * @dev Get all listings for a seller
     * @param seller The address of the seller
     * @return listingIds Array of listing IDs
     */
    function getSellerListings(address seller) external view returns (uint256[] memory) {
        return sellerListings[seller];
    }

    /**
     * @dev Get all active listings for a specific game item
     * @param gameItemId The game item ID
     * @return activeListingIds Array of active listing IDs
     */
    function getActiveGameItemListings(string memory gameItemId) external view returns (uint256[] memory) {
        uint256 count = gameItemStats[gameItemId].currentListings;
        uint256[] memory activeListingIds = new uint256[](count);

        uint256 currentIndex = 0;
        uint256 totalListings = _listingIds.current();

        for (uint256 i = 1; i <= totalListings && currentIndex < count; i++) {
            Listing storage listing = listings[i];
            if (
                listing.active &&
                keccak256(bytes(listing.gameItemId)) == keccak256(bytes(gameItemId))
            ) {
                activeListingIds[currentIndex] = i;
                currentIndex++;
            }
        }

        return activeListingIds;
    }



    /**
     * @dev Get the price history for a game item
     * @param gameItemId The game item ID
     * @param limit The maximum number of records to return (0 for all)
     * @return records Array of price records
     */
    function getGameItemPriceHistory(
        string memory gameItemId,
        uint256 limit
    ) external view returns (SaleRecord[] memory) {
        SaleRecord[] storage history = gameItemSaleHistory[gameItemId];
        uint256 historyLength = history.length;

        if (limit == 0 || limit > historyLength) {
            limit = historyLength;
        }

        SaleRecord[] memory records = new SaleRecord[](limit);
        for (uint256 i = 0; i < limit; i++) {
            // Get the most recent records first
            records[i] = history[historyLength - limit + i];
        }

        return records;
    }



    /**
     * @dev Get the lowest priced listing for a game item
     * @param gameItemId The game item ID
     * @return listingId The listing ID with the lowest price
     * @return price The lowest price
     */
    function getLowestPriceListingForGameItem(
        string memory gameItemId
    ) external view returns (uint256 listingId, uint256 price) {
        listingId = lowestPriceListingForGameItem[gameItemId];

        if (listingId != 0 && listings[listingId].active) {
            price = listings[listingId].price;
        } else {
            price = 0;
        }

        return (listingId, price);
    }



    /**
     * @dev Get all unique game items that are currently listed in the marketplace
     * @return uniqueGameItems Array of unique game item IDs
     */
    function getAllUniqueGameItems() external view returns (string[] memory) {
        // Simply return the tracked unique game items
        return uniqueGameItemIds;
    }



    /**
     * @dev Get detailed information about a specific listing
     * @param listingId The ID of the listing to retrieve
     * @return The complete Listing struct containing all listing details
     */
    function getListingById(uint256 listingId) external view returns (Listing memory) {
        require(listingId > 0 && listingId <= _listingIds.current(), "Invalid listing ID");
        return listings[listingId];
    }

    /**
     * @dev Get all unique items with their lowest prices
     * @return gameItems Array of game item IDs
     * @return gameItemPrices Array of lowest prices for each game item
     */
    function getAllUniqueItemsWithPrices()
        external
        view
        returns (
            string[] memory gameItems,
            uint256[] memory gameItemPrices
        )
    {
        // Get all unique game items
        gameItems = this.getAllUniqueGameItems();
        gameItemPrices = new uint256[](gameItems.length);

        // Get lowest price for each game item
        for (uint256 i = 0; i < gameItems.length; i++) {
            (, uint256 price) = this.getLowestPriceListingForGameItem(gameItems[i]);
            gameItemPrices[i] = price;
        }

        return (gameItems, gameItemPrices);
    }

    // ==================== Internal Functions ====================

    /**
     * @dev Verify if a user owns a game item
     * @param user The user address
     * @param gameItemId The game item ID
     * @param quantity The quantity to verify
     * @return Whether the user owns the specified quantity of the item
     */
    function _verifyGameItemOwnership(
        address user,
        string memory gameItemId,
        uint256 quantity
    ) internal view returns (bool) {
        // Get only the inventory data needed for verification
        GameSave.InventoryItem[] memory inventory = _getUserInventory(user);
        uint256 ownedQuantity = 0;

        // Sum up the quantity of matching items
        for (uint i = 0; i < inventory.length; i++) {
            if (keccak256(bytes(inventory[i].itemId)) == keccak256(bytes(gameItemId))) {
                ownedQuantity += inventory[i].quantity;
            }
        }

        return ownedQuantity >= quantity;
    }

    /**
     * @dev Helper function to get only the inventory data needed for ownership verification
     * @param user The user address
     * @return inventory Array of user's inventory items
     */
    function _getUserInventory(address user) internal view returns (GameSave.InventoryItem[] memory) {
        // Check if the user has a save in the GameSave contract
        bool hasSave = gameSave.hasSaveData(user);

        // If no save exists or the user isn't the caller, return an empty inventory
        if (!hasSave || user != msg.sender) {
            return new GameSave.InventoryItem[](0);
        }

        // Load only the inventory data from the GameSave contract
        (
            ,
            ,
            ,
            // version (ignored)
            // timestamp (ignored)
            // player data (ignored)
            GameSave.InventoryItem[] memory inventory, // farming data (ignored)
            ,

        ) = // map changes (ignored)
            gameSave.loadGame(user);

        return inventory;
    }

    /**
     * @dev Remove a game item from a user's inventory when it's listed on the marketplace
     * @param user The user address
     * @param gameItemId The game item ID
     * @param quantity The quantity to remove
     * @return Whether the operation was successful
     */
    function _removeItemFromInventory(
        address user,
        string memory gameItemId,
        uint256 quantity
    ) internal returns (bool) {
        // Get user's current inventory
        GameSave.InventoryItem[] memory inventory = _getUserInventory(user);
        if (inventory.length == 0) return false;

        // Find the item in inventory and create an updated inventory
        uint256 slotToUpdate = type(uint256).max;
        uint256 newQuantity = 0;

        for (uint i = 0; i < inventory.length; i++) {
            if (keccak256(bytes(inventory[i].itemId)) == keccak256(bytes(gameItemId))) {
                if (inventory[i].quantity >= quantity) {
                    slotToUpdate = inventory[i].slotIndex;
                    newQuantity = inventory[i].quantity - quantity;
                    break;
                }
            }
        }

        if (slotToUpdate == type(uint256).max) return false;

        // Create updated inventory array with reduced quantity
        GameSave.InventoryItem[] memory updatedInventory = new GameSave.InventoryItem[](inventory.length);
        uint updatedItemCount = 0;

        for (uint i = 0; i < inventory.length; i++) {
            if (inventory[i].slotIndex == slotToUpdate) {
                if (newQuantity > 0) {
                    updatedInventory[updatedItemCount] = GameSave.InventoryItem({
                        slotIndex: slotToUpdate,
                        itemId: gameItemId,
                        quantity: newQuantity
                    });
                    updatedItemCount++;
                }
            } else {
                updatedInventory[updatedItemCount] = inventory[i];
                updatedItemCount++;
            }
        }

        // Create the final array with the correct length
        GameSave.InventoryItem[] memory finalInventory = new GameSave.InventoryItem[](updatedItemCount);
        for (uint i = 0; i < updatedItemCount; i++) {
            finalInventory[i] = updatedInventory[i];
        }

        // Save the updated inventory back to GameSave
        return _updateUserInventory(user, finalInventory);
    }

    /**
     * @dev Add a game item back to a user's inventory when a listing is cancelled or expired
     * @param user The user address
     * @param gameItemId The game item ID
     * @param quantity The quantity to add back
     * @return Whether the operation was successful
     */
    function _addItemToInventory(
        address user,
        string memory gameItemId,
        uint256 quantity
    ) internal returns (bool) {
        // Get user's current inventory
        GameSave.InventoryItem[] memory inventory = _getUserInventory(user);
        
        // Try to find if the item already exists to stack it
        uint256 slotToUpdate = type(uint256).max;
        uint256 newQuantity = 0;

        for (uint i = 0; i < inventory.length; i++) {
            if (keccak256(bytes(inventory[i].itemId)) == keccak256(bytes(gameItemId))) {
                slotToUpdate = inventory[i].slotIndex;
                newQuantity = inventory[i].quantity + quantity;
                break;
            }
        }

        if (slotToUpdate != type(uint256).max) {
            // Update existing item
            GameSave.InventoryItem[] memory updatedInventory = new GameSave.InventoryItem[](inventory.length);
            
            for (uint i = 0; i < inventory.length; i++) {
                if (inventory[i].slotIndex == slotToUpdate) {
                    updatedInventory[i] = GameSave.InventoryItem({
                        slotIndex: slotToUpdate,
                        itemId: gameItemId,
                        quantity: newQuantity
                    });
                } else {
                    updatedInventory[i] = inventory[i];
                }
            }
            
            return _updateUserInventory(user, updatedInventory);
        } else {
            // Add as new item to the first empty slot or to the end
            uint256 newSlot = 0;
            bool foundEmptySlot = false;
            
            // Check for empty slots (assuming slots are sequential)
            if (inventory.length > 0) {
                // Create a mapping of used slots
                bool[] memory usedSlots = new bool[](100); // Assuming max 100 slots
                
                for (uint i = 0; i < inventory.length; i++) {
                    if (inventory[i].slotIndex < 100) {
                        usedSlots[inventory[i].slotIndex] = true;
                    }
                }
                
                // Find first empty slot
                for (uint i = 0; i < 100; i++) {
                    if (!usedSlots[i]) {
                        newSlot = i;
                        foundEmptySlot = true;
                        break;
                    }
                }
            }
            
            if (!foundEmptySlot) {
                // If no empty slot found, add to the end
                newSlot = inventory.length > 0 ? inventory.length : 0;
            }
            
            // Create updated inventory with new item
            GameSave.InventoryItem[] memory updatedInventory = new GameSave.InventoryItem[](inventory.length + 1);
            
            for (uint i = 0; i < inventory.length; i++) {
                updatedInventory[i] = inventory[i];
            }
            
            updatedInventory[inventory.length] = GameSave.InventoryItem({
                slotIndex: newSlot,
                itemId: gameItemId,
                quantity: quantity
            });
            
            return _updateUserInventory(user, updatedInventory);
        }
    }

    /**
     * @dev Update a user's inventory in the GameSave contract
     * @param user The user address
     * @param inventory The new inventory array
     * @return Whether the operation was successful
     */
    function _updateUserInventory(
        address user,
        GameSave.InventoryItem[] memory inventory
    ) internal returns (bool) {
        try gameSave.updateInventory(user, inventory) {
            return true;
        } catch {
            return false;
        }
    }

    /**
     * @dev Add a game item to the marketplace's escrow when it's listed
     * @param user The user address
     * @param gameItemId The game item ID
     * @param quantity The quantity to add
     */
    function _escrowGameItem(
        address user,
        string memory gameItemId,
        uint256 quantity
    ) internal {
        userGameItemEscrow[user][gameItemId] += quantity;
    }

    /**
     * @dev Release a game item from escrow back to user when a listing is cancelled
     * @param user The user address
     * @param gameItemId The game item ID
     * @param quantity The quantity to release
     * @return Whether the operation was successful
     */
    function _releaseGameItemFromEscrow(
        address user,
        string memory gameItemId,
        uint256 quantity
    ) internal returns (bool) {
        if (userGameItemEscrow[user][gameItemId] < quantity) {
            return false;
        }
        
        userGameItemEscrow[user][gameItemId] -= quantity;
        return true;
    }

    /**
     * @dev Check how many items a user has in escrow
     * @param user The user address
     * @param gameItemId The game item ID
     * @return The quantity of the item in escrow
     */
    function getGameItemEscrowBalance(
        address user,
        string memory gameItemId
    ) external view returns (uint256) {
        return userGameItemEscrow[user][gameItemId];
    }

    /**
     * @dev Update the lowest priced listing for a game item
     * @param gameItemId The game item ID
     * @param listingId The listing ID
     * @param price The price
     */
    function _updateLowestPriceGameItemListing(string memory gameItemId, uint256 listingId, uint256 price) internal {
        uint256 currentLowestListingId = lowestPriceListingForGameItem[gameItemId];

        if (
            currentLowestListingId == 0 ||
            !listings[currentLowestListingId].active ||
            price < listings[currentLowestListingId].price
        ) {
            lowestPriceListingForGameItem[gameItemId] = listingId;
        }
    }



    /**
     * @dev Recalculate the lowest priced listing for a game item
     * @param gameItemId The game item ID
     */
    function _recalculateLowestPriceGameItemListing(string memory gameItemId) internal {
        uint256 totalListings = _listingIds.current();
        uint256 lowestPrice = type(uint256).max;
        uint256 lowestPriceId = 0;

        for (uint256 i = 1; i <= totalListings; i++) {
            Listing storage listing = listings[i];
            if (
                listing.active &&
                keccak256(bytes(listing.gameItemId)) == keccak256(bytes(gameItemId)) &&
                listing.price < lowestPrice
            ) {
                lowestPrice = listing.price;
                lowestPriceId = i;
            }
        }

        lowestPriceListingForGameItem[gameItemId] = lowestPriceId;
    }



    /**
     * @dev Get the lowest price for a game item
     * @param gameItemId The game item ID
     * @return The lowest price
     */
    function _getLowestPriceForGameItem(string memory gameItemId) internal view returns (uint256) {
        uint256 listingId = lowestPriceListingForGameItem[gameItemId];
        if (listingId != 0 && listings[listingId].active) {
            return listings[listingId].price;
        }
        return type(uint256).max;
    }



    /**
     * @dev Remove a game item from the unique items tracking when it has no active listings
     * @param gameItemId The game item ID to remove
     */
    function _removeUniqueGameItem(string memory gameItemId) internal {
        if (listedGameItems[gameItemId]) {
            listedGameItems[gameItemId] = false;

            // Find and remove the item from the uniqueGameItemIds array
            for (uint256 i = 0; i < uniqueGameItemIds.length; i++) {
                if (keccak256(bytes(uniqueGameItemIds[i])) == keccak256(bytes(gameItemId))) {
                    // Move the last element to the position of the removed element
                    if (i < uniqueGameItemIds.length - 1) {
                        uniqueGameItemIds[i] = uniqueGameItemIds[uniqueGameItemIds.length - 1];
                    }
                    // Remove the last element
                    uniqueGameItemIds.pop();
                    break;
                }
            }
        }
    }


}
