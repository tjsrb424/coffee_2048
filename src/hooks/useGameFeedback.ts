"use client";

import { useCallback } from "react";
import { playMergePlink, playMoveTick } from "@/lib/webAudioPlinks";
import { useAppStore } from "@/stores/useAppStore";

/**
 * 사운드/햅틱. 합체·이동은 짧은 Web Audio 플링크(설정 켤 때만).
 */
export function useGameFeedback() {
  const soundOn = useAppStore((s) => s.settings.soundOn);
  const vibrationOn = useAppStore((s) => s.settings.vibrationOn);

  const lightTap = useCallback(() => {
    if (vibrationOn && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, [vibrationOn]);

  const mergePulse = useCallback(() => {
    if (vibrationOn && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([12, 24, 14]);
    }
    if (soundOn) {
      try {
        playMergePlink();
      } catch {
        /* noop */
      }
    }
  }, [soundOn, vibrationOn]);

  const moveWhoosh = useCallback(() => {
    if (soundOn) {
      try {
        playMoveTick();
      } catch {
        /* noop */
      }
    }
  }, [soundOn]);

  return { lightTap, mergePulse, moveWhoosh };
}
