// Reference drawing of the badge: a clear grading case ("slab") with a label on top and a
// holographic Whitechain card inside. contracts/src/SlabRenderer.sol builds exactly the same SVG
// on-chain; `node make-fixtures.mjs` writes sample outputs that the Solidity tests compare against.
// Only string concatenation over (tokenId, firstContract, claimedAt): no fonts or external files.
const NAVY = '#07081F', BLUE = '#0044FF', INK2 = '#4A5567';
const SANS = "font-family=\"Helvetica Neue, Helvetica, Arial, sans-serif\"";
const MONO = "font-family=\"Menlo, Consolas, monospace\"";

const ICON =
  `<path fill="${NAVY}" d="M10 0H35A10 10 0 0 1 42.07 2.93L53.07 13.93 46 21 21 46 13.93 53.07 2.93 42.07A10 10 0 0 1 0 35V10A10 10 0 0 1 10 0Z"/>` +
  `<rect x="11" y="11" width="45" height="45" rx="10" fill="${BLUE}"/>` +
  `<path fill="#fff" d="M11 21A10 10 0 0 1 21 11H45V35A10 10 0 0 1 35 45H11Z"/>` +
  `<path fill="${NAVY}" d="M22.7 19.95A9.4 9.4 0 0 0 36 33.25Z"/>`;
// Outline of the whole icon, used to lay the hologram over it.
const ICON_SIL =
  'M10 0H35A10 10 0 0 1 42.07 2.93L53.07 13.93A10 10 0 0 1 56 21V46A10 10 0 0 1 46 56H21A10 10 0 0 1 13.93 53.07L2.93 42.07A10 10 0 0 1 0 35V10A10 10 0 0 1 10 0Z';

const WHITE_PANEL = 'M11 21A10 10 0 0 1 21 11H45V35A10 10 0 0 1 35 45H11Z';

// Sunburst behind the logo (precomputed once; a constant string on-chain).
function rays(cx, cy, r, n) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, b = a + Math.PI / n;
    d += `M${cx} ${cy}L${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}L${(cx + r * Math.cos(b)).toFixed(1)} ${(cy + r * Math.sin(b)).toFixed(1)}Z`;
  }
  return d;
}

function star(x, y, s, delay) {
  return `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -10C1 -2 2 -1 10 0C2 1 1 2 0 10C-1 2 -2 1 -10 0C-2 -1 -1 -2 0 -10Z" fill="#fff">` +
    `<animate attributeName="opacity" values="0.2;1;0.2" dur="2.4s" begin="${delay}s" repeatCount="indefinite"/></path>`;
}

function barcode(hex, x0, y, h, maxX) {
  let x = x0, out = '';
  for (const ch of hex) {
    const v = parseInt(ch, 16), w = 2 + (v & 3) * 1.5, gap = 2 + ((v >> 2) & 1) * 2;
    if (x + w > maxX) break;
    out += `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`;
    x += w + gap;
  }
  return out;
}

/** firstContract must be checksummed, like Strings.toChecksumHexString on-chain. */
export function slabSvg({ tokenId, firstContract, claimedAt }) {
  const id = String(tokenId);
  const addr = firstContract;
  return drawSlab({
    year: String(new Date(claimedAt * 1000).getUTCFullYear()),
    short: (addr.slice(0, 6) + '…' + addr.slice(-4)).toUpperCase().replace('0X', '0x'),
    id,
    cert: id.padStart(8, '0'),
    bars: barcode(addr.slice(2), 214, 268, 44, 440),
    addr,
  });
}

/** The drawing, with every per-badge value already formatted. Everything else is fixed. */
export function drawSlab({ year, short, id, cert, bars, addr }) {
  const s = 1.06; // lettering scale on the card header

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1400">
<defs>
  <linearGradient id="holo" gradientUnits="userSpaceOnUse" x1="200" y1="420" x2="800" y2="1000" spreadMethod="reflect">
    <stop offset="0" stop-color="#FF8AD8"/><stop offset=".18" stop-color="#7FE3FF"/><stop offset=".36" stop-color="#A6FFB8"/>
    <stop offset=".54" stop-color="#FFF38A"/><stop offset=".72" stop-color="#FFB38A"/><stop offset=".9" stop-color="#C8A2FF"/><stop offset="1" stop-color="#FF8AD8"/>
    <animateTransform attributeName="gradientTransform" type="translate" values="0 0;320 460;0 0" dur="9s" repeatCount="indefinite"/>
  </linearGradient>
  <linearGradient id="glare" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1000" y2="1400">
    <stop offset=".42" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".6"/><stop offset=".58" stop-color="#fff" stop-opacity="0"/>
    <animateTransform attributeName="gradientTransform" type="translate" values="-1000 -1400;-1000 -1400;1000 1400" keyTimes="0;.45;1" dur="7s" repeatCount="indefinite"/>
  </linearGradient>
  <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#E6ECF4"/><stop offset="1" stop-color="#CBD5E2"/>
  </linearGradient>
  <linearGradient id="side" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#D5DDE8"/><stop offset="1" stop-color="#A9B6C8"/>
  </linearGradient>
  <linearGradient id="silver" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#DCE3EE"/><stop offset=".5" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D3DBE8"/>
  </linearGradient>
  <pattern id="foil" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
    <rect width="2.5" height="7" fill="#fff" opacity=".5"/>
  </pattern>
  <linearGradient id="holoIcon" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="40" y2="40" spreadMethod="reflect">
    <stop offset="0" stop-color="#FF8AD8"/><stop offset=".25" stop-color="#7FE3FF"/><stop offset=".5" stop-color="#A6FFB8"/><stop offset=".75" stop-color="#FFF38A"/><stop offset="1" stop-color="#C8A2FF"/>
    <animateTransform attributeName="gradientTransform" type="translate" values="0 0;24 32;0 0" dur="9s" repeatCount="indefinite"/>
  </linearGradient>
  <linearGradient id="shimmer" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="56" y2="56">
    <stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".4" stop-color="#7FE3FF" stop-opacity=".55"/>
    <stop offset=".5" stop-color="#FFC2F0" stop-opacity=".6"/><stop offset=".6" stop-color="#FFF38A" stop-opacity=".55"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/>
    <animateTransform attributeName="gradientTransform" type="translate" values="-60 -60;-60 -60;60 60" keyTimes="0;.35;1" dur="5s" repeatCount="indefinite"/>
  </linearGradient>
  <pattern id="foilIcon" width="1.3" height="1.3" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
    <rect width=".45" height="1.3" fill="#fff" opacity=".6"/>
  </pattern>
  <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="12" cy="12" r="1.6" fill="#C7D0DC"/></pattern>
  <clipPath id="case"><rect x="120" y="40" width="760" height="1320" rx="56"/></clipPath>
  <clipPath id="art"><rect x="240" y="500" width="520" height="470" rx="10"/></clipPath>
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="22" stdDeviation="24" flood-color="${NAVY}" flood-opacity=".18"/></filter>
</defs>

<rect width="1000" height="1400" fill="#F1F4F8"/>
<rect width="1000" height="1400" fill="url(#dots)"/>

<!-- Case: thick clear acrylic -->
<rect x="136" y="56" width="760" height="1320" rx="56" fill="url(#side)" filter="url(#shadow)"/>
<rect x="120" y="40" width="760" height="1320" rx="56" fill="url(#edge)"/>
<rect x="138" y="58" width="724" height="1284" rx="44" fill="none" stroke="#C9D3E0" stroke-width="1.5"/>
<rect x="140" y="60" width="720" height="1280" rx="42" fill="none" stroke="#fff" stroke-width="2"/>
<rect x="126" y="46" width="748" height="1308" rx="51" fill="none" stroke="#fff" stroke-width="5"/>
<rect x="154" y="74" width="692" height="1252" rx="30" fill="#F7F9FC" stroke="#C9D3E0" stroke-width="2"/>
<rect x="157" y="77" width="686" height="1246" rx="28" fill="none" stroke="#fff" stroke-width="2"/>
<g fill="#D7DFEA"><rect x="864" y="150" width="10" height="70" rx="5"/><rect x="126" y="150" width="10" height="70" rx="5"/></g>

<!-- Label -->
<rect x="176" y="96" width="648" height="252" rx="10" fill="#E8EDF4"/>
<rect x="186" y="106" width="628" height="232" rx="6" fill="#fff" stroke="${BLUE}" stroke-width="12"/>
<g ${SANS} fill="${NAVY}" font-size="27" font-weight="500" letter-spacing=".5">
  <text x="214" y="160">${year} WHITECHAIN TÜRKİYE</text>
  <text x="214" y="198">WELCOME BADGE</text>
  <text x="214" y="236">FIRST CONTRACT ${short}</text>
  <text x="786" y="160" text-anchor="end">#${id}</text>
  <text x="786" y="198" text-anchor="end">GEM MT</text>
  <text x="786" y="236" text-anchor="end">10</text>
  <text x="786" y="306" text-anchor="end" ${MONO} font-size="24" letter-spacing="1">${cert}</text>
</g>
<g fill="${NAVY}">${bars}</g>
<g transform="translate(466 262)">
  <rect width="68" height="52" rx="6" fill="url(#silver)"/>
  <rect width="68" height="52" rx="6" fill="url(#holo)" opacity=".75"/>
  <rect width="68" height="52" rx="6" fill="url(#foil)"/>
  <g transform="translate(18 10) scale(.57)" opacity=".9">${ICON}</g>
</g>

<!-- Seal between label and card -->
<path d="M168 368H832" stroke="#C9D3E0" stroke-width="3"/><path d="M168 372H832" stroke="#fff" stroke-width="2"/>

<!-- Card well and card -->
<rect x="186" y="392" width="628" height="912" rx="18" fill="#E8EDF4" stroke="#D3DBE6" stroke-width="2"/>
<rect x="206" y="412" width="588" height="872" rx="24" fill="url(#silver)"/>
<rect x="206" y="412" width="588" height="872" rx="24" fill="url(#holo)" opacity=".42"/>
<rect x="206" y="412" width="588" height="872" rx="24" fill="url(#foil)" opacity=".6"/>
<rect x="224" y="430" width="552" height="836" rx="14" fill="#fff" fill-opacity=".55" stroke="#fff" stroke-width="2"/>

<!-- Card header: lettering + TÜRKİYE, the community lockup -->
<g transform="translate(${(244 - 73.25 * s).toFixed(2)} ${(446 - 12 * s).toFixed(2)}) scale(${s})"><path fill="${NAVY}" fill-rule="evenodd" d="${WORDMARK}"/></g>
<text x="756" y="479" text-anchor="end" ${SANS} font-size="31" font-weight="800" fill="${BLUE}" letter-spacing="2">TÜRKİYE</text>

<!-- Art window: holographic sunburst with the logo -->
<g clip-path="url(#art)">
  <rect x="240" y="500" width="520" height="470" fill="#EAF0FF"/>
  <path d="${rays(500, 735, 520, 36)}" fill="url(#holo)" opacity=".9"/>
  <rect x="240" y="500" width="520" height="470" fill="url(#foil)" opacity=".7"/>
  <circle cx="500" cy="735" r="190" fill="#fff" opacity=".35"/>
  <g transform="translate(350 585) scale(5.357)">
    ${ICON}
    <path d="${WHITE_PANEL}" fill="url(#holoIcon)" opacity=".4"/>
    <path d="${WHITE_PANEL}" fill="url(#foilIcon)"/>
    <path fill="${NAVY}" d="M22.7 19.95A9.4 9.4 0 0 0 36 33.25Z"/>
    <path d="${ICON_SIL}" fill="url(#shimmer)"/>
  </g>
  ${star(300, 560, 1.6, 0)}${star(705, 585, 2.2, .8)}${star(690, 905, 1.4, 1.6)}${star(285, 880, 2, 1.1)}${star(560, 545, 1, 2)}
</g>
<rect x="240" y="500" width="520" height="470" rx="10" fill="none" stroke="#fff" stroke-width="4"/>

<!-- Name strip and text box -->
<rect x="300" y="990" width="400" height="52" rx="26" fill="${NAVY}"/>
<text x="500" y="1024" text-anchor="middle" ${SANS} font-size="24" font-weight="700" fill="#fff" letter-spacing="4">WELCOME BADGE</text>
<g ${SANS} fill="${NAVY}" font-size="21">
  <text x="500" y="1090" text-anchor="middle">Awarded for deploying a first smart contract</text>
  <text x="500" y="1120" text-anchor="middle">on Whitechain. Non-transferable.</text>
</g>
<path d="M260 1150H740" stroke="#C9D3E0" stroke-width="2"/>
<text x="500" y="1186" text-anchor="middle" ${SANS} font-size="16" letter-spacing="4" fill="${INK2}">FIRST CONTRACT</text>
<text x="500" y="1218" text-anchor="middle" ${MONO} font-size="18" fill="${NAVY}">${addr}</text>
<text x="252" y="1250" ${SANS} font-size="17" font-weight="700" fill="${INK2}">No. ${id}</text>
<text x="748" y="1250" text-anchor="end" ${SANS} font-size="17" font-weight="700" fill="${INK2}">SEPOLIA · CHAIN 1874</text>

<!-- Light sweeping across the acrylic -->
<rect x="120" y="40" width="760" height="1320" fill="url(#glare)" clip-path="url(#case)"/>
</svg>`.replace(/<!--[^>]*-->/g, '').replace(/\n\s*/g, '');
}

// The "whitechain" lettering, traced from the official logo (brand/whitechain-logo.svg).
const WORDMARK = "M109.94 12 111 11.85 115.50 11.85 115.93 12 115.93 20.70 122.50 21.16 125.50 21.69 127.72 22.75 128.50 23.35 129.77 24.75 130.81 26.75 131.33 28.75 131.59 30.75 131.59 43.75 131.50 44.03 125.65 44.03 125.65 27.25 125.50 26.46 119.75 26.46 117.75 26 116 25.48 115.86 25.75 115.86 43.75 115.75 44.02 115.50 44.03 109.91 44.03 109.91 25.75 110.25 25.54 115.66 25.54 114 24.58 112.75 23.61 111.75 22.49 110.68 20.50 110.15 18.50 109.94 16.50ZM138.91 12 140.25 12 141.50 12.49 142.19 13.25 142.57 14 142.71 15.25 142.50 16.50 141.72 17.50 140.75 18.07 139.50 18.29 138.25 18.03 137.40 17.50 136.64 16.50 136.39 15.25 136.65 13.75 137 13.12 137.75 12.40ZM213.68 12 219.61 12 219.61 20.50 219.75 20.86 227.50 21.38 229.50 21.88 231.69 23 233.58 25 234.46 26.75 234.83 28 235.26 30.75 235.26 44.10 229.50 44.10 229.34 44 229.34 26.75 223 26.32 219.75 25.61 219.59 26 219.59 44 218.50 44.14 213.75 44.14 213.63 44 213.63 25.62 219.46 25.62 217.75 24.67 216.50 23.72 215.40 22.50 214.70 21.25 213.97 19 213.68 17ZM267.73 11.98 269 11.98 270.25 12.40 271.13 13.25 271.60 14.25 271.60 15.75 271.25 16.75 270.66 17.50 269.50 18.13 268.25 18.26 267 17.95 266.07 17.25 265.39 16 265.39 14.50 265.67 13.50 266.50 12.55ZM147.71 15.75 153.66 15.75 153.66 21.11 161 21.11 161.39 21.25 161.39 26.25 161.25 26.39 156.75 26.39 153.75 25.84 153.64 26.50 153.64 38.79 161.25 38.79 161.40 39 161.39 40.25 161.39 44 161.25 44.10 157 44.10 155.25 43.83 153.25 43.28 151.75 42.57 150.50 41.58 149.51 40.50 148.67 39 147.90 36.50 147.69 34.50 147.69 25.71 152.50 25.71 152.98 25.50 151 24.39 150 23.50 149.23 22.50 148.41 20.75 147.93 19 147.71 17.25ZM73.31 21.25 73.50 21.12 78.75 21.12 79.23 21.25 79.23 38.50 79.50 38.65 86.75 38.65 86.98 38.50 86.44 36.50 86.21 34.50 86.21 21.25 86.50 21.14 92 21.14 92.18 21.50 92.18 38.50 92.50 38.65 98 38.65 99.41 38.50 99.41 21.25 99.75 21.14 105.25 21.14 105.38 21.75 105.38 44 105 44.12 95.75 44.12 92.50 43.52 90.75 42.82 89.51 42 88.07 40.50 87.25 39.10 87.04 39.25 87.04 43.75 87 44 86.75 44.11 83 44.11 80.75 43.81 78.50 43.12 76.89 42.25 75.74 41.25 74.67 39.75 73.90 38 73.44 36 73.31 33.50ZM136.62 21.25 136.75 21.12 142 21.12 142.56 21.25 142.56 43.75 142.50 44.06 142.25 44.13 136.75 44.13 136.62 44ZM165.38 21.25 165.75 21.13 176 21.13 179.50 21.40 181.50 21.94 183 22.67 184.87 24.25 186.13 26.25 186.80 28.25 187.13 30.75 187.13 34.75 186.75 34.89 175.75 34.89 172.75 34.56 171.50 34.20 171.29 34.50 171.29 38.50 171.75 38.64 186.25 38.64 186.42 39.25 186.42 43.25 186.25 44.12 175.75 44.12 173 43.86 171.75 43.60 169.75 42.83 167.66 41.25 166.69 40 165.94 38.50 165.40 36.50 165.40 34.20 170.50 34.20 170.88 34 168.75 32.85 167.75 31.92 166.68 30.50 166.13 29.25 165.67 27.75 165.38 26ZM199.71 21.23 209.03 21.23 209.03 26 208.50 26.22 196.92 26.22 196.92 39.08 209 39.08 209 44.07 200.75 44.07 197.25 43.54 195.50 42.85 193.75 41.63 192.74 40.50 191.68 38.50 191.14 36.50 190.89 34.50 190.89 32.50 191.14 28.75 191.68 26.75 192.76 24.75 194.55 23 196.75 21.91ZM243.03 21.25 243.50 21.13 251.75 21.19 254 21.19 256 21.68 257.50 22.30 258.54 23 259.58 24 260.32 25.25 260.81 26.75 260.81 29 260.37 30.50 259.59 31.75 258.75 32.57 257.50 33.40 255.30 34.29 260.50 34.29 260.89 34.50 260.89 43.75 260.75 44.08 247 44.08 245.75 43.83 243.75 43.15 242.23 42.25 241.04 41 240.41 40 239.90 38.50 239.90 35.75 240.42 34.25 241.25 33 242.01 32.25 243.75 31.18 246.25 30.41 247.75 30.04 254.50 30.04 254.67 29.50 254.67 26.75 254.50 26.43 243.25 26.43 243.03 26ZM265.53 21.25 265.75 21.13 270.75 21.13 271.49 21.25 271.49 44 271.25 44.13 265.75 44.13 265.53 43.79ZM276.85 21.25 277.50 21.15 290.25 21.15 292 21.45 293.50 21.93 294.75 22.65 295.99 23.75 296.78 24.75 297.56 26.25 298.28 28.75 298.51 32.75 298.51 44 298.25 44.14 293.25 44.14 292.55 44 292.55 26.64 292 26.45 283.25 26.45 282.76 26.75 282.76 44 282 44.13 277 44.13 276.85 44ZM171.33 26.20 181 26.20 181.16 26.50 181.16 29.75 180.75 29.89 171.50 29.89 171.33 29.50ZM253.55 34.50 254.75 34.32 254.97 34.50 254.97 38.81 246.50 38.81 246.04 38.75 246.04 35Z";
