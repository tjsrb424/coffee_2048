"use client";

import { AnimatePresence, motion } from "framer-motion";
import { getHighestTileValue } from "@/features/puzzle2048/engine";
import { usePuzzleSessionStore } from "@/features/puzzle2048/store/usePuzzleSessionStore";

type Props = {
  bestScoreMeta: number;
};

export function PuzzleHud({ bestScoreMeta }: Props) {
  const score = usePuzzleSessionStore((s) => s.score);
  const board = usePuzzleSessionStore((s) => s.board);
  const lastDelta = usePuzzleSessionStore((s) => s.lastScoreDelta);
  const highest = getHighestTileValue(board);
  const bestShown = Math.max(bestScoreMeta, score);

  return (
    <div className="mb-1 flex shrink-0 items-start justify-between gap-1.5 sm:mb-3 sm:gap-3">
      <div className="flex min-w-0 flex-1 gap-1.5 sm:gap-3">
        <div className="min-h-0 min-w-0 flex-1 rounded-xl bg-cream-200/80 px-2 py-1.5 ring-1 ring-coffee-600/10 sm:min-h-[5.25rem] sm:rounded-2xl sm:px-4 sm:py-3">
          <div className="text-[10px] font-semibold text-coffee-600/70 sm:text-xs">점수</div>
          <div className="relative mt-0.5 min-h-[1.5rem] text-lg font-bold tabular-nums text-coffee-900 sm:mt-1 sm:min-h-[2.5rem] sm:text-2xl">
            {score}
            <AnimatePresence>
              {lastDelta > 0 && (
                <motion.span
                  key={`${score}-${lastDelta}`}
                  initial={{ opacity: 0, y: 8, scale: 0.9 }}
                  animate={{ opacity: 1, y: -6, scale: 1 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="pointer-events-none absolute right-0 top-0 text-xs font-semibold text-accent-soft sm:text-sm"
                >
                  +{lastDelta}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="min-h-0 min-w-0 flex-1 rounded-xl bg-cream-200/80 px-2 py-1.5 ring-1 ring-coffee-600/10 sm:min-h-[5.25rem] sm:rounded-2xl sm:px-4 sm:py-3">
          <div className="text-[10px] font-semibold text-coffee-600/70 sm:text-xs">최고</div>
          <div className="mt-0.5 min-h-[1.5rem] text-lg font-bold tabular-nums text-coffee-900 sm:mt-1 sm:min-h-[2.5rem] sm:text-2xl">
            {bestShown}
          </div>
        </div>
      </div>
      <div className="w-[5.3rem] shrink-0 rounded-xl bg-cream-200/80 px-2 py-1.5 text-center ring-1 ring-coffee-600/10 sm:min-h-[5.25rem] sm:w-[7rem] sm:rounded-2xl sm:px-3 sm:py-3">
        <div className="text-[9px] font-semibold leading-tight text-coffee-600/70 sm:text-[11px]">
          최고
          <br className="sm:hidden" />
          타일
        </div>
        <div className="mt-0.5 whitespace-nowrap text-[1.05rem] font-bold tabular-nums leading-none tracking-[-0.04em] text-coffee-900 sm:mt-1 sm:min-h-[2.5rem] sm:text-2xl sm:leading-8">
          {highest}
        </div>
      </div>
    </div>
  );
}
