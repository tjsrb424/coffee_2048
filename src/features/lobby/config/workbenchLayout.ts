export const WORKBENCH_LAYOUT_BASE = {
  width: 942,
  height: 1672,
} as const;

export type WorkbenchLayoutItem = {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  zIndex: number;
  opacity?: number;
};

export const WORKBENCH_LAYOUT_KEYS = [
  "topHud",
  "backButton",
  "title",
  "shotHud",
  "categoryTabs",
  "filterBar",
  "recipeGrid",
  "cardStatusBadge",
  "cardNewBadge",
  "cardFavorite",
  "cardDrinkImage",
  "cardTitle",
  "cardCategoryBadge",
  "cardMaterials",
  "cardMaterialIcon",
  "cardMaterialText",
  "cardCraftButton",
  "bottomHud",
  "bottomPanel",
  "bottomLabel",
  "bottomDrinkImage",
  "bottomTitle",
  "bottomCategoryBadge",
  "bottomDescription",
  "bottomStepper",
  "bottomCraftButton",
  "bottomCraftButtonText",
] as const;

export type WorkbenchLayoutKey = (typeof WORKBENCH_LAYOUT_KEYS)[number];
export type WorkbenchLayout = Record<WorkbenchLayoutKey, WorkbenchLayoutItem>;
export type WorkbenchLayoutPatch = Partial<
  Record<WorkbenchLayoutKey, Partial<WorkbenchLayoutItem>>
>;

export const WORKBENCH_LAYOUT_LABELS: Record<WorkbenchLayoutKey, string> = {
  topHud: "Top HUD",
  backButton: "Back button",
  title: "Title",
  shotHud: "Shot HUD",
  categoryTabs: "Category tabs",
  filterBar: "Filter bar",
  recipeGrid: "Recipe grid",
  cardStatusBadge: "Card status badge",
  cardNewBadge: "Card NEW badge",
  cardFavorite: "Card favorite",
  cardDrinkImage: "Card drink image",
  cardTitle: "Card title",
  cardCategoryBadge: "Card category badge",
  cardMaterials: "Card materials",
  cardMaterialIcon: "Card material icon",
  cardMaterialText: "Card material text",
  cardCraftButton: "Card craft button",
  bottomHud: "Bottom HUD",
  bottomPanel: "Bottom panel",
  bottomLabel: "Bottom label",
  bottomDrinkImage: "Bottom drink image",
  bottomTitle: "Bottom title",
  bottomCategoryBadge: "Bottom category badge",
  bottomDescription: "Bottom description",
  bottomStepper: "Bottom stepper",
  bottomCraftButton: "Bottom craft button",
  bottomCraftButtonText: "Bottom craft text",
};

/**
 * 후속 에셋 매핑 키:
 * - topBar: 헤더 배경/타이틀 리본/뒤로가기 버튼 베이스
 * - currencyBar: 코인/원두/하트 아이콘 및 캡슐 배경
 * - categoryTabs: 탭 배경/활성 탭 프레임/카테고리 아이콘
 * - recipeFilterBar: 정렬/필터/리스트 버튼 베이스
 * - recipeGrid: 카드 프레임/상태 배지/썸네일 이미지
 * - bottomPanel: 하단 선택 패널 배경/캐릭터 장식
 * - quantityStepper: +/- 스텝퍼 프레임
 * - craftCta: 메인 제작 버튼 9-slice 또는 단일 PNG
 */
export const workbenchLayout: WorkbenchLayout = {
  topHud: { x: 0, y: 0, width: 942, height: 350, scale: 1, zIndex: 10 },
  backButton: { x: 24, y: 96, width: 96, height: 88, scale: 1, zIndex: 30 },
  title: { x: 145, y: 105, width: 365, height: 102, scale: 1, zIndex: 25 },
  shotHud: { x: 642, y: 105, width: 250, height: 70, scale: 1, zIndex: 30 },
  categoryTabs: { x: 36, y: 255, width: 876, height: 118, scale: 1, zIndex: 15 },
  filterBar: { x: 8, y: 20, width: 890, height: 78, scale: 1, zIndex: 25, opacity: 1 },
  recipeGrid: { x: 16, y: 363, width: 910, height: 1619, scale: 1, zIndex: 20 },
  cardStatusBadge: { x: 2, y: 277, width: 160, height: 48, scale: 1, zIndex: 20 },
  cardNewBadge: { x: 2, y: 18, width: 160, height: 48, scale: 1.1, zIndex: 20 },
  cardFavorite: { x: 345, y: 18, width: 44, height: 44, scale: 0.78, zIndex: 20 },
  cardDrinkImage: { x: 9, y: 118, width: 160, height: 160, scale: 1, zIndex: 10 },
  cardTitle: { x: 149, y: 30, width: 252, height: 54, scale: 0.7, zIndex: 15 },
  cardCategoryBadge: { x: 170, y: 70, width: 138, height: 30, scale: 0.73, zIndex: 16 },
  cardMaterials: { x: 166, y: 120, width: 176, height: 105, scale: 1.31, zIndex: 15 },
  cardMaterialIcon: { x: 15, y: 11, width: 40, height: 34, scale: 0.82, zIndex: 10 },
  cardMaterialText: { x: 11, y: 48, width: 48, height: 50, scale: 0.84, zIndex: 10 },
  cardCraftButton: { x: 187, y: 265, width: 214, height: 58, scale: 0.88, zIndex: 18 },
  bottomHud: { x: 0, y: 1365, width: 942, height: 267, scale: 1, zIndex: 91 },
  bottomPanel: { x: 10, y: 1230, width: 942, height: 420, scale: 0.97, zIndex: 35 },
  bottomLabel: { x: 66, y: 134, width: 190, height: 44, scale: 1, zIndex: 20 },
  bottomDrinkImage: { x: 40, y: 155, width: 235, height: 230, scale: 1.1, zIndex: 10 },
  bottomTitle: { x: 290, y: 188, width: 360, height: 58, scale: 0.8, zIndex: 20 },
  bottomCategoryBadge: { x: 290, y: 242, width: 138, height: 34, scale: 0.82, zIndex: 20 },
  bottomDescription: { x: 290, y: 290, width: 380, height: 80, scale: 0.79, zIndex: 20 },
  bottomStepper: { x: 650, y: 192, width: 210, height: 64, scale: 1, zIndex: 20, opacity: 1 },
  bottomCraftButton: { x: 600, y: 275, width: 300, height: 78, scale: 1, zIndex: 20 },
  bottomCraftButtonText: { x: 60, y: 16, width: 220, height: 54, scale: 1, zIndex: 25 },
};

function numericOrFallback(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function mergeWorkbenchLayoutPatch(
  base: WorkbenchLayout,
  patch: unknown,
): WorkbenchLayout {
  if (!patch || typeof patch !== "object") return base;

  return WORKBENCH_LAYOUT_KEYS.reduce((next, key) => {
    const patchItem = (patch as WorkbenchLayoutPatch)[key];
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
  }, {} as WorkbenchLayout);
}
