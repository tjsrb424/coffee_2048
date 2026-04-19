"use client";

import { motion } from "framer-motion";
import { BeanIcon } from "@/components/ui/BeanIcon";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { HeartIcon } from "@/components/ui/HeartIcon";
import { computePuzzleRewards } from "@/features/meta/rewards/computePuzzleRewards";
import { getHighestTileValue } from "@/features/puzzle2048/engine";
import { usePuzzleSessionStore } from "@/features/puzzle2048/store/usePuzzleSessionStore";

export function RewardPreview() {
  const board = usePuzzleSessionStore((s) => s.board);
  const score = usePuzzleSessionStore((s) => s.score);
  const highest = getHighestTileValue(board);
  const preview = computePuzzleRewards(score, highest);
  const showHeart = preview.hearts > 0;

  return (
    <div className="shrink-0 rounded-xl bg-cream-200/70 px-2.5 py-2 text-xs text-coffee-800 ring-1 ring-coffee-600/10 sm:min-h-[6.75rem] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
      <div className="text-center text-[10px] font-semibold uppercase tracking-wide text-coffee-600/70 sm:text-xs">
        예상 보상
      </div>
      <div
        className={`mt-1 grid gap-2 font-semibold tabular-nums ${
          showHeart ? "grid-cols-3" : "grid-cols-2"
        } sm:mt-2 sm:gap-3`}
      >
        <div className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-cream-50/75 px-2 py-2 text-sm font-bold ring-1 ring-coffee-600/10 sm:min-h-14 sm:rounded-2xl sm:text-lg">
          <CoinIcon size={22} className="shrink-0 opacity-95 sm:h-7 sm:w-7" />
          <span className="sr-only">코인</span>+{preview.coins}
        </div>
        <div className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-cream-50/75 px-2 py-2 text-sm font-bold ring-1 ring-coffee-600/10 sm:min-h-14 sm:rounded-2xl sm:text-lg">
          <BeanIcon size={22} className="shrink-0 opacity-95 sm:h-7 sm:w-7" />
          <span className="sr-only">원두</span>+{preview.beans}
        </div>
        {showHeart ? (
          <div className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-cream-50/75 px-2 py-2 text-sm font-bold ring-1 ring-coffee-600/10 sm:min-h-14 sm:rounded-2xl sm:text-lg">
            <HeartIcon size={22} className="shrink-0 opacity-95 sm:h-7 sm:w-7" />
            <span className="sr-only">하트</span>+{preview.hearts}
          </div>
        ) : null}
      </div>
      <div className="mt-1 hidden min-h-[2.5rem] sm:mt-2 sm:block">
        <motion.p
          key={score > 0 ? "on" : "off"}
          initial={false}
          animate={{
            opacity: score > 0 ? 1 : 0.35,
            y: score > 0 ? 0 : 2,
          }}
          transition={{ duration: 0.22 }}
          className="text-xs text-coffee-600/80"
        >
          지금까지의 합류가 곧 매장의 온기로 이어져요.
        </motion.p>
      </div>
    </div>
  );
}
