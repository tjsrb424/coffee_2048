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
  BmEntitlementsState,
  CafeState,
  CosmeticsState,
  DrinkMenuId,
  LiveOpsSaveState,
  MetaRuntimeState,
  PassProgressState,
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
  displaySellingActive: false,
  lastAutoSellAtMs: 0,
  lastOfflineSaleAtMs: 0,
  lastOfflineSaleCoins: 0,
  lastOfflineSaleSoldCount: 0,
};

const defaultSettings: SettingsState = {
  soundOn: true,
  vibrationOn: true,
  reducedMotion: false,
  lobbyOnboardingSeen: false,
};

const defaultMeta: MetaRuntimeState = {
  lastHeartRegenAtMs: 0,
};

const defaultBm: BmEntitlementsState = {
  adFree: false,
  supporterTier: 0,
};

const defaultCosmetics: CosmeticsState = {
  equippedThemeId: "default",
  ownedThemeIds: ["default"],
};

const defaultPassProgress: PassProgressState = {
  seasonId: "s0",
  tier: 0,
  xp: 0,
  premiumUnlocked: false,
};

const defaultLiveOps: LiveOpsSaveState = {
  unlockedGuestIds: [],
  activeEventIds: [],
};

const defaultState: AppPersistState = {
  playerResources: defaultResources,
  puzzleProgress: defaultPuzzleProgress,
  cafeState: defaultCafe,
  meta: defaultMeta,
  settings: defaultSettings,
  bm: defaultBm,
  cosmetics: defaultCosmetics,
  passProgress: defaultPassProgress,
  liveOps: defaultLiveOps,
  ownedProductIds: [],
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
    /** 이번 배치 메뉴별 판매 잔 수(애정도 선호 보너스용) */
    soldByMenu: Partial<Record<DrinkMenuId, number>>;
  };
  /** 진열 재고가 있을 때 판매 세션 시작(이후에만 판매 틱 적용) */
  startDisplaySelling: () => boolean;
  /** 진행 중인 진열 판매를 수동 중지 */
  stopDisplaySelling: () => boolean;
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
  patchBm: (patch: Partial<BmEntitlementsState>) => void;
  patchCosmetics: (patch: Partial<CosmeticsState>) => void;
  /** 소유한 테마만 장착 */
  equipThemeIfOwned: (themeId: string) => boolean;
  /** 상점 placeholder: 상품 ID 기록 + 테마 해금(실결제 없음) */
  grantPlaceholderProduct: (input: {
    productId: string;
    unlockThemeIds?: string[];
  }) => void;
  patchPassProgress: (patch: Partial<PassProgressState>) => void;
  patchLiveOps: (patch: Partial<LiveOpsSaveState>) => void;
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
    bm: {
      ...defaultBm,
      ...current.bm,
      ...(p.bm ?? {}),
    },
    cosmetics: (() => {
      const merged: CosmeticsState = {
        ...defaultCosmetics,
        ...current.cosmetics,
        ...(p.cosmetics ?? {}),
        ownedThemeIds: Array.from(
          new Set([
            ...defaultCosmetics.ownedThemeIds,
            ...(current.cosmetics?.ownedThemeIds ?? []),
            ...(p.cosmetics?.ownedThemeIds ?? []),
          ]),
        ),
      };
      if (!merged.ownedThemeIds.includes(merged.equippedThemeId)) {
        merged.equippedThemeId = "default";
      }
      return merged;
    })(),
    passProgress: {
      ...defaultPassProgress,
      ...current.passProgress,
      ...(p.passProgress ?? {}),
    },
    liveOps: {
      ...defaultLiveOps,
      ...current.liveOps,
      ...(p.liveOps ?? {}),
      unlockedGuestIds: Array.from(
        new Set([
          ...(current.liveOps?.unlockedGuestIds ?? []),
          ...(p.liveOps?.unlockedGuestIds ?? []),
        ]),
      ),
      activeEventIds: Array.from(
        new Set([
          ...(current.liveOps?.activeEventIds ?? []),
          ...(p.liveOps?.activeEventIds ?? []),
        ]),
      ),
    },
    ownedProductIds: Array.from(
      new Set([
        ...(current.ownedProductIds ?? []),
        ...(p.ownedProductIds ?? []),
      ]),
    ),
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
        if (!cafe.displaySellingActive) {
          return {
            gainedCoins: 0,
            soldCount: 0,
            ticks: 0,
            soldByMenu: {},
          };
        }

        const totalStart =
          cafe.menuStock.americano +
          cafe.menuStock.latte +
          cafe.menuStock.affogato;
        if (totalStart <= 0) {
          set({
            cafeState: { ...cafe, displaySellingActive: false },
          });
          return {
            gainedCoins: 0,
            soldCount: 0,
            ticks: 0,
            soldByMenu: {},
          };
        }

        let last = cafe.lastAutoSellAtMs;
        if (last === 0) {
          set({ cafeState: { ...cafe, lastAutoSellAtMs: nowMs } });
          return {
            gainedCoins: 0,
            soldCount: 0,
            ticks: 0,
            soldByMenu: {},
          };
        }

        const m = getCafeRuntimeModifiers(cafe);
        const interval = m.autoSellIntervalMs;
        const maxTicks = m.autoSellMaxTicks;
        const grossTicks = Math.min(maxTicks, Math.floor((nowMs - last) / interval));
        if (grossTicks <= 0)
          return { gainedCoins: 0, soldCount: 0, ticks: 0, soldByMenu: {} };

        let menuStock = { ...cafe.menuStock };
        let coins = prev.playerResources.coins;
        let gained = 0;
        let soldCount = 0;
        let executedTicks = 0;
        const soldByMenu: Partial<Record<DrinkMenuId, number>> = {};
        for (let i = 0; i < grossTicks; i++) {
          const sold = trySellOneRoundRobin(menuStock, m.sellBonus);
          if (!sold) break;
          last += interval;
          executedTicks += 1;
          menuStock = sold.nextStock;
          coins += sold.coins;
          gained += sold.coins;
          soldCount += 1;
          soldByMenu[sold.id] = (soldByMenu[sold.id] ?? 0) + 1;
        }

        const remaining =
          menuStock.americano + menuStock.latte + menuStock.affogato;

        set({
          playerResources: { ...prev.playerResources, coins },
          cafeState: {
            ...cafe,
            menuStock,
            lastAutoSellAtMs: last,
            displaySellingActive: remaining > 0,
          },
        });
        return {
          gainedCoins: gained,
          soldCount,
          ticks: executedTicks,
          soldByMenu,
        };
      },
      startDisplaySelling: () => {
        const prev = get();
        const cafe = prev.cafeState;
        const total =
          cafe.menuStock.americano +
          cafe.menuStock.latte +
          cafe.menuStock.affogato;
        if (total <= 0) return false;
        if (cafe.displaySellingActive) return true;
        set({
          cafeState: {
            ...cafe,
            displaySellingActive: true,
            lastAutoSellAtMs: Date.now(),
          },
        });
        return true;
      },
      stopDisplaySelling: () => {
        const prev = get();
        const cafe = prev.cafeState;
        if (!cafe.displaySellingActive) return false;
        set({
          cafeState: {
            ...cafe,
            displaySellingActive: false,
          },
        });
        return true;
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
          bm: s.bm,
          cosmetics: s.cosmetics,
          passProgress: s.passProgress,
          liveOps: s.liveOps,
          ownedProductIds: s.ownedProductIds,
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
          meta: merged.meta,
          settings: merged.settings,
          bm: merged.bm,
          cosmetics: merged.cosmetics,
          passProgress: merged.passProgress,
          liveOps: merged.liveOps,
          ownedProductIds: merged.ownedProductIds,
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
      patchBm: (patch) =>
        set((s) => ({ bm: { ...s.bm, ...patch } })),
      patchCosmetics: (patch) =>
        set((s) => {
          const next: CosmeticsState = {
            ...s.cosmetics,
            ...patch,
            ownedThemeIds: patch.ownedThemeIds ?? s.cosmetics.ownedThemeIds,
          };
          if (!next.ownedThemeIds.includes(next.equippedThemeId)) {
            next.equippedThemeId = "default";
          }
          return { cosmetics: next };
        }),
      equipThemeIfOwned: (themeId) => {
        const prev = get();
        if (!prev.cosmetics.ownedThemeIds.includes(themeId)) return false;
        set({ cosmetics: { ...prev.cosmetics, equippedThemeId: themeId } });
        return true;
      },
      grantPlaceholderProduct: ({ productId, unlockThemeIds = [] }) => {
        const prev = get();
        const owned = new Set(prev.ownedProductIds);
        owned.add(productId);
        const themes = new Set(prev.cosmetics.ownedThemeIds);
        for (const id of unlockThemeIds) themes.add(id);
        set({
          ownedProductIds: Array.from(owned),
          cosmetics: { ...prev.cosmetics, ownedThemeIds: Array.from(themes) },
        });
      },
      patchPassProgress: (patch) =>
        set((s) => ({
          passProgress: { ...s.passProgress, ...patch },
        })),
      patchLiveOps: (patch) =>
        set((s) => ({
          liveOps: {
            ...s.liveOps,
            ...patch,
            unlockedGuestIds:
              patch.unlockedGuestIds ?? s.liveOps.unlockedGuestIds,
            activeEventIds: patch.activeEventIds ?? s.liveOps.activeEventIds,
          },
        })),
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
