"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/layout/BottomNav";
import { useResetDocumentScrollOnMount } from "@/hooks/useResetDocumentScrollOnMount";
import { useCafeAutoSell } from "@/features/lobby/hooks/useCafeAutoSell";
import { useAppStore } from "@/stores/useAppStore";
import { CafeLoopSection } from "./CafeLoopSection";
import { LastRunCard } from "./LastRunCard";
import { LobbyMainCard } from "./LobbyMainCard";
import { LobbyAmbientCustomers } from "./LobbyAmbientCustomers";
import { OfflineSalesCard } from "./OfflineSalesCard";
import { ResourceBar } from "./ResourceBar";

export function LobbyScreen() {
  useResetDocumentScrollOnMount();
  const soundOn = useAppStore((s) => s.settings.soundOn);
  const reducedMotion = useAppStore((s) => s.settings.reducedMotion);
  const [coinToast, setCoinToast] = useState<{
    amount: number;
    kind: "online" | "offline";
  } | null>(null);
  const [purchasePulse, setPurchasePulse] = useState(0);
  const [purchaseKind, setPurchaseKind] = useState<"online" | "offline">(
    "online",
  );

  const onCoinsEarned = useCallback((amount: number) => {
    setCoinToast({ amount, kind: "online" });
    setPurchaseKind("online");
    setPurchasePulse((n) => n + 1);
  }, []);

  const onOfflineSettled = useCallback(
    (input: { gainedCoins: number; soldCount: number }) => {
      // soldCount는 후속 UI(상세 모달)에서 쓰기 좋지만, 지금은 토스트만.
      if (input.gainedCoins <= 0) return;
      setCoinToast({ amount: input.gainedCoins, kind: "offline" });
      setPurchaseKind("offline");
      setPurchasePulse((n) => n + 1);
    },
    [],
  );

  useCafeAutoSell({ onCoinsEarned, onOfflineSettled });

  useEffect(() => {
    const audio = new Audio("/bgm/lobby.mp3");
    audio.loop = true;
    audio.preload = "auto";
    const targetVolume = reducedMotion ? 0.22 : 0.28;
    audio.volume = 0;
    let raf = 0;

    const cancelFade = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const fadeTo = (to: number, ms: number, onDone?: () => void) => {
      cancelFade();
      const from = audio.volume;
      const startAt = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - startAt) / ms);
        audio.volume = from + (to - from) * t;
        if (t < 1) {
          raf = requestAnimationFrame(step);
        } else {
          raf = 0;
          onDone?.();
        }
      };
      raf = requestAnimationFrame(step);
    };

    const start = async () => {
      if (!soundOn) return;
      try {
        await audio.play();
        fadeTo(targetVolume, 900);
      } catch {
        // Chrome/iOS/Safari: 사용자 제스처 전에는 실패할 수 있음
      }
    };

    const onFirstGesture = () => {
      void start();
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("touchstart", onFirstGesture);
    };

    // 1) 즉시 재생 시도 (될 수 있는 브라우저에서는 바로 BGM)
    void start();
    // 2) 실패 대비: 첫 제스처로 재시도
    window.addEventListener("pointerdown", onFirstGesture, { passive: true });
    window.addEventListener("touchstart", onFirstGesture, { passive: true });

    // 설정 토글 반영
    if (!soundOn) {
      fadeTo(0, 250, () => {
        audio.pause();
        audio.currentTime = 0;
      });
    }

    return () => {
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("touchstart", onFirstGesture);
      cancelFade();
      fadeTo(0, 220, () => {
        audio.pause();
        audio.currentTime = 0;
      });
    };
  }, [reducedMotion, soundOn]);

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
          <LobbyAmbientCustomers
            purchasePulse={purchasePulse}
            purchaseKind={purchaseKind}
          />
          <ResourceBar />
          <AnimatePresence>
            {coinToast != null ? (
              <motion.div
                key={`${coinToast.kind}-${coinToast.amount}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                className="pointer-events-none absolute left-0 right-0 -top-1 flex"
              >
                <div className="flex w-1/3 justify-center">
                  <span className="rounded-full bg-coffee-700/95 px-3 py-1 text-xs font-semibold text-cream-50 shadow-card ring-1 ring-black/10">
                    {coinToast.kind === "offline" ? "오프라인 판매 " : ""}+
                    {coinToast.amount} 코인
                  </span>
                </div>
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
