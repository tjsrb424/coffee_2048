"use client";

import { motion } from "framer-motion";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";
import { cn } from "@/lib/utils";
import {
  PUZZLE_MOVE_ANIMATION_SECONDS,
  PUZZLE_MOVE_EASE,
  PUZZLE_SPAWN_POP_SECONDS,
} from "@/features/puzzle2048/constants/animation";
import { usePuzzleSessionStore } from "@/features/puzzle2048/store/usePuzzleSessionStore";
import { puzzleTileClassForSkin } from "@/features/meta/cosmetics/puzzleSkins";
import { useAppStore } from "@/stores/useAppStore";
import type { PlacedTile } from "../utils/boardToTiles";
import { tileClassForValue, tileFontSize } from "../utils/tileStyle";
import { usePuzzleBoardMetrics } from "./PuzzleBoardMetricsContext";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function PuzzleTile({ tile }: { tile: PlacedTile }) {
  const reduce = useReducedMotionPreference();
  const blockSkinId = useAppStore(
    (s) => s.cosmetics.equippedPuzzleBlockSkinId,
  );
  const { gap, pad, side, tileSize } = usePuzzleBoardMetrics();
  const compact = side > 0 && side < 304;
  const mergeStrength = usePuzzleSessionStore(
    (s) => s.lastMergePulseById[tile.id] ?? 0,
  );
  const shouldPulse = !reduce && mergeStrength > 0;
  const x = pad + tile.c * (tileSize + gap);
  const y = pad + tile.r * (tileSize + gap);

  return (
    <motion.div
      initial={reduce ? false : { x, y, scale: 0.84, opacity: 0.42 }}
      animate={
        shouldPulse
          ? {
              x,
              y,
              opacity: 1,
              // “겹침 → 압축 → 팡 → 안정”을 짧게. 고단계일수록 아주 약하게만 더 묵직하게.
              scale: [
                1,
                lerp(0.945, 0.92, mergeStrength),
                lerp(1.04, 1.07, mergeStrength),
                1,
              ],
            }
          : { x, y, scale: 1, opacity: 1 }
      }
      transition={{
        x: {
          duration: PUZZLE_MOVE_ANIMATION_SECONDS,
          ease: PUZZLE_MOVE_EASE,
        },
        y: {
          duration: PUZZLE_MOVE_ANIMATION_SECONDS,
          ease: PUZZLE_MOVE_EASE,
        },
        // merge 펄스는 layout 이동과 독립적으로 짧게 끊는다.
        scale: shouldPulse
          ? {
              duration: lerp(0.16, 0.2, mergeStrength),
              times: [0, 0.36, 0.74, 1],
              ease: [0.22, 1, 0.36, 1],
            }
          : {
              duration: PUZZLE_SPAWN_POP_SECONDS,
              ease: PUZZLE_MOVE_EASE,
            },
        opacity: {
          duration: Math.min(PUZZLE_SPAWN_POP_SECONDS, 0.1),
          ease: PUZZLE_MOVE_EASE,
        },
      }}
      style={{
        height: tileSize,
        width: tileSize,
      }}
      data-testid="puzzle-tile"
      data-tile-id={tile.id}
      data-row={tile.r}
      data-col={tile.c}
      data-value={tile.value}
      className={cn(
        "absolute left-0 top-0 flex select-none items-center justify-center rounded-xl font-bold tabular-nums will-change-transform sm:rounded-2xl",
        tileClassForValue(tile.value),
        puzzleTileClassForSkin(blockSkinId, tile.value),
        "text-[#674831]",
        tileFontSize(tile.value, compact),
      )}
    >
      {tile.value}
    </motion.div>
  );
}
