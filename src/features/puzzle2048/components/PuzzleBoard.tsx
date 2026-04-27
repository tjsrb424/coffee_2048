"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { usePuzzleSessionStore } from "@/features/puzzle2048/store/usePuzzleSessionStore";
import { boardToTiles } from "@/features/puzzle2048/utils/boardToTiles";
import {
  puzzleBoardClassForSkin,
  puzzleCellClassForSkin,
} from "@/features/meta/cosmetics/puzzleSkins";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/useAppStore";
import { PuzzleBoardMetricsContext } from "./PuzzleBoardMetricsContext";
import { PuzzleTile } from "./PuzzleTile";

const MAX_SIDE_REM = 21; // max-w-[21rem]
const GAP_PX = 6; // gap-1.5
const PAD_PX = 8; // p-2

type PuzzleBoardProps = {
  /** PNG 프레임 셸 안에서 링/라운드 이중 테두리를 줄이고 타일만 올린다. */
  shellVisual?: boolean;
  /** 셸 모드에서 셀 그리드 / 타일 레이어의 쌓임 순서(레이아웃 `boardGrid`·`tileLayer`와 맞춤). */
  cellStackZ?: number;
  tileStackZ?: number;
};

export function PuzzleBoard({
  shellVisual = false,
  cellStackZ = 0,
  tileStackZ = 1,
}: PuzzleBoardProps = {}) {
  const board = usePuzzleSessionStore((s) => s.board);
  const backgroundSkinId = useAppStore(
    (s) => s.cosmetics.equippedPuzzleBackgroundSkinId,
  );
  const tiles = boardToTiles(board);
  const slotRef = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState(300);
  const tileSize = Math.max(0, (side - PAD_PX * 2 - GAP_PX * 3) / 4);

  useLayoutEffect(() => {
    const el = slotRef.current;
    if (!el) return;

    let raf = 0;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const remPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const maxW = MAX_SIDE_REM * remPx;
      const unscaledWidth = el.clientWidth || r.width;
      const unscaledHeight = el.clientHeight || r.height;
      const next = Math.floor(Math.min(unscaledWidth, unscaledHeight, maxW));
      if (next < 8) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(measure);
        return;
      }
      setSide(next);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <PuzzleBoardMetricsContext.Provider
      value={{ side, tileSize, gap: GAP_PX, pad: PAD_PX }}
    >
      <div
        ref={slotRef}
        className="relative flex h-full min-h-0 w-full min-w-0 items-center justify-center"
      >
        <div
            className="relative shrink-0 will-change-transform"
            style={{ width: side, height: side }}
          >
            <div
              data-testid="puzzle-board-visual-mask"
              className={cn(
                "relative h-full w-full overflow-hidden",
                shellVisual
                  ? "rounded-none ring-0"
                  : "rounded-[1.15rem] ring-1 ring-coffee-900/10 ring-inset sm:rounded-[1.35rem]",
              )}
            >
              <div
                className={cn(
                  "grid h-full w-full grid-cols-4 shadow-inner",
                  shellVisual ? "rounded-none" : "rounded-3xl",
                  puzzleBoardClassForSkin(backgroundSkinId),
                )}
                style={{
                  gap: GAP_PX,
                  padding: PAD_PX,
                  gridTemplateRows: "repeat(4, minmax(0, 1fr))",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  zIndex: cellStackZ,
                }}
              >
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "min-h-0 min-w-0",
                      shellVisual
                        ? "rounded-lg sm:rounded-xl"
                        : "rounded-xl sm:rounded-2xl",
                      puzzleCellClassForSkin(backgroundSkinId),
                    )}
                  />
                ))}
              </div>
              <div
                className="pointer-events-none absolute inset-0"
                aria-live="off"
                style={{ zIndex: tileStackZ }}
              >
                {tiles.map((t) => (
                  <PuzzleTile key={t.id} tile={t} />
                ))}
              </div>
            </div>
          </div>
      </div>
    </PuzzleBoardMetricsContext.Provider>
  );
}
