"use client";

import { useEffect } from "react";
import { unlockSfx, warmSfx } from "@/lib/sfx";
import { unlockWebAudioPlinks, warmWebAudioPlinks } from "@/lib/webAudioPlinks";
import { useAppStore } from "@/stores/useAppStore";

export function GlobalAudioWarmup() {
  const soundOn = useAppStore((s) => s.settings.soundOn);

  useEffect(() => {
    if (typeof window === "undefined" || !soundOn) return;

    warmSfx();
    warmWebAudioPlinks();

    const onFirstGesture = () => {
      warmSfx();
      unlockSfx();
      unlockWebAudioPlinks();
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("touchstart", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
    };

    window.addEventListener("pointerdown", onFirstGesture, true);
    window.addEventListener("touchstart", onFirstGesture, true);
    window.addEventListener("keydown", onFirstGesture);

    return () => {
      window.removeEventListener("pointerdown", onFirstGesture, true);
      window.removeEventListener("touchstart", onFirstGesture, true);
      window.removeEventListener("keydown", onFirstGesture);
    };
  }, [soundOn]);

  return null;
}
