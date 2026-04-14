"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/layout/BottomNav";
import { useResetDocumentScrollOnMount } from "@/hooks/useResetDocumentScrollOnMount";
import { useCafeAutoSell } from "@/features/lobby/hooks/useCafeAutoSell";
import { CafeLoopSection } from "./CafeLoopSection";
import { LastRunCard } from "./LastRunCard";
import { LobbyMainCard } from "./LobbyMainCard";
import { OfflineSalesCard } from "./OfflineSalesCard";
import { ResourceBar } from "./ResourceBar";

export function LobbyScreen() {
  useResetDocumentScrollOnMount();
  const [coinToast, setCoinToast] = useState<{
    amount: number;
    kind: "online" | "offline";
  } | null>(null);

  const onCoinsEarned = useCallback((amount: number) => {
    setCoinToast({ amount, kind: "online" });
  }, []);

  const onOfflineSettled = useCallback(
    (input: { gainedCoins: number; soldCount: number }) => {
      // soldCount는 후속 UI(상세 모달)에서 쓰기 좋지만, 지금은 토스트만.
      if (input.gainedCoins <= 0) return;
      setCoinToast({ amount: input.gainedCoins, kind: "offline" });
    },
    [],
  );

  useCafeAutoSell({ onCoinsEarned, onOfflineSettled });

  useEffect(() => {
    if (coinToast == null) return;
    const t = window.setTimeout(() => setCoinToast(null), 1400);
    return () => window.clearTimeout(t);
  }, [coinToast]);

  return (
    <>
      <AppShell>
        <header className="mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-coffee-600/60">
            Lobby
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-coffee-900">
            따뜻한 로비
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-coffee-700">
            퍼즐 한 판이 곧 매장의 온도를 바꿔요.
          </p>
        </header>

        <div className="relative mb-5">
          <ResourceBar />
          <AnimatePresence>
            {coinToast != null ? (
              <motion.div
                key={`${coinToast.kind}-${coinToast.amount}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                className="pointer-events-none absolute inset-x-0 -top-1 flex justify-center"
              >
                <span className="rounded-full bg-coffee-700/95 px-3 py-1 text-xs font-semibold text-cream-50 shadow-card ring-1 ring-black/10">
                  {coinToast.kind === "offline" ? "오프라인 판매 " : ""}+
                  {coinToast.amount} 코인
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        <OfflineSalesCard />
        <LastRunCard />
        <LobbyMainCard />
        <CafeLoopSection />
      </AppShell>
      <BottomNav />
    </>
  );
}
