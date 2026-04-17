"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { t } from "@/locale/i18n";
import { useLobbyFxStore } from "@/stores/useLobbyFxStore";

const DISPLAY_MS = 2400;

export function CounterSellPulseToast() {
  const pulse = useLobbyFxStore((s) => s.cafeSellPulse);
  const clearCafeSell = useLobbyFxStore((s) => s.clearCafeSell);
  const reduceMotion = useReducedMotion();

  useEffect(
    () => () => {
      clearCafeSell();
    },
    [clearCafeSell],
  );

  useEffect(() => {
    if (!pulse) return;
    const timer = window.setTimeout(clearCafeSell, DISPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [pulse, clearCafeSell]);

  const line = pulse
    ? pulse.kind === "offline"
      ? t("sellPulse.lineOffline", {
          sold: pulse.soldCount,
          coins: pulse.gainedCoins,
        })
      : t("sellPulse.lineOnline", {
          sold: pulse.soldCount,
          coins: pulse.gainedCoins,
        })
    : "";

  return (
    <AnimatePresence mode="wait">
      {pulse ? (
        <motion.div
          key={pulse.key}
          initial={
            reduceMotion
              ? { opacity: 1 }
              : { opacity: 0, y: 12, scale: 0.992 }
          }
          animate={
            reduceMotion
              ? { opacity: 1 }
              : { opacity: 1, y: 0, scale: 1 }
          }
          exit={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, y: -6, scale: 0.996 }
          }
          transition={
            reduceMotion
              ? { duration: 0.18 }
              : {
                  opacity: { duration: 0.18, ease: "easeOut" },
                  y: { type: "spring", stiffness: 430, damping: 30, mass: 0.72 },
                  scale: { type: "spring", stiffness: 470, damping: 34, mass: 0.72 },
                }
          }
          className="overflow-hidden rounded-[1.65rem] border border-white/85 bg-[#fffaf4] px-4 py-3 shadow-[0_18px_40px_-18px_rgb(62_47_35_/_0.42)] ring-1 ring-coffee-700/16 will-change-transform"
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-coffee-700/80">
                {t("sellPulse.heading")}
              </div>
              <p className="mt-1 text-[13px] font-medium leading-relaxed text-coffee-950">
                {line}
              </p>
            </div>
            <div className="shrink-0 rounded-2xl bg-coffee-900 px-3 py-2 text-center text-xs font-semibold text-cream-50 shadow-[0_10px_18px_-12px_rgb(33_22_17_/_0.65)]">
              <div className="inline-flex items-center justify-center gap-1">
                <CoinIcon size={16} className="opacity-95" />
                +{pulse.gainedCoins}
                <span className="sr-only">{t("sellPulse.coinLabel")}</span>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
