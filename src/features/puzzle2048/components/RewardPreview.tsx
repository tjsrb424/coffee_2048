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

  return (
    <div className="shrink-0 rounded-xl bg-cream-200/70 px-2 py-1.5 text-xs text-coffee-800 ring-1 ring-coffee-600/10 sm:min-h-[6.75rem] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-coffee-600/70 sm:text-xs">
        예상 보상
      </div>
      <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 font-semibold tabular-nums sm:mt-1 sm:gap-x-4 sm:gap-y-1">
        <span className="inline-flex items-center gap-1">
          <CoinIcon size={16} className="opacity-95" />
          <span className="sr-only">코인</span>+{preview.coins}
        </span>
        <span className="inline-flex items-center gap-1">
          <BeanIcon size={16} className="opacity-95" />
          <span className="sr-only">원두</span>+{preview.beans}
        </span>
        <span className="inline-flex items-center gap-1">
          <HeartIcon size={16} className="opacity-95" />
          <span className="sr-only">하트</span>+{preview.hearts}
        </span>
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
