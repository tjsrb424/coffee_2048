"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BeanIcon } from "@/components/ui/BeanIcon";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { EspressoShotIcon } from "@/components/ui/EspressoShotIcon";
import { DRINK_MENU_TEXT_IDS } from "@/data/drinkMenuTextIds";
import { getCafeRuntimeModifiers } from "@/features/meta/balance/cafeModifiers";
import {
  CAFE_ECONOMY,
  MENU_ORDER,
  MENU_UNLOCK_CAFE_LEVEL,
} from "@/features/meta/balance/cafeEconomy";
import type { DrinkMenuId } from "@/features/meta/types/gameState";
import { t } from "@/locale/i18n";
import { useAppStore } from "@/stores/useAppStore";
import { useGameFeedback } from "@/hooks/useGameFeedback";
import { publicAssetPath } from "@/lib/publicAssetPath";
import { playDisplayStartClick } from "@/lib/sfx";
import { cn } from "@/lib/utils";

export type CafeLoopSectionKey = "roast" | "craft" | "display";

export function CafeLoopSection({
  sections = ["roast", "craft", "display"],
}: {
  /** 기본값은 전체. 로비 시트 등에서 일부만 표시할 때 사용 */
  sections?: CafeLoopSectionKey[];
}) {
  const beans = useAppStore((s) => s.playerResources.beans);
  const cafe = useAppStore((s) => s.cafeState);
  const shots = useAppStore((s) => s.cafeState.espressoShots);
  const menuStock = useAppStore((s) => s.cafeState.menuStock);
  const displaySellingActive = useAppStore((s) => s.cafeState.displaySellingActive);
  const lastAuto = useAppStore((s) => s.cafeState.lastAutoSellAtMs);
  const roastOnce = useAppStore((s) => s.roastOnce);
  const craftDrink = useAppStore((s) => s.craftDrink);
  const startDisplaySelling = useAppStore((s) => s.startDisplaySelling);
  const stopDisplaySelling = useAppStore((s) => s.stopDisplaySelling);
  const soundOn = useAppStore((s) => s.settings.soundOn);
  const { lightTap } = useGameFeedback();
  const [roastDelta, setRoastDelta] = useState<{
    key: number;
    beans: number;
    shots: number;
  } | null>(null);
  const roastDeltaTimerRef = useRef<number | null>(null);

  const m = getCafeRuntimeModifiers(cafe);
  const canRoast = beans >= m.roastBeanCost && shots < m.maxShots;
  const totalStock =
    menuStock.americano + menuStock.latte + menuStock.affogato;
  const reduceMotion = !!useReducedMotion();

  const roastBlockReason =
    shots >= m.maxShots
      ? t("cafe.loop.roast.blockFull")
      : beans < m.roastBeanCost
        ? t("cafe.loop.roast.blockBeans", {
            need: m.roastBeanCost - beans,
          })
        : null;

  const show = (k: CafeLoopSectionKey) => sections.includes(k);

  useEffect(() => {
    return () => {
      if (roastDeltaTimerRef.current !== null) {
        window.clearTimeout(roastDeltaTimerRef.current);
      }
    };
  }, []);

  const showRoastDelta = (input: { beans: number; shots: number }) => {
    if (roastDeltaTimerRef.current !== null) {
      window.clearTimeout(roastDeltaTimerRef.current);
    }
    const key = Date.now();
    setRoastDelta({ key, ...input });
    roastDeltaTimerRef.current = window.setTimeout(
      () => {
        setRoastDelta((current) => (current?.key === key ? null : current));
        roastDeltaTimerRef.current = null;
      },
      reduceMotion ? 750 : 1250,
    );
  };

  const scrollToCraft = () => {
    const el = document.getElementById("lobby-cafe-craft");
    el?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <div className="space-y-4">
      {show("roast") && (
      <Card className="p-4">
        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="relative inline-flex items-center gap-1.5 overflow-visible rounded-2xl bg-cream-200/60 px-2.5 py-1.5 text-xs font-semibold tabular-nums text-coffee-900 ring-1 ring-coffee-600/5">
              <RoastResourceDelta
                deltaKey={roastDelta?.key}
                reduceMotion={reduceMotion}
                tone="spend"
                value={roastDelta?.beans ?? 0}
              />
              <BeanIcon size={16} className="opacity-95" />
              <span>{beans}</span>
              <span className="sr-only">원두</span>
            </div>
            <div className="relative inline-flex items-center gap-1.5 overflow-visible rounded-2xl bg-cream-200/60 px-2.5 py-1.5 text-xs font-semibold tabular-nums text-coffee-900 ring-1 ring-coffee-600/5">
              <RoastResourceDelta
                deltaKey={roastDelta?.key}
                reduceMotion={reduceMotion}
                tone="gain"
                value={roastDelta?.shots ?? 0}
              />
              <EspressoShotIcon size={18} className="opacity-95" />
              <span>{shots}</span>
              <span className="sr-only">샷</span>
            </div>
          </div>
          <div className="inline-flex items-center justify-center gap-1 text-center text-[11px] font-semibold text-coffee-600/70">
            최대
            <EspressoShotIcon size={14} className="opacity-75" />
            <span className="tabular-nums">{m.maxShots}</span>
          </div>
        </div>

        <div className="mt-3 flex justify-center">
          <Button
            type="button"
            variant="soft"
            className="h-auto min-h-[3rem] w-full max-w-[18rem] flex-col items-center justify-center gap-1 py-2.5 text-center"
            disabled={!canRoast}
            onClick={() => {
              lightTap();
              const didRoast = roastOnce();
              if (didRoast) {
                showRoastDelta({
                  beans: -m.roastBeanCost,
                  shots: m.shotYield,
                });
              }
            }}
          >
            <span className="text-[15px] font-semibold leading-tight">
              {t("cafe.loop.roast.ctaLine1")}
            </span>
            <span className="inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold leading-snug text-coffee-700/90">
              <BeanIcon size={14} className="opacity-95" />
              <span className="tabular-nums">
                {beans}/{m.roastBeanCost}
              </span>
            </span>
          </Button>
        </div>
        <p
          className={cn(
            "mt-2 text-center text-xs leading-relaxed",
            canRoast ? "text-coffee-600/55" : "text-coffee-700/85",
          )}
        >
          {canRoast
            ? t("cafe.loop.roast.hintOk", { cost: m.roastBeanCost, yield: m.shotYield })
            : roastBlockReason}
        </p>
      </Card>
      )}

      {show("craft") && (
      <Card id="lobby-cafe-craft" className="scroll-mt-4 p-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-coffee-600/60">
              {t("cafe.loop.craft.heading")}
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-cream-200/50 px-3 py-2 ring-1 ring-coffee-600/5">
          <span className="text-[11px] font-semibold text-coffee-600/75">
            {t("cafe.loop.craft.resources")}
          </span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold tabular-nums text-coffee-900">
            <span className="inline-flex items-center gap-1">
              <EspressoShotIcon size={16} className="opacity-95" />
              <span className="sr-only">{t("cafe.loop.craft.shots")}</span>
              <span className="text-coffee-800">{shots}</span>
            </span>
            <span>
              {t("cafe.loop.craft.beans")}{" "}
              <span className="text-coffee-800">{beans}</span>
              {t("cafe.loop.craft.beansUnit")}
            </span>
          </div>
        </div>
        <ul className="mt-4 grid grid-cols-1 gap-3">
          {MENU_ORDER.map((id) => (
            <MenuCraftCard
              key={id}
              id={id}
              stock={menuStock[id]}
              locked={cafe.cafeLevel < (MENU_UNLOCK_CAFE_LEVEL[id] ?? 1)}
              requiredCafeLevel={MENU_UNLOCK_CAFE_LEVEL[id] ?? 1}
              shotsOk={shots >= CAFE_ECONOMY.recipe[id].shots}
              beansOk={beans >= CAFE_ECONOMY.recipe[id].beans}
              shots={shots}
              beans={beans}
              onCraft={() => {
                lightTap();
                craftDrink(id);
              }}
            />
          ))}
        </ul>
      </Card>
      )}

      {show("display") && (
      <Card id="lobby-cafe-display" className="scroll-mt-4 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-coffee-600/60">
          {t("cafe.loop.display.heading")}
        </div>
        {totalStock === 0 && show("craft") ? (
          <div className="mt-3 rounded-2xl border border-accent-soft/25 bg-cream-50/90 px-3 py-3 ring-1 ring-coffee-600/8">
            <p className="text-xs font-semibold text-coffee-900">
              {t("cafe.loop.display.emptyTitle.craft")}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-coffee-700/85">
              {t("cafe.loop.display.emptyHint.craft")}
            </p>
            <Button
              type="button"
              variant="ghost"
              className="mt-2 h-9 w-full text-xs font-semibold text-coffee-900"
              onClick={() => {
                lightTap();
                scrollToCraft();
              }}
            >
              {t("cafe.loop.display.emptyCta.craft")}
            </Button>
          </div>
        ) : null}
        {totalStock === 0 && !show("craft") ? (
          <div className="mt-3 rounded-2xl border border-accent-soft/20 bg-cream-50/90 px-3 py-2.5 ring-1 ring-coffee-600/8">
            <p className="text-xs leading-relaxed text-coffee-700/85">
              {t("cafe.loop.display.emptyNoCraft")}
            </p>
          </div>
        ) : null}
        {totalStock > 0 && !displaySellingActive ? (
          <div className="mt-3">
            <Button
              type="button"
              variant="soft"
              className="h-11 w-full text-xs font-semibold sm:h-10"
              onClick={() => {
                lightTap();
                if (soundOn) playDisplayStartClick();
                startDisplaySelling();
              }}
            >
              {t("cafe.loop.display.startCta")}
            </Button>
          </div>
        ) : null}
        {displaySellingActive && totalStock > 0 ? (
          <div className="mt-3">
            <Button
              type="button"
              variant="ghost"
              className="h-11 w-full text-xs font-semibold sm:h-10"
              onClick={() => {
                lightTap();
                stopDisplaySelling();
              }}
            >
              {t("cafe.loop.display.stopCta")}
            </Button>
          </div>
        ) : null}
        {displaySellingActive && totalStock > 0 ? (
          <p className="mt-3 text-center text-[11px] font-medium text-coffee-700/85">
            {t("cafe.loop.display.sellingBadge")}
          </p>
        ) : null}
        <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
          {MENU_ORDER.map((id) => (
            <div
              key={id}
              className={cn(
                "rounded-3xl px-2 py-3 ring-1",
                menuStock[id] > 0
                  ? "bg-cream-50/95 ring-accent-soft/25 shadow-[inset_0_0_0_1px_rgb(196_154_108_/_0.12)]"
                  : "bg-cream-200/45 ring-coffee-600/5",
              )}
            >
              <div className="text-[11px] font-semibold text-coffee-700/80">
                {t(DRINK_MENU_TEXT_IDS[id].nameTextId)}
              </div>
              <div className="mt-2 flex justify-center" aria-hidden>
                <Image
                  src={drinkImagePath(id)}
                  alt=""
                  width={192}
                  height={192}
                  className={cn(
                    "h-20 w-20 object-contain drop-shadow-[0_10px_18px_rgb(90_61_43_/_0.18)]",
                    menuStock[id] === 0 && "opacity-50 saturate-[0.8]",
                  )}
                  priority={false}
                />
              </div>
              <div className="mt-2 text-sm font-bold tabular-nums text-coffee-900">
                현재 {menuStock[id]}잔
              </div>
              <div className="mt-1 inline-flex items-center justify-center gap-1 text-[10px] font-semibold text-coffee-600/70">
                <CoinIcon size={14} className={menuStock[id] === 0 ? "opacity-55" : ""} />
                <span>
                  {t("cafe.loop.display.coinLine", {
                    price: CAFE_ECONOMY.sellPrice[id] + m.sellBonus,
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
        <motion.p
          className="mt-3 text-center text-xs text-coffee-600/70"
          key={`${lastAuto}-${totalStock}-${displaySellingActive ? 1 : 0}`}
          initial={reduceMotion ? false : { opacity: 0.4 }}
          animate={{ opacity: 1 }}
        >
          {t("cafe.loop.display.total")}{" "}
          <span className="font-semibold tabular-nums text-coffee-800">
            {totalStock}
          </span>
          {t("cafe.loop.display.totalUnit")}
        </motion.p>
      </Card>
      )}
    </div>
  );
}

function drinkImagePath(id: DrinkMenuId): string {
  switch (id) {
    case "americano":
      return publicAssetPath("/images/drink/아메리카노.png");
    case "latte":
      return publicAssetPath("/images/drink/카페라떼.png");
    case "affogato":
      return publicAssetPath("/images/drink/아포가토.png");
    default:
      return publicAssetPath("/images/drink/아메리카노.png");
  }
}

function RoastResourceDelta({
  deltaKey,
  reduceMotion,
  tone,
  value,
}: {
  deltaKey?: number;
  reduceMotion: boolean;
  tone: "gain" | "spend";
  value: number;
}) {
  const show = value !== 0 && deltaKey !== undefined;
  const text = value > 0 ? `+${value}` : `${value}`;

  return (
    <AnimatePresence mode="popLayout">
      {show ? (
        <motion.span
          key={`${deltaKey}-${tone}-${value}`}
          initial={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, y: 7, scale: 0.88 }
          }
          animate={
            reduceMotion
              ? { opacity: 1 }
              : { opacity: 1, y: -18, scale: 1 }
          }
          exit={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, y: -30, scale: 0.96 }
          }
          transition={
            reduceMotion
              ? { duration: 0.18 }
              : {
                  duration: 0.9,
                  ease: [0.22, 1, 0.36, 1],
                }
          }
          className={cn(
            "pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-extrabold tabular-nums shadow-[0_8px_18px_rgb(55_34_20_/_0.16)] ring-1",
            tone === "gain"
              ? "bg-accent-mint/35 text-coffee-950 ring-accent-mint/50"
              : "bg-[#f2dfc7]/95 text-coffee-900 ring-accent-soft/45",
          )}
          aria-hidden
        >
          {text}
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}

function menuEmoji(id: DrinkMenuId): string {
  switch (id) {
    case "americano":
      return "☕";
    case "latte":
      return "🥛";
    case "affogato":
      return "🍨";
    default:
      return "☕";
  }
}

function MenuCraftCard({
  id,
  stock,
  locked,
  requiredCafeLevel,
  shotsOk,
  beansOk,
  shots,
  beans,
  onCraft,
}: {
  id: DrinkMenuId;
  stock: number;
  locked: boolean;
  requiredCafeLevel: number;
  shotsOk: boolean;
  beansOk: boolean;
  shots: number;
  beans: number;
  onCraft: () => void;
}) {
  const rec = CAFE_ECONOMY.recipe[id];
  const can = !locked && shotsOk && beansOk;
  const needsBeans = rec.beans > 0;

  const blockLine = locked
    ? t("cafe.menuCraft.unlock", { level: requiredCafeLevel })
    : !shotsOk
      ? t("cafe.menuCraft.needShots", { have: shots, need: rec.shots })
      : !beansOk && needsBeans
        ? t("cafe.menuCraft.needBeans", { have: beans, need: rec.beans })
        : t("cafe.menuCraft.blockGeneric");

  return (
    <li
      className={cn(
        "rounded-3xl p-3 ring-1 transition-colors",
        can
          ? cn(
              "bg-cream-50/95 ring-accent-soft/35",
              "shadow-[0_10px_26px_-18px_rgb(90_61_43_/_0.45)] ring-1 ring-inset ring-accent-soft/20",
            )
          : "bg-cream-200/45 ring-coffee-600/5",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "relative grid place-items-center overflow-visible rounded-2xl",
            id === "americano" || id === "latte" || id === "affogato"
              ? "h-24 w-24"
              : "h-12 w-12 ring-1",
            id === "americano" || id === "latte" || id === "affogato"
              ? "bg-transparent"
              : can
                ? "bg-gradient-to-br from-cream-50 to-cream-200/70 ring-accent-soft/22"
                : "bg-cream-50/70 ring-coffee-600/10 opacity-80",
          )}
          aria-hidden
        >
          {id === "americano" || id === "latte" || id === "affogato" ? (
            <Image
              src={drinkImagePath(id)}
              alt=""
              width={256}
              height={256}
              className="pointer-events-none h-32 w-32 -translate-y-1 object-contain drop-shadow-[0_14px_26px_rgb(90_61_43_/_0.22)]"
              priority
            />
          ) : (
            <span className="text-xl">{menuEmoji(id)}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-coffee-900">
              {t(DRINK_MENU_TEXT_IDS[id].nameTextId)}
            </h3>
            {can ? (
              <span className="rounded-full bg-accent-soft/14 px-2 py-0.5 text-[10px] font-semibold text-coffee-800 ring-1 ring-accent-soft/22">
                {t("cafe.menuCraft.badge.can")}
              </span>
            ) : (
              <span className="rounded-full bg-coffee-900/5 px-2 py-0.5 text-[10px] font-semibold text-coffee-600/70 ring-1 ring-coffee-600/10">
                {locked
                  ? t("cafe.menuCraft.badge.locked")
                  : t("cafe.menuCraft.badge.blocked")}
              </span>
            )}
          </div>

          <p className="mt-1 text-xs leading-relaxed text-coffee-700/80">
            {t(DRINK_MENU_TEXT_IDS[id].descriptionTextId)}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold tabular-nums">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 ring-1",
                shotsOk
                  ? "bg-cream-50/80 text-coffee-800 ring-coffee-600/10"
                  : "bg-[#f6ede3] text-coffee-900 ring-accent-soft/22",
              )}
            >
              <span className="inline-flex items-center gap-1">
                <EspressoShotIcon size={15} className="opacity-95" />
                <span className="sr-only">{t("cafe.loop.craft.shots")}</span>
                <span>
                  {shots}/{rec.shots}
                </span>
              </span>
            </span>
            {needsBeans ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 ring-1",
                  beansOk
                    ? "bg-cream-50/80 text-coffee-800 ring-coffee-600/10"
                    : "bg-[#f6ede3] text-coffee-900 ring-accent-soft/22",
                )}
              >
                {t("cafe.menuCraft.beansPair", {
                  have: beans,
                  need: rec.beans,
                })}
              </span>
            ) : null}
          </div>

          {!can ? (
            <p className="mt-2 text-[11px] leading-relaxed text-coffee-700/90">
              {blockLine}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="text-right">
            <div className="text-[10px] font-semibold text-coffee-600/70">
              {t("cafe.menuCraft.stockLabel")}
            </div>
            <div className="mt-0.5 text-sm font-bold tabular-nums text-coffee-900">
              {stock}
            </div>
          </div>
          <Button
            type="button"
            variant={can ? "soft" : "ghost"}
            className={cn(
              "h-11 px-3 text-xs font-semibold",
              can && "min-w-[72px]",
              !can && "opacity-70",
            )}
            disabled={!can}
            onClick={onCraft}
          >
            {t("cafe.menuCraft.cta")}
          </Button>
        </div>
      </div>
    </li>
  );
}
