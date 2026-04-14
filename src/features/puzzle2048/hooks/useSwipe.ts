"use client";

import { useCallback, useRef } from "react";
import type { Direction } from "@/features/puzzle2048/types";

const THRESHOLD_PX = 28;

type SwipeHandlers = {
  onSwipe: (dir: Direction) => void;
};

export function useSwipe({ onSwipe }: SwipeHandlers) {
  const start = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!start.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.current.x;
      const dy = t.clientY - start.current.y;
      start.current = null;
      if (Math.abs(dx) < THRESHOLD_PX && Math.abs(dy) < THRESHOLD_PX) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        onSwipe(dx > 0 ? "right" : "left");
      } else {
        onSwipe(dy > 0 ? "down" : "up");
      }
    },
    [onSwipe],
  );

  return { onTouchStart, onTouchEnd };
}
