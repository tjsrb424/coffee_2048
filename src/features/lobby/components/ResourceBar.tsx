"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/common/AnimatedNumber";
import { useAppStore } from "@/stores/useAppStore";

function formatMMSS(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function ResourceBar() {
  const coins = useAppStore((s) => s.playerResources.coins);
  const beans = useAppStore((s) => s.playerResources.beans);
  const hearts = useAppStore((s) => s.playerResources.hearts);
  const lastHeartAt = useAppStore((s) => s.meta.lastHeartRegenAtMs);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const heartHint = useMemo(() => {
    const MAX_HEARTS = 5;
    const INTERVAL_MS = 10 * 60 * 1000;
    if (hearts >= MAX_HEARTS) return "만땅";
    if (lastHeartAt === 0) return "곧 +1";
    const nextAt = lastHeartAt + INTERVAL_MS;
    const remainSec = (nextAt - now) / 1000;
    return `다음 +1 ${formatMMSS(remainSec)}`;
  }, [hearts, lastHeartAt, now]);

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
        <div className="mt-1 text-[10px] font-semibold text-coffee-600/70">
          {heartHint}
        </div>
      </div>
    </motion.div>
  );
}
