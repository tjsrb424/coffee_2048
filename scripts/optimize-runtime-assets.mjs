import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const assets = [
  ["public/images/ui/bean.png", "public/images/optimized/ui/bean.webp", 128],
  ["public/images/ui/coin.png", "public/images/optimized/ui/coin.webp", 128],
  ["public/images/ui/heart.png", "public/images/optimized/ui/heart.webp", 128],
  [
    "public/images/ui/espresso-shot.png",
    "public/images/optimized/ui/espresso-shot.webp",
    128,
  ],
  [
    "public/images/ui/lobby-white-panel-figma.png",
    "public/images/optimized/ui/lobby-white-panel-figma.webp",
    900,
  ],
  [
    "public/images/ui/lobby-roaster-tile.png",
    "public/images/optimized/ui/lobby-roaster-tile.webp",
    620,
  ],
  [
    "public/images/ui/lobby-workbench-tile.png",
    "public/images/optimized/ui/lobby-workbench-tile.webp",
    720,
  ],
  [
    "public/images/ui/lobby-counter-tile.png",
    "public/images/optimized/ui/lobby-counter-tile.webp",
    720,
  ],
  [
    "public/images/ui/roaster-machine-2.png",
    "public/images/optimized/ui/roaster-machine-2.webp",
    900,
  ],
  [
    "public/images/ui/workbench.png",
    "public/images/optimized/ui/workbench.webp",
    900,
  ],
  [
    "public/images/ui/counter-machine.png",
    "public/images/optimized/ui/counter-machine.webp",
    900,
  ],
  [
    "public/images/brand/cafe-2048-title-2.png",
    "public/images/optimized/brand/cafe-2048-title-2.webp",
    900,
  ],
  [
    "public/images/drink/아메리카노.png",
    "public/images/optimized/drink/아메리카노.webp",
    384,
  ],
  [
    "public/images/drink/카페라떼.png",
    "public/images/optimized/drink/카페라떼.webp",
    384,
  ],
  [
    "public/images/drink/아포가토.png",
    "public/images/optimized/drink/아포가토.webp",
    384,
  ],
];

for (const [srcRel, destRel, width] of assets) {
  const src = path.join(root, srcRel);
  const dest = path.join(root, destRel);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await sharp(src)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 84, effort: 5 })
    .toFile(dest);
  const srcStat = await fs.stat(src);
  const destStat = await fs.stat(dest);
  const saved = Math.round((1 - destStat.size / srcStat.size) * 100);
  console.log(
    `${destRel} ${(destStat.size / 1024).toFixed(1)}KB (${saved}% smaller)`,
  );
}
