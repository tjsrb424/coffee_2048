"use client";

import { createContext, useContext } from "react";

export type PuzzleBoardMetrics = {
  /** 측정된 보드 한 변(px). 0이면 아직 측정 전 */
  side: number;
};

export const PuzzleBoardMetricsContext = createContext<PuzzleBoardMetrics>({
  side: 0,
});

export function usePuzzleBoardMetrics() {
  return useContext(PuzzleBoardMetricsContext);
}
