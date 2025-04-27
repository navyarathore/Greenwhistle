// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { Counters } from "openzeppelin/contracts/utils/Counters.sol";
import "./GameToken.sol";
import "./GameNfts.sol";
import "./GameSave.sol";

/**
 * @title VolatileMarketplace
 * @dev A marketplace contract for trading in-game items and NFTs with supply and demand dynamics
 * similar to the Steam marketplace. All transactions are conducted with game tokens.
 */
contract VolatileMarketplace is Ownable, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;

    // Contract dependencies
    GameToken public gameToken;
    GameNfts public gameNfts;
    GameSave public gameSave;

    // Listing counter
    Counters.Counter private _listingIds;

    // Fee structure
    uint256 public marketplaceFeePercentage = 250; // 2.5% (using basis points: 10000 = 100%)
    address public feeCollector;

    // Marketplace types
    enum ItemType {
        GAME_ITEM,
        NFT
    }

    // Listing structure
    struct Listing {
        uint256 listingId;
        address seller;
        string gameItemId; // For game items
        uint256 nftId; // For NFTs
        uint256 quantity; // For game items (always 1 for NFTs)
        uint256 price; // Price per unit in game tokens
        uint256 listedAt;
        bool active;
        ItemType itemType;
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
    mapping(uint256 => MarketStats) public nftStats;
    mapping(string => SaleRecord[]) public gameItemSaleHistory;
    mapping(uint256 => SaleRecord[]) public nftSaleHistory;

    // Keep track of the current lowest priced listing for each item
    mapping(string => uint256) public lowestPriceListingForGameItem;
    mapping(uint256 => uint256) public lowestPriceListingForNft;

    // Track unique game items and NFTs that are listed
    mapping(string => bool) public listedGameItems;
    mapping(uint256 => bool) public listedNfts;
    string[] public uniqueGameItemIds;
    uint256[] public uniqueNftIds;

    // Events
    event ItemListed(
        uint256 indexed listingId,
        address indexed seller,
        string gameItemId,
        uint256 price,
        uint256 quantity,
        ItemType itemType
    );
    event NftListed(
        uint256 indexed listingId,
        address indexed seller,
        uint256 indexed nftId,
        uint256 price,
        ItemType itemType
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
    event NftSold(
        uint256 indexed listingId,
        address indexed seller,
        address indexed buyer,
        uint256 nftId,
        uint256 price
    );
    event MarketplaceFeeUpdated(uint256 newFeePercentage);
    event FeeCollectorUpdated(address newFeeCollector);
    event PriceChanged(uint256 indexed listingId, uint256 oldPrice, uint256 newPrice);

    /**
     * @dev Constructor to initialize the marketplace with required contract addresses
     * @param _gameToken Address of the game token contract
     * @param _gameNfts Address of the game NFTs contract
     * @param _gameSave Address of the game save contract
     */
    constructor(address _gameToken, address _gameNfts, address _gameSave) Ownable(msg.sender) {
        require(_gameToken != address(0), "Invalid GameToken address");
        require(_gameNfts != address(0), "Invalid GameNfts address");
        require(_gameSave != address(0), "Invalid GameSave address");

        gameToken = GameToken(_gameToken);
        gameNfts = GameNfts(_gameNfts);
        gameSave = GameSave(_gameSave);

        feeCollector = msg.sender;
    }

    /**
     * @dev List a game item on the marketplace
     * @param gameItemId The ID of the game item as used in the game
     * @param quantity The quantity of the item to list
     * @param price The price per unit in game tokens
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

        // Create the listing
        _listingIds.increment();
        uint256 newListingId = _listingIds.current();

        listings[newListingId] = Listing({
            listingId: newListingId,
            seller: msg.sender,
            gameItemId: gameItemId,
            nftId: 0,
            quantity: quantity,
            price: price,
            listedAt: block.timestamp,
            active: true,
            itemType: ItemType.GAME_ITEM
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

        // Track unique game items
        if (!listedGameItems[gameItemId]) {
            listedGameItems[gameItemId] = true;
            uniqueGameItemIds.push(gameItemId);
        }

        emit ItemListed(newListingId, msg.sender, gameItemId, price, quantity, ItemType.GAME_ITEM);
    }

    /**
     * @dev List an NFT on the marketplace
     * @param nftId The token ID of the NFT
     * @param price The price in game tokens
     */
    function listNft(uint256 nftId, uint256 price) external whenNotPaused nonReentrant {
        require(price > 0, "Price must be greater than 0");

        // Verify that the user owns the NFT
        require(gameNfts.ownerOf(nftId) == msg.sender, "You don't own this NFT");

        // Check if the NFT is approved for the marketplace
        require(
            gameNfts.getApproved(nftId) == address(this) || gameNfts.isApprovedForAll(msg.sender, address(this)),
            "NFT not approved for marketplace"
        );

        // Create the listing
        _listingIds.increment();
        uint256 newListingId = _listingIds.current();

        listings[newListingId] = Listing({
            listingId: newListingId,
            seller: msg.sender,
            gameItemId: "",
            nftId: nftId,
            quantity: 1, // NFTs always have quantity of 1
            price: price,
            listedAt: block.timestamp,
            active: true,
            itemType: ItemType.NFT
        });

        // Add to seller's listings
        sellerListings[msg.sender].push(newListingId);

        // Update market stats
        nftStats[nftId].totalListings++;
        nftStats[nftId].currentListings++;

        // Track unique NFT if not already tracked
        if (!listedNfts[nftId]) {
            listedNfts[nftId] = true;
            uniqueNftIds.push(nftId);
        }

        // Update lowest price listing if applicable
        _updateLowestPriceNftListing(nftId, newListingId, price);

        // Track unique NFTs
        if (!listedNfts[nftId]) {
            listedNfts[nftId] = true;
            uniqueNftIds.push(nftId);
        }

        emit NftListed(newListingId, msg.sender, nftId, price, ItemType.NFT);
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
        if (listing.itemType == ItemType.GAME_ITEM) {
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
            nftStats[listing.nftId].currentListings--;

            // Check if this was the last listing for this NFT and remove from unique items if so
            if (nftStats[listing.nftId].currentListings == 0) {
                _removeUniqueNft(listing.nftId);
            }

            // Update lowest price listing if this was the lowest price
            if (lowestPriceListingForNft[listing.nftId] == listingId) {
                _recalculateLowestPriceNftListing(listing.nftId);
            }
        }

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
        if (listing.itemType == ItemType.GAME_ITEM) {
            if (lowestPriceListingForGameItem[listing.gameItemId] == listingId && newPrice > oldPrice) {
                _recalculateLowestPriceGameItemListing(listing.gameItemId);
            } else if (newPrice < _getLowestPriceForGameItem(listing.gameItemId)) {
                _updateLowestPriceGameItemListing(listing.gameItemId, listingId, newPrice);
            }
        } else {
            if (lowestPriceListingForNft[listing.nftId] == listingId && newPrice > oldPrice) {
                _recalculateLowestPriceNftListing(listing.nftId);
            } else if (newPrice < _getLowestPriceForNft(listing.nftId)) {
                _updateLowestPriceNftListing(listing.nftId, listingId, newPrice);
            }
        }

        emit PriceChanged(listingId, oldPrice, newPrice);
    }

    /**
     * @dev Buy a game item from the marketplace
     * @param listingId The ID of the listing
     * @param quantity The quantity to buy (must be <= listing quantity)
     */
    function buyGameItem(uint256 listingId, uint256 quantity) external whenNotPaused nonReentrant {
        Listing storage listing = listings[listingId];

        require(listing.active, "Listing is not active");
        require(listing.itemType == ItemType.GAME_ITEM, "Not a game item");
        require(quantity > 0 && quantity <= listing.quantity, "Invalid quantity");
        require(listing.seller != msg.sender, "Cannot buy your own listing");

        uint256 totalPrice = listing.price * quantity;
        uint256 fee = (totalPrice * marketplaceFeePercentage) / 10000;
        uint256 sellerAmount = totalPrice - fee;

        // Check if buyer has enough tokens
        require(gameToken.balanceOf(msg.sender) >= totalPrice, "Insufficient funds");

        // Transfer tokens from buyer to seller and marketplace
        require(gameToken.transferFrom(msg.sender, listing.seller, sellerAmount), "Token transfer to seller failed");
        require(gameToken.transferFrom(msg.sender, feeCollector, fee), "Fee transfer failed");

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

        // Record sale in history
        SaleRecord memory record = SaleRecord({ timestamp: block.timestamp, price: listing.price, quantity: quantity });
        gameItemSaleHistory[listing.gameItemId].push(record);

        // Update market stats
        MarketStats storage stats = gameItemStats[listing.gameItemId];
        stats.totalVolume += totalPrice;
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

        // Update buyer's inventory (handled off-chain)

        emit ItemSold(listingId, listing.seller, msg.sender, listing.gameItemId, listing.price, quantity);
    }

    /**
     * @dev Buy an NFT from the marketplace
     * @param listingId The ID of the listing
     */
    function buyNft(uint256 listingId) external whenNotPaused nonReentrant {
        Listing storage listing = listings[listingId];

        require(listing.active, "Listing is not active");
        require(listing.itemType == ItemType.NFT, "Not an NFT");
        require(listing.seller != msg.sender, "Cannot buy your own listing");

        uint256 totalPrice = listing.price;
        uint256 fee = (totalPrice * marketplaceFeePercentage) / 10000;
        uint256 sellerAmount = totalPrice - fee;

        // Check if buyer has enough tokens and NFT is still owned by seller
        require(gameToken.balanceOf(msg.sender) >= totalPrice, "Insufficient funds");
        require(gameNfts.ownerOf(listing.nftId) == listing.seller, "Seller no longer owns this NFT");

        // Transfer tokens from buyer to seller and marketplace
        require(gameToken.transferFrom(msg.sender, listing.seller, sellerAmount), "Token transfer to seller failed");
        require(gameToken.transferFrom(msg.sender, feeCollector, fee), "Fee transfer failed");

        // Transfer NFT from seller to buyer
        gameNfts.transferFrom(listing.seller, msg.sender, listing.nftId);

        // Update listing
        listing.active = false;
        nftStats[listing.nftId].currentListings--;

        // Check if this was the last listing for this NFT and remove from unique items if so
        if (nftStats[listing.nftId].currentListings == 0) {
            _removeUniqueNft(listing.nftId);
        }

        // Update lowest price listing if this was the lowest price
        if (lowestPriceListingForNft[listing.nftId] == listingId) {
            _recalculateLowestPriceNftListing(listing.nftId);
        }

        // Record sale in history
        SaleRecord memory record = SaleRecord({ timestamp: block.timestamp, price: listing.price, quantity: 1 });
        nftSaleHistory[listing.nftId].push(record);

        // Update market stats
        MarketStats storage stats = nftStats[listing.nftId];
        stats.totalVolume += totalPrice;
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

        emit NftSold(listingId, listing.seller, msg.sender, listing.nftId, listing.price);
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
                listing.itemType == ItemType.GAME_ITEM &&
                keccak256(bytes(listing.gameItemId)) == keccak256(bytes(gameItemId))
            ) {
                activeListingIds[currentIndex] = i;
                currentIndex++;
            }
        }

        return activeListingIds;
    }

    /**
     * @dev Get all active listings for a specific NFT
     * @param nftId The NFT token ID
     * @return activeListingIds Array of active listing IDs
     */
    function getActiveNftListings(uint256 nftId) external view returns (uint256[] memory) {
        uint256 count = nftStats[nftId].currentListings;
        uint256[] memory activeListingIds = new uint256[](count);

        uint256 currentIndex = 0;
        uint256 totalListings = _listingIds.current();

        for (uint256 i = 1; i <= totalListings && currentIndex < count; i++) {
            Listing storage listing = listings[i];
            if (listing.active && listing.itemType == ItemType.NFT && listing.nftId == nftId) {
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
     * @dev Get the price history for an NFT
     * @param nftId The NFT token ID
     * @param limit The maximum number of records to return (0 for all)
     * @return records Array of price records
     */
    function getNftPriceHistory(uint256 nftId, uint256 limit) external view returns (SaleRecord[] memory) {
        SaleRecord[] storage history = nftSaleHistory[nftId];
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
     * @dev Get the lowest priced listing for an NFT
     * @param nftId The NFT token ID
     * @return listingId The listing ID with the lowest price
     * @return price The lowest price
     */
    function getLowestPriceListingForNft(uint256 nftId) external view returns (uint256 listingId, uint256 price) {
        listingId = lowestPriceListingForNft[nftId];

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
     * @dev Get all unique NFTs that are currently listed in the marketplace
     * @return uniqueNftIds Array of unique NFT IDs
     */
    function getAllUniqueNfts() external view returns (uint256[] memory) {
        // Simply return the tracked unique NFT IDs
        return uniqueNftIds;
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
     * @dev Get all unique items (both game items and NFTs) with their lowest prices
     * @return gameItems Array of game item IDs
     * @return gameItemPrices Array of lowest prices for each game item
     * @return nftIds Array of NFT IDs
     * @return nftPrices Array of lowest prices for each NFT
     */
    function getAllUniqueItemsWithPrices()
        external
        view
        returns (
            string[] memory gameItems,
            uint256[] memory gameItemPrices,
            uint256[] memory nftIds,
            uint256[] memory nftPrices
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

        // Get all unique NFTs
        nftIds = this.getAllUniqueNfts();
        nftPrices = new uint256[](nftIds.length);

        // Get lowest price for each NFT
        for (uint256 i = 0; i < nftIds.length; i++) {
            (, uint256 price) = this.getLowestPriceListingForNft(nftIds[i]);
            nftPrices[i] = price;
        }

        return (gameItems, gameItemPrices, nftIds, nftPrices);
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
        bool hasSave = gameSave.hasSaveData();

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
            gameSave.loadGame();

        return inventory;
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
     * @dev Update the lowest priced listing for an NFT
     * @param nftId The NFT token ID
     * @param listingId The listing ID
     * @param price The price
     */
    function _updateLowestPriceNftListing(uint256 nftId, uint256 listingId, uint256 price) internal {
        uint256 currentLowestListingId = lowestPriceListingForNft[nftId];

        if (
            currentLowestListingId == 0 ||
            !listings[currentLowestListingId].active ||
            price < listings[currentLowestListingId].price
        ) {
            lowestPriceListingForNft[nftId] = listingId;
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
                listing.itemType == ItemType.GAME_ITEM &&
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
     * @dev Recalculate the lowest priced listing for an NFT
     * @param nftId The NFT token ID
     */
    function _recalculateLowestPriceNftListing(uint256 nftId) internal {
        uint256 totalListings = _listingIds.current();
        uint256 lowestPrice = type(uint256).max;
        uint256 lowestPriceId = 0;

        for (uint256 i = 1; i <= totalListings; i++) {
            Listing storage listing = listings[i];
            if (
                listing.active &&
                listing.itemType == ItemType.NFT &&
                listing.nftId == nftId &&
                listing.price < lowestPrice
            ) {
                lowestPrice = listing.price;
                lowestPriceId = i;
            }
        }

        lowestPriceListingForNft[nftId] = lowestPriceId;
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
     * @dev Get the lowest price for an NFT
     * @param nftId The NFT token ID
     * @return The lowest price
     */
    function _getLowestPriceForNft(uint256 nftId) internal view returns (uint256) {
        uint256 listingId = lowestPriceListingForNft[nftId];
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

    /**
     * @dev Remove an NFT from the unique items tracking when it has no active listings
     * @param nftId The NFT ID to remove
     */
    function _removeUniqueNft(uint256 nftId) internal {
        if (listedNfts[nftId]) {
            listedNfts[nftId] = false;

            // Find and remove the NFT from the uniqueNftIds array
            for (uint256 i = 0; i < uniqueNftIds.length; i++) {
                if (uniqueNftIds[i] == nftId) {
                    // Move the last element to the position of the removed element
                    if (i < uniqueNftIds.length - 1) {
                        uniqueNftIds[i] = uniqueNftIds[uniqueNftIds.length - 1];
                    }
                    // Remove the last element
                    uniqueNftIds.pop();
                    break;
                }
            }
        }
    }
}
