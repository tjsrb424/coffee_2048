"use client";

import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";

/**
 * 전역 하트 회복 틱. 페이지 어디서든 한 번만 붙이면 됨.
 */
export function useHeartRegenTicker() {
  const stepHeartRegen = useAppStore((s) => s.stepHeartRegen);

  useEffect(() => {
    const tick = () => stepHeartRegen(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [stepHeartRegen]);
}

