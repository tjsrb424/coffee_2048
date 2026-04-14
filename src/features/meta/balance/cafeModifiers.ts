import { CAFE_ECONOMY } from "@/features/meta/balance/cafeEconomy";
import type { CafeState } from "@/features/meta/types/gameState";

/** 트랙별 업그레이드 상한 (레벨 수치) */
export const CAFE_UPGRADE_MAX_LEVEL = 12;

export type CafeUpgradeTrack = "roast" | "display" | "ambiance";

const UPGRADE_COST = {
  roast: { base: 52, perLevel: 30 },
  display: { base: 48, perLevel: 34 },
  ambiance: { base: 50, perLevel: 32 },
} as const;

export function upgradeCost(
  track: CafeUpgradeTrack,
  currentLevel: number,
): number {
  if (currentLevel >= CAFE_UPGRADE_MAX_LEVEL) return Number.POSITIVE_INFINITY;
  const t = UPGRADE_COST[track];
  return t.base + (currentLevel - 1) * t.perLevel;
}

/** 세 트랙 합진도로 매장 표시 레벨을 다시 맞춤 */
export function recomputeCafeLevel(cafe: CafeState): number {
  const sum =
    cafe.roastLevel + cafe.displayLevel + cafe.ambianceLevel;
  return Math.min(40, 1 + Math.floor((sum - 3) / 3));
}

/** 로스팅·판매 타이밍·가격 보정을 한 번에 */
export function getCafeRuntimeModifiers(cafe: CafeState) {
  const rl = Math.max(1, cafe.roastLevel);
  const dl = Math.max(1, cafe.displayLevel);
  const al = Math.max(1, cafe.ambianceLevel);
  return {
    roastBeanCost: Math.max(
      1,
      CAFE_ECONOMY.roastBeanCost - Math.floor((rl - 1) / 5),
    ),
    shotYield: CAFE_ECONOMY.shotYield + Math.floor((rl - 1) / 3),
    maxShots: CAFE_ECONOMY.maxShots + (rl - 1) * 2,
    autoSellIntervalMs: Math.max(
      2600,
      CAFE_ECONOMY.autoSellIntervalMs - (al - 1) * 110,
    ),
    autoSellMaxTicks:
      CAFE_ECONOMY.autoSellMaxTicks + Math.floor((dl - 1) / 2),
    sellBonus: Math.floor((dl - 1) / 2),
  };
}
