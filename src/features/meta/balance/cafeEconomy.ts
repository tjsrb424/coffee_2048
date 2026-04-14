import type { DrinkMenuId, MenuStock } from "@/features/meta/types/gameState";

export const MENU_ORDER: DrinkMenuId[] = ["americano", "latte", "affogato"];

/** 메뉴 해금 기준 — Phase 4 성장 구조(최소 버전) */
export const MENU_UNLOCK_CAFE_LEVEL: Record<DrinkMenuId, number> = {
  americano: 1,
  latte: 2,
  affogato: 3,
};

export const CAFE_ECONOMY = {
  roastBeanCost: 2,
  shotYield: 3,
  maxShots: 24,
  autoSellIntervalMs: 4000,
  /** 한 번에 돌릴 최대 판매 틱 (오프라인·복귀 시 폭주 방지) */
  autoSellMaxTicks: 18,
  recipe: {
    americano: { shots: 1, beans: 0 },
    latte: { shots: 1, beans: 1 },
    affogato: { shots: 1, beans: 1 },
  },
  sellPrice: {
    americano: 10,
    latte: 16,
    affogato: 22,
  },
} as const;

export const MENU_LABEL: Record<DrinkMenuId, string> = {
  americano: "아메리카노",
  latte: "카페 라떼",
  affogato: "아포가토",
};

export function defaultMenuStock(): MenuStock {
  return { americano: 0, latte: 0, affogato: 0 };
}

export function trySellOneRoundRobin(
  stock: MenuStock,
  sellBonus = 0,
): { id: DrinkMenuId; coins: number; nextStock: MenuStock } | null {
  for (const id of MENU_ORDER) {
    if (stock[id] > 0) {
      return {
        id,
        coins: CAFE_ECONOMY.sellPrice[id] + sellBonus,
        nextStock: { ...stock, [id]: stock[id] - 1 },
      };
    }
  }
  return null;
}
