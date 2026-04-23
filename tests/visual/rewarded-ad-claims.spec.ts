import { expect, test, type Page } from "@playwright/test";
import { computePuzzleRewards } from "../../src/features/meta/rewards/computePuzzleRewards";
import {
  REWARDED_AD_LAST_RESULT_STORAGE_KEY,
  REWARDED_AD_MOCK_OUTCOME_STORAGE_KEY,
  REWARDED_AD_PROVIDER_OVERRIDE_STORAGE_KEY,
} from "../../src/lib/ads/rewardedAds";
import { buildDebugSaveBundle, exportDebugSaveBundle, importDebugSaveBundle, installFixedClock } from "./ownershipTestUtils";
import type { DebugSaveBundle } from "./ownershipTestUtils";

const FIXED_TIME = "2026-04-23T14:00:00";

async function setMockAdOutcome(page: Page, outcome: "success" | "cancel" | "error") {
  await page.evaluate(
    ([outcomeStorageKey, providerStorageKey, lastResultStorageKey, nextOutcome]) => {
      window.localStorage.setItem(providerStorageKey, "mock");
      window.localStorage.removeItem(lastResultStorageKey);
      window.localStorage.setItem(outcomeStorageKey, nextOutcome);
    },
    [
      REWARDED_AD_MOCK_OUTCOME_STORAGE_KEY,
      REWARDED_AD_PROVIDER_OVERRIDE_STORAGE_KEY,
      REWARDED_AD_LAST_RESULT_STORAGE_KEY,
      outcome,
    ] as const,
  );
}

async function seedBundle(
  page: Page,
  bundle: DebugSaveBundle,
  adOutcome: "success" | "cancel" | "error" = "success",
) {
  await importDebugSaveBundle(page, bundle);
  await setMockAdOutcome(page, adOutcome);
}

async function forceUnsupportedProvider(page: Page) {
  await page.evaluate(
    ([providerStorageKey, lastResultStorageKey]) => {
      window.localStorage.setItem(providerStorageKey, "unsupported");
      window.localStorage.removeItem(lastResultStorageKey);
    },
    [
      REWARDED_AD_PROVIDER_OVERRIDE_STORAGE_KEY,
      REWARDED_AD_LAST_RESULT_STORAGE_KEY,
    ] as const,
  );
}

test.describe.configure({ mode: "serial" });

function comparableMissionProgress(bundle: DebugSaveBundle) {
  return Object.fromEntries(
    Object.entries(bundle.app.accountLevel.missionProgress).map(([id, progress]) => [
      id,
      {
        current: progress.current,
        target: progress.target,
        completed: progress.completed,
      },
    ]),
  );
}

test("offline reward base and ad double claims stay single-use across reload", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const nowMs = new Date(FIXED_TIME).getTime();
  const offlineStartedAtMs = nowMs - 30 * 60 * 1000;
  const offlineBundle = buildDebugSaveBundle({
    nowMs,
    app: {
      playerResources: {
        coins: 1_000,
      },
      cafeState: {
        displaySellingActive: true,
        lastAutoSellAtMs: offlineStartedAtMs,
        menuStock: {
          americano: 3,
        },
        lastOfflineSaleAtMs: 0,
        lastOfflineSaleCoins: 0,
        lastOfflineSaleSoldCount: 0,
        pendingOfflineReward: null,
      },
      meta: {
        lastHeartRegenAtMs: nowMs,
        lastSeenAtMs: offlineStartedAtMs,
      },
    },
  });

  await installFixedClock(page, FIXED_TIME);
  await page.emulateMedia({ reducedMotion: "reduce" });

  await test.step("기본 수령은 1회만 적용되고 새로고침 뒤에도 유지된다", async () => {
    await seedBundle(page, offlineBundle);

    const baseButton = page.getByRole("button", { name: "보상 받기" });
    await expect(page.getByText("오프라인 보상")).toBeVisible();
    await expect(baseButton).toBeVisible();
    await expect(
      page.getByRole("button", { name: "광고 보고 2배" }),
    ).toBeVisible();

    const beforeClaim = await exportDebugSaveBundle(page);
    const pendingCoins = beforeClaim.app.cafeState.pendingOfflineReward?.pendingCoins ?? 0;
    const soldCount = beforeClaim.app.cafeState.pendingOfflineReward?.soldCount ?? 0;

    await baseButton.click();

    const afterClaim = await exportDebugSaveBundle(page);
    expect(afterClaim.app.playerResources.coins).toBe(1_000 + pendingCoins);
    expect(afterClaim.app.cafeState.pendingOfflineReward).toBeNull();
    expect(afterClaim.app.cafeState.lastOfflineSaleCoins).toBe(pendingCoins);
    expect(afterClaim.app.cafeState.lastOfflineSaleSoldCount).toBe(soldCount);

    await page.reload();
    await expect(page.getByText("오프라인 보상")).toHaveCount(0);

    const afterReload = await exportDebugSaveBundle(page);
    expect(afterReload.app.playerResources.coins).toBe(1_000 + pendingCoins);
    expect(afterReload.app.cafeState.pendingOfflineReward).toBeNull();
    expect(afterReload.app.cafeState.lastOfflineSaleCoins).toBe(pendingCoins);
  });

  await test.step("광고 x2 수령도 1회만 적용되고 기본 경로와 분리된다", async () => {
    await seedBundle(page, offlineBundle, "success");

    const adButton = page.getByRole("button", { name: "광고 보고 2배" });
    await expect(page.getByText("오프라인 보상")).toBeVisible();

    const beforeClaim = await exportDebugSaveBundle(page);
    const pendingCoins = beforeClaim.app.cafeState.pendingOfflineReward?.pendingCoins ?? 0;
    const soldCount = beforeClaim.app.cafeState.pendingOfflineReward?.soldCount ?? 0;

    await adButton.click();
    await page.clock.runFor(400);

    const afterAdClaim = await exportDebugSaveBundle(page);
    expect(afterAdClaim.app.playerResources.coins).toBe(1_000 + pendingCoins * 2);
    expect(afterAdClaim.app.cafeState.pendingOfflineReward).toBeNull();
    expect(afterAdClaim.app.cafeState.lastOfflineSaleCoins).toBe(pendingCoins * 2);
    expect(afterAdClaim.app.cafeState.lastOfflineSaleSoldCount).toBe(soldCount);

    await page.reload();
    await expect(page.getByText("오프라인 보상")).toHaveCount(0);

    const afterReload = await exportDebugSaveBundle(page);
    expect(afterReload.app.playerResources.coins).toBe(1_000 + pendingCoins * 2);
    expect(afterReload.app.cafeState.pendingOfflineReward).toBeNull();
    expect(afterReload.app.cafeState.lastOfflineSaleCoins).toBe(pendingCoins * 2);
  });
});

test("puzzle result double only changes coins and beans", async ({ page }) => {
  test.setTimeout(120_000);
  const nowMs = new Date(FIXED_TIME).getTime();
  const score = 320;
  const highestTile = 256;
  const mergeCount = 12;
  const rewards = computePuzzleRewards(score, highestTile);

  const puzzleBundle = buildDebugSaveBundle({
    nowMs,
    app: {
      playerResources: {
        coins: 100,
        beans: 40,
        hearts: 2,
      },
      meta: {
        lastHeartRegenAtMs: nowMs,
        lastSeenAtMs: nowMs,
        pendingPuzzleRewardClaim: {
          claimId: `puzzle-${nowMs}-${score}-${highestTile}-${mergeCount}`,
          generatedAtMs: nowMs,
          score,
          highestTile,
          mergeCount,
          baseCoins: rewards.coins,
          baseBeans: rewards.beans,
          baseHearts: rewards.hearts,
        },
      },
    },
  });

  await installFixedClock(page, FIXED_TIME);
  await page.emulateMedia({ reducedMotion: "reduce" });

  let baseClaimState: DebugSaveBundle | null = null;

  await test.step("기본 수령은 기본 보상만 반영한다", async () => {
    await seedBundle(page, puzzleBundle);
    await page.goto("/puzzle");

    const resultDialog = page.getByRole("dialog", { name: "수고했어요" });
    await expect(resultDialog).toBeVisible();
    await expect(resultDialog).toContainText("광고 x2는 코인과 원두만 2배예요.");

    await resultDialog.getByRole("button", { name: "기본 받기" }).click();
    await page.clock.runFor(250);
    await expect(page).toHaveURL(/\/lobby\/?$/);

    baseClaimState = await exportDebugSaveBundle(page);
    expect(baseClaimState.app.playerResources.coins).toBeGreaterThanOrEqual(
      100 + rewards.coins,
    );
    expect(baseClaimState.app.playerResources.beans).toBeGreaterThanOrEqual(
      40 + rewards.beans,
    );
    expect(baseClaimState.app.playerResources.hearts).toBe(2 + rewards.hearts);
    expect(baseClaimState.app.puzzleProgress.lastRunCoins).toBe(rewards.coins);
    expect(baseClaimState.app.puzzleProgress.lastRunBeans).toBe(rewards.beans);
    expect(baseClaimState.app.puzzleProgress.lastRunHearts).toBe(rewards.hearts);
    expect(baseClaimState.app.meta.pendingPuzzleRewardClaim).toBeNull();

    await page.reload();
    const afterReload = await exportDebugSaveBundle(page);
    expect(afterReload.app.playerResources).toEqual(baseClaimState.app.playerResources);
    expect(afterReload.app.meta.pendingPuzzleRewardClaim).toBeNull();
  });

  await test.step("광고 x2는 코인과 원두만 2배고 다른 메타는 같다", async () => {
    await seedBundle(page, puzzleBundle, "success");
    await page.goto("/puzzle");

    const resultDialog = page.getByRole("dialog", { name: "수고했어요" });
    await expect(resultDialog).toBeVisible();

    await resultDialog
      .getByRole("button", { name: "광고 보고 코인+원두 x2" })
      .click();
    await page.clock.runFor(400);
    await page.clock.runFor(250);
    await expect(page).toHaveURL(/\/lobby\/?$/);

    const adClaimState = await exportDebugSaveBundle(page);
    expect(adClaimState.app.playerResources.coins).toBe(
      (baseClaimState?.app.playerResources.coins ?? 0) + rewards.coins,
    );
    expect(adClaimState.app.playerResources.beans).toBe(
      (baseClaimState?.app.playerResources.beans ?? 0) + rewards.beans,
    );
    expect(adClaimState.app.playerResources.hearts).toBe(
      baseClaimState?.app.playerResources.hearts,
    );
    expect(adClaimState.app.puzzleProgress.lastRunCoins).toBe(rewards.coins * 2);
    expect(adClaimState.app.puzzleProgress.lastRunBeans).toBe(rewards.beans * 2);
    expect(adClaimState.app.puzzleProgress.lastRunHearts).toBe(rewards.hearts);
    expect(adClaimState.app.meta.pendingPuzzleRewardClaim).toBeNull();

    expect(adClaimState.app.accountLevel.level).toBe(baseClaimState?.app.accountLevel.level);
    expect(adClaimState.app.accountLevel.tierIndex).toBe(
      baseClaimState?.app.accountLevel.tierIndex,
    );
    expect(adClaimState.app.accountLevel.currentLevelCompleted).toBe(
      baseClaimState?.app.accountLevel.currentLevelCompleted,
    );
    expect(adClaimState.app.accountLevel.unlockedRecipeIds).toEqual(
      baseClaimState?.app.accountLevel.unlockedRecipeIds,
    );
    expect(adClaimState.app.accountLevel.purchasedRecipeIds).toEqual(
      baseClaimState?.app.accountLevel.purchasedRecipeIds,
    );
    expect(comparableMissionProgress(adClaimState)).toEqual(
      comparableMissionProgress(baseClaimState!),
    );
    expect(adClaimState.app.beverageCodex).toEqual(baseClaimState?.app.beverageCodex);
    expect(adClaimState.customers).toEqual(baseClaimState?.customers);

    await page.reload();
    const afterReload = await exportDebugSaveBundle(page);
    expect(afterReload.app.playerResources).toEqual(adClaimState.app.playerResources);
    expect(afterReload.app.meta.pendingPuzzleRewardClaim).toBeNull();
  });
});

test("unsupported rewarded UX disables ad CTA on offline and puzzle rewards", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const nowMs = new Date(FIXED_TIME).getTime();
  const offlineStartedAtMs = nowMs - 30 * 60 * 1000;

  await installFixedClock(page, FIXED_TIME);
  await page.emulateMedia({ reducedMotion: "reduce" });

  await test.step("오프라인 보상 카드는 unsupported 상태를 바로 안내한다", async () => {
    await importDebugSaveBundle(
      page,
      buildDebugSaveBundle({
        nowMs,
        app: {
          playerResources: {
            coins: 1_000,
          },
          cafeState: {
            displaySellingActive: true,
            lastAutoSellAtMs: offlineStartedAtMs,
            menuStock: {
              americano: 3,
            },
            pendingOfflineReward: null,
          },
          meta: {
            lastHeartRegenAtMs: nowMs,
            lastSeenAtMs: offlineStartedAtMs,
          },
        },
      }),
    );
    await forceUnsupportedProvider(page);
    await page.reload();

    await expect(page.getByText("오프라인 보상")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "광고 2배 사용 불가" }),
    ).toBeDisabled();
    await expect(
      page.getByText(
        "이 환경에서는 광고 2배를 사용할 수 없어요. 기본 보상은 바로 받을 수 있어요.",
      ),
    ).toBeVisible();
  });

  await test.step("퍼즐 결과 모달도 같은 정책으로 광고 CTA를 비활성화한다", async () => {
    await importDebugSaveBundle(
      page,
      buildDebugSaveBundle({
        nowMs,
        app: {
          playerResources: {
            coins: 100,
            beans: 40,
            hearts: 2,
          },
          meta: {
            lastHeartRegenAtMs: nowMs,
            lastSeenAtMs: nowMs,
            pendingPuzzleRewardClaim: {
              claimId: `puzzle-${nowMs}-320-256-12-unsupported`,
              generatedAtMs: nowMs,
              score: 320,
              highestTile: 256,
              mergeCount: 12,
              baseCoins: 32,
              baseBeans: 8,
              baseHearts: 1,
            },
          },
        },
      }),
    );
    await forceUnsupportedProvider(page);
    await page.goto("/puzzle");

    const resultDialog = page.getByRole("dialog", { name: "수고했어요" });
    await expect(resultDialog).toBeVisible();
    await expect(
      resultDialog.getByRole("button", { name: "광고 x2 사용 불가" }),
    ).toBeDisabled();
    await expect(
      resultDialog.getByText(
        "이 환경에서는 광고 x2를 사용할 수 없어요. 기본 보상으로 진행해 주세요.",
      ),
    ).toBeVisible();
  });
});
