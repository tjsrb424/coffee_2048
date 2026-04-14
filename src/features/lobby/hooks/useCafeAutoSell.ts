"use client";

import { useEffect, useRef } from "react";
import { getCafeRuntimeModifiers } from "@/features/meta/balance/cafeModifiers";
import { useAppStore } from "@/stores/useAppStore";

export function useCafeAutoSell(options: {
  onCoinsEarned?: (amount: number) => void;
  onOfflineSettled?: (input: { gainedCoins: number; soldCount: number }) => void;
}) {
  const stepAutoSell = useAppStore((s) => s.stepAutoSell);
  const recordOfflineSaleSummary = useAppStore((s) => s.recordOfflineSaleSummary);
  const cafe = useAppStore((s) => s.cafeState);
  const onCoinsEarned = options.onCoinsEarned;
  const onOfflineSettled = options.onOfflineSettled;
  const cbRef = useRef(onCoinsEarned);
  cbRef.current = onCoinsEarned;
  const offlineRef = useRef(onOfflineSettled);
  offlineRef.current = onOfflineSettled;
  const firstRef = useRef(true);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const lastBefore = useAppStore.getState().cafeState.lastAutoSellAtMs;
      const { gainedCoins, soldCount, ticks } = stepAutoSell(now);
      if (gainedCoins <= 0) return;

      const interval = getCafeRuntimeModifiers(cafe).autoSellIntervalMs;
      const gapMs = lastBefore > 0 ? now - lastBefore : 0;
      const shouldTreatAsOffline =
        firstRef.current &&
        lastBefore > 0 &&
        (ticks >= 2 || gapMs >= Math.max(8000, Math.floor(interval * 2.25)));

      if (shouldTreatAsOffline) {
        recordOfflineSaleSummary({ atMs: now, gainedCoins, soldCount });
        offlineRef.current?.({ gainedCoins, soldCount });
      } else {
        cbRef.current?.(gainedCoins);
      }
    };
    tick();
    firstRef.current = false;
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [cafe, recordOfflineSaleSummary, stepAutoSell]);
}
