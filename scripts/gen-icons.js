#!/usr/bin/env bun
/*
 * gen-icons.js — renders the Dev Tutorials logo into app icons, no deps.
 *
 * The logo is a rounded-square "terminal" mark on a dark background: a gradient
 * header bar with three window dots, and a code prompt — a cyan "›" chevron
 * followed by an indigo underscore cursor. It's drawn with 4x supersampling for
 * clean anti-aliased edges and encoded as real PNGs via node:zlib.
 *
 * The same design is written as icon.svg by build-site.js (vector, crisp at any
 * size). Re-run this only when the logo design changes:
 *   bun run scripts/gen-icons.js
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(__dirname, "..", "assets");

// palette
const BG      = [13, 17, 23];    // #0d1117 window body
const PANEL   = [22, 27, 34];    // #161b22 header bar
const CYAN    = [56, 189, 248];  // #38bdf8 accent
const INDIGO  = [129, 140, 248]; // #818cf8 accent-2
const RED      = [239, 68, 68];
const AMBER    = [251, 191, 36];
const GREEN    = [52, 211, 153];
const EDGEDARK = [8, 11, 16];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) { c ^= buf[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePng(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0;
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      raw[o++] = rgba[i]; raw[o++] = rgba[i + 1]; raw[o++] = rgba[i + 2]; raw[o++] = rgba[i + 3];
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

const lerp = (a, b, t) => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

// Draw the logo into a float RGBA buffer at `S` resolution, then downsample.
// `maskable` fills the whole canvas (no rounding) and shrinks the mark into the
// central safe zone.
function draw(S, maskable) {
  const buf = new Uint8ClampedArray(S * S * 4);
  const radius = maskable ? 0 : S * 0.22;
  // mark bounding box
  const inset = maskable ? S * 0.26 : S * 0.14;
  const x0 = inset, y0 = inset, x1 = S - inset, y1 = S - inset;
  const w = x1 - x0, h = y1 - y0;
  const winR = w * 0.14;                 // terminal window corner radius
  const headerH = h * 0.26;              // header bar height

  function roundedInside(x, y, bx0, by0, bx1, by1, r) {
    if (x < bx0 || x > bx1 || y < by0 || y > by1) return false;
    const cx = x < bx0 + r ? bx0 + r : (x > bx1 - r ? bx1 - r : x);
    const cy = y < by0 + r ? by0 + r : (y > by1 - r ? by1 - r : y);
    const dx = x - cx, dy = y - cy;
    return dx * dx + dy * dy <= r * r;
  }

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      let col = null, a = 0;

      // outer canvas (rounded square), dark gradient background
      const inCanvas = maskable ? true : roundedInside(x, y, 0, 0, S - 1, S - 1, radius);
      if (inCanvas) {
        col = lerp(EDGEDARK, BG, y / S); a = 255;
      }

      // terminal window
      if (roundedInside(x, y, x0, y0, x1, y1, winR)) {
        if (y < y0 + headerH) {
          // header bar: subtle cyan→indigo gradient
          col = lerp(PANEL, lerp(CYAN, INDIGO, (x - x0) / w), 0.22); a = 255;
          // three window dots
          const dotY = y0 + headerH / 2, dr = headerH * 0.16;
          const dots = [[x0 + w * 0.10, RED], [x0 + w * 0.185, AMBER], [x0 + w * 0.27, GREEN]];
          for (const [dx, dc] of dots) {
            if ((x - dx) ** 2 + (y - dotY) ** 2 <= dr * dr) { col = dc; }
          }
        } else {
          col = BG; a = 255;
        }
      }

      // code prompt in the body: a chevron "›" and an underscore cursor
      const bodyTop = y0 + headerH;
      const stroke = h * 0.055;
      // chevron: two diagonal strokes meeting at a point
      const cvx = x0 + w * 0.26, cvy = (bodyTop + y1) / 2, cvs = h * 0.17;
      // top arm
      const onArm = (px, py, ax, ay, bx, by) => {
        const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
        let t = ((px - ax) * dx + (py - ay) * dy) / L2; t = Math.max(0, Math.min(1, t));
        const ex = ax + t * dx, ey = ay + t * dy;
        return (px - ex) ** 2 + (py - ey) ** 2 <= (stroke / 2) ** 2;
      };
      if (col && (onArm(x, y, cvx - cvs, cvy - cvs, cvx + cvs * 0.4, cvy) ||
                  onArm(x, y, cvx + cvs * 0.4, cvy, cvx - cvs, cvy + cvs))) {
        col = CYAN;
      }
      // underscore cursor to the right of the chevron
      const uy0 = cvy + cvs * 0.55, uy1 = uy0 + stroke;
      const ux0 = x0 + w * 0.42, ux1 = x0 + w * 0.72;
      if (col && x >= ux0 && x <= ux1 && y >= uy0 && y <= uy1) col = INDIGO;

      if (col) { buf[i] = col[0]; buf[i + 1] = col[1]; buf[i + 2] = col[2]; buf[i + 3] = a; }
      else { buf[i] = buf[i + 1] = buf[i + 2] = buf[i + 3] = 0; }
    }
  }
  return buf;
}

// Supersample: render at size*ss, average down to size for anti-aliasing.
function icon(size, maskable) {
  const ss = 4, S = size * ss;
  const hi = draw(S, maskable);
  const out = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < ss; sy++) for (let sx = 0; sx < ss; sx++) {
        const i = (((y * ss + sy) * S) + (x * ss + sx)) * 4;
        r += hi[i]; g += hi[i + 1]; b += hi[i + 2]; a += hi[i + 3];
      }
      const n = ss * ss, o = (y * size + x) * 4;
      out[o] = r / n; out[o + 1] = g / n; out[o + 2] = b / n; out[o + 3] = a / n;
    }
  }
  return encodePng(size, out);
}

fs.mkdirSync(ASSETS, { recursive: true });
fs.writeFileSync(path.join(ASSETS, "icon-192.png"), icon(192, false));
fs.writeFileSync(path.join(ASSETS, "icon-512.png"), icon(512, false));
fs.writeFileSync(path.join(ASSETS, "icon-maskable-512.png"), icon(512, true));
console.log("Wrote branded icon-192.png, icon-512.png, icon-maskable-512.png to assets/");
