"use client";

import { MotionConfig } from "framer-motion";
import { FadeSlide } from "@/components/motion/FadeSlide";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";

export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotionPreference();
  return (
    <MotionConfig reducedMotion={reduce ? "always" : "never"}>
      <FadeSlide>{children}</FadeSlide>
    </MotionConfig>
  );
}
