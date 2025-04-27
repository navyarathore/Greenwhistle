// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./GameToken.sol";
import "./GameNfts.sol";
import "./GameSave.sol";

contract VolatileMarketplace is ReentrancyGuard, Pausable, Ownable {
    struct MarketItem {
        uint256 itemId;
        address seller;
        string gameItemId;
        address nftContract;
        uint256 tokenId;
        uint256 basePrice;
        uint256 currentPrice;
        bool isActive;
        uint256 listedAt;
        ItemType itemType;
        uint256 quantity;
    }

    struct MarketMetrics {
        uint256 totalVolume;
        uint256 totalTrades;
        uint256 lastPrice;
        uint256 highestPrice;
        uint256 lowestPrice;
        uint256 supply;
        uint256 demand;
        uint256 volatilityFactor;
    }

    enum ItemType { 
        GAME_NFT,
        GAME_ITEM
    }

    uint256 private constant PLATFORM_FEE = 250;
    uint256 private constant VOLATILITY_BASE = 1000;
    uint256 private constant MIN_PRICE_CHANGE_INTERVAL = 1 hours;
    uint256 private constant MAX_PRICE_DROP = 500;
    uint256 private constant MAX_PRICE_INCREASE = 1000;
    
    uint256 private _itemIds;
    address public treasury;
    GameToken public gameToken;
    GameNfts public gameNfts;
    GameSave public gameSave;
    
    bool public volatilityEnabled = true;
    uint256 public priceUpdateInterval = 24 hours;
    uint256 public lastGlobalPriceUpdate;
    
    mapping(uint256 => MarketItem) public marketItems;
    mapping(string => mapping(uint256 => MarketMetrics)) public gameItemMetrics;
    mapping(address => mapping(uint256 => MarketMetrics)) public nftMetrics;
    mapping(address => uint256) public userTrades;
    mapping(address => uint256[]) public userListings;
    mapping(address => uint256[]) public userPurchases;
    mapping(address => mapping(string => uint256)) public lastGameItemBuyTime;
    mapping(address => mapping(uint256 => uint256)) public lastNftBuyTime;
    mapping(string => uint256) public itemListingCount;
    mapping(address => mapping(uint256 => uint256)) public nftListingCount;
    
    event GameItemListed(
        uint256 indexed itemId,
        address indexed seller,
        string gameItemId,
        uint256 basePrice,
        uint256 currentPrice,
        uint256 quantity
    );
    
    event NftListed(
        uint256 indexed itemId,
        address indexed seller,
        address nftContract,
        uint256 tokenId,
        uint256 basePrice,
        uint256 currentPrice
    );
    
    event ItemSold(
        uint256 indexed itemId,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        uint256 quantity
    );
    
    event ItemPriceChanged(
        uint256 indexed itemId,
        uint256 oldPrice,
        uint256 newPrice,
        bool isAutomatic
    );
    
    event ItemDelisted(uint256 indexed itemId);
    
    event MarketMetricsUpdated(
        string indexed gameItemId,
        uint256 price,
        uint256 supply,
        uint256 demand
    );
    
    event NftMetricsUpdated(
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 price,
        uint256 supply,
        uint256 demand
    );

    event VolatilityChanged(bool enabled);
    event PriceUpdateIntervalChanged(uint256 newInterval);

    constructor(
        address _gameToken,
        address _gameNfts,
        address _gameSave,
        address _treasury
    ) Ownable(msg.sender) {
        require(_gameToken != address(0), "Invalid game token address");
        require(_gameNfts != address(0), "Invalid game NFTs address");
        require(_gameSave != address(0), "Invalid game save address");
        require(_treasury != address(0), "Invalid treasury address");
        
        gameToken = GameToken(_gameToken);
        gameNfts = GameNfts(_gameNfts);
        gameSave = GameSave(_gameSave);
        treasury = _treasury;
        lastGlobalPriceUpdate = block.timestamp;
    }

    function listGameItem(
        string memory gameItemId,
        uint256 basePrice,
        uint256 quantity
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(basePrice > 0, "Price must be greater than 0");
        require(quantity > 0, "Quantity must be greater than 0");
        
        _itemIds++;
        uint256 itemId = _itemIds;
        
        uint256 currentPrice = basePrice;
        
        MarketMetrics storage metrics = gameItemMetrics[gameItemId][0];
        if (metrics.totalTrades > 0) {
            if (metrics.supply > 0 && metrics.demand > 0) {
                if (metrics.demand > metrics.supply) {
                    uint256 increase = basePrice * min(metrics.demand * VOLATILITY_BASE / metrics.supply - VOLATILITY_BASE, MAX_PRICE_INCREASE) / VOLATILITY_BASE;
                    currentPrice = basePrice + increase;
                }
                else if (metrics.supply > metrics.demand) {
                    uint256 decrease = basePrice * min(VOLATILITY_BASE - (metrics.demand * VOLATILITY_BASE / metrics.supply), MAX_PRICE_DROP) / VOLATILITY_BASE;
                    currentPrice = basePrice > decrease ? basePrice - decrease : basePrice;
                }
            }
        }
        
        marketItems[itemId] = MarketItem({
            itemId: itemId,
            seller: msg.sender,
            gameItemId: gameItemId,
            nftContract: address(0),
            tokenId: 0,
            basePrice: basePrice,
            currentPrice: currentPrice,
            isActive: true,
            listedAt: block.timestamp,
            itemType: ItemType.GAME_ITEM,
            quantity: quantity
        });
        
        userListings[msg.sender].push(itemId);
        _updateGameItemMetrics(gameItemId, basePrice, currentPrice, true);
        
        emit GameItemListed(itemId, msg.sender, gameItemId, basePrice, currentPrice, quantity);
        return itemId;
    }
    
    function listNft(
        uint256 tokenId,
        uint256 basePrice
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(basePrice > 0, "Price must be greater than 0");
        require(gameNfts.ownerOf(tokenId) == msg.sender, "Not owner of NFT");
        
        require(
            gameNfts.getApproved(tokenId) == address(this) || 
            gameNfts.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );
        
        gameNfts.transferNFT(msg.sender, address(this), tokenId);
        
        _itemIds++;
        uint256 itemId = _itemIds;
        
        uint256 currentPrice = basePrice;
        
        MarketMetrics storage metrics = nftMetrics[address(gameNfts)][tokenId];
        if (metrics.totalTrades > 0) {
            if (metrics.supply > 0 && metrics.demand > 0) {
                if (metrics.demand > metrics.supply) {
                    uint256 increase = basePrice * min(metrics.demand * VOLATILITY_BASE / metrics.supply - VOLATILITY_BASE, MAX_PRICE_INCREASE) / VOLATILITY_BASE;
                    currentPrice = basePrice + increase;
                }
                else if (metrics.supply > metrics.demand) {
                    uint256 decrease = basePrice * min(VOLATILITY_BASE - (metrics.demand * VOLATILITY_BASE / metrics.supply), MAX_PRICE_DROP) / VOLATILITY_BASE;
                    currentPrice = basePrice > decrease ? basePrice - decrease : basePrice;
                }
            }
        }
        
        marketItems[itemId] = MarketItem({
            itemId: itemId,
            seller: msg.sender,
            gameItemId: "",
            nftContract: address(gameNfts),
            tokenId: tokenId,
            basePrice: basePrice,
            currentPrice: currentPrice,
            isActive: true,
            listedAt: block.timestamp,
            itemType: ItemType.GAME_NFT,
            quantity: 1
        });
        
        userListings[msg.sender].push(itemId);
        _updateNftMetrics(address(gameNfts), tokenId, basePrice, currentPrice, true);
        
        emit NftListed(itemId, msg.sender, address(gameNfts), tokenId, basePrice, currentPrice);
        return itemId;
    }
    
    function buyItem(uint256 itemId, uint256 quantity) external whenNotPaused nonReentrant {
        MarketItem storage item = marketItems[itemId];
        require(item.isActive, "Item not active");
        require(msg.sender != item.seller, "Cannot buy your own item");
        
        if (item.itemType == ItemType.GAME_ITEM) {
            require(quantity > 0 && quantity <= item.quantity, "Invalid quantity");
        } else {
            require(quantity == 1, "NFT quantity must be 1");
        }
        
        uint256 totalPrice = item.currentPrice * quantity;
        uint256 platformFee = (totalPrice * PLATFORM_FEE) / 10000;
        uint256 sellerAmount = totalPrice - platformFee;
        
        require(gameToken.allowance(msg.sender, address(this)) >= totalPrice, "Insufficient token allowance");
        
        require(gameToken.transferFrom(msg.sender, treasury, platformFee), "Platform fee transfer failed");
        require(gameToken.transferFrom(msg.sender, item.seller, sellerAmount), "Payment transfer failed");
        
        if (item.itemType == ItemType.GAME_NFT) {
            gameNfts.transferNFT(address(this), msg.sender, item.tokenId);
            item.isActive = false;
            
            _updateNftMetrics(item.nftContract, item.tokenId, item.basePrice, item.currentPrice, false);
            
            lastNftBuyTime[msg.sender][item.tokenId] = block.timestamp;
        } else if (item.itemType == ItemType.GAME_ITEM) {
            item.quantity -= quantity;
            if (item.quantity == 0) {
                item.isActive = false;
            }
            
            _updateGameItemMetrics(item.gameItemId, item.basePrice, item.currentPrice, false);
            
            lastGameItemBuyTime[msg.sender][item.gameItemId] = block.timestamp;
        }
        
        userTrades[msg.sender]++;
        userTrades[item.seller]++;
        userPurchases[msg.sender].push(itemId);
        
        emit ItemSold(itemId, item.seller, msg.sender, totalPrice, quantity);
    }
    
    function updateItemPrice(uint256 itemId, uint256 newBasePrice) external nonReentrant {
        MarketItem storage item = marketItems[itemId];
        require(msg.sender == item.seller, "Not the seller");
        require(item.isActive, "Item not active");
        require(newBasePrice > 0, "Invalid price");
        
        uint256 oldPrice = item.currentPrice;
        item.basePrice = newBasePrice;
        
        uint256 newCurrentPrice = newBasePrice;
        
        if (item.itemType == ItemType.GAME_ITEM) {
            MarketMetrics storage metrics = gameItemMetrics[item.gameItemId][0];
            if (metrics.supply > 0 && metrics.demand > 0) {
                if (metrics.demand > metrics.supply) {
                    uint256 increase = newBasePrice * min(metrics.demand * VOLATILITY_BASE / metrics.supply - VOLATILITY_BASE, MAX_PRICE_INCREASE) / VOLATILITY_BASE;
                    newCurrentPrice = newBasePrice + increase;
                } else if (metrics.supply > metrics.demand) {
                    uint256 decrease = newBasePrice * min(VOLATILITY_BASE - (metrics.demand * VOLATILITY_BASE / metrics.supply), MAX_PRICE_DROP) / VOLATILITY_BASE;
                    newCurrentPrice = newBasePrice > decrease ? newBasePrice - decrease : newBasePrice;
                }
            }
            _updateGameItemMetrics(item.gameItemId, newBasePrice, newCurrentPrice, false);
        } else if (item.itemType == ItemType.GAME_NFT) {
            MarketMetrics storage metrics = nftMetrics[item.nftContract][item.tokenId];
            if (metrics.supply > 0 && metrics.demand > 0) {
                if (metrics.demand > metrics.supply) {
                    uint256 increase = newBasePrice * min(metrics.demand * VOLATILITY_BASE / metrics.supply - VOLATILITY_BASE, MAX_PRICE_INCREASE) / VOLATILITY_BASE;
                    newCurrentPrice = newBasePrice + increase;
                } else if (metrics.supply > metrics.demand) {
                    uint256 decrease = newBasePrice * min(VOLATILITY_BASE - (metrics.demand * VOLATILITY_BASE / metrics.supply), MAX_PRICE_DROP) / VOLATILITY_BASE;
                    newCurrentPrice = newBasePrice > decrease ? newBasePrice - decrease : newBasePrice;
                }
            }
            _updateNftMetrics(item.nftContract, item.tokenId, newBasePrice, newCurrentPrice, false);
        }
        
        item.currentPrice = newCurrentPrice;
        
        emit ItemPriceChanged(itemId, oldPrice, newCurrentPrice, false);
    }
    
    function delistItem(uint256 itemId) external nonReentrant {
        MarketItem storage item = marketItems[itemId];
        require(msg.sender == item.seller || msg.sender == owner(), "Not authorized");
        require(item.isActive, "Item not active");
        
        if (item.itemType == ItemType.GAME_NFT) {
            gameNfts.transferNFT(address(this), item.seller, item.tokenId);
            
            nftListingCount[item.nftContract][item.tokenId]--;
        } else if (item.itemType == ItemType.GAME_ITEM) {
            itemListingCount[item.gameItemId] -= item.quantity;
        }
        
        item.isActive = false;
        emit ItemDelisted(itemId);
    }
    
    function updateAllPrices() external whenNotPaused {
        require(block.timestamp >= lastGlobalPriceUpdate + priceUpdateInterval, "Too soon for price update");
        require(volatilityEnabled, "Price volatility is disabled");
        
        for (uint256 i = 1; i <= _itemIds; i++) {
            MarketItem storage item = marketItems[i];
            if (item.isActive) {
                _updateItemPrice(i);
            }
        }
        
        lastGlobalPriceUpdate = block.timestamp;
    }
    
    function _updateItemPrice(uint256 itemId) internal {
        MarketItem storage item = marketItems[itemId];
        if (!item.isActive) return;
        
        if (block.timestamp < item.listedAt + MIN_PRICE_CHANGE_INTERVAL) return;
        
        uint256 oldPrice = item.currentPrice;
        uint256 newPrice = item.basePrice;
        
        if (item.itemType == ItemType.GAME_ITEM) {
            MarketMetrics storage metrics = gameItemMetrics[item.gameItemId][0];
            
            if (metrics.supply > 0 && metrics.demand > 0) {
                if (metrics.demand > metrics.supply) {
                    uint256 increase = item.basePrice * min(metrics.demand * VOLATILITY_BASE / metrics.supply - VOLATILITY_BASE, MAX_PRICE_INCREASE) / VOLATILITY_BASE;
                    newPrice = item.basePrice + increase;
                } else if (metrics.supply > metrics.demand) {
                    uint256 decrease = item.basePrice * min(VOLATILITY_BASE - (metrics.demand * VOLATILITY_BASE / metrics.supply), MAX_PRICE_DROP) / VOLATILITY_BASE;
                    newPrice = item.basePrice > decrease ? item.basePrice - decrease : item.basePrice;
                }
            }
            
            newPrice = max(newPrice, item.basePrice / 5);
            
            item.currentPrice = newPrice;
            _updateGameItemMetrics(item.gameItemId, item.basePrice, newPrice, false);
        } else if (item.itemType == ItemType.GAME_NFT) {
            MarketMetrics storage metrics = nftMetrics[item.nftContract][item.tokenId];
            
            if (metrics.supply > 0 && metrics.demand > 0) {
                if (metrics.demand > metrics.supply) {
                    uint256 increase = item.basePrice * min(metrics.demand * VOLATILITY_BASE / metrics.supply - VOLATILITY_BASE, MAX_PRICE_INCREASE) / VOLATILITY_BASE;
                    newPrice = item.basePrice + increase;
                } else if (metrics.supply > metrics.demand) {
                    uint256 decrease = item.basePrice * min(VOLATILITY_BASE - (metrics.demand * VOLATILITY_BASE / metrics.supply), MAX_PRICE_DROP) / VOLATILITY_BASE;
                    newPrice = item.basePrice > decrease ? item.basePrice - decrease : item.basePrice;
                }
            }
            
            newPrice = max(newPrice, item.basePrice / 5);
            
            item.currentPrice = newPrice;
            _updateNftMetrics(item.nftContract, item.tokenId, item.basePrice, newPrice, false);
        }
        
        if (oldPrice != newPrice) {
            emit ItemPriceChanged(itemId, oldPrice, newPrice, true);
        }
    }
    
    function _updateGameItemMetrics(
        string memory gameItemId,
        uint256 basePrice,
        uint256 currentPrice,
        bool isNewListing
    ) internal {
        MarketMetrics storage metrics = gameItemMetrics[gameItemId][0];
        
        if (isNewListing) {
            metrics.supply++;
            itemListingCount[gameItemId]++;
        } else {
            metrics.totalTrades++;
            metrics.totalVolume += currentPrice;
            metrics.lastPrice = currentPrice;
            
            if (metrics.highestPrice == 0 || currentPrice > metrics.highestPrice) {
                metrics.highestPrice = currentPrice;
            }
            if (metrics.lowestPrice == 0 || currentPrice < metrics.lowestPrice) {
                metrics.lowestPrice = currentPrice;
            }

            uint256 uniqueBuyers = 0;
            for (uint256 i = 1; i <= _itemIds; i++) {
                MarketItem storage item = marketItems[i];
                if (keccak256(bytes(item.gameItemId)) == keccak256(bytes(gameItemId))) {
                    for (uint256 j = 0; j < userPurchases[item.seller].length; j++) {
                        if (lastGameItemBuyTime[item.seller][gameItemId] > block.timestamp - 1 days) {
                            uniqueBuyers++;
                            break;
                        }
                    }
                }
            }
            
            metrics.demand = uniqueBuyers;
        }
        
        emit MarketMetricsUpdated(
            gameItemId,
            currentPrice,
            metrics.supply,
            metrics.demand
        );
    }
    
    function _updateNftMetrics(
        address nftContract,
        uint256 tokenId,
        uint256 basePrice,
        uint256 currentPrice,
        bool isNewListing
    ) internal {
        MarketMetrics storage metrics = nftMetrics[nftContract][tokenId];
        
        if (isNewListing) {
            metrics.supply++;
            nftListingCount[nftContract][tokenId]++;
        } else {
            metrics.totalTrades++;
            metrics.totalVolume += currentPrice;
            metrics.lastPrice = currentPrice;
            
            if (metrics.highestPrice == 0 || currentPrice > metrics.highestPrice) {
                metrics.highestPrice = currentPrice;
            }
            if (metrics.lowestPrice == 0 || currentPrice < metrics.lowestPrice) {
                metrics.lowestPrice = currentPrice;
            }

            uint256 uniqueBuyers = 0;
            for (uint256 i = 1; i <= _itemIds; i++) {
                MarketItem storage item = marketItems[i];
                if (item.nftContract == nftContract && item.tokenId == tokenId) {
                    for (uint256 j = 0; j < userPurchases[item.seller].length; j++) {
                        if (lastNftBuyTime[item.seller][tokenId] > block.timestamp - 1 days) {
                            uniqueBuyers++;
                            break;
                        }
                    }
                }
            }
            
            metrics.demand = uniqueBuyers;
        }
        
        emit NftMetricsUpdated(
            nftContract,
            tokenId,
            currentPrice,
            metrics.supply,
            metrics.demand
        );
    }
    
    function getItemDetails(uint256 itemId) external view returns (
        uint256 id,
        address seller,
        string memory gameItemId,
        address nftContract,
        uint256 tokenId,
        uint256 basePrice,
        uint256 currentPrice,
        bool isActive,
        uint256 listedAt,
        ItemType itemType,
        uint256 quantity
    ) {
        MarketItem storage item = marketItems[itemId];
        return (
            item.itemId,
            item.seller,
            item.gameItemId,
            item.nftContract,
            item.tokenId,
            item.basePrice,
            item.currentPrice,
            item.isActive,
            item.listedAt,
            item.itemType,
            item.quantity
        );
    }
    
    function getItemsByUser(address user) external view returns (uint256[] memory) {
        uint256[] memory userItems = userListings[user];
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < userItems.length; i++) {
            if (marketItems[userItems[i]].isActive) {
                activeCount++;
            }
        }
        
        uint256[] memory activeItems = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < userItems.length; i++) {
            if (marketItems[userItems[i]].isActive) {
                activeItems[index] = userItems[i];
                index++;
            }
        }
        
        return activeItems;
    }
    
    function getPurchasesByUser(address user) external view returns (uint256[] memory) {
        return userPurchases[user];
    }
    
    function getActiveItems() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        
        for (uint256 i = 1; i <= _itemIds; i++) {
            if (marketItems[i].isActive) {
                activeCount++;
            }
        }
        
        uint256[] memory activeItems = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= _itemIds; i++) {
            if (marketItems[i].isActive) {
                activeItems[index] = i;
                index++;
            }
        }
        
        return activeItems;
    }
    
    function getGameItemMetrics(string memory gameItemId) external view returns (
        uint256 totalVolume,
        uint256 totalTrades, 
        uint256 lastPrice,
        uint256 highestPrice,
        uint256 lowestPrice,
        uint256 supply,
        uint256 demand
    ) {
        MarketMetrics storage metrics = gameItemMetrics[gameItemId][0];
        return (
            metrics.totalVolume,
            metrics.totalTrades,
            metrics.lastPrice,
            metrics.highestPrice,
            metrics.lowestPrice,
            metrics.supply,
            metrics.demand
        );
    }
    
    function getNftMetrics(address nftContract, uint256 tokenId) external view returns (
        uint256 totalVolume,
        uint256 totalTrades, 
        uint256 lastPrice,
        uint256 highestPrice,
        uint256 lowestPrice,
        uint256 supply,
        uint256 demand
    ) {
        MarketMetrics storage metrics = nftMetrics[nftContract][tokenId];
        return (
            metrics.totalVolume,
            metrics.totalTrades,
            metrics.lastPrice,
            metrics.highestPrice,
            metrics.lowestPrice,
            metrics.supply,
            metrics.demand
        );
    }
    
    function setVolatilityEnabled(bool enabled) external onlyOwner {
        volatilityEnabled = enabled;
        emit VolatilityChanged(enabled);
    }
    
    function setPriceUpdateInterval(uint256 interval) external onlyOwner {
        require(interval >= 1 hours, "Interval too short");
        priceUpdateInterval = interval;
        emit PriceUpdateIntervalChanged(interval);
    }
    
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        treasury = newTreasury;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
    
    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a : b;
    }
    
    function emergencyWithdrawNFT(
        address nftContract,
        uint256 tokenId
    ) external onlyOwner {
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
    }
    
    function emergencyWithdraw(
        address token,
        uint256 amount
    ) external onlyOwner {
        IERC20(token).transfer(msg.sender, amount);
    }
}
