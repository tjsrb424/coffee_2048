"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  CAFE_ECONOMY,
  defaultMenuStock,
  MENU_UNLOCK_CAFE_LEVEL,
  trySellOneRoundRobin,
} from "@/features/meta/balance/cafeEconomy";
import {
  type CafeUpgradeTrack,
  CAFE_UPGRADE_MAX_LEVEL,
  getCafeRuntimeModifiers,
  recomputeCafeLevel,
  upgradeCost,
} from "@/features/meta/balance/cafeModifiers";
import { computePuzzleRewards } from "@/features/meta/rewards/computePuzzleRewards";
import { STORAGE_KEY } from "@/features/meta/storage/storageKeys";
import type {
  AppPersistState,
  CafeState,
  DrinkMenuId,
  MetaRuntimeState,
  PlayerResources,
  PuzzleProgress,
  SettingsState,
} from "@/features/meta/types/gameState";

const defaultResources: PlayerResources = {
  coins: 120,
  beans: 8,
  hearts: 3,
};

const defaultPuzzleProgress: PuzzleProgress = {
  bestScore: 0,
  bestTile: 0,
  lastRunScore: 0,
  lastRunTile: 0,
  lastRunCoins: 0,
  lastRunBeans: 0,
  lastRunHearts: 0,
  totalRuns: 0,
};

const defaultCafe: CafeState = {
  cafeLevel: 1,
  roastLevel: 1,
  displayLevel: 1,
  ambianceLevel: 1,
  espressoShots: 0,
  menuStock: defaultMenuStock(),
  lastAutoSellAtMs: 0,
  lastOfflineSaleAtMs: 0,
  lastOfflineSaleCoins: 0,
  lastOfflineSaleSoldCount: 0,
};

const defaultSettings: SettingsState = {
  soundOn: true,
  vibrationOn: true,
  reducedMotion: false,
};

const defaultMeta: MetaRuntimeState = {
  lastHeartRegenAtMs: 0,
};

const defaultState: AppPersistState = {
  playerResources: defaultResources,
  puzzleProgress: defaultPuzzleProgress,
  cafeState: defaultCafe,
  meta: defaultMeta,
  settings: defaultSettings,
};

export type AppStore = AppPersistState & {
  /** 퍼즐 세션 종료 시 호출 — 보상 반영 + 기록 갱신 */
  applyPuzzleRunOutcome: (input: {
    score: number;
    highestTile: number;
  }) => void;
  patchSettings: (patch: Partial<SettingsState>) => void;
  roastOnce: () => boolean;
  craftDrink: (id: DrinkMenuId) => boolean;
  /** 경과 시간만큼 자동 판매 처리. 코인 획득량 반환 */
  stepAutoSell: (nowMs: number) => {
    gainedCoins: number;
    soldCount: number;
    ticks: number;
  };
  recordOfflineSaleSummary: (input: {
    atMs: number;
    gainedCoins: number;
    soldCount: number;
  }) => void;
  purchaseCafeUpgrade: (track: CafeUpgradeTrack) => boolean;
  /** 개발자 디버그: 자원 수치 강제 조정 */
  patchPlayerResources: (patch: Partial<PlayerResources>) => void;
  /** 개발자 디버그: 카페 상태 일부 강제 조정 */
  patchCafeState: (patch: Partial<CafeState>) => void;
  /** 개발자 디버그: 퍼즐 진행 강제 조정 */
  patchPuzzleProgress: (patch: Partial<PuzzleProgress>) => void;
  /** 개발자 디버그: 저장 데이터 전체 덤프 */
  exportSave: () => AppPersistState;
  /** 개발자 디버그: 저장 데이터 전체 로드(최소 검증/보정 포함) */
  importSave: (data: unknown) => boolean;
  /** 개발자 디버그: 세이브 초기화(설정은 유지) */
  resetSave: () => void;
  /** 퍼즐 입장/재도전 비용(하트) 차감 */
  consumePuzzleHeart: () => boolean;
  /** 하트 자동 회복 틱 — 회복량 반환 */
  stepHeartRegen: (nowMs: number) => { gainedHearts: number; ticks: number };
};

function mergePersisted(persisted: unknown, current: AppStore): AppStore {
  if (!persisted || typeof persisted !== "object") return current;
  const p = persisted as Partial<AppPersistState>;
  return {
    ...current,
    playerResources: {
      ...defaultResources,
      ...current.playerResources,
      ...p.playerResources,
    },
    puzzleProgress: {
      ...defaultPuzzleProgress,
      ...current.puzzleProgress,
      ...p.puzzleProgress,
    },
    cafeState: (() => {
      const merged = { ...defaultCafe, ...current.cafeState, ...p.cafeState };
      merged.cafeLevel = recomputeCafeLevel(merged);
      return merged;
    })(),
    meta: {
      ...defaultMeta,
      ...current.meta,
      ...p.meta,
    },
    settings: {
      ...defaultSettings,
      ...current.settings,
      ...p.settings,
    },
  };
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...defaultState,
      applyPuzzleRunOutcome: ({ score, highestTile }) => {
        const rewards = computePuzzleRewards(score, highestTile);
        const prev = get();
        const nextBestScore = Math.max(prev.puzzleProgress.bestScore, score);
        const nextBestTile = Math.max(prev.puzzleProgress.bestTile, highestTile);
        set({
          playerResources: {
            coins: prev.playerResources.coins + rewards.coins,
            beans: prev.playerResources.beans + rewards.beans,
            hearts: prev.playerResources.hearts + rewards.hearts,
          },
          puzzleProgress: {
            bestScore: nextBestScore,
            bestTile: nextBestTile,
            lastRunScore: score,
            lastRunTile: highestTile,
            lastRunCoins: rewards.coins,
            lastRunBeans: rewards.beans,
            lastRunHearts: rewards.hearts,
            totalRuns: prev.puzzleProgress.totalRuns + 1,
          },
        });
      },
      patchSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
      roastOnce: () => {
        const prev = get();
        const cafe = prev.cafeState;
        const m = getCafeRuntimeModifiers(cafe);
        if (prev.playerResources.beans < m.roastBeanCost) return false;
        if (cafe.espressoShots >= m.maxShots) return false;
        set({
          playerResources: {
            ...prev.playerResources,
            beans: prev.playerResources.beans - m.roastBeanCost,
          },
          cafeState: {
            ...cafe,
            espressoShots: Math.min(
              m.maxShots,
              cafe.espressoShots + m.shotYield,
            ),
          },
        });
        return true;
      },
      craftDrink: (id: DrinkMenuId) => {
        const prev = get();
        const cafe = prev.cafeState;
        const requiredCafeLevel = MENU_UNLOCK_CAFE_LEVEL[id] ?? 1;
        if (cafe.cafeLevel < requiredCafeLevel) return false;
        const rec = CAFE_ECONOMY.recipe[id];
        if (cafe.espressoShots < rec.shots) return false;
        if (prev.playerResources.beans < rec.beans) return false;
        set({
          playerResources: {
            ...prev.playerResources,
            beans: prev.playerResources.beans - rec.beans,
          },
          cafeState: {
            ...cafe,
            espressoShots: cafe.espressoShots - rec.shots,
            menuStock: {
              ...cafe.menuStock,
              [id]: cafe.menuStock[id] + 1,
            },
          },
        });
        return true;
      },
      stepAutoSell: (nowMs) => {
        const prev = get();
        const cafe = prev.cafeState;
        let last = cafe.lastAutoSellAtMs;
        if (last === 0) {
          set({ cafeState: { ...cafe, lastAutoSellAtMs: nowMs } });
          return { gainedCoins: 0, soldCount: 0, ticks: 0 };
        }
        const m = getCafeRuntimeModifiers(cafe);
        const interval = m.autoSellIntervalMs;
        const maxTicks = m.autoSellMaxTicks;
        const grossTicks = Math.min(maxTicks, Math.floor((nowMs - last) / interval));
        if (grossTicks <= 0) return { gainedCoins: 0, soldCount: 0, ticks: 0 };

        let menuStock = { ...cafe.menuStock };
        let coins = prev.playerResources.coins;
        let gained = 0;
        let soldCount = 0;
        for (let i = 0; i < grossTicks; i++) {
          last += interval;
          const sold = trySellOneRoundRobin(menuStock, m.sellBonus);
          if (sold) {
            menuStock = sold.nextStock;
            coins += sold.coins;
            gained += sold.coins;
            soldCount += 1;
          }
        }
        set({
          playerResources: { ...prev.playerResources, coins },
          cafeState: {
            ...cafe,
            menuStock,
            lastAutoSellAtMs: last,
          },
        });
        return { gainedCoins: gained, soldCount, ticks: grossTicks };
      },
      recordOfflineSaleSummary: ({ atMs, gainedCoins, soldCount }) => {
        const prev = get();
        set({
          cafeState: {
            ...prev.cafeState,
            lastOfflineSaleAtMs: atMs,
            lastOfflineSaleCoins: gainedCoins,
            lastOfflineSaleSoldCount: soldCount,
          },
        });
      },
      purchaseCafeUpgrade: (track) => {
        const prev = get();
        const cafe = prev.cafeState;
        const key =
          track === "roast"
            ? "roastLevel"
            : track === "display"
              ? "displayLevel"
              : "ambianceLevel";
        const lv = cafe[key];
        if (lv >= CAFE_UPGRADE_MAX_LEVEL) return false;
        const cost = upgradeCost(track, lv);
        if (prev.playerResources.coins < cost) return false;
        const nextCafe: CafeState = {
          ...cafe,
          [key]: lv + 1,
        };
        nextCafe.cafeLevel = recomputeCafeLevel(nextCafe);
        set({
          playerResources: {
            ...prev.playerResources,
            coins: prev.playerResources.coins - cost,
          },
          cafeState: nextCafe,
        });
        return true;
      },
      patchPlayerResources: (patch) =>
        set((s) => ({
          playerResources: {
            ...s.playerResources,
            ...patch,
          },
        })),
      patchCafeState: (patch) =>
        set((s) => {
          const next: CafeState = {
            ...s.cafeState,
            ...patch,
          };
          next.cafeLevel = recomputeCafeLevel(next);
          return { cafeState: next };
        }),
      patchPuzzleProgress: (patch) =>
        set((s) => ({
          puzzleProgress: {
            ...s.puzzleProgress,
            ...patch,
          },
        })),
      exportSave: () => {
        const s = get();
        return {
          playerResources: s.playerResources,
          puzzleProgress: s.puzzleProgress,
          cafeState: s.cafeState,
          meta: s.meta,
          settings: s.settings,
        };
      },
      importSave: (data) => {
        if (!data || typeof data !== "object") return false;
        const input = data as Partial<AppPersistState>;
        const prev = get();
        const merged = mergePersisted(input, prev);
        set({
          playerResources: merged.playerResources,
          puzzleProgress: merged.puzzleProgress,
          cafeState: merged.cafeState,
          settings: merged.settings,
        });
        return true;
      },
      resetSave: () => {
        const prev = get();
        set({
          ...defaultState,
          settings: prev.settings,
        });
      },
      consumePuzzleHeart: () => {
        const prev = get();
        if (prev.playerResources.hearts <= 0) return false;
        set({
          playerResources: {
            ...prev.playerResources,
            hearts: prev.playerResources.hearts - 1,
          },
        });
        return true;
      },
      stepHeartRegen: (nowMs) => {
        const MAX_HEARTS = 5;
        const INTERVAL_MS = 10 * 60 * 1000; // 10분
        const prev = get();
        const hearts = prev.playerResources.hearts;
        const last = prev.meta.lastHeartRegenAtMs;

        if (hearts >= MAX_HEARTS) {
          // 만땅일 때는 누적되지 않게 기준 시각만 현재로 리셋
          if (last !== nowMs) set({ meta: { ...prev.meta, lastHeartRegenAtMs: nowMs } });
          return { gainedHearts: 0, ticks: 0 };
        }

        if (last === 0) {
          set({ meta: { ...prev.meta, lastHeartRegenAtMs: nowMs } });
          return { gainedHearts: 0, ticks: 0 };
        }

        const grossTicks = Math.floor((nowMs - last) / INTERVAL_MS);
        if (grossTicks <= 0) return { gainedHearts: 0, ticks: 0 };

        const canGain = Math.min(MAX_HEARTS - hearts, grossTicks);
        const nextLast = last + grossTicks * INTERVAL_MS;
        set({
          playerResources: {
            ...prev.playerResources,
            hearts: hearts + canGain,
          },
          meta: {
            ...prev.meta,
            lastHeartRegenAtMs: nextLast,
          },
        });
        return { gainedHearts: canGain, ticks: grossTicks };
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      merge: mergePersisted,
    },
  ),
);
