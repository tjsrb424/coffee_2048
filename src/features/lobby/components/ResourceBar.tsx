"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AnimatedNumber } from "@/components/common/AnimatedNumber";
import { BeanIcon } from "@/components/ui/BeanIcon";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { HeartIcon } from "@/components/ui/HeartIcon";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/useAppStore";
import { useLobbyFxStore } from "@/stores/useLobbyFxStore";

function formatMMSS(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function ResourceBar({
  variant = "default",
  className,
}: {
  variant?: "default" | "compact";
  className?: string;
}) {
  const coins = useAppStore((s) => s.playerResources.coins);
  const beans = useAppStore((s) => s.playerResources.beans);
  const hearts = useAppStore((s) => s.playerResources.hearts);
  const lastHeartAt = useAppStore((s) => s.meta.lastHeartRegenAtMs);

  const reduceMotion = !!useReducedMotion();
  const rewardPulse = useLobbyFxStore((s) => s.puzzleRewardPulse);
  const clearRewards = useLobbyFxStore((s) => s.clearPuzzleRewards);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    if (!rewardPulse) return;
    // 1회성 HUD 펄스: 잠깐 보여주고 자동 해제
    const id = window.setTimeout(() => clearRewards(), reduceMotion ? 450 : 1100);
    return () => window.clearTimeout(id);
  }, [clearRewards, reduceMotion, rewardPulse]);

  const heartHint = useMemo(() => {
    const MAX_HEARTS = 5;
    const INTERVAL_MS = 10 * 60 * 1000;
    if (hearts >= MAX_HEARTS) return "만땅";
    if (lastHeartAt === 0) return "곧 +1";
    const nextAt = lastHeartAt + INTERVAL_MS;
    const remainSec = (nextAt - now) / 1000;
    return `다음 +1 ${formatMMSS(remainSec)}`;
  }, [hearts, lastHeartAt, now]);

  if (variant === "compact") {
    return (
      <motion.div
        layout={!reduceMotion}
        className={cn(
          "mb-3 flex items-stretch gap-1.5 rounded-2xl bg-cream-50/88 px-2 py-1.5 shadow-card",
          className,
        )}
      >
        <CompactStat
          label="코인"
          icon={
            <>
              <CoinIcon size={22} className="opacity-95" />
              <span className="sr-only">코인</span>
            </>
          }
          value={coins}
          delta={rewardPulse?.coins ?? 0}
          deltaKey={rewardPulse?.key}
          reduceMotion={reduceMotion}
        />
        <CompactStat
          label="원두"
          icon={
            <>
              <BeanIcon size={20} className="opacity-95" />
              <span className="sr-only">원두</span>
            </>
          }
          value={beans}
          delta={rewardPulse?.beans ?? 0}
          deltaKey={rewardPulse?.key}
          reduceMotion={reduceMotion}
        />
        <CompactStat
          label="하트"
          icon={
            <>
              <HeartIcon size={20} className="opacity-95" />
              <span className="sr-only">하트</span>
            </>
          }
          value={hearts}
          delta={rewardPulse?.hearts ?? 0}
          deltaKey={rewardPulse?.key}
          reduceMotion={reduceMotion}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      layout={!reduceMotion}
      className={cn(
        "mb-5 grid grid-cols-3 gap-2 rounded-3xl bg-cream-50/90 p-3 shadow-card ring-1 ring-coffee-600/10",
        className,
      )}
    >
      <div className="relative rounded-2xl bg-cream-200/70 px-3 py-3 text-center ring-1 ring-coffee-600/5">
        <div className="flex items-center justify-center text-coffee-600/70">
          <CoinIcon size={20} className="opacity-95" />
          <span className="sr-only">코인</span>
        </div>
        <div className="mt-1 text-lg font-bold tabular-nums text-coffee-900">
          <AnimatedNumber value={coins} />
        </div>
        <RewardDelta
          show={!!rewardPulse && (rewardPulse?.coins ?? 0) > 0}
          text={`+${rewardPulse?.coins ?? 0}`}
          accent="soft"
          reduceMotion={reduceMotion}
          deltaKey={rewardPulse?.key}
        />
      </div>
      <div className="relative rounded-2xl bg-cream-200/70 px-3 py-3 text-center ring-1 ring-coffee-600/5">
        <div className="flex items-center justify-center text-coffee-600/70">
          <BeanIcon size={20} className="opacity-95" />
          <span className="sr-only">원두</span>
        </div>
        <div className="mt-1 text-lg font-bold tabular-nums text-coffee-900">
          <AnimatedNumber value={beans} />
        </div>
        <RewardDelta
          show={!!rewardPulse && (rewardPulse?.beans ?? 0) > 0}
          text={`+${rewardPulse?.beans ?? 0}`}
          accent="mint"
          reduceMotion={reduceMotion}
          deltaKey={rewardPulse?.key}
        />
      </div>
      <div className="relative rounded-2xl bg-cream-200/70 px-3 py-3 text-center ring-1 ring-coffee-600/5">
        <div className="flex items-center justify-center text-coffee-600/70">
          <HeartIcon size={20} className="opacity-95" />
          <span className="sr-only">하트</span>
        </div>
        <div className="mt-1 text-lg font-bold tabular-nums text-coffee-900">
          <AnimatedNumber value={hearts} />
        </div>
        <RewardDelta
          show={!!rewardPulse && (rewardPulse?.hearts ?? 0) > 0}
          text={`+${rewardPulse?.hearts ?? 0}`}
          accent="soft"
          reduceMotion={reduceMotion}
          deltaKey={rewardPulse?.key}
        />
        <div className="mt-1 text-[10px] font-semibold text-coffee-600/70">
          {heartHint}
        </div>
      </div>
    </motion.div>
  );
}

function CompactStat({
  label,
  icon,
  value,
  delta,
  deltaKey,
  reduceMotion,
}: {
  label: string;
  icon?: React.ReactNode;
  value: number;
  delta: number;
  deltaKey?: number;
  reduceMotion: boolean;
}) {
  return (
    <div className="relative flex min-w-0 flex-1 items-center justify-center gap-2.5 rounded-xl bg-cream-200/60 px-2 py-2 ring-1 ring-coffee-600/5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center text-[10px] font-semibold text-coffee-600/70">
        {icon ?? label}
      </div>
      <div className="min-w-0 text-center text-[15px] font-bold tabular-nums leading-none text-coffee-900">
        x<AnimatedNumber value={value} />
      </div>
      <RewardDelta
        show={delta > 0}
        text={`+${delta}`}
        accent={label === "원두" ? "mint" : "soft"}
        reduceMotion={reduceMotion}
        deltaKey={deltaKey}
      />
    </div>
  );
}

function RewardDelta({
  show,
  text,
  accent,
  reduceMotion,
  deltaKey,
}: {
  show: boolean;
  text: string;
  accent: "soft" | "mint";
  reduceMotion: boolean;
  deltaKey?: number;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={deltaKey}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.96 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: -10, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -18, scale: 0.98 }}
          transition={reduceMotion ? { duration: 0.18 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={`pointer-events-none absolute left-1/2 top-1 -translate-x-1/2 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums shadow-sm ring-1 ${
            accent === "mint"
              ? "bg-accent-mint/25 text-coffee-900 ring-accent-mint/45"
              : "bg-accent-soft/20 text-coffee-900 ring-accent-soft/40"
          }`}
        >
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
