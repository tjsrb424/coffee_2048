import type { Page } from "@playwright/test";
import { normalizeAccountLevelState } from "../../src/features/meta/progression/missionEngine";
import type {
  AccountLevelState,
  AppPersistState,
  DrinkMenuId,
} from "../../src/features/meta/types/gameState";
import type { CustomerRuntimeState } from "../../src/features/customers/types";

const MENU_IDS = [
  "americano",
  "latte",
  "affogato",
  "morning_mist_latte",
  "dawn_honey_shot",
  "noon_citrus_coffee",
  "traveler_blend",
  "evening_caramel_crema",
  "sunset_tea_latte",
  "night_velvet_mocha",
  "midnight_tonic",
] as const;

const DEFAULT_MENU_STOCK = Object.fromEntries(
  MENU_IDS.map((id) => [id, 0]),
) as AppPersistState["cafeState"]["menuStock"];

const DEFAULT_MATERIALS: AppPersistState["cafeState"]["materialInventory"] = {
  milk: 10,
  cream: 10,
  vanillaSyrup: 10,
  caramelSyrup: 10,
  hazelnutSyrup: 10,
  mochaSauce: 10,
  honey: 10,
  matchaPowder: 10,
  blackTeaBase: 10,
  fruitBase: 10,
  sparklingWater: 10,
  rareIngredient: 10,
};

type SeedInput = {
  level: number;
  coins?: number;
  beans?: number;
  unlockedRecipeIds: string[];
  purchasedRecipeIds: string[];
  purchasedTimeRecipeIds?: string[];
  espressoShots?: number;
};

type DeepPartial<T> = T extends Array<infer U>
  ? Array<DeepPartial<U>>
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

export type DebugCustomerSave = {
  byId: Record<string, CustomerRuntimeState>;
  featuredCustomerId: string;
  featuredDailyQuotaTotal: number;
  featuredDailyQuotaUsed: number;
  featuredQuotaDayKey: number;
  lastFeaturedDayKey: number;
  saleSession?: {
    startedAtMs: number;
    queue: string[];
    currentRemainingCups: number;
    featuredQueued: boolean;
  };
};

export type DebugSaveBundle = {
  format: "coffee2048-debug-save-bundle";
  app: AppPersistState;
  customers: DebugCustomerSave;
};

type DebugSaveBundleInput = {
  nowMs?: number;
  app?: DeepPartial<AppPersistState>;
  customers?: DeepPartial<DebugCustomerSave>;
};

const DEV_SAVE_PLACEHOLDER =
  "여기에 앱/손님 세이브 JSON을 붙여넣고 '세이브 불러오기'를 누르세요.";

export async function installFixedClock(
  page: Page,
  dateString = "2026-04-21T12:00:00",
) {
  await page.clock.install({ time: new Date(dateString).getTime() });
}

export function dayKeyUtc(nowMs: number): number {
  return Math.floor(nowMs / 86_400_000);
}

export function buildAccountLevelState(input: {
  level: number;
  nowMs: number;
  unlockedRecipeIds?: DrinkMenuId[];
  purchasedRecipeIds?: DrinkMenuId[];
}): AccountLevelState {
  return normalizeAccountLevelState(
    {
      level: input.level,
      tierIndex: 0,
      currentLevelCompleted: false,
      levelStartedAtMs: input.nowMs,
      lastLevelUpAtMs: 0,
      missionSlots: [],
      missionProgress: {},
      unlockedRecipeIds: input.unlockedRecipeIds ?? ["americano"],
      purchasedRecipeIds: input.purchasedRecipeIds ?? ["americano"],
    } as AccountLevelState,
    input.nowMs,
  );
}

export function buildDebugSaveBundle(
  input: DebugSaveBundleInput = {},
): DebugSaveBundle {
  const nowMs = input.nowMs ?? Date.now();
  const dayKey = dayKeyUtc(nowMs);
  const baseAccountLevel = buildAccountLevelState({
    level: 1,
    nowMs,
  });

  const baseApp: AppPersistState = {
    playerResources: {
      coins: 5000,
      beans: 500,
      hearts: 3,
    },
    puzzleProgress: {
      bestScore: 0,
      bestTile: 0,
      lastRunScore: 0,
      lastRunTile: 0,
      lastRunCoins: 0,
      lastRunBeans: 0,
      lastRunHearts: 0,
      totalRuns: 0,
    },
    cafeState: {
      cafeLevel: 1,
      roastLevel: 1,
      displayLevel: 1,
      ambianceLevel: 1,
      espressoShots: 24,
      menuStock: DEFAULT_MENU_STOCK,
      materialInventory: DEFAULT_MATERIALS,
      craftedDrinkIds: [],
      displaySellingActive: false,
      lastAutoSellAtMs: 0,
      lastOfflineSaleAtMs: 0,
      lastOfflineSaleCoins: 0,
      lastOfflineSaleSoldCount: 0,
      pendingOfflineReward: null,
    },
    accountLevel: baseAccountLevel,
    beverageCodex: {
      entries: {},
      purchasedTimeRecipeIds: [],
    },
    meta: {
      lastHeartRegenAtMs: nowMs,
      lastSeenAtMs: nowMs,
      pendingPuzzleRewardClaim: null,
    },
    settings: {
      soundOn: false,
      vibrationOn: false,
      reducedMotion: true,
      lobbyOnboardingSeen: true,
    },
    bm: { adFree: false, supporterTier: 0 },
    cosmetics: {
      equippedThemeId: "default",
      ownedThemeIds: ["default"],
      equippedPuzzleBackgroundSkinId: "cafe_default_bg",
      equippedPuzzleBlockSkinId: "cream_default_blocks",
      ownedPuzzleSkinIds: ["cafe_default_bg", "cream_default_blocks"],
    },
    passProgress: {
      seasonId: "s0",
      tier: 0,
      xp: 0,
      premiumUnlocked: false,
    },
    liveOps: {
      unlockedGuestIds: [],
      activeEventIds: [],
    },
    ownedProductIds: [],
  };

  const appPatch = input.app ?? {};
  const baseCustomers: DebugCustomerSave = {
    byId: {},
    featuredCustomerId: "han_eun",
    featuredDailyQuotaTotal: 1,
    featuredDailyQuotaUsed: 0,
    featuredQuotaDayKey: dayKey,
    lastFeaturedDayKey: dayKey,
  };
  const customerPatch = input.customers ?? {};

  return {
    format: "coffee2048-debug-save-bundle",
    app: {
      ...baseApp,
      ...appPatch,
      playerResources: {
        ...baseApp.playerResources,
        ...appPatch.playerResources,
      },
      puzzleProgress: {
        ...baseApp.puzzleProgress,
        ...appPatch.puzzleProgress,
      },
      cafeState: {
        ...baseApp.cafeState,
        ...appPatch.cafeState,
        menuStock: {
          ...baseApp.cafeState.menuStock,
          ...appPatch.cafeState?.menuStock,
        },
        materialInventory: {
          ...baseApp.cafeState.materialInventory,
          ...appPatch.cafeState?.materialInventory,
        },
        craftedDrinkIds:
          (appPatch.cafeState?.craftedDrinkIds as AppPersistState["cafeState"]["craftedDrinkIds"] | undefined) ??
          baseApp.cafeState.craftedDrinkIds,
        pendingOfflineReward:
          (appPatch.cafeState?.pendingOfflineReward as AppPersistState["cafeState"]["pendingOfflineReward"] | undefined) ??
          baseApp.cafeState.pendingOfflineReward,
      },
      accountLevel:
        (appPatch.accountLevel as AppPersistState["accountLevel"] | undefined) ??
        baseApp.accountLevel,
      beverageCodex: {
        ...baseApp.beverageCodex,
        ...appPatch.beverageCodex,
        entries: {
          ...baseApp.beverageCodex.entries,
          ...((appPatch.beverageCodex?.entries ?? {}) as AppPersistState["beverageCodex"]["entries"]),
        },
        purchasedTimeRecipeIds:
          (appPatch.beverageCodex?.purchasedTimeRecipeIds as AppPersistState["beverageCodex"]["purchasedTimeRecipeIds"] | undefined) ??
          baseApp.beverageCodex.purchasedTimeRecipeIds,
      },
      meta: {
        ...baseApp.meta,
        ...appPatch.meta,
        pendingPuzzleRewardClaim:
          (appPatch.meta?.pendingPuzzleRewardClaim as AppPersistState["meta"]["pendingPuzzleRewardClaim"] | undefined) ??
          baseApp.meta.pendingPuzzleRewardClaim,
      },
      settings: {
        ...baseApp.settings,
        ...appPatch.settings,
      },
      bm: {
        ...baseApp.bm,
        ...appPatch.bm,
      },
      cosmetics: {
        ...baseApp.cosmetics,
        ...appPatch.cosmetics,
        ownedThemeIds:
          (appPatch.cosmetics?.ownedThemeIds as AppPersistState["cosmetics"]["ownedThemeIds"] | undefined) ??
          baseApp.cosmetics.ownedThemeIds,
        ownedPuzzleSkinIds:
          (appPatch.cosmetics?.ownedPuzzleSkinIds as AppPersistState["cosmetics"]["ownedPuzzleSkinIds"] | undefined) ??
          baseApp.cosmetics.ownedPuzzleSkinIds,
      },
      passProgress: {
        ...baseApp.passProgress,
        ...appPatch.passProgress,
      },
      liveOps: {
        ...baseApp.liveOps,
        ...appPatch.liveOps,
        unlockedGuestIds:
          (appPatch.liveOps?.unlockedGuestIds as AppPersistState["liveOps"]["unlockedGuestIds"] | undefined) ??
          baseApp.liveOps.unlockedGuestIds,
        activeEventIds:
          (appPatch.liveOps?.activeEventIds as AppPersistState["liveOps"]["activeEventIds"] | undefined) ??
          baseApp.liveOps.activeEventIds,
      },
      ownedProductIds:
        (appPatch.ownedProductIds as AppPersistState["ownedProductIds"] | undefined) ??
        baseApp.ownedProductIds,
    },
    customers: {
      ...baseCustomers,
      ...customerPatch,
      saleSession:
        (customerPatch.saleSession as DebugCustomerSave["saleSession"] | undefined) ??
        baseCustomers.saleSession,
      byId: {
        ...baseCustomers.byId,
        ...((customerPatch.byId ?? {}) as DebugCustomerSave["byId"]),
      },
    },
  };
}

export async function openDevDebugPanel(page: Page) {
  const saveTextarea = page.getByPlaceholder(DEV_SAVE_PLACEHOLDER);
  if (!(await saveTextarea.isVisible().catch(() => false))) {
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll("button")).find(
        (node) => node.textContent?.trim() === "DEV",
      );
      if (!(button instanceof HTMLButtonElement)) {
        throw new Error("DEV button not found");
      }
      button.click();
    });
    await saveTextarea.waitFor();
  }
  return saveTextarea;
}

export async function closeDevDebugPanel(page: Page) {
  const saveTextarea = page.getByPlaceholder(DEV_SAVE_PLACEHOLDER);
  if (!(await saveTextarea.isVisible().catch(() => false))) return;
  await page.evaluate((placeholder) => {
    const textarea = Array.from(document.querySelectorAll("textarea")).find(
      (node) => node.getAttribute("placeholder") === placeholder,
    );
    if (!(textarea instanceof HTMLTextAreaElement)) return;

    let container: HTMLElement | null = textarea.parentElement;
    while (container) {
      const closeButton = Array.from(container.querySelectorAll("button")).find(
        (node) => node.textContent?.trim() === "닫기",
      );
      if (closeButton instanceof HTMLButtonElement) {
        closeButton.click();
        return;
      }
      container = container.parentElement;
    }

    throw new Error("DEV close button not found");
  }, DEV_SAVE_PLACEHOLDER);
  await saveTextarea.waitFor({ state: "hidden" });
}

export async function importDebugSaveBundle(
  page: Page,
  bundle: DebugSaveBundle,
) {
  await page.goto("/lobby");
  const saveTextarea = await openDevDebugPanel(page);
  await saveTextarea.fill(JSON.stringify(bundle));
  await page.getByRole("button", { name: "세이브 불러오기" }).click();
  await page.getByText("세이브를 불러왔어요.").waitFor();
  await closeDevDebugPanel(page);
}

export async function exportDebugSaveBundle(
  page: Page,
): Promise<DebugSaveBundle> {
  const saveTextarea = await openDevDebugPanel(page);
  await saveTextarea.fill("");
  await page.getByRole("button", { name: "세이브 복사" }).click();
  await page.waitForFunction(
    (placeholder) => {
      const target = Array.from(document.querySelectorAll("textarea")).find(
        (node) => node.getAttribute("placeholder") === placeholder,
      ) as HTMLTextAreaElement | undefined;
      return Boolean(target?.value?.trim());
    },
    DEV_SAVE_PLACEHOLDER,
  );
  const bundle = JSON.parse(await saveTextarea.inputValue()) as DebugSaveBundle;
  await closeDevDebugPanel(page);
  return bundle;
}

export async function seedGameState(page: Page, input: SeedInput) {
  const nowMs = Date.now();
  await importDebugSaveBundle(
    page,
    buildDebugSaveBundle({
      nowMs,
      app: {
        playerResources: {
          coins: input.coins ?? 5000,
          beans: input.beans ?? 500,
          hearts: 3,
        },
        cafeState: {
          espressoShots: input.espressoShots ?? 24,
        },
        accountLevel: buildAccountLevelState({
          level: input.level,
          nowMs,
          unlockedRecipeIds: input.unlockedRecipeIds as DrinkMenuId[],
          purchasedRecipeIds: input.purchasedRecipeIds as DrinkMenuId[],
        }),
        beverageCodex: {
          purchasedTimeRecipeIds: input.purchasedTimeRecipeIds ?? [],
        },
      },
    }),
  );
}

export async function openLobbyShop(page: Page) {
  await page.goto("/lobby");
  await page.getByTestId("lobby-reference-tile-shop").click();
}
