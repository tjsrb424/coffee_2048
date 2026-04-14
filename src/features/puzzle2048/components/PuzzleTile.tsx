"use client";

import { motion } from "framer-motion";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";
import { cn } from "@/lib/utils";
import type { PlacedTile } from "../utils/boardToTiles";
import { tileClassForValue, tileFontSize } from "../utils/tileStyle";
import { usePuzzleBoardMetrics } from "./PuzzleBoardMetricsContext";

export function PuzzleTile({ tile }: { tile: PlacedTile }) {
  const reduce = useReducedMotionPreference();
  const { side } = usePuzzleBoardMetrics();
  const compact = side > 0 && side < 304;

  return (
    <motion.div
      layout
      layoutId={tile.id}
      initial={reduce ? false : { scale: 0.78, opacity: 0.35, y: 6 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={reduce ? undefined : { scale: 0.9, opacity: 0 }}
      transition={{ type: "spring", stiffness: 520, damping: 30, mass: 0.35 }}
      style={{
        gridRowStart: tile.r + 1,
        gridColumnStart: tile.c + 1,
      }}
      className={cn(
        "flex h-full min-h-0 w-full min-w-0 select-none items-center justify-center rounded-xl font-bold tabular-nums sm:rounded-2xl",
        tileClassForValue(tile.value),
        tileFontSize(tile.value, compact),
      )}
    >
      {tile.value}
    </motion.div>
  );
}
