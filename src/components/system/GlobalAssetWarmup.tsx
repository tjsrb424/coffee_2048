"use client";

import { useEffect } from "react";
import { publicAssetPath } from "@/lib/publicAssetPath";

const WARM_IMAGE_PATHS = [
  "/images/optimized/brand/cafe-2048-title-2.webp",
  "/images/optimized/ui/coin.webp",
  "/images/optimized/ui/bean.webp",
  "/images/optimized/ui/heart.webp",
  "/images/optimized/ui/espresso-shot.webp",
  "/images/optimized/ui/lobby-white-panel-figma.webp",
  "/images/optimized/ui/lobby-roaster-tile.webp",
  "/images/optimized/ui/lobby-workbench-tile.webp",
  "/images/optimized/ui/lobby-counter-tile.webp",
  "/images/optimized/ui/roaster-machine-2.webp",
  "/images/optimized/ui/workbench.webp",
  "/images/optimized/ui/counter-machine.webp",
  "/images/optimized/drink/아메리카노.webp",
  "/images/optimized/drink/카페라떼.webp",
  "/images/optimized/drink/아포가토.webp",
] as const;

type WindowWithIdle = Window &
  typeof globalThis & {
    requestIdleCallback?: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions,
    ) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

function warmImage(path: string) {
  const img = new window.Image();
  img.decoding = "async";
  img.src = publicAssetPath(path);
  if (typeof img.decode === "function") {
    void img.decode().catch(() => {});
  }
}

export function GlobalAssetWarmup() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const w = window as WindowWithIdle;
    let cancelled = false;
    let index = 0;
    let cancelScheduled: (() => void) | null = null;

    const schedule = (callback: () => void, timeout = 1000) => {
      if (w.requestIdleCallback) {
        const id = w.requestIdleCallback(() => callback(), { timeout });
        return () => w.cancelIdleCallback?.(id);
      }
      const id = window.setTimeout(callback, 220);
      return () => window.clearTimeout(id);
    };

    const warmBatch = () => {
      if (cancelled) return;
      for (let n = 0; n < 3 && index < WARM_IMAGE_PATHS.length; n += 1) {
        warmImage(WARM_IMAGE_PATHS[index]);
        index += 1;
      }
      if (index < WARM_IMAGE_PATHS.length) {
        cancelScheduled = schedule(warmBatch, 1600);
      }
    };

    cancelScheduled = schedule(warmBatch, 1200);
    return () => {
      cancelled = true;
      cancelScheduled?.();
    };
  }, []);

  return null;
}
