"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  CAFE_ECONOMY,
  defaultMenuStock,
  normalizeMenuStock,
  totalMenuStock,
  trySellOneRoundRobin,
} from "@/features/meta/balance/cafeEconomy";
import {
  beverageIdForRecipeId,
  createDefaultBeverageCodexState,
  markCodexCrafted,
  markCodexPurchased,
  markCodexSold,
  normalizeBeverageCodexState,
} from "@/features/meta/content/codex";
import {
  activeTimeShopEntry,
  currentTimeOfDay,
} from "@/features/meta/content/timeShop";
import {
  DEFAULT_PUZZLE_BACKGROUND_SKIN_ID,
  DEFAULT_PUZZLE_BLOCK_SKIN_ID,
  normalizeEquippedPuzzleSkinId,
  normalizeOwnedPuzzleSkinIds,
  puzzleSkinDefinition,
} from "@/features/meta/cosmetics/puzzleSkins";
import { validateCraftDrink } from "@/features/meta/economy/crafting";
import {
  isOwnedBeverageRecipe,
  isOwnedRecipe,
} from "@/features/meta/economy/recipeOwnership";
import {
  defaultMaterialInventory,
  materialDefinition,
  normalizeMaterialInventory,
} from "@/features/meta/economy/materials";
import {
  type CafeUpgradeTrack,
  CAFE_UPGRADE_MAX_LEVEL,
  getCafeRuntimeModifiers,
  recomputeCafeLevel,
  upgradeCost,
} from "@/features/meta/balance/cafeModifiers";
import {
  computePuzzleRewards,
  type PuzzleRewards,
} from "@/features/meta/rewards/computePuzzleRewards";
import { simulateOfflineCafeReward } from "@/features/meta/rewards/offlineCafeReward";
import {
  applyMissionEvent,
  createDefaultAccountLevelState,
  type MissionApplyResult,
  normalizeAccountLevelState,
} from "@/features/meta/progression/missionEngine";
import {
  canPurchaseRecipe,
  recipePurchaseCost,
} from "@/features/meta/progression/levelBands";
import {
  SAVE_SCHEMA_VERSION,
  STORAGE_KEY,
} from "@/features/meta/storage/storageKeys";
import type {
  AccountLevelState,
  AppPersistState,
  BeverageId,
  BmEntitlementsState,
  CafeState,
  CosmeticsState,
  DrinkMenuId,
  LiveOpsSaveState,
  MaterialId,
  MetaRuntimeState,
  MissionEvent,
  PendingOfflineReward,
  PendingPuzzleRewardClaim,
  PassProgressState,
  PlayerResources,
  PuzzleProgress,
  PuzzleSkinId,
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
  materialInventory: defaultMaterialInventory(),
  craftedDrinkIds: [],
  displaySellingActive: false,
  lastAutoSellAtMs: 0,
  lastOfflineSaleAtMs: 0,
  lastOfflineSaleCoins: 0,
  lastOfflineSaleSoldCount: 0,
  pendingOfflineReward: null,
};

const defaultAccountLevel: AccountLevelState = createDefaultAccountLevelState(0);
const defaultBeverageCodex = createDefaultBeverageCodexState();

const defaultSettings: SettingsState = {
  soundOn: true,
  vibrationOn: true,
  reducedMotion: false,
  lobbyOnboardingSeen: false,
};

const defaultMeta: MetaRuntimeState = {
  lastHeartRegenAtMs: 0,
  lastSeenAtMs: 0,
  pendingPuzzleRewardClaim: null,
};

const defaultBm: BmEntitlementsState = {
  adFree: false,
  supporterTier: 0,
};

const defaultCosmetics: CosmeticsState = {
  equippedThemeId: "default",
  ownedThemeIds: ["default"],
  equippedPuzzleBackgroundSkinId: DEFAULT_PUZZLE_BACKGROUND_SKIN_ID,
  equippedPuzzleBlockSkinId: DEFAULT_PUZZLE_BLOCK_SKIN_ID,
  ownedPuzzleSkinIds: [
    DEFAULT_PUZZLE_BACKGROUND_SKIN_ID,
    DEFAULT_PUZZLE_BLOCK_SKIN_ID,
  ],
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
  accountLevel: defaultAccountLevel,
  beverageCodex: defaultBeverageCodex,
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
    mergeCount?: number;
  }) => void;
  /** 퍼즐 결과를 저장 가능한 pending claim으로 만든다 */
  preparePuzzleRewardClaim: (input: {
    score: number;
    highestTile: number;
    mergeCount?: number;
  }) => PendingPuzzleRewardClaim;
  /** 미션 공통 이벤트 디스패처 */
  recordMissionEvent: (
    input: MissionEvent | MissionEvent[],
  ) => MissionApplyResult[];
  patchSettings: (patch: Partial<SettingsState>) => void;
  roastOnce: () => boolean;
  craftDrink: (id: DrinkMenuId) => boolean;
  purchaseMaterial: (id: MaterialId) => boolean;
  purchaseRecipe: (id: DrinkMenuId) => boolean;
  purchaseTimeShopRecipe: (id: BeverageId) => boolean;
  purchasePuzzleSkin: (id: PuzzleSkinId) => boolean;
  equipPuzzleSkin: (id: PuzzleSkinId) => boolean;
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
  settleOfflineReward: (nowMs?: number) => PendingOfflineReward | null;
  claimOfflineReward: (input?: {
    nowMs?: number;
    claimId?: string;
    doubled?: boolean;
  }) => PendingOfflineReward | null;
  claimPuzzleReward: (input?: {
    nowMs?: number;
    claimId?: string;
    doubled?: boolean;
  }) => {
    claimId: string;
    score: number;
    highestTile: number;
    mergeCount: number;
    rewards: PuzzleRewards;
    doubled: boolean;
  } | null;
  markLastSeenAt: (nowMs?: number) => void;
  purchaseCafeUpgrade: (track: CafeUpgradeTrack) => boolean;
  /** 개발자 디버그: 자원 수치 강제 조정 */
  patchPlayerResources: (patch: Partial<PlayerResources>) => void;
  /** 개발자 디버그: 카페 상태 일부 강제 조정 */
  patchCafeState: (patch: Partial<CafeState>) => void;
  /** 개발자 디버그: 퍼즐 진행 강제 조정 */
  patchPuzzleProgress: (patch: Partial<PuzzleProgress>) => void;
  /** 개발자 디버그: 계정 레벨 상태 강제 조정 */
  patchAccountLevel: (patch: Partial<AccountLevelState>) => void;
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

function normalizeTimestampMs(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}

function buildClaimId(prefix: string, parts: Array<string | number>): string {
  return [prefix, ...parts.map((part) => String(part))].join("-");
}

function normalizePendingOfflineReward(
  input: unknown,
): PendingOfflineReward | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Partial<PendingOfflineReward>;
  const pendingCoins = normalizeTimestampMs(raw.pendingCoins);
  const soldCount = normalizeTimestampMs(raw.soldCount);
  if (pendingCoins <= 0 || soldCount <= 0) return null;
  return {
    claimId:
      typeof raw.claimId === "string" && raw.claimId.length > 0
        ? raw.claimId
        : buildClaimId("offline", [
            normalizeTimestampMs(raw.generatedAtMs),
            soldCount,
            pendingCoins,
          ]),
    generatedAtMs: normalizeTimestampMs(raw.generatedAtMs),
    elapsedMs: normalizeTimestampMs(raw.elapsedMs),
    soldCount,
    pendingCoins,
  };
}

function normalizePendingPuzzleRewardClaim(
  input: unknown,
): PendingPuzzleRewardClaim | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Partial<PendingPuzzleRewardClaim>;
  const score = normalizeTimestampMs(raw.score);
  const highestTile = normalizeTimestampMs(raw.highestTile);
  const mergeCount = normalizeTimestampMs(raw.mergeCount);
  const baseCoins = normalizeTimestampMs(raw.baseCoins);
  const baseBeans = normalizeTimestampMs(raw.baseBeans);
  const baseHearts = normalizeTimestampMs(raw.baseHearts);
  if (score <= 0 && highestTile <= 0) return null;
  return {
    claimId:
      typeof raw.claimId === "string" && raw.claimId.length > 0
        ? raw.claimId
        : buildClaimId("puzzle", [
            normalizeTimestampMs(raw.generatedAtMs),
            score,
            highestTile,
            mergeCount,
          ]),
    generatedAtMs: normalizeTimestampMs(raw.generatedAtMs),
    score,
    highestTile,
    mergeCount,
    baseCoins,
    baseBeans,
    baseHearts,
  };
}

function buildPendingPuzzleRewardClaim(input: {
  score: number;
  highestTile: number;
  mergeCount?: number;
  nowMs?: number;
}): PendingPuzzleRewardClaim {
  const generatedAtMs = normalizeTimestampMs(input.nowMs ?? Date.now());
  const rewards = computePuzzleRewards(input.score, input.highestTile);
  return {
    claimId: buildClaimId("puzzle", [
      generatedAtMs,
      input.score,
      input.highestTile,
      input.mergeCount ?? 0,
    ]),
    generatedAtMs,
    score: Math.max(0, Math.floor(input.score)),
    highestTile: Math.max(0, Math.floor(input.highestTile)),
    mergeCount: Math.max(0, Math.floor(input.mergeCount ?? 0)),
    baseCoins: rewards.coins,
    baseBeans: rewards.beans,
    baseHearts: rewards.hearts,
  };
}

function puzzleRewardsForClaim(
  claim: PendingPuzzleRewardClaim,
  doubled: boolean,
): PuzzleRewards {
  return {
    coins: claim.baseCoins * (doubled ? 2 : 1),
    beans: claim.baseBeans * (doubled ? 2 : 1),
    hearts: claim.baseHearts,
  };
}

function applyOfflineRewardHydration(next: AppStore): AppStore {
  const now = Date.now();
  const pending = next.cafeState.pendingOfflineReward;
  if (pending && pending.pendingCoins > 0) {
    return {
      ...next,
      meta: {
        ...next.meta,
        lastSeenAtMs: now,
      },
    };
  }

  if (!next.cafeState.displaySellingActive) {
    return next;
  }

  const totalStock = totalMenuStock(next.cafeState.menuStock);
  if (totalStock <= 0) {
    return {
      ...next,
      cafeState: {
        ...next.cafeState,
        displaySellingActive: false,
        lastAutoSellAtMs: now,
      },
      meta: {
        ...next.meta,
        lastSeenAtMs: now,
      },
    };
  }

  const lastSeenAtMs = next.meta.lastSeenAtMs > 0 ? next.meta.lastSeenAtMs : now;
  const runtime = getCafeRuntimeModifiers(next.cafeState);
  const reward = simulateOfflineCafeReward({
    menuStock: next.cafeState.menuStock,
    elapsedMs: Math.max(0, now - lastSeenAtMs),
    intervalMs: runtime.autoSellIntervalMs,
    sellBonus: runtime.sellBonus,
  });

  if (!reward) {
    return {
      ...next,
      meta: {
        ...next.meta,
        lastSeenAtMs: now,
      },
    };
  }

  const remainingStock = totalMenuStock(reward.nextMenuStock);
  return {
    ...next,
    cafeState: {
      ...next.cafeState,
      menuStock: reward.nextMenuStock,
      displaySellingActive: remainingStock > 0,
      lastAutoSellAtMs: now,
      pendingOfflineReward: {
        claimId: buildClaimId("offline", [now, reward.soldCount, reward.pendingCoins]),
        generatedAtMs: now,
        elapsedMs: reward.cappedElapsedMs,
        soldCount: reward.soldCount,
        pendingCoins: reward.pendingCoins,
      },
    },
    meta: {
      ...next.meta,
      lastSeenAtMs: now,
    },
  };
}

function mergePersisted(persisted: unknown, current: AppStore): AppStore {
  if (!persisted || typeof persisted !== "object") return current;
  const p = persisted as Partial<AppPersistState>;
  return applyOfflineRewardHydration({
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
      merged.menuStock = normalizeMenuStock(
        p.cafeState?.menuStock ??
          current.cafeState.menuStock ??
          defaultCafe.menuStock,
      );
      merged.materialInventory = normalizeMaterialInventory(
        p.cafeState?.materialInventory ??
          current.cafeState.materialInventory ??
          defaultCafe.materialInventory,
      );
      merged.craftedDrinkIds = Array.from(
        new Set([
          ...(current.cafeState.craftedDrinkIds ?? []),
          ...(p.cafeState?.craftedDrinkIds ?? []),
        ]),
      );
      merged.pendingOfflineReward = normalizePendingOfflineReward(
        p.cafeState?.pendingOfflineReward ??
          current.cafeState.pendingOfflineReward ??
          defaultCafe.pendingOfflineReward,
      );
      merged.cafeLevel = recomputeCafeLevel(merged);
      return merged;
    })(),
    accountLevel: normalizeAccountLevelState(
      p.accountLevel ?? current.accountLevel ?? defaultAccountLevel,
      Date.now(),
    ),
    beverageCodex: normalizeBeverageCodexState(
      p.beverageCodex ?? current.beverageCodex ?? defaultBeverageCodex,
    ),
    meta: {
      ...defaultMeta,
      ...current.meta,
      ...p.meta,
      lastHeartRegenAtMs: normalizeTimestampMs(
        p.meta?.lastHeartRegenAtMs ??
          current.meta.lastHeartRegenAtMs ??
          defaultMeta.lastHeartRegenAtMs,
      ),
      lastSeenAtMs: normalizeTimestampMs(
        p.meta?.lastSeenAtMs ??
          current.meta.lastSeenAtMs ??
          defaultMeta.lastSeenAtMs,
      ),
      pendingPuzzleRewardClaim: normalizePendingPuzzleRewardClaim(
        p.meta?.pendingPuzzleRewardClaim ??
          current.meta.pendingPuzzleRewardClaim ??
          defaultMeta.pendingPuzzleRewardClaim,
      ),
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
      const ownedPuzzleSkinIds = normalizeOwnedPuzzleSkinIds([
        ...(current.cosmetics?.ownedPuzzleSkinIds ?? []),
        ...(p.cosmetics?.ownedPuzzleSkinIds ?? []),
      ]);
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
        ownedPuzzleSkinIds,
        equippedPuzzleBackgroundSkinId: normalizeEquippedPuzzleSkinId(
          p.cosmetics?.equippedPuzzleBackgroundSkinId ??
            current.cosmetics?.equippedPuzzleBackgroundSkinId,
          "background",
          ownedPuzzleSkinIds,
        ),
        equippedPuzzleBlockSkinId: normalizeEquippedPuzzleSkinId(
          p.cosmetics?.equippedPuzzleBlockSkinId ??
            current.cosmetics?.equippedPuzzleBlockSkinId,
          "blocks",
          ownedPuzzleSkinIds,
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
  });
}

function migratePersistedState(persisted: unknown): unknown {
  if (!persisted || typeof persisted !== "object") return persisted;
  const state = persisted as Partial<AppPersistState>;
  return {
    ...state,
    cafeState: {
      ...state.cafeState,
      menuStock: normalizeMenuStock(state.cafeState?.menuStock),
      materialInventory: normalizeMaterialInventory(
        state.cafeState?.materialInventory,
      ),
      craftedDrinkIds: state.cafeState?.craftedDrinkIds ?? [],
      pendingOfflineReward: normalizePendingOfflineReward(
        state.cafeState?.pendingOfflineReward,
      ),
    },
    accountLevel: normalizeAccountLevelState(state.accountLevel),
    beverageCodex: normalizeBeverageCodexState(state.beverageCodex),
    cosmetics: {
      ...defaultCosmetics,
      ...(state.cosmetics ?? {}),
      ownedPuzzleSkinIds: normalizeOwnedPuzzleSkinIds(
        state.cosmetics?.ownedPuzzleSkinIds,
      ),
    },
    meta: {
      ...defaultMeta,
      ...(state.meta ?? {}),
      lastHeartRegenAtMs: normalizeTimestampMs(state.meta?.lastHeartRegenAtMs),
      lastSeenAtMs: normalizeTimestampMs(state.meta?.lastSeenAtMs),
      pendingPuzzleRewardClaim: normalizePendingPuzzleRewardClaim(
        state.meta?.pendingPuzzleRewardClaim,
      ),
    },
  };
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...defaultState,
      recordMissionEvent: (input) => {
        const events = Array.isArray(input) ? input : [input];
        const results: MissionApplyResult[] = [];
        if (events.length === 0) return results;

        set((s) => {
          let accountLevel = normalizeAccountLevelState(s.accountLevel);
          let playerResources = s.playerResources;

          for (const event of events) {
            const result = applyMissionEvent(accountLevel, event);
            accountLevel = result.account;
            if (result.rewards.coins > 0 || result.rewards.beans > 0) {
              playerResources = {
                ...playerResources,
                coins: playerResources.coins + result.rewards.coins,
                beans: playerResources.beans + result.rewards.beans,
              };
            }
            results.push(result);
          }

          return { accountLevel, playerResources };
        });

        return results;
      },
      applyPuzzleRunOutcome: ({ score, highestTile, mergeCount = 0 }) => {
        const claim = get().preparePuzzleRewardClaim({
          score,
          highestTile,
          mergeCount,
        });
        get().claimPuzzleReward({ claimId: claim.claimId });
      },
      preparePuzzleRewardClaim: ({ score, highestTile, mergeCount = 0 }) => {
        const prev = get();
        const current = prev.meta.pendingPuzzleRewardClaim;
        if (current) return current;
        const claim = buildPendingPuzzleRewardClaim({
          score,
          highestTile,
          mergeCount,
        });
        set({
          meta: {
            ...prev.meta,
            pendingPuzzleRewardClaim: claim,
          },
        });
        return claim;
      },
      patchSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
      roastOnce: () => {
        const prev = get();
        const cafe = prev.cafeState;
        const m = getCafeRuntimeModifiers(cafe);
        if (prev.playerResources.beans < m.roastBeanCost) return false;
        if (cafe.espressoShots >= m.maxShots) return false;
        const nextShots = Math.min(m.maxShots, cafe.espressoShots + m.shotYield);
        const shotsMade = nextShots - cafe.espressoShots;
        set({
          playerResources: {
            ...prev.playerResources,
            beans: prev.playerResources.beans - m.roastBeanCost,
          },
          cafeState: {
            ...cafe,
            espressoShots: nextShots,
          },
        });
        get().recordMissionEvent([
          { type: "beansRoasted", amount: m.roastBeanCost },
          { type: "shotsCreated", amount: shotsMade },
        ]);
        return true;
      },
      craftDrink: (id: DrinkMenuId) => {
        const prev = get();
        const cafe = prev.cafeState;
        const account = normalizeAccountLevelState(prev.accountLevel);
        const rec = CAFE_ECONOMY.recipe[id];
        const validation = validateCraftDrink({
          id,
          account,
          beverageCodex: prev.beverageCodex,
          cafeState: cafe,
          beans: prev.playerResources.beans,
        });
        if (!validation.canCraft) return false;
        const nextMaterialInventory = { ...cafe.materialInventory };
        for (const [rawId, amount] of Object.entries(rec.materials)) {
          const materialId = rawId as MaterialId;
          nextMaterialInventory[materialId] =
            (nextMaterialInventory[materialId] ?? 0) - (amount ?? 0);
        }
        const wasFirstCraft = !cafe.craftedDrinkIds.includes(id);
        set({
          playerResources: {
            ...prev.playerResources,
            beans: prev.playerResources.beans - rec.beans,
          },
          cafeState: {
            ...cafe,
            espressoShots: cafe.espressoShots - rec.shots,
            materialInventory: nextMaterialInventory,
            craftedDrinkIds: wasFirstCraft
              ? [...cafe.craftedDrinkIds, id]
              : cafe.craftedDrinkIds,
            menuStock: {
              ...cafe.menuStock,
              [id]: cafe.menuStock[id] + 1,
            },
          },
          beverageCodex: markCodexCrafted(
            prev.beverageCodex,
            beverageIdForRecipeId(id),
          ),
        });
        get().recordMissionEvent(
          wasFirstCraft
            ? [
                { type: "drinkCrafted", drinkId: id, amount: 1 },
                {
                  type: "collectionRegistered",
                  collectionKind: "recipe",
                  id,
                },
              ]
            : { type: "drinkCrafted", drinkId: id, amount: 1 },
        );
        return true;
      },
      purchaseMaterial: (id: MaterialId) => {
        const prev = get();
        const material = materialDefinition(id);
        if (prev.playerResources.coins < material.coinCost) return false;
        set({
          playerResources: {
            ...prev.playerResources,
            coins: prev.playerResources.coins - material.coinCost,
          },
          cafeState: {
            ...prev.cafeState,
            materialInventory: {
              ...prev.cafeState.materialInventory,
              [id]:
                (prev.cafeState.materialInventory[id] ?? 0) +
                material.purchaseAmount,
            },
          },
        });
        return true;
      },
      purchaseRecipe: (id: DrinkMenuId) => {
        const prev = get();
        const account = normalizeAccountLevelState(prev.accountLevel);
        if (!account.unlockedRecipeIds.includes(id)) return false;
        if (isOwnedRecipe({ id, account, codex: prev.beverageCodex })) return true;
        const cost = recipePurchaseCost(id);
        if (!canPurchaseRecipe(account, id, prev.playerResources.coins, prev.beverageCodex))
          return false;
        set({
          playerResources: {
            ...prev.playerResources,
            coins: prev.playerResources.coins - cost,
          },
          accountLevel: {
            ...account,
            purchasedRecipeIds: [...account.purchasedRecipeIds, id],
          },
          beverageCodex: markCodexPurchased(
            prev.beverageCodex,
            beverageIdForRecipeId(id),
          ),
        });
        get().recordMissionEvent({
          type: "recipePurchased",
          recipeId: id,
          timeOfDay: currentTimeOfDay(),
        });
        return true;
      },
      purchaseTimeShopRecipe: (id: BeverageId) => {
        const prev = get();
        const account = normalizeAccountLevelState(prev.accountLevel);
        const timeOfDay = currentTimeOfDay();
        const entry = activeTimeShopEntry(id, timeOfDay);
        if (!entry) return false;
        if (account.level < entry.requiredLevel) return false;
        if (
          isOwnedBeverageRecipe({
            beverageId: id,
            account,
            codex: prev.beverageCodex,
          })
        ) {
          return true;
        }
        if (prev.playerResources.coins < entry.price) return false;
        set({
          playerResources: {
            ...prev.playerResources,
            coins: prev.playerResources.coins - entry.price,
          },
          beverageCodex: markCodexPurchased(
            {
              ...prev.beverageCodex,
              purchasedTimeRecipeIds: [
                ...prev.beverageCodex.purchasedTimeRecipeIds,
                id,
              ],
            },
            id,
          ),
        });
        get().recordMissionEvent({
          type: "timeRecipePurchased",
          beverageId: id,
          timeOfDay,
        });
        return true;
      },
      purchasePuzzleSkin: (id: PuzzleSkinId) => {
        const prev = get();
        const account = normalizeAccountLevelState(prev.accountLevel);
        const skin = puzzleSkinDefinition(id);
        if (prev.cosmetics.ownedPuzzleSkinIds.includes(id)) return true;
        if (account.level < skin.requiredLevel) return false;
        if (prev.playerResources.coins < skin.coinCost) return false;
        set({
          playerResources: {
            ...prev.playerResources,
            coins: prev.playerResources.coins - skin.coinCost,
          },
          cosmetics: {
            ...prev.cosmetics,
            ownedPuzzleSkinIds: [
              ...prev.cosmetics.ownedPuzzleSkinIds,
              id,
            ],
          },
        });
        get().recordMissionEvent({
          type: "skinPurchased",
          skinId: id,
        });
        return true;
      },
      equipPuzzleSkin: (id: PuzzleSkinId) => {
        const prev = get();
        const skin = puzzleSkinDefinition(id);
        if (!prev.cosmetics.ownedPuzzleSkinIds.includes(id)) return false;
        set({
          cosmetics: {
            ...prev.cosmetics,
            ...(skin.kind === "background"
              ? { equippedPuzzleBackgroundSkinId: id }
              : { equippedPuzzleBlockSkinId: id }),
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

        const totalStart = totalMenuStock(cafe.menuStock);
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

        const remaining = totalMenuStock(menuStock);
        let beverageCodex = prev.beverageCodex;
        for (const [rawId, amount] of Object.entries(soldByMenu)) {
          beverageCodex = markCodexSold(
            beverageCodex,
            beverageIdForRecipeId(rawId as DrinkMenuId),
            amount ?? 0,
          );
        }

        set({
          playerResources: { ...prev.playerResources, coins },
          beverageCodex,
          cafeState: {
            ...cafe,
            menuStock,
            lastAutoSellAtMs: last,
            displaySellingActive: remaining > 0,
          },
        });
        get().recordMissionEvent([
          {
            type: "drinkSold",
            amount: soldCount,
            soldByMenu,
            coins: gained,
            timeOfDay: currentTimeOfDay(),
          },
          { type: "coinsEarned", amount: gained, source: "sale" },
        ]);
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
        const total = totalMenuStock(cafe.menuStock);
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
      settleOfflineReward: (nowMs) => {
        const now = normalizeTimestampMs(nowMs ?? Date.now());
        const prev = get();
        const currentPending = prev.cafeState.pendingOfflineReward;
        if (currentPending && currentPending.pendingCoins > 0) {
          if (prev.meta.lastSeenAtMs !== now) {
            set({
              meta: {
                ...prev.meta,
                lastSeenAtMs: now,
              },
            });
          }
          return currentPending;
        }

        const cafe = prev.cafeState;
        const meta = prev.meta;
        const lastSeenAtMs = meta.lastSeenAtMs > 0 ? meta.lastSeenAtMs : now;

        if (!cafe.displaySellingActive) {
          if (meta.lastSeenAtMs !== now) {
            set({
              meta: {
                ...meta,
                lastSeenAtMs: now,
              },
            });
          }
          return null;
        }

        const totalStock = totalMenuStock(cafe.menuStock);
        if (totalStock <= 0) {
          set({
            cafeState: {
              ...cafe,
              displaySellingActive: false,
              lastAutoSellAtMs: now,
            },
            meta: {
              ...meta,
              lastSeenAtMs: now,
            },
          });
          return null;
        }

        const runtime = getCafeRuntimeModifiers(cafe);
        const reward = simulateOfflineCafeReward({
          menuStock: cafe.menuStock,
          elapsedMs: Math.max(0, now - lastSeenAtMs),
          intervalMs: runtime.autoSellIntervalMs,
          sellBonus: runtime.sellBonus,
        });

        if (!reward) {
          set({
            meta: {
              ...meta,
              lastSeenAtMs: now,
            },
          });
          return null;
        }

        const pendingReward: PendingOfflineReward = {
          claimId: buildClaimId("offline", [now, reward.soldCount, reward.pendingCoins]),
          generatedAtMs: now,
          elapsedMs: reward.cappedElapsedMs,
          soldCount: reward.soldCount,
          pendingCoins: reward.pendingCoins,
        };
        const remainingStock = totalMenuStock(reward.nextMenuStock);

        set({
          cafeState: {
            ...cafe,
            menuStock: reward.nextMenuStock,
            displaySellingActive: remainingStock > 0,
            lastAutoSellAtMs: now,
            pendingOfflineReward: pendingReward,
          },
          meta: {
            ...meta,
            lastSeenAtMs: now,
          },
        });

        return pendingReward;
      },
      claimOfflineReward: (input) => {
        const now = normalizeTimestampMs(input?.nowMs ?? Date.now());
        const prev = get();
        const reward = prev.cafeState.pendingOfflineReward;
        if (!reward || reward.pendingCoins <= 0) return null;
        if (input?.claimId && reward.claimId !== input.claimId) return null;
        const doubled = input?.doubled === true;
        const claimedCoins = reward.pendingCoins * (doubled ? 2 : 1);

        set({
          playerResources: {
            ...prev.playerResources,
            coins: prev.playerResources.coins + claimedCoins,
          },
          cafeState: {
            ...prev.cafeState,
            pendingOfflineReward: null,
            lastOfflineSaleAtMs: now,
            lastOfflineSaleCoins: claimedCoins,
            lastOfflineSaleSoldCount: reward.soldCount,
          },
          meta: {
            ...prev.meta,
            lastSeenAtMs: now,
          },
        });

        get().recordMissionEvent({
          type: "coinsEarned",
          amount: reward.pendingCoins,
          source: "sale",
        });

        return {
          ...reward,
          pendingCoins: claimedCoins,
        };
      },
      claimPuzzleReward: (input) => {
        const now = normalizeTimestampMs(input?.nowMs ?? Date.now());
        const prev = get();
        const claim = prev.meta.pendingPuzzleRewardClaim;
        if (!claim) return null;
        if (input?.claimId && claim.claimId !== input.claimId) return null;
        const doubled = input?.doubled === true;
        const rewards = puzzleRewardsForClaim(claim, doubled);
        const nextBestScore = Math.max(prev.puzzleProgress.bestScore, claim.score);
        const nextBestTile = Math.max(prev.puzzleProgress.bestTile, claim.highestTile);

        set({
          playerResources: {
            coins: prev.playerResources.coins + rewards.coins,
            beans: prev.playerResources.beans + rewards.beans,
            hearts: prev.playerResources.hearts + rewards.hearts,
          },
          puzzleProgress: {
            bestScore: nextBestScore,
            bestTile: nextBestTile,
            lastRunScore: claim.score,
            lastRunTile: claim.highestTile,
            lastRunCoins: rewards.coins,
            lastRunBeans: rewards.beans,
            lastRunHearts: rewards.hearts,
            totalRuns: prev.puzzleProgress.totalRuns + 1,
          },
          meta: {
            ...prev.meta,
            pendingPuzzleRewardClaim: null,
            lastSeenAtMs: now,
          },
        });

        get().recordMissionEvent({
          type: "puzzleRunCompleted",
          score: claim.score,
          highestTile: claim.highestTile,
          mergeCount: claim.mergeCount,
          coins: claim.baseCoins,
          beans: claim.baseBeans,
          hearts: claim.baseHearts,
        });

        return {
          claimId: claim.claimId,
          score: claim.score,
          highestTile: claim.highestTile,
          mergeCount: claim.mergeCount,
          rewards,
          doubled,
        };
      },
      markLastSeenAt: (nowMs) => {
        const now = normalizeTimestampMs(nowMs ?? Date.now());
        set((s) => ({
          meta: {
            ...s.meta,
            lastSeenAtMs: now,
          },
        }));
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
            menuStock: normalizeMenuStock(
              patch.menuStock ?? s.cafeState.menuStock,
            ),
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
      patchAccountLevel: (patch) =>
        set((s) => ({
          accountLevel: normalizeAccountLevelState({
            ...s.accountLevel,
            ...patch,
          }),
        })),
      exportSave: () => {
        const s = get();
        return {
          playerResources: s.playerResources,
          puzzleProgress: s.puzzleProgress,
          cafeState: s.cafeState,
          accountLevel: s.accountLevel,
          beverageCodex: s.beverageCodex,
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
          accountLevel: merged.accountLevel,
          beverageCodex: merged.beverageCodex,
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
          const ownedPuzzleSkinIds = normalizeOwnedPuzzleSkinIds(
            patch.ownedPuzzleSkinIds ?? s.cosmetics.ownedPuzzleSkinIds,
          );
          const next: CosmeticsState = {
            ...s.cosmetics,
            ...patch,
            ownedThemeIds: patch.ownedThemeIds ?? s.cosmetics.ownedThemeIds,
            ownedPuzzleSkinIds,
            equippedPuzzleBackgroundSkinId: normalizeEquippedPuzzleSkinId(
              patch.equippedPuzzleBackgroundSkinId ??
                s.cosmetics.equippedPuzzleBackgroundSkinId,
              "background",
              ownedPuzzleSkinIds,
            ),
            equippedPuzzleBlockSkinId: normalizeEquippedPuzzleSkinId(
              patch.equippedPuzzleBlockSkinId ??
                s.cosmetics.equippedPuzzleBlockSkinId,
              "blocks",
              ownedPuzzleSkinIds,
            ),
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
        if (unlockThemeIds.length > 0) {
          get().recordMissionEvent({
            type: "skinPurchased",
            skinId: unlockThemeIds[0]!,
          });
        }
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
      version: SAVE_SCHEMA_VERSION,
      migrate: (persistedState) => migratePersistedState(persistedState),
      merge: mergePersisted,
    },
  ),
);
