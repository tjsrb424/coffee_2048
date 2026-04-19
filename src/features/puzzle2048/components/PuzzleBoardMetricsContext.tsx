"use client";

import { createContext, useContext } from "react";

export type PuzzleBoardMetrics = {
  /** 측정된 보드 한 변(px). 0이면 아직 측정 전 */
  side: number;
  /** 타일 한 칸의 실제 픽셀 크기 */
  tileSize: number;
  /** 칸 사이 간격(px) */
  gap: number;
  /** 보드 내부 패딩(px) */
  pad: number;
};

export const PuzzleBoardMetricsContext = createContext<PuzzleBoardMetrics>({
  side: 0,
  tileSize: 0,
  gap: 0,
  pad: 0,
});

export function usePuzzleBoardMetrics() {
  return useContext(PuzzleBoardMetricsContext);
}
