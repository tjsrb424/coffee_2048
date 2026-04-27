import type { CSSProperties } from "react";

/**
 * 기준 좌표계 — `public/images/ingame/ingame_reference.png` 원본 픽셀과 동일해야
 * 오버레이/튜닝이 시안과 맞습니다. 시안 PNG가 바뀌면 이 값을 그 크기에 맞춰 갱신하세요.
 */
export const PUZZLE_LAYOUT_BASE = {
  width: 750,
  height: 1600,
} as const;

export const PUZZLE_LAYOUT_VERSION = 5;

export type PuzzleLayoutItem = {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  zIndex: number;
  opacity?: number;
};

export const PUZZLE_LAYOUT_KEYS = [
  "background",
  "titleLogo",
  "exitButton",
  "pauseButton",
  "goalPanel",
  "goalRibbonText",
  "goalText",
  "currentTileLabel",
  "currentTileValue",
  "scoreCard",
  "scoreLabel",
  "scoreValue",
  "bestScoreCard",
  "bestScoreLabel",
  "bestScoreValue",
  "bestTileCard",
  "bestTileLabel",
  "bestTileValue",
  "rewardPanel",
  "rewardTitle",
  "rewardCoinValue",
  "rewardBeanValue",
  "midDecor",
  "puzzleFrame",
  "boardBacking",
  "boardGrid",
  "tileLayer",
  "bottomDecor",
  "bottomGuideText",
] as const;

export type PuzzleLayoutKey = (typeof PUZZLE_LAYOUT_KEYS)[number];
export type PuzzleLayout = Record<PuzzleLayoutKey, PuzzleLayoutItem>;
export type PuzzleLayoutPatch = Partial<
  Record<PuzzleLayoutKey, Partial<PuzzleLayoutItem>>
>;

/** `&` 등 파일명 이슈 시 우선 사용할 안전한 공개 경로 */
export const INGAME_IMAGE_PATHS = {
  reference: "/images/ingame/ingame_reference.png",
  bgBase: "/images/ingame/ingame_bg_base.png",
  titleLogo: "/images/ingame/ingame_title_logo.png",
  btnOut: "/images/ingame/ingame_btn_out.png",
  hudGoalScore: "/images/ingame/ingame_hud_goal_score.png",
  /** 레거시/오타 파일명 대비 */
  hudGoalScoreAmp: "/images/ingame/ingame_hud_goal&score.png",
  hudScore: "/images/ingame/ingame_hud_score.png",
  hudBestScore: "/images/ingame/ingame_hud_bestscore.png",
  hudBestTile: "/images/ingame/ingame_hud_besttile.png",
  hudReward: "/images/ingame/ingame_hud_reward.png",
  hudMid: "/images/ingame/ingame_hud_mid.png",
  hudPuzzleFrame: "/images/ingame/ingame_hud_puzzleframe.png",
  hudBottom: "/images/ingame/ingame_hud_bottom.png",
} as const;

export const PUZZLE_LAYOUT_LABELS: Record<PuzzleLayoutKey, string> = {
  background: "Background",
  titleLogo: "Title logo",
  exitButton: "Exit button",
  pauseButton: "Pause button",
  goalPanel: "Goal panel (PNG)",
  goalRibbonText: "Goal ribbon text",
  goalText: "Goal text",
  currentTileLabel: "Current tile label",
  currentTileValue: "Current tile value",
  scoreCard: "Score card (PNG)",
  scoreLabel: "Score label",
  scoreValue: "Score value",
  bestScoreCard: "Best score card (PNG)",
  bestScoreLabel: "Best score label",
  bestScoreValue: "Best score value",
  bestTileCard: "Best tile card (PNG)",
  bestTileLabel: "Best tile label",
  bestTileValue: "Best tile value",
  rewardPanel: "Reward panel (PNG)",
  rewardTitle: "Reward title",
  rewardCoinValue: "Reward coin value",
  rewardBeanValue: "Reward bean value",
  midDecor: "Mid decor (shelf)",
  puzzleFrame: "Puzzle frame (PNG)",
  boardBacking: "Board backing (색 백판)",
  boardGrid: "Board grid (touch + cells)",
  tileLayer: "Tile layer (z만 사용)",
  bottomDecor: "Bottom decor (PNG)",
  bottomGuideText: "Bottom guide text",
};

/** 튜닝 패널에서 선택 시 표시하는 짧은 설명 */
export const PUZZLE_LAYOUT_HINTS: Partial<Record<PuzzleLayoutKey, string>> = {
  tileLayer:
    "별도 UI 박스가 아닙니다. 4×4 숫자 타일이 셀 배경보다 위로 보이게 하기 위한 z-index 보조값이에요. 실제 그리기는 모두 boardGrid 안에서 하고, tileLayer.zIndex − boardGrid.zIndex 만 타일 레이어에 반영됩니다. 위치·크기는 보통 boardGrid와 동일하게 두면 됩니다.",
  boardBacking:
    "PNG 프레임 안쪽, 격자·타일 뒤에 깔리는 크림톤 백판입니다. 퍼즐 배경 스킨과 겹치므로 밝기만 맞추면 됩니다.",
};

export const puzzleLayout: PuzzleLayout = {
  background: {
    x: 0,
    y: 0,
    width: 750,
    height: 1600,
    scale: 1,
    zIndex: 0,
  },
  titleLogo: {
    x: -229,
    y: -15,
    width: 373,
    height: 88,
    scale: 2.11,
    zIndex: 25,
  },
  exitButton: {
    x: 598,
    y: 44,
    width: 112,
    height: 76,
    scale: 1.14,
    zIndex: 50,
  },
  pauseButton: {
    x: 466,
    y: 49,
    width: 112,
    height: 76,
    scale: 1,
    zIndex: 50,
  },
  goalPanel: {
    x: -260,
    y: 148,
    width: 686,
    height: 92,
    scale: 1.9,
    zIndex: 20,
  },
  goalRibbonText: {
    x: 137,
    y: 228,
    width: 120,
    height: 28,
    scale: 1,
    zIndex: 40,
  },
  goalText: {
    x: 128,
    y: 227,
    width: 418,
    height: 36,
    scale: 1.23,
    zIndex: 40,
  },
  currentTileLabel: {
    x: 541,
    y: 223,
    width: 124,
    height: 18,
    scale: 1,
    zIndex: 41,
  },
  currentTileValue: {
    x: 541,
    y: 245,
    width: 124,
    height: 28,
    scale: 1,
    zIndex: 41,
  },
  scoreCard: {
    x: -10,
    y: 325,
    width: 200,
    height: 108,
    scale: 1.45,
    zIndex: 22,
    opacity: 1,
  },
  scoreLabel: {
    x: 120,
    y: 337,
    width: 180,
    height: 22,
    scale: 1,
    zIndex: 40,
  },
  scoreValue: {
    x: 44,
    y: 371,
    width: 180,
    height: 64,
    scale: 1,
    zIndex: 40,
  },
  bestScoreCard: {
    x: 223,
    y: 327,
    width: 216,
    height: 108,
    scale: 1.45,
    zIndex: 22,
  },
  bestScoreLabel: {
    x: 367,
    y: 337,
    width: 180,
    height: 22,
    scale: 1,
    zIndex: 40,
  },
  bestScoreValue: {
    x: 291,
    y: 373,
    width: 180,
    height: 64,
    scale: 1,
    zIndex: 40,
  },
  bestTileCard: {
    x: 468,
    y: 326,
    width: 214,
    height: 108,
    scale: 1.45,
    zIndex: 22,
  },
  bestTileLabel: {
    x: 537,
    y: 334,
    width: 182,
    height: 22,
    scale: 1,
    zIndex: 40,
  },
  bestTileValue: {
    x: 534,
    y: 382,
    width: 182,
    height: 48,
    scale: 1,
    zIndex: 40,
  },
  rewardPanel: {
    x: 33,
    y: 493,
    width: 686,
    height: 168,
    scale: 1,
    zIndex: 58,
  },
  rewardTitle: {
    x: 52,
    y: 503,
    width: 654,
    height: 24,
    scale: 1,
    zIndex: 59,
    opacity: 0,
  },
  rewardCoinValue: {
    x: 172,
    y: 546,
    width: 180,
    height: 96,
    scale: 1,
    zIndex: 59,
  },
  rewardBeanValue: {
    x: 411,
    y: 548,
    width: 178,
    height: 96,
    scale: 1,
    zIndex: 59,
  },
  midDecor: {
    x: 0,
    y: 560,
    width: 750,
    height: 280,
    scale: 1,
    zIndex: 15,
  },
  puzzleFrame: {
    x: -65,
    y: 575,
    width: 614,
    height: 641,
    scale: 1.44,
    zIndex: 50,
  },
  boardBacking: {
    x: 79,
    y: 684,
    width: 596,
    height: 720,
    scale: 1,
    zIndex: 31,
    opacity: 1,
  },
  boardGrid: {
    x: 29,
    y: 689,
    width: 576,
    height: 576,
    scale: 1.21,
    zIndex: 35,
  },
  tileLayer: {
    x: 87,
    y: 852,
    width: 576,
    height: 576,
    scale: 1,
    zIndex: 36,
    opacity: 1,
  },
  bottomDecor: {
    x: 0,
    y: 1180,
    width: 750,
    height: 420,
    scale: 1,
    zIndex: 62,
  },
  bottomGuideText: {
    x: 48,
    y: 1510,
    width: 654,
    height: 72,
    scale: 1,
    zIndex: 40,
  },
};

function numericOrFallback(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function mergePuzzleLayoutPatch(
  base: PuzzleLayout,
  patch: unknown,
): PuzzleLayout {
  if (!patch || typeof patch !== "object") return base;

  return PUZZLE_LAYOUT_KEYS.reduce((next, key) => {
    const patchItem = (patch as PuzzleLayoutPatch)[key];
    if (!patchItem || typeof patchItem !== "object") {
      next[key] = base[key];
      return next;
    }

    next[key] = {
      x: numericOrFallback(patchItem.x, base[key].x),
      y: numericOrFallback(patchItem.y, base[key].y),
      width: numericOrFallback(patchItem.width, base[key].width),
      height: numericOrFallback(patchItem.height, base[key].height),
      scale: numericOrFallback(patchItem.scale, base[key].scale),
      zIndex: numericOrFallback(patchItem.zIndex, base[key].zIndex),
      opacity:
        patchItem.opacity == null
          ? base[key].opacity
          : numericOrFallback(patchItem.opacity, base[key].opacity ?? 1),
    };
    return next;
  }, {} as PuzzleLayout);
}

export function puzzleLayoutItemStyle(item: PuzzleLayoutItem): CSSProperties {
  return {
    left: `${(item.x / PUZZLE_LAYOUT_BASE.width) * 100}%`,
    top: `${(item.y / PUZZLE_LAYOUT_BASE.height) * 100}%`,
    width: `${(item.width / PUZZLE_LAYOUT_BASE.width) * 100}%`,
    height: `${(item.height / PUZZLE_LAYOUT_BASE.height) * 100}%`,
    transform: `scale(${item.scale})`,
    transformOrigin: "top left",
    zIndex: item.zIndex,
    opacity: item.opacity ?? 1,
  };
}
