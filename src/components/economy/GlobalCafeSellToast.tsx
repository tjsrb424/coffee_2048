"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { useCafeAutoSell } from "@/features/lobby/hooks/useCafeAutoSell";
import type { DrinkMenuId } from "@/features/meta/types/gameState";
import { t } from "@/locale/i18n";
import { useLobbyFxStore } from "@/stores/useLobbyFxStore";
import { useCustomerStore } from "@/stores/useCustomerStore";
import { useAppStore } from "@/stores/useAppStore";

type SaleTickInput = {
  gainedCoins: number;
  soldCount: number;
  soldByMenu: Partial<Record<DrinkMenuId, number>>;
};

/**
 * 카페 자동 판매 틱 + 코인 토스트. 모든 주요 라우트에서 마운트되도록 template에 둔다.
 */
export function GlobalCafeSellToast() {
  const recordCafeSale = useCustomerStore((s) => s.recordCafeSale);
  const ensureFeaturedForToday = useCustomerStore((s) => s.ensureFeaturedForToday);
  const ensureFeaturedQuotaForToday = useCustomerStore((s) => s.ensureFeaturedQuotaForToday);
  const ensureSaleSession = useCustomerStore((s) => s.ensureSaleSession);
  const clearSaleSession = useCustomerStore((s) => s.clearSaleSession);
  const sellingActive = useAppStore((s) => s.cafeState.displaySellingActive);
  const [coinToast, setCoinToast] = useState<{
    amount: number;
    kind: "online" | "offline";
    soldCount: number;
    affection: {
      name: string;
      gained: number;
      shopAfter: number;
      preferredBonus: number;
      storyUnlockTitle: string | null;
    } | null;
  } | null>(null);

  useEffect(() => {
    ensureFeaturedForToday();
    ensureFeaturedQuotaForToday();
  }, [ensureFeaturedForToday, ensureFeaturedQuotaForToday]);

  useEffect(() => {
    if (sellingActive) ensureSaleSession();
    else clearSaleSession();
  }, [sellingActive, ensureSaleSession, clearSaleSession]);

  const pushSaleToast = useCallback(
    (kind: "online" | "offline", input: SaleTickInput) => {
      const aff = recordCafeSale({
        soldCount: input.soldCount,
        soldByMenu: input.soldByMenu,
      });
      setCoinToast({
        amount: input.gainedCoins,
        kind,
        soldCount: input.soldCount,
        affection: aff
          ? {
              name: aff.customerDisplayName,
              gained: aff.gainedAffection,
              shopAfter: aff.shopAffectionAfter,
              preferredBonus: aff.preferredBonus,
              storyUnlockTitle: aff.storyUnlockTitle,
            }
          : null,
      });
    },
    [recordCafeSale],
  );

  const onCoinsEarned = useCallback(
    (input: SaleTickInput) => {
      useLobbyFxStore.getState().pingPurchase("online");
      useLobbyFxStore.getState().pingCafeSell({
        gainedCoins: input.gainedCoins,
        soldCount: input.soldCount,
        kind: "online",
      });
      pushSaleToast("online", input);
    },
    [pushSaleToast],
  );

  const onOfflineSettled = useCallback(
    (input: SaleTickInput) => {
      if (input.gainedCoins <= 0) return;
      useLobbyFxStore.getState().pingPurchase("offline");
      useLobbyFxStore.getState().pingCafeSell({
        gainedCoins: input.gainedCoins,
        soldCount: input.soldCount,
        kind: "offline",
      });
      pushSaleToast("offline", input);
    },
    [pushSaleToast],
  );

  useCafeAutoSell({ onCoinsEarned, onOfflineSettled });

  useEffect(() => {
    if (coinToast == null) return;
    const timer = window.setTimeout(() => setCoinToast(null), 1900);
    return () => window.clearTimeout(timer);
  }, [coinToast]);

  return (
    <AnimatePresence>
      {coinToast != null ? (
        <motion.div
          key={`${coinToast.kind}-${coinToast.amount}-${coinToast.soldCount}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          style={{
            top: "max(1rem, env(safe-area-inset-top))",
            maxWidth: "min(20rem, calc(100vw - 2rem))",
          }}
          className="pointer-events-none fixed left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-1.5 px-2"
        >
          <span className="inline-flex items-center gap-1 rounded-full bg-coffee-700/95 px-3 py-1.5 text-xs font-semibold text-cream-50 shadow-card ring-1 ring-black/10">
            <CoinIcon size={18} className="opacity-95" />
            {coinToast.kind === "offline" ? t("toast.offline.prefix") : ""}+{coinToast.amount}
            <span className="sr-only">{t("toast.coins.suffix")}</span>
          </span>
          {coinToast.affection ? (
            <span className="flex max-w-full flex-col items-center gap-0.5 rounded-2xl bg-cream-50/96 px-2.5 py-1 text-center text-[10px] font-medium leading-snug text-coffee-800 shadow-card ring-1 ring-coffee-600/10">
              <span>
                {t("toast.affection.line", {
                  name: coinToast.affection.name,
                  gained: coinToast.affection.gained,
                })}
              </span>
              {coinToast.affection.preferredBonus > 0 ? (
                <span className="text-[9px] font-normal text-accent-soft/95">
                  {t("toast.affection.preferredHint", {
                    bonus: coinToast.affection.preferredBonus,
                  })}
                </span>
              ) : null}
              {coinToast.affection.storyUnlockTitle ? (
                <span className="text-[9px] font-normal text-coffee-700/85">
                  {t("toast.storyFragment.unlocked", {
                    title: coinToast.affection.storyUnlockTitle,
                  })}
                </span>
              ) : null}
            </span>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
