"use client";

import { animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";

type Props = {
  value: number;
  className?: string;
};

export function AnimatedNumber({ value, className }: Props) {
  const reduce = useReducedMotionPreference();
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    if (reduce) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }
    const ctrl = animate(fromRef.current, value, {
      duration: 0.48,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
      onComplete: () => {
        fromRef.current = value;
      },
    });
    return () => ctrl.stop();
  }, [value, reduce]);

  return <span className={className}>{display}</span>;
}
