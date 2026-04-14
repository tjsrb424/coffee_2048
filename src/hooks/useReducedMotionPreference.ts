"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";

/**
 * OS 접근성 설정 + 인게임 reducedMotion 설정을 합성.
 */
export function useReducedMotionPreference(): boolean {
  const userPref = useAppStore((s) => s.settings.reducedMotion);
  const [systemPref, setSystemPref] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemPref(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return userPref || systemPref;
}
