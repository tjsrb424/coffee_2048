"use client";

import { MotionConfig } from "framer-motion";
import { FadeSlide } from "@/components/motion/FadeSlide";
import { DevDebugPanel } from "@/components/dev/DevDebugPanel";
import { useHeartRegenTicker } from "@/hooks/useHeartRegenTicker";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";

export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotionPreference();
  useHeartRegenTicker();
  return (
    <MotionConfig reducedMotion={reduce ? "always" : "never"}>
      <FadeSlide>
        {children}
        {process.env.NODE_ENV !== "production" && <DevDebugPanel />}
      </FadeSlide>
    </MotionConfig>
  );
}
