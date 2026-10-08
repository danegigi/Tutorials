#!/usr/bin/env bun
/*
 * gen-icons.js — writes valid raster PNG app icons into assets/ with no deps.
 *
 * PWA installability wants real PNG icons at 192 and 512, plus a maskable 512.
 * We can't run a full raster/SVG renderer without a dependency, so we draw a
 * simple-but-genuine icon pixel-by-pixel: a brand-colored rounded square with
 * a lighter "book" bar motif, encoded as a real PNG via node:zlib (deflate).
 *
 * Run once (and re-run only if you want to change the icon):
 *   bun run scripts/gen-icons.js
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(__dirname, "..", "assets");

const BG = [13, 17, 23];       // #0d1117
const ACCENT = [56, 189, 248]; // #38bdf8
const ACCENT2 = [129, 140, 248]; // #818cf8
const PAPER = [230, 237, 243]; // #e6edf3

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "latin1");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

// Build an RGBA PNG from a draw(x,y)->[r,g,b,a] function.
function png(size, draw) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  // 10,11,12 = 0 (deflate / adaptive / no interlace)
  const raw = Buffer.alloc((size * 4 + 1) * size);
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const px = draw(x, y, size);
      raw[o++] = px[0]; raw[o++] = px[1]; raw[o++] = px[2]; raw[o++] = px[3];
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// Rounded-corner test.
function inRoundedRect(x, y, size, radius) {
  const r = radius;
  if (x >= r && x < size - r) return true;
  if (y >= r && y < size - r) return true;
  const cx = x < r ? r : size - r - 1;
  const cy = y < r ? r : size - r - 1;
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function makeIcon(size, maskable) {
  // Maskable icons need a safe zone: fill the whole canvas (no rounding) and
  // keep the motif within the central 80%.
  const radius = maskable ? 0 : Math.round(size * 0.19);
  const pad = maskable ? Math.round(size * 0.18) : Math.round(size * 0.14);
  const barH = Math.round(size * 0.07);
  const gap = Math.round(size * 0.055);
  const bars = [
    { color: ACCENT, w: 0.72 },
    { color: PAPER, w: 0.56 },
    { color: ACCENT2, w: 0.64 },
    { color: PAPER, w: 0.46 },
  ];
  const blockTop = Math.round(size * 0.34);

  return png(size, (x, y) => {
    if (!inRoundedRect(x, y, size, radius)) return [0, 0, 0, 0];
    // background
    let px = [BG[0], BG[1], BG[2], 255];
    // horizontal "book/text" bars
    for (let i = 0; i < bars.length; i++) {
      const top = blockTop + i * (barH + gap);
      const left = pad;
      const right = pad + Math.round((size - 2 * pad) * bars[i].w);
      if (y >= top && y < top + barH && x >= left && x < right) {
        px = [bars[i].color[0], bars[i].color[1], bars[i].color[2], 255];
      }
    }
    // top accent bar (the "spine")
    const spineTop = Math.round(size * 0.2);
    if (y >= spineTop && y < spineTop + barH && x >= pad && x < size - pad) {
      px = [ACCENT[0], ACCENT[1], ACCENT[2], 255];
    }
    return px;
  });
}

fs.mkdirSync(ASSETS, { recursive: true });
fs.writeFileSync(path.join(ASSETS, "icon-192.png"), makeIcon(192, false));
fs.writeFileSync(path.join(ASSETS, "icon-512.png"), makeIcon(512, false));
fs.writeFileSync(path.join(ASSETS, "icon-maskable-512.png"), makeIcon(512, true));
console.log("Wrote icon-192.png, icon-512.png, icon-maskable-512.png to assets/");
