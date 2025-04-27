// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GameToken
 * @dev Implements a basic ERC20 token for use in a game with enhanced balance tracking
 */
contract GameToken is ERC20, Ownable {
    uint8 private immutable _decimals;
    
    // Additional user data structure
    struct UserData {
        uint256 totalEarned;
        uint256 totalSpent;
        uint256 lastUpdateTime;
    }
    
    // Mapping to track additional user data
    mapping(address => UserData) private _userData;

    /**
     * @dev Constructor that gives the msg.sender all initial tokens.
     * @param initialSupply Initial supply of tokens
     * @param name_ Name of the token
     * @param symbol_ Symbol of the token
     * @param decimals_ Number of decimals for the token
     */
    constructor(
        uint256 initialSupply,
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        _decimals = decimals_;
        _mint(msg.sender, initialSupply);
        
        // Initialize user data for the initial holder
        _userData[msg.sender].totalEarned = initialSupply;
        _userData[msg.sender].lastUpdateTime = block.timestamp;
    }

    /**
     * @dev Returns the number of decimals used for token.
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Mints new tokens to an address and updates user stats.
     * @param to The address that will receive the minted tokens
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        _userData[to].totalEarned += amount;
        _userData[to].lastUpdateTime = block.timestamp;
    }

    /**
     * @dev Burns tokens from an address and updates user stats.
     * @param from The address from which to burn tokens
     * @param amount The amount of tokens to burn
     */
    function burn(address from, uint256 amount) external {
        require(
            from == msg.sender || owner() == msg.sender,
            "GameToken: Caller must be owner or burning own tokens"
        );
        _burn(from, amount);
        _userData[from].totalSpent += amount;
        _userData[from].lastUpdateTime = block.timestamp;
    }
    
    /**
     * @dev Returns detailed user balance data
     * @param user The address of the user
     * @return currentBalance The current token balance
     * @return totalEarned Total tokens earned/received
     * @return totalSpent Total tokens spent/burned
     * @return lastUpdateTime Last time user data was updated
     */
    function getUserData(address user) external view returns (
        uint256 currentBalance,
        uint256 totalEarned,
        uint256 totalSpent,
        uint256 lastUpdateTime
    ) {
        return (
            balanceOf(user),
            _userData[user].totalEarned,
            _userData[user].totalSpent,
            _userData[user].lastUpdateTime
        );
    }
    
    /**
     * @dev Override the _update function to track user stats on transfers
     */
    function _update(address from, address to, uint256 amount) internal override {
        super._update(from, to, amount);
        
        // Skip minting and burning as they're handled in their respective functions
        if (from != address(0) && to != address(0)) {
            _userData[to].totalEarned += amount;
            _userData[from].totalSpent += amount;
            _userData[to].lastUpdateTime = block.timestamp;
            _userData[from].lastUpdateTime = block.timestamp;
        }
    }
}