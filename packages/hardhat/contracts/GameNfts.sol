// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Counters} from "openzeppelin/contracts/utils/Counters.sol";

contract GameNfts is ERC721Enumerable, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Struct to store NFT metadata
    struct NFTMetadata {
        string earningReason;
        uint256 earnedTimestamp;
        string imageURI;         // Direct URI to the NFT image
        string additionalData;   // JSON string for any additional data
    }

    // Mapping from token ID to metadata
    mapping(uint256 => NFTMetadata) private _nftMetadata;

    // Events
    event NFTMinted(address indexed to, uint256 indexed tokenId, string reason, string imageURI);
    event MetadataUpdated(uint256 indexed tokenId, string newURI);
    event ImageURIUpdated(uint256 indexed tokenId, string newImageURI);
    event NFTTransferred(address indexed from, address indexed to, uint256 indexed tokenId);
    event BatchNFTTransferred(address indexed from, address indexed to, uint256[] tokenIds);

    constructor(
        string memory name_,
        string memory symbol_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {}

    // Mint new NFT with specified earning reason and image
    function mintNFT(
        address recipient,
        string memory tokenURI,
        string memory imageURI,
        string memory reason,
        string memory additionalData
    ) public onlyOwner returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(recipient, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        _nftMetadata[newTokenId] = NFTMetadata({
            earningReason: reason,
            earnedTimestamp: block.timestamp,
            imageURI: imageURI,
            additionalData: additionalData
        });

        emit NFTMinted(recipient, newTokenId, reason, imageURI);

        return newTokenId;
    }

    // Batch mint NFTs to a recipient
    function batchMintNFTs(
        address recipient,
        string[] memory tokenURIs,
        string[] memory imageURIs,
        string memory reason,
        string memory additionalData
    ) public onlyOwner returns (uint256[] memory) {
        require(tokenURIs.length > 0, "Must mint at least one NFT");
        require(tokenURIs.length == imageURIs.length, "Token and image arrays must have same length");

        uint256[] memory tokenIds = new uint256[](tokenURIs.length);

        for (uint256 i = 0; i < tokenURIs.length; i++) {
            tokenIds[i] = mintNFT(recipient, tokenURIs[i], imageURIs[i], reason, additionalData);
        }

        return tokenIds;
    }

    // Update token URI
    function updateTokenURI(uint256 tokenId, string memory newTokenURI) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _setTokenURI(tokenId, newTokenURI);
        emit MetadataUpdated(tokenId, newTokenURI);
    }

    // Update image URI
    function updateImageURI(uint256 tokenId, string memory newImageURI) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _nftMetadata[tokenId].imageURI = newImageURI;
        emit ImageURIUpdated(tokenId, newImageURI);
    }

    // Transfer NFT
    function transferNFT(address from, address to, uint256 tokenId) public {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(from == msg.sender || getApproved(tokenId) == msg.sender || isApprovedForAll(from, msg.sender), 
                "Caller is not owner nor approved");
        
        safeTransferFrom(from, to, tokenId);
        emit NFTTransferred(from, to, tokenId);
    }

    // Batch transfer NFTs
    function batchTransferNFTs(address from, address to, uint256[] memory tokenIds) public {
        require(tokenIds.length > 0, "Must transfer at least one NFT");
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(_ownerOf(tokenId) != address(0), "Token does not exist");
            require(from == msg.sender || getApproved(tokenId) == msg.sender || isApprovedForAll(from, msg.sender), 
                    "Caller is not owner nor approved for one or more tokens");
            
            safeTransferFrom(from, to, tokenId);
        }
        
        emit BatchNFTTransferred(from, to, tokenIds);
    }

    // Game master controlled transfer (owner can force transfer NFTs between addresses)
    function gameMasterTransfer(address from, address to, uint256 tokenId) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(ownerOf(tokenId) == from, "From address is not the owner");
        
        _safeTransfer(from, to, tokenId, "");
        emit NFTTransferred(from, to, tokenId);
    }

    // Game master controlled batch transfer
    function gameMasterBatchTransfer(address from, address to, uint256[] memory tokenIds) public onlyOwner {
        require(tokenIds.length > 0, "Must transfer at least one NFT");
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(_ownerOf(tokenId) != address(0), "Token does not exist");
            require(ownerOf(tokenId) == from, "From address is not the owner of one or more tokens");
            
            _safeTransfer(from, to, tokenId, "");
        }
        
        emit BatchNFTTransferred(from, to, tokenIds);
    }

    // Get NFT metadata
    function getNFTMetadata(uint256 tokenId) public view returns (
        string memory earningReason,
        uint256 earnedTimestamp,
        string memory imageURI,
        string memory additionalData
    ) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        NFTMetadata memory metadata = _nftMetadata[tokenId];
        return (metadata.earningReason, metadata.earnedTimestamp, metadata.imageURI, metadata.additionalData);
    }

    // Get image URI
    function getImageURI(uint256 tokenId) public view returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _nftMetadata[tokenId].imageURI;
    }

    // Get all tokens owned by an address
    function getTokensByOwner(address owner) public view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);

        if (tokenCount == 0) {
            return new uint256[](0);
        }

        uint256[] memory result = new uint256[](tokenCount);
        for (uint256 i = 0; i < tokenCount; i++) {
            result[i] = tokenOfOwnerByIndex(owner, i);
        }

        return result;
    }

    // Get all NFTs in the contract (for owner only)
    function getAllNFTs() public view onlyOwner returns (uint256[] memory) {
        uint256 totalSupply = totalSupply();
        uint256[] memory result = new uint256[](totalSupply);

        for (uint256 i = 0; i < totalSupply; i++) {
            result[i] = tokenByIndex(i);
        }

        return result;
    }

    // Get total count of NFTs
    function getTotalNFTs() public view returns (uint256) {
        return _tokenIds.current();
    }

    // Override functions required by inherited contracts
    function _update(address to, uint256 tokenId, address auth) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 amount) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, amount);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
