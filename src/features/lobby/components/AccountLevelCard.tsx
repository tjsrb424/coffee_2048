"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import {
  levelBandForLevel,
  nextUnlockPreview,
} from "@/features/meta/progression/levelBands";
import { missionDefinitionById } from "@/features/meta/progression/missionDefinitions";
import { normalizeAccountLevelState } from "@/features/meta/progression/missionEngine";
import type { MissionDefinition } from "@/features/meta/types/gameState";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/useAppStore";

const TIER_BACKGROUNDS = [
  "from-[#fff8e8] via-[#f4dfbc] to-[#e7c187]",
  "from-[#fff4dd] via-[#efd1a3] to-[#d7a86a]",
  "from-[#f9f1e3] via-[#dec29c] to-[#b98958]",
  "from-[#f5eadb] via-[#d6b18c] to-[#a77850]",
  "from-[#f2e6d5] via-[#c89b78] to-[#8d6045]",
  "from-[#eee0cf] via-[#b98668] to-[#714934]",
  "from-[#efe5d8] via-[#ad806d] to-[#5f4034]",
  "from-[#eadfce] via-[#9f715f] to-[#50372f]",
  "from-[#e8dcc8] via-[#8c6654] to-[#443029]",
  "from-[#e6dac5] via-[#7c5a4b] to-[#382923]",
  "from-[#f0dfbd] via-[#6f4a33] to-[#241811]",
] as const;

function missionUnit(definition: MissionDefinition): string {
  switch (definition.type) {
    case "cumulativeScore":
    case "singleSessionScore":
      return "점";
    case "mergeCount":
      return "회";
    case "beansEarned":
    case "beansRoasted":
      return "개";
    case "shotsCreated":
      return "샷";
    case "drinksCrafted":
    case "specificDrinkSold":
    case "totalDrinksSold":
    case "timeDrinkSold":
      return "잔";
    case "coinsEarned":
      return "코인";
    default:
      return "";
  }
}

export function AccountLevelCard() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rawAccount = useAppStore((s) => s.accountLevel);
  const account = normalizeAccountLevelState(rawAccount);
  const band = levelBandForLevel(account.level);
  const preview = nextUnlockPreview(account.level);
  const completedCount = account.missionSlots.filter(
    (slot) => account.missionProgress[slot.id]?.completed,
  ).length;
  const tierBg = TIER_BACKGROUNDS[band.tierIndex] ?? TIER_BACKGROUNDS[0];

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative z-30">
      <button
        type="button"
        aria-label={`레벨 ${account.level} 성장 열기`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br text-coffee-950 shadow-card ring-1 ring-cream-50/70 backdrop-blur-sm transition-transform duration-150 ease-out active:scale-95",
          tierBg,
        )}
      >
        <span className="flex h-[2.35rem] w-[2.35rem] flex-col items-center justify-center rounded-full bg-cream-50/82 text-center leading-none ring-1 ring-coffee-600/8">
          <span className="text-[10px] font-black uppercase tracking-[-0.04em]">
            Lv
          </span>
          <span className="mt-0.5 text-[12px] font-black tabular-nums tracking-[-0.05em]">
            {account.level}
          </span>
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 top-[calc(100%+0.55rem)] w-[calc(100vw-1.5rem)] max-w-[22.5rem]"
          >
            <Card
              data-tier-slot={band.backgroundSlot}
              className={cn(
                "overflow-hidden border border-cream-50/40 bg-gradient-to-br p-3.5 shadow-[0_18px_46px_rgb(42_27_18_/_0.18)] ring-1 ring-coffee-600/8",
                tierBg,
              )}
            >
              <div className="rounded-[1.35rem] bg-cream-50/86 p-3 ring-1 ring-coffee-600/8 backdrop-blur-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-coffee-600/60">
                      성장
                    </div>
                    <div className="mt-0.5 flex items-baseline gap-2">
                      <h2 className="text-xl font-black leading-none tracking-[-0.04em] text-coffee-950">
                        Lv.{account.level}
                      </h2>
                      <span className="text-xs font-bold text-coffee-700/75">
                        {band.title}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-full bg-cream-200/70 px-2.5 py-1 text-[11px] font-bold tabular-nums text-coffee-800 ring-1 ring-coffee-600/8">
                    {completedCount}/{account.missionSlots.length}
                  </div>
                </div>

                <ul className="mt-3 space-y-2">
                  {account.missionSlots.map((slot) => {
                    const definition = missionDefinitionById(slot.missionId);
                    const progress = account.missionProgress[slot.id];
                    if (!definition || !progress) return null;
                    const ratio = Math.min(
                      100,
                      (progress.current / progress.target) * 100,
                    );

                    return (
                      <li
                        key={slot.id}
                        className="rounded-2xl bg-cream-50/70 px-3 py-2 ring-1 ring-coffee-600/7"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate text-xs font-bold text-coffee-900">
                            {definition.title}
                          </span>
                          <span
                            className={cn(
                              "shrink-0 text-[11px] font-bold tabular-nums",
                              progress.completed
                                ? "text-accent-mint"
                                : "text-coffee-600/80",
                            )}
                          >
                            {progress.completed
                              ? "완료"
                              : `${progress.current}/${progress.target}${missionUnit(definition)}`}
                          </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-coffee-900/8">
                          <motion.div
                            className={cn(
                              "h-full rounded-full",
                              progress.completed
                                ? "bg-accent-mint"
                                : "bg-accent-soft",
                            )}
                            initial={false}
                            animate={{ width: `${ratio}%` }}
                            transition={{
                              duration: 0.24,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-3 rounded-2xl bg-coffee-900/5 px-3 py-2 text-xs leading-relaxed text-coffee-700 ring-1 ring-coffee-600/6">
                  {preview
                    ? `다음 Lv.${preview.level} · ${preview.preview}`
                    : "마지막 향까지 도착했어요"}
                </div>
              </div>
            </Card>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
