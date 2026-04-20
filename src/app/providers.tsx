"use client";

import { MotionConfig } from "framer-motion";
import { GlobalAudioWarmup } from "@/components/audio/GlobalAudioWarmup";
import { GlobalBgm } from "@/components/audio/GlobalBgm";
import { GlobalUiClickSound } from "@/components/audio/GlobalUiClickSound";
import { GlobalCafeSellToast } from "@/components/economy/GlobalCafeSellToast";
import { GlobalAssetWarmup } from "@/components/system/GlobalAssetWarmup";
import { GlobalSceneTransition } from "@/components/system/GlobalSceneTransition";
import { SafeClientBoundary } from "@/components/system/SafeClientBoundary";
import { useHeartRegenTicker } from "@/hooks/useHeartRegenTicker";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";

export function Providers({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotionPreference();
  useHeartRegenTicker();

  return (
    <MotionConfig reducedMotion={reduce ? "always" : "never"}>
      <SafeClientBoundary label="global-ui">
        <GlobalAssetWarmup />
        <GlobalAudioWarmup />
        <GlobalBgm />
        <GlobalUiClickSound />
        <GlobalCafeSellToast />
        <GlobalSceneTransition />
      </SafeClientBoundary>
      {children}
    </MotionConfig>
  );
}
