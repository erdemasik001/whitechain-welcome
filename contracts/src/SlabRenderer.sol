// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IWelcomeRenderer} from "./IWelcomeRenderer.sol";
import {SlabArt} from "./SlabArt.sol";

/// @title SlabRenderer
/// @notice The badge artwork: a clear grading case ("slab") holding a holographic Whitechain
///         card. The label on top shows the badge number, the first contract, the year it was
///         claimed and a barcode made from the contract address. Everything is drawn here, so
///         the badge needs no image hosting.
/// @dev The drawing comes from design/slab.mjs. design/build-contract.mjs writes its fixed parts
///      to SlabArt.sol; this contract fills in the per-badge values between them. The tests
///      compare the result byte for byte with SVGs that slab.mjs drew.
contract SlabRenderer is IWelcomeRenderer {
    bytes16 private constant UPPER_HEX = "0123456789ABCDEF";

    function tokenURI(uint256 tokenId, address, address firstContract, uint64 claimedAt)
        external
        pure
        returns (string memory)
    {
        string memory attributes = string.concat(
            '[{"trait_type":"First contract","value":"',
            Strings.toChecksumHexString(firstContract),
            unicode'"},{"trait_type":"Community","value":"Whitechain Türkiye"},{"trait_type":"Grade","value":"GEM MT 10"},',
            '{"display_type":"date","trait_type":"Claimed","value":',
            Strings.toString(claimedAt),
            "}]"
        );
        string memory json = string.concat(
            '{"name":"Welcome to Whitechain #',
            Strings.toString(tokenId),
            unicode'","description":"Awarded for deploying a first smart contract on Whitechain. Non-transferable. A Whitechain Türkiye community badge.",',
            '"image":"data:image/svg+xml;base64,',
            Base64.encode(bytes(svg(tokenId, firstContract, claimedAt))),
            '","attributes":',
            attributes,
            "}"
        );
        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    /// @notice The badge image as plain SVG. Handy for previews and tests.
    function svg(uint256 tokenId, address firstContract, uint64 claimedAt) public pure returns (string memory) {
        // Built in small steps: one big string.concat runs out of stack slots.
        string memory id = Strings.toString(tokenId);
        string memory out = string.concat(SlabArt.P0, Strings.toString(yearOf(claimedAt)), SlabArt.P1);
        out = string.concat(out, _shortHex(firstContract), SlabArt.P2, id, SlabArt.P3);
        out = string.concat(out, _certNumber(id), SlabArt.P4, _barcode(firstContract), SlabArt.P5);
        return string.concat(out, Strings.toChecksumHexString(firstContract), SlabArt.P6, id, SlabArt.P7);
    }

    /// @notice UTC calendar year of a unix timestamp (Howard Hinnant's days-to-civil algorithm).
    /// @dev The divisions round down on purpose: they count whole 400-year eras and whole years.
    function yearOf(uint64 timestamp) public pure returns (uint256) {
        uint256 z = timestamp / 86400 + 719468;
        uint256 era = z / 146097;
        // forge-lint: disable-next-line(divide-before-multiply)
        uint256 dayOfEra = z - era * 146097;
        uint256 yearOfEra = (dayOfEra - dayOfEra / 1460 + dayOfEra / 36524 - dayOfEra / 146096) / 365;
        // forge-lint: disable-next-line(divide-before-multiply)
        uint256 dayOfYear = dayOfEra - (365 * yearOfEra + yearOfEra / 4 - yearOfEra / 100);
        uint256 shiftedMonth = (5 * dayOfYear + 2) / 153; // 0 = March ... 11 = February
        // The algorithm's years start in March, so January and February belong to the next year.
        // forge-lint: disable-next-line(divide-before-multiply)
        return yearOfEra + era * 400 + (shiftedMonth >= 10 ? 1 : 0);
    }

    /// @dev "0x6D1A…9901": first and last two bytes in upper case, as on the label.
    function _shortHex(address account) private pure returns (string memory) {
        bytes20 raw = bytes20(account);
        bytes memory head = new bytes(4);
        bytes memory tail = new bytes(4);
        for (uint256 i; i < 2; ++i) {
            head[2 * i] = UPPER_HEX[uint8(raw[i]) >> 4];
            head[2 * i + 1] = UPPER_HEX[uint8(raw[i]) & 15];
            tail[2 * i] = UPPER_HEX[uint8(raw[18 + i]) >> 4];
            tail[2 * i + 1] = UPPER_HEX[uint8(raw[18 + i]) & 15];
        }
        return string.concat("0x", string(head), unicode"…", string(tail));
    }

    /// @dev The badge number padded to eight digits, like a grading certificate number.
    function _certNumber(string memory id) private pure returns (string memory padded) {
        padded = id;
        for (uint256 i = bytes(id).length; i < 8; ++i) {
            padded = string.concat("0", padded);
        }
    }

    /// @dev One bar per hex digit of the address: the digit sets the bar width and the gap after
    ///      it. Bars stop before x = 440 so the barcode never runs into the hologram sticker.
    ///      Positions are kept in half pixels so every value is a whole number.
    function _barcode(address account) private pure returns (string memory bars) {
        bytes20 raw = bytes20(account);
        uint256 x2 = 428; // 214 px
        for (uint256 i; i < 40; ++i) {
            uint256 digit = i % 2 == 0 ? uint8(raw[i / 2]) >> 4 : uint8(raw[i / 2]) & 15;
            uint256 width2 = 4 + (digit & 3) * 3; // 2, 3.5, 5 or 6.5 px
            if (x2 + width2 > 880) break;
            bars = string.concat(
                bars, '<rect x="', _halfPixels(x2), '" y="268" width="', _halfPixels(width2), '" height="44"/>'
            );
            x2 += width2 + 4 + ((digit >> 2) & 1) * 4; // gap: 2 or 4 px
        }
    }

    function _halfPixels(uint256 value2) private pure returns (string memory) {
        string memory whole = Strings.toString(value2 / 2);
        return value2 % 2 == 0 ? whole : string.concat(whole, ".5");
    }
}
