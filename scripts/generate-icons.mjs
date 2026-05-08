// Generates PWA icon PNGs from scripts/icon-source.svg
// Run: npm run icons

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";

const ROOT = resolve(process.cwd());
const SRC = resolve(ROOT, "scripts/icon-source.svg");
const OUT = resolve(ROOT, "public/icons");
mkdirSync(OUT, { recursive: true });

const svg = readFileSync(SRC);

const targets = [
  // Standard "any" icons — same art, full bleed
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  // Maskable icons — art shrunk to inner 80% (safe zone), full background bleed
  { file: "icon-maskable-192.png", size: 192, maskable: true },
  { file: "icon-maskable-512.png", size: 512, maskable: true },
];

for (const t of targets) {
  let pipeline;
  if (t.maskable) {
    // Render the art at 80% of target, on top of solid background of full size
    const inner = Math.round(t.size * 0.8);
    const innerBuf = await sharp(svg).resize(inner, inner).png().toBuffer();
    pipeline = sharp({
      create: {
        width: t.size,
        height: t.size,
        channels: 4,
        background: { r: 0x1e, g: 0x3a, b: 0x5f, alpha: 1 },
      },
    }).composite([{ input: innerBuf, gravity: "center" }]);
  } else {
    pipeline = sharp(svg).resize(t.size, t.size);
  }
  const buf = await pipeline.png().toBuffer();
  const out = resolve(OUT, t.file);
  writeFileSync(out, buf);
  console.log(`✓ ${t.file} (${buf.length} bytes)`);
}
