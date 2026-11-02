// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @notice Builds the metadata (name, image, attributes) of a welcome badge.
/// @dev Kept separate from the badge contract so the artwork can be replaced later
///      without redeploying the badge contract or losing anyone's badge.
interface IWelcomeRenderer {
    /// @return A full token URI, e.g. "data:application/json;base64,..." or "https://...".
    function tokenURI(uint256 tokenId, address holder, address firstContract, uint64 claimedAt)
        external
        view
        returns (string memory);
}
