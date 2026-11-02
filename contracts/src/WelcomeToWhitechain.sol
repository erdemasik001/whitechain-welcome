// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IWelcomeRenderer} from "./IWelcomeRenderer.sol";

/// @title WelcomeToWhitechain
/// @notice A non-transferable "Welcome to Whitechain" badge for people who deployed their
///         first contract.
///
///         How a claim is checked, with no server involved: when a wallet deploys a contract
///         directly (forge create, Remix, a deploy script), the new address is fully determined
///         by the wallet address and the nonce of the deploy transaction. So the caller passes
///         the contract address and that nonce, and this contract recomputes the address from
///         msg.sender. If it matches and there is code at that address, the caller deployed it.
///
///         Contracts deployed through a factory or with CREATE2 are not supported.
contract WelcomeToWhitechain is ERC721, Ownable {
    struct Badge {
        address firstContract;
        uint64 claimedAt;
    }

    /// @notice Builds each badge's metadata and image. Replaceable by the owner.
    IWelcomeRenderer public renderer;

    /// @notice Number of badges claimed so far. Token ids run from 1 to totalSupply.
    uint256 public totalSupply;

    /// @notice Badge data by token id.
    mapping(uint256 tokenId => Badge) public badges;

    /// @notice Token id held by a wallet, or 0 if it has not claimed.
    mapping(address wallet => uint256 tokenId) public badgeOf;

    event Claimed(address indexed builder, uint256 indexed tokenId, address indexed firstContract);
    event RendererUpdated(address indexed renderer);
    /// @dev ERC-5192: the token can never be transferred.
    event Locked(uint256 tokenId);
    /// @dev ERC-4906: tells explorers and wallets to refresh metadata.
    event BatchMetadataUpdate(uint256 fromTokenId, uint256 toTokenId);

    error AlreadyClaimed(uint256 tokenId);
    error NotDeployer();
    error NoContractCode();
    error Soulbound();

    constructor(address initialOwner, IWelcomeRenderer initialRenderer)
        ERC721("Welcome to Whitechain", "WELCOME")
        Ownable(initialOwner)
    {
        renderer = initialRenderer;
        emit RendererUpdated(address(initialRenderer));
    }

    /// @notice Claim the badge for a contract the caller deployed.
    /// @param firstContract Address of the contract the caller deployed.
    /// @param nonce Nonce of the caller's deploy transaction.
    function claim(address firstContract, uint64 nonce) external returns (uint256 tokenId) {
        uint256 existing = badgeOf[msg.sender];
        if (existing != 0) revert AlreadyClaimed(existing);
        if (computeCreateAddress(msg.sender, nonce) != firstContract) revert NotDeployer();
        if (firstContract.code.length == 0) revert NoContractCode();

        tokenId = ++totalSupply;
        badgeOf[msg.sender] = tokenId;
        // forge-lint: disable-next-line(unsafe-typecast) — a uint64 timestamp lasts billions of years
        badges[tokenId] = Badge({firstContract: firstContract, claimedAt: uint64(block.timestamp)});

        // Plain _mint on purpose: the badge can never move, so the receiver check of _safeMint
        // would only add a callback into the caller without protecting anything.
        // forge-lint: disable-next-line(unsafe-oz-erc721-mint)
        _mint(msg.sender, tokenId);
        emit Locked(tokenId);
        emit Claimed(msg.sender, tokenId, firstContract);
    }

    /// @notice Address a CREATE deployment from `deployer` at `nonce` ends up at:
    ///         keccak256(rlp([deployer, nonce])), last 20 bytes.
    /// @dev Each narrowing cast below sits behind a range check, so nothing is truncated.
    // forge-lint: disable-next-item(unsafe-typecast)
    function computeCreateAddress(address deployer, uint64 nonce) public pure returns (address) {
        bytes memory rlp;
        // 0xd6 + n is the RLP list header (0xc0 + payload length), 0x94 is the header for a
        // 20-byte address, and 0x80 + n is the header for an n-byte nonce.
        if (nonce == 0) {
            rlp = abi.encodePacked(bytes1(0xd6), bytes1(0x94), deployer, bytes1(0x80));
        } else if (nonce < 0x80) {
            rlp = abi.encodePacked(bytes1(0xd6), bytes1(0x94), deployer, uint8(nonce));
        } else if (nonce <= type(uint8).max) {
            rlp = abi.encodePacked(bytes1(0xd7), bytes1(0x94), deployer, bytes1(0x81), uint8(nonce));
        } else if (nonce <= type(uint16).max) {
            rlp = abi.encodePacked(bytes1(0xd8), bytes1(0x94), deployer, bytes1(0x82), uint16(nonce));
        } else if (nonce <= type(uint24).max) {
            rlp = abi.encodePacked(bytes1(0xd9), bytes1(0x94), deployer, bytes1(0x83), uint24(nonce));
        } else if (nonce <= type(uint32).max) {
            rlp = abi.encodePacked(bytes1(0xda), bytes1(0x94), deployer, bytes1(0x84), uint32(nonce));
        } else if (nonce <= type(uint40).max) {
            rlp = abi.encodePacked(bytes1(0xdb), bytes1(0x94), deployer, bytes1(0x85), uint40(nonce));
        } else if (nonce <= type(uint48).max) {
            rlp = abi.encodePacked(bytes1(0xdc), bytes1(0x94), deployer, bytes1(0x86), uint48(nonce));
        } else if (nonce <= type(uint56).max) {
            rlp = abi.encodePacked(bytes1(0xdd), bytes1(0x94), deployer, bytes1(0x87), uint56(nonce));
        } else {
            rlp = abi.encodePacked(bytes1(0xde), bytes1(0x94), deployer, bytes1(0x88), nonce);
        }
        return address(uint160(uint256(keccak256(rlp))));
    }

    /// @notice Swap the artwork for every badge, past and future.
    function setRenderer(IWelcomeRenderer newRenderer) external onlyOwner {
        renderer = newRenderer;
        emit RendererUpdated(address(newRenderer));
        if (totalSupply != 0) emit BatchMetadataUpdate(1, totalSupply);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        address holder = _requireOwned(tokenId);
        Badge memory badge = badges[tokenId];
        return renderer.tokenURI(tokenId, holder, badge.firstContract, badge.claimedAt);
    }

    /// @notice ERC-5192: every badge is locked to its holder.
    function locked(uint256 tokenId) external view returns (bool) {
        _requireOwned(tokenId);
        return true;
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return interfaceId == 0xb45a3c0e // ERC-5192
            || interfaceId == 0x49064906 // ERC-4906
            || super.supportsInterface(interfaceId);
    }

    // ---------------------------------------------------------------------------------------
    // Non-transferable: minting is the only allowed balance change, and nothing can be approved.
    // ---------------------------------------------------------------------------------------

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        if (_ownerOf(tokenId) != address(0)) revert Soulbound();
        return super._update(to, tokenId, auth);
    }

    function approve(address, uint256) public pure override {
        revert Soulbound();
    }

    function setApprovalForAll(address, bool) public pure override {
        revert Soulbound();
    }
}
