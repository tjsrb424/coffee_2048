"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import {
  isTimeShopUnlock,
  levelBandForLevel,
  nextUnlockPreview,
} from "@/features/meta/progression/levelBands";
import { missionDefinitionById } from "@/features/meta/progression/missionDefinitions";
import { normalizeAccountLevelState } from "@/features/meta/progression/missionEngine";
import type { MissionDefinition } from "@/features/meta/types/gameState";
import { t } from "@/locale/i18n";
import { publicAssetPath } from "@/lib/publicAssetPath";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/useAppStore";

const LOBBY_TIER_BADGE_ASSET = publicAssetPath("/assets/lobby/lobby_btn_tier.png");

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
  const previewDistance = preview ? Math.max(0, preview.level - account.level) : null;
  const previewIsSoon = previewDistance !== null && previewDistance <= 2;
  const previewIsTimeShop = preview ? isTimeShopUnlock(preview) : false;
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
          "relative grid h-[3.45rem] w-[3.45rem] place-items-center overflow-hidden rounded-full text-coffee-950 shadow-[0_12px_26px_rgb(72_50_35_/_0.16)] transition-transform duration-150 ease-out active:scale-95",
        )}
      >
        <Image
          src={LOBBY_TIER_BADGE_ASSET}
          alt=""
          fill
          sizes="3.45rem"
          className="object-contain"
          priority
        />
        <span
          className={cn(
            "absolute inset-[0.34rem] rounded-full bg-gradient-to-br opacity-45",
            tierBg,
          )}
          aria-hidden
        />
        <span className="relative z-10 flex h-[2.2rem] w-[2.2rem] flex-col items-center justify-center rounded-full bg-cream-50/56 text-center leading-none">
          <span className="text-[10px] font-black uppercase tracking-[-0.04em] text-coffee-800">
            Lv
          </span>
          <span className="mt-0.5 text-[12px] font-black tabular-nums tracking-[-0.05em] text-coffee-950">
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

                <div className="mt-3 rounded-2xl bg-coffee-900/5 px-3 py-2.5 text-xs leading-relaxed text-coffee-700 ring-1 ring-coffee-600/6">
                  {preview ? (
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-cream-50/80 px-2 py-0.5 text-[10px] font-bold text-coffee-900 ring-1 ring-coffee-600/8">
                          {previewIsSoon ? "곧 열림" : "다음 해금"}
                        </span>
                        {previewIsTimeShop ? (
                          <span className="rounded-full bg-accent-soft/16 px-2 py-0.5 text-[10px] font-bold text-coffee-900 ring-1 ring-accent-soft/24">
                            {t("nav.timeShop")}
                          </span>
                        ) : null}
                        <span className="text-[11px] font-bold text-coffee-800">
                          Lv.{preview.level}
                        </span>
                      </div>
                      <div className="mt-1 font-bold text-coffee-900">
                        {preview.title}
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-coffee-700/85">
                        {preview.preview}
                      </p>
                    </div>
                  ) : (
                    "마지막 향까지 도착했어요"
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
