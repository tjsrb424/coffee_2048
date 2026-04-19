"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { usePuzzleSessionStore } from "@/features/puzzle2048/store/usePuzzleSessionStore";
import { boardToTiles } from "@/features/puzzle2048/utils/boardToTiles";
import { PuzzleBoardMetricsContext } from "./PuzzleBoardMetricsContext";
import { PuzzleTile } from "./PuzzleTile";

const MAX_SIDE_REM = 21; // max-w-[21rem]
const GAP_PX = 6; // gap-1.5
const PAD_PX = 8; // p-2

export function PuzzleBoard() {
  const board = usePuzzleSessionStore((s) => s.board);
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
      const next = Math.floor(Math.min(r.width, r.height, maxW));
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
              className="relative h-full w-full overflow-hidden rounded-[1.15rem] ring-1 ring-coffee-900/10 ring-inset sm:rounded-[1.35rem]"
            >
              <div
                className="grid h-full w-full grid-cols-4 rounded-3xl bg-coffee-900/10 shadow-inner"
                style={{
                  gap: GAP_PX,
                  padding: PAD_PX,
                  gridTemplateRows: "repeat(4, minmax(0, 1fr))",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                }}
              >
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    className="min-h-0 min-w-0 rounded-xl bg-cream-200/75 sm:rounded-2xl"
                  />
                ))}
              </div>
              <div
                className="pointer-events-none absolute inset-0"
                aria-live="off"
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
