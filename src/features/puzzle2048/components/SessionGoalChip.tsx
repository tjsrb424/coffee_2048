"use client";

import { motion } from "framer-motion";
import {
  SESSION_TARGET_HIGHEST_TILE,
  isSessionGoalMet,
} from "@/features/meta/balance/sessionGoals";
import { getHighestTileValue } from "@/features/puzzle2048/engine";
import { usePuzzleSessionStore } from "@/features/puzzle2048/store/usePuzzleSessionStore";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function SessionGoalChip({ className }: Props) {
  const board = usePuzzleSessionStore((s) => s.board);
  const highest = getHighestTileValue(board);
  const met = isSessionGoalMet(highest);

  return (
    <motion.div
      layout
      className={cn(
        "flex shrink-0 items-center justify-between gap-1.5 rounded-xl px-2 py-1.5 text-[11px] ring-1 sm:gap-2 sm:rounded-2xl sm:px-3 sm:py-2.5 sm:text-sm",
        className,
        met
          ? "bg-accent-mint/25 text-coffee-900 ring-accent-mint/50"
          : "bg-cream-200/80 text-coffee-800 ring-coffee-600/10",
      )}
    >
      <span className="font-semibold">이번 목표</span>
      <span className="tabular-nums text-coffee-700">
        최고 타일{" "}
        <span className="font-bold text-coffee-900">{SESSION_TARGET_HIGHEST_TILE}</span>
      </span>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-bold",
          met ? "bg-coffee-700 text-cream-50" : "bg-cream-300 text-coffee-700",
        )}
      >
        {met ? "달성" : `현재 ${highest || "—"}`}
      </span>
    </motion.div>
  );
}
