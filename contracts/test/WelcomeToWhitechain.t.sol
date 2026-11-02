// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {WelcomeToWhitechain} from "../src/WelcomeToWhitechain.sol";
import {SlabRenderer} from "../src/SlabRenderer.sol";
import {IWelcomeRenderer} from "../src/IWelcomeRenderer.sol";

/// A stand-in for someone's first contract.
contract HelloWorld {
    string public greeting = "hello whitechain";
}

contract FixedRenderer is IWelcomeRenderer {
    function tokenURI(uint256, address, address, uint64) external pure returns (string memory) {
        return "ipfs://final-design";
    }
}

contract WelcomeToWhitechainTest is Test {
    WelcomeToWhitechain badge;
    address owner = makeAddr("owner");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    event Claimed(address indexed builder, uint256 indexed tokenId, address indexed firstContract);
    event Locked(uint256 tokenId);
    event BatchMetadataUpdate(uint256 fromTokenId, uint256 toTokenId);

    function setUp() public {
        badge = new WelcomeToWhitechain(owner, new SlabRenderer());
    }

    /// Alice deploys HelloWorld from her own wallet, the way `forge create` would.
    function _aliceDeploys() internal returns (address deployed, uint64 nonce) {
        nonce = vm.getNonce(alice);
        vm.prank(alice, alice);
        deployed = address(new HelloWorld());
    }

    function test_Claim() public {
        (address deployed, uint64 nonce) = _aliceDeploys();

        vm.expectEmit(address(badge));
        emit Locked(1);
        vm.expectEmit(address(badge));
        emit Claimed(alice, 1, deployed);

        vm.prank(alice);
        uint256 tokenId = badge.claim(deployed, nonce);

        assertEq(tokenId, 1);
        assertEq(badge.ownerOf(1), alice);
        assertEq(badge.badgeOf(alice), 1);
        assertEq(badge.totalSupply(), 1);
        (address firstContract, uint64 claimedAt) = badge.badges(1);
        assertEq(firstContract, deployed);
        assertEq(claimedAt, block.timestamp);
        assertTrue(badge.locked(1));
    }

    function test_Claim_LaterNonce() public {
        // Alice already sent a few transactions before her deploy.
        vm.setNonce(alice, 41);
        (address deployed, uint64 nonce) = _aliceDeploys();
        assertEq(nonce, 41);

        vm.prank(alice);
        badge.claim(deployed, nonce);
        assertEq(badge.badgeOf(alice), 1);
    }

    function test_RevertWhen_SomeoneElseClaimsAlicesContract() public {
        (address deployed, uint64 nonce) = _aliceDeploys();

        vm.prank(bob);
        vm.expectRevert(WelcomeToWhitechain.NotDeployer.selector);
        badge.claim(deployed, nonce);
    }

    function test_RevertWhen_WrongNonce() public {
        (address deployed, uint64 nonce) = _aliceDeploys();

        vm.prank(alice);
        vm.expectRevert(WelcomeToWhitechain.NotDeployer.selector);
        badge.claim(deployed, nonce + 1);
    }

    function test_RevertWhen_NothingDeployedAtThatNonce() public {
        uint64 nonce = 7;
        address empty = badge.computeCreateAddress(alice, nonce);

        vm.prank(alice);
        vm.expectRevert(WelcomeToWhitechain.NoContractCode.selector);
        badge.claim(empty, nonce);
    }

    function test_RevertWhen_ClaimingTwice() public {
        (address first, uint64 n1) = _aliceDeploys();
        (address second, uint64 n2) = _aliceDeploys();

        vm.startPrank(alice);
        badge.claim(first, n1);
        vm.expectRevert(abi.encodeWithSelector(WelcomeToWhitechain.AlreadyClaimed.selector, 1));
        badge.claim(second, n2);
        vm.stopPrank();
    }

    function test_RevertWhen_Transferring() public {
        (address deployed, uint64 nonce) = _aliceDeploys();
        vm.startPrank(alice);
        badge.claim(deployed, nonce);

        vm.expectRevert(WelcomeToWhitechain.Soulbound.selector);
        badge.transferFrom(alice, bob, 1);
        vm.expectRevert(WelcomeToWhitechain.Soulbound.selector);
        badge.safeTransferFrom(alice, bob, 1);
        vm.expectRevert(WelcomeToWhitechain.Soulbound.selector);
        badge.approve(bob, 1);
        vm.expectRevert(WelcomeToWhitechain.Soulbound.selector);
        badge.setApprovalForAll(bob, true);
        vm.stopPrank();

        assertEq(badge.ownerOf(1), alice);
    }

    function test_TokenURI_IsOnChainJson() public {
        (address deployed, uint64 nonce) = _aliceDeploys();
        vm.prank(alice);
        badge.claim(deployed, nonce);

        string memory uri = badge.tokenURI(1);
        assertEq(_prefix(uri, 29), "data:application/json;base64,");
    }

    function test_SetRenderer_ChangesEveryBadge() public {
        (address deployed, uint64 nonce) = _aliceDeploys();
        vm.prank(alice);
        badge.claim(deployed, nonce);

        IWelcomeRenderer finalDesign = new FixedRenderer();
        vm.expectEmit(address(badge));
        emit BatchMetadataUpdate(1, 1);
        vm.prank(owner);
        badge.setRenderer(finalDesign);

        assertEq(badge.tokenURI(1), "ipfs://final-design");
    }

    function test_RevertWhen_NonOwnerSetsRenderer() public {
        IWelcomeRenderer other = new FixedRenderer();
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        badge.setRenderer(other);
    }

    function test_SupportsInterfaces() public view {
        assertTrue(badge.supportsInterface(0x80ac58cd)); // ERC-721
        assertTrue(badge.supportsInterface(0x5b5e139f)); // ERC-721 metadata
        assertTrue(badge.supportsInterface(0xb45a3c0e)); // ERC-5192
        assertTrue(badge.supportsInterface(0x49064906)); // ERC-4906
        assertFalse(badge.supportsInterface(0xdeadbeef));
    }

    function testFuzz_ComputeCreateAddress(address deployer, uint64 nonce) public view {
        assertEq(badge.computeCreateAddress(deployer, nonce), vm.computeCreateAddress(deployer, nonce));
    }

    function test_ComputeCreateAddress_ByteBoundaries() public view {
        uint64[19] memory nonces = [
            uint64(0), 1, 0x7f, 0x80, 0xff, 0x100, 0xffff, 0x10000, 0xffffff, 0x1000000,
            0xffffffff, 0x100000000, 0xffffffffff, 0x10000000000, 0xffffffffffff,
            0x1000000000000, 0xffffffffffffff, 0x100000000000000, type(uint64).max
        ];
        for (uint256 i; i < nonces.length; i++) {
            assertEq(badge.computeCreateAddress(alice, nonces[i]), vm.computeCreateAddress(alice, nonces[i]));
        }
    }

    function _prefix(string memory s, uint256 len) internal pure returns (string memory) {
        bytes memory out = new bytes(len);
        for (uint256 i; i < len; i++) {
            out[i] = bytes(s)[i];
        }
        return string(out);
    }
}

/// Runs against live Whitechain Sepolia: a real contract, claimed by the wallet that deployed it.
/// Skip with: forge test --no-match-contract Fork
contract WelcomeToWhitechainForkTest is Test {
    // MinimalToken, deployed by 0xe64c… with nonce 0 (checked on the explorer).
    address constant REAL_CONTRACT = 0x6d1A36885424c41FaCdA6A51b47Fcdf1e1EF9901;
    address constant REAL_DEPLOYER = 0xe64c79726DD1ab65b76ef4f237724b000657593B;

    function test_Fork_ClaimForRealWhitechainContract() public {
        vm.createSelectFork("whitechain_sepolia");
        assertEq(block.chainid, 1874);

        WelcomeToWhitechain badge = new WelcomeToWhitechain(address(this), new SlabRenderer());

        vm.prank(makeAddr("stranger"));
        vm.expectRevert(WelcomeToWhitechain.NotDeployer.selector);
        badge.claim(REAL_CONTRACT, 0);

        vm.prank(REAL_DEPLOYER);
        badge.claim(REAL_CONTRACT, 0);
        assertEq(badge.ownerOf(1), REAL_DEPLOYER);
    }
}
