"use client";

import { useCallback, useRef } from "react";
import type { Direction } from "@/features/puzzle2048/types";

const THRESHOLD_PX = 28;

type SwipeHandlers = {
  onSwipe: (dir: Direction) => void;
};

export function useSwipe({ onSwipe }: SwipeHandlers) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const mode = useRef<"pointer" | "touch" | null>(null);
  const pointerId = useRef<number | null>(null);

  const commitSwipe = useCallback(
    (x: number, y: number) => {
      if (!start.current) return;
      const dx = x - start.current.x;
      const dy = y - start.current.y;
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

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // iOS Safari에서 방향별 touch 이벤트 누락이 있어 Pointer Events 우선 사용
    if (e.pointerType === "mouse") return;
    mode.current = "pointer";
    pointerId.current = e.pointerId;
    start.current = { x: e.clientX, y: e.clientY };
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "mouse") return;
      if (mode.current && mode.current !== "pointer") return;
      if (pointerId.current !== null && e.pointerId !== pointerId.current) return;
      commitSwipe(e.clientX, e.clientY);
      mode.current = null;
      pointerId.current = null;
      try {
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    },
    [commitSwipe],
  );

  const onPointerCancel = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "mouse") return;
    if (mode.current && mode.current !== "pointer") return;
    start.current = null;
    mode.current = null;
    pointerId.current = null;
    try {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }, []);

  // 일부 웹뷰/구형 브라우저 대비(보조 경로)
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (mode.current === "pointer") return;
    mode.current = "touch";
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (mode.current && mode.current !== "touch") return;
      const t = e.changedTouches[0];
      commitSwipe(t.clientX, t.clientY);
      mode.current = null;
    },
    [commitSwipe],
  );

  const onTouchCancel = useCallback(() => {
    if (mode.current && mode.current !== "touch") return;
    start.current = null;
    mode.current = null;
  }, []);

  return {
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    onTouchStart,
    onTouchEnd,
    onTouchCancel,
  };
}
