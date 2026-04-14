"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/common/AnimatedNumber";
import { useAppStore } from "@/stores/useAppStore";

export function ResourceBar() {
  const coins = useAppStore((s) => s.playerResources.coins);
  const beans = useAppStore((s) => s.playerResources.beans);
  const hearts = useAppStore((s) => s.playerResources.hearts);

  return (
    <motion.div
      layout
      className="mb-5 grid grid-cols-3 gap-2 rounded-3xl bg-cream-50/90 p-3 shadow-card ring-1 ring-coffee-600/10"
    >
      <div className="rounded-2xl bg-cream-200/70 px-3 py-3 text-center ring-1 ring-coffee-600/5">
        <div className="text-[11px] font-semibold text-coffee-600/70">코인</div>
        <div className="mt-1 text-lg font-bold tabular-nums text-coffee-900">
          <AnimatedNumber value={coins} />
        </div>
      </div>
      <div className="rounded-2xl bg-cream-200/70 px-3 py-3 text-center ring-1 ring-coffee-600/5">
        <div className="text-[11px] font-semibold text-coffee-600/70">원두</div>
        <div className="mt-1 text-lg font-bold tabular-nums text-coffee-900">
          <AnimatedNumber value={beans} />
        </div>
      </div>
      <div className="rounded-2xl bg-cream-200/70 px-3 py-3 text-center ring-1 ring-coffee-600/5">
        <div className="text-[11px] font-semibold text-coffee-600/70">하트</div>
        <div className="mt-1 text-lg font-bold tabular-nums text-coffee-900">
          <AnimatedNumber value={hearts} />
        </div>
      </div>
    </motion.div>
  );
}
