// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {SlabRenderer} from "../src/SlabRenderer.sol";

/// The fixtures are drawn by design/slab.mjs (`node design/build-contract.mjs`). If one of these
/// tests fails after a design change, rerun that script and check SlabRenderer.svg().
contract SlabRendererTest is Test {
    SlabRenderer renderer;

    function setUp() public {
        renderer = new SlabRenderer();
    }

    function test_Svg_Basic() public view {
        _assertFixture("slab-basic", 1, 0x6d1A36885424c41FaCdA6A51b47Fcdf1e1EF9901, 1793620429);
    }

    function test_Svg_LongIdAndZeroAddress() public view {
        // Nine-digit id: the certificate number is not padded or cut. Last second of 2026.
        _assertFixture("slab-long-id-zero-address", 123456789, address(0), 1798761599);
    }

    function test_Svg_WideBarcodeAndNewYear() public view {
        // All-F address: widest bars, so the barcode stops early. First second of 2027.
        _assertFixture("slab-wide-barcode-new-year", 42, 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF, 1798761600);
    }

    function test_Svg_LeapDay() public view {
        _assertFixture("slab-leap-day", 1000, 0x1804c8AB1F12E6bbf3894d4083f33e07309d1f38, 1709164800);
    }

    function test_YearOf() public view {
        assertEq(renderer.yearOf(0), 1970);
        assertEq(renderer.yearOf(951782399), 2000); // 2000-02-28 23:59:59
        assertEq(renderer.yearOf(951868800), 2000); // 2000-03-01, after a leap day in a /400 year
        assertEq(renderer.yearOf(1735689599), 2024); // 2024-12-31 23:59:59
        assertEq(renderer.yearOf(1735689600), 2025); // 2025-01-01
        assertEq(renderer.yearOf(4107542400), 2100); // 2100-03-01, no leap day in a /100 year
        assertEq(renderer.yearOf(type(uint64).max), 584554051223);
    }

    function testFuzz_YearOf_MatchesDayCount(uint32 daysSince1970) public view {
        // Count years forward from 1970 the slow way and compare.
        uint256 day = daysSince1970 % 200_000; // up to the year ~2517
        uint256 year = 1970;
        uint256 left = day;
        while (true) {
            uint256 length = _isLeap(year) ? 366 : 365;
            if (left < length) break;
            left -= length;
            ++year;
        }
        assertEq(renderer.yearOf(uint64(day * 86400 + 86399)), year);
    }

    function test_TokenUri_IsJsonWithTheSlab() public view {
        string memory uri =
            renderer.tokenURI(7, address(0xA11CE), 0x6d1A36885424c41FaCdA6A51b47Fcdf1e1EF9901, 1793620429);
        string memory prefix = "data:application/json;base64,";
        assertTrue(_startsWith(uri, prefix));

        string memory json = string(_decodeBase64(_after(uri, bytes(prefix).length)));
        assertEq(vm.parseJsonString(json, ".name"), "Welcome to Whitechain #7");
        assertEq(vm.parseJsonString(json, ".attributes[0].value"), "0x6d1A36885424c41FaCdA6A51b47Fcdf1e1EF9901");
        assertEq(vm.parseJsonString(json, ".attributes[1].value"), unicode"Whitechain Türkiye");
        assertEq(vm.parseJsonUint(json, ".attributes[3].value"), 1793620429);

        string memory image = vm.parseJsonString(json, ".image");
        string memory imagePrefix = "data:image/svg+xml;base64,";
        assertTrue(_startsWith(image, imagePrefix));
        assertEq(
            string(_decodeBase64(_after(image, bytes(imagePrefix).length))),
            renderer.svg(7, 0x6d1A36885424c41FaCdA6A51b47Fcdf1e1EF9901, 1793620429)
        );
    }

    function test_TokenUri_FitsInAnEthCall() public {
        uint256 before = gasleft();
        renderer.tokenURI(type(uint256).max, address(1), 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF, type(uint64).max);
        uint256 used = before - gasleft();
        emit log_named_uint("tokenURI gas (worst case)", used);
        assertLt(used, 10_000_000); // public RPCs allow far more for eth_call; this is a sanity bound
    }

    function _assertFixture(string memory name, uint256 tokenId, address firstContract, uint64 claimedAt) private view {
        string memory expected = vm.readFile(string.concat("test/fixtures/", name, ".svg"));
        assertEq(renderer.svg(tokenId, firstContract, claimedAt), expected, name);
    }

    /// @dev Minimal base64 decoder (this OpenZeppelin version only encodes).
    function _decodeBase64(string memory text) private pure returns (bytes memory out) {
        bytes memory input = bytes(text);
        uint256 padding =
            input.length > 0 && input[input.length - 1] == "=" ? (input[input.length - 2] == "=" ? 2 : 1) : 0;
        out = new bytes((input.length / 4) * 3 - padding);
        uint256 o;
        for (uint256 i; i < input.length; i += 4) {
            uint256 chunk;
            for (uint256 j; j < 4; ++j) {
                chunk = (chunk << 6) | _base64Value(input[i + j]);
            }
            for (uint256 j; j < 3 && o < out.length; ++j) {
                out[o++] = bytes1(uint8(chunk >> (16 - 8 * j)));
            }
        }
    }

    function _base64Value(bytes1 char) private pure returns (uint256) {
        uint8 c = uint8(char);
        if (c >= 65 && c <= 90) return c - 65; // A-Z
        if (c >= 97 && c <= 122) return c - 71; // a-z
        if (c >= 48 && c <= 57) return c + 4; // 0-9
        if (c == 43) return 62; // +
        if (c == 47) return 63; // /
        return 0; // = padding
    }

    function _isLeap(uint256 year) private pure returns (bool) {
        return (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
    }

    function _startsWith(string memory text, string memory prefix) private pure returns (bool) {
        bytes memory t = bytes(text);
        bytes memory p = bytes(prefix);
        if (t.length < p.length) return false;
        for (uint256 i; i < p.length; ++i) {
            if (t[i] != p[i]) return false;
        }
        return true;
    }

    function _after(string memory text, uint256 start) private pure returns (string memory) {
        bytes memory t = bytes(text);
        bytes memory out = new bytes(t.length - start);
        for (uint256 i; i < out.length; ++i) {
            out[i] = t[start + i];
        }
        return string(out);
    }
}
