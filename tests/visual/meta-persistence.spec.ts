import { expect, test } from "@playwright/test";
import {
  buildAccountLevelState,
  buildDebugSaveBundle,
  dayKeyUtc,
  exportDebugSaveBundle,
  importDebugSaveBundle,
  installFixedClock,
} from "./ownershipTestUtils";

test.describe.configure({ mode: "serial" });

test("level and mission state survives reload", async ({ page }) => {
  test.setTimeout(90_000);
  const fixedTime = "2026-04-21T12:00:00";
  const nowMs = new Date(fixedTime).getTime();

  await installFixedClock(page, fixedTime);
  await page.emulateMedia({ reducedMotion: "reduce" });

  const accountLevel = buildAccountLevelState({
    level: 18,
    nowMs,
    unlockedRecipeIds: ["americano", "latte", "affogato"],
    purchasedRecipeIds: ["americano", "latte"],
  });
  const [firstSlot, secondSlot] = accountLevel.missionSlots;
  if (!firstSlot || !secondSlot) {
    throw new Error("level 18 should expose two mission slots");
  }

  accountLevel.missionProgress[firstSlot.id] = {
    ...accountLevel.missionProgress[firstSlot.id]!,
    current: accountLevel.missionProgress[firstSlot.id]!.target,
    completed: true,
    updatedAtMs: nowMs - 4_000,
    completedAtMs: nowMs - 4_000,
  };
  accountLevel.missionProgress[secondSlot.id] = {
    ...accountLevel.missionProgress[secondSlot.id]!,
    current: Math.max(1, accountLevel.missionProgress[secondSlot.id]!.target - 1),
    completed: false,
    updatedAtMs: nowMs - 2_000,
    completedAtMs: null,
  };
  accountLevel.missionSlots = accountLevel.missionSlots.map((slot) => ({
    ...slot,
    completedAtMs: slot.id === firstSlot.id ? nowMs - 4_000 : null,
  }));
  accountLevel.currentLevelCompleted = false;

  await importDebugSaveBundle(
    page,
    buildDebugSaveBundle({
      nowMs,
      app: {
        accountLevel,
      },
    }),
  );

  await page.goto("/lobby");
  await page
    .getByRole("button", { name: `레벨 ${accountLevel.level} 성장 열기` })
    .click();
  const levelCard = page.locator("[data-tier-slot]").first();
  await expect(levelCard).toContainText(`Lv.${accountLevel.level}`);
  await expect(levelCard).toContainText(`1/${accountLevel.missionSlots.length}`);

  const beforeReload = await exportDebugSaveBundle(page);

  await page.reload();
  await page
    .getByRole("button", { name: `레벨 ${accountLevel.level} 성장 열기` })
    .click();
  await expect(page.locator("[data-tier-slot]").first()).toContainText(
    `1/${accountLevel.missionSlots.length}`,
  );

  const afterReload = await exportDebugSaveBundle(page);
  expect(afterReload.app.accountLevel).toEqual(beforeReload.app.accountLevel);
});

test("puzzle skin purchase and equip state survives reload", async ({ page }) => {
  test.setTimeout(90_000);
  const fixedTime = "2026-04-21T15:30:00";
  const nowMs = new Date(fixedTime).getTime();

  await installFixedClock(page, fixedTime);
  await page.emulateMedia({ reducedMotion: "reduce" });

  await importDebugSaveBundle(
    page,
    buildDebugSaveBundle({
      nowMs,
      app: {
        playerResources: {
          coins: 5_000,
        },
        accountLevel: buildAccountLevelState({
          level: 22,
          nowMs,
          unlockedRecipeIds: ["americano", "latte", "affogato"],
          purchasedRecipeIds: ["americano", "latte"],
        }),
      },
    }),
  );

  await page.goto("/shop");

  const backgroundCard = page.locator("li").filter({ hasText: "웜 우드 보드" }).first();
  await expect(backgroundCard).toContainText("구매 가능");
  await backgroundCard.getByRole("button").click();
  await expect(backgroundCard).toContainText("보유");
  await backgroundCard.getByRole("button", { name: "장착하기" }).click();
  await expect(backgroundCard).toContainText("장착 중");

  const blockCard = page.locator("li").filter({ hasText: "에스프레소 타일" }).first();
  await expect(blockCard).toContainText("구매 가능");
  await blockCard.getByRole("button").click();
  await expect(blockCard).toContainText("보유");
  await blockCard.getByRole("button", { name: "장착하기" }).click();
  await expect(blockCard).toContainText("장착 중");

  const beforeReload = await exportDebugSaveBundle(page);
  expect(beforeReload.app.playerResources.coins).toBe(5_000 - 180 - 220);
  expect(beforeReload.app.cosmetics.ownedPuzzleSkinIds).toEqual(
    expect.arrayContaining(["warm_wood_bg", "espresso_blocks"]),
  );
  expect(beforeReload.app.cosmetics.equippedPuzzleBackgroundSkinId).toBe(
    "warm_wood_bg",
  );
  expect(beforeReload.app.cosmetics.equippedPuzzleBlockSkinId).toBe(
    "espresso_blocks",
  );

  await page.reload();

  const reloadedBackgroundCard = page
    .locator("li")
    .filter({ hasText: "웜 우드 보드" })
    .first();
  const reloadedBlockCard = page
    .locator("li")
    .filter({ hasText: "에스프레소 타일" })
    .first();
  await expect(reloadedBackgroundCard).toContainText("장착 중");
  await expect(reloadedBlockCard).toContainText("장착 중");

  const afterReload = await exportDebugSaveBundle(page);
  expect(afterReload.app.cosmetics).toEqual(beforeReload.app.cosmetics);
  expect(afterReload.app.playerResources.coins).toBe(
    beforeReload.app.playerResources.coins,
  );
});

test("customer affection and story state survives reload", async ({ page }) => {
  test.setTimeout(90_000);
  const fixedTime = "2026-04-21T19:30:00";
  const nowMs = new Date(fixedTime).getTime();
  const dayKey = dayKeyUtc(nowMs);

  await installFixedClock(page, fixedTime);
  await page.emulateMedia({ reducedMotion: "reduce" });

  await importDebugSaveBundle(
    page,
    buildDebugSaveBundle({
      nowMs,
      customers: {
        featuredCustomerId: "so_yeon",
        featuredDailyQuotaTotal: 2,
        featuredDailyQuotaUsed: 1,
        featuredQuotaDayKey: dayKey,
        lastFeaturedDayKey: dayKey,
        byId: {
          so_yeon: {
            affection: 7,
            isRegular: true,
            storyIndex: 1,
            lastAffectionAtMs: nowMs - 1_000,
          },
        },
      },
    }),
  );

  await page.goto("/lobby");
  const counterTile = page.getByTestId("lobby-reference-tile-counter");
  await counterTile.scrollIntoViewIfNeeded();
  await counterTile.click();

  await expect(page.getByText("오늘의 손님 · 소연")).toBeVisible();
  await expect(page.getByText("단골", { exact: true })).toBeVisible();
  await expect(page.getByText("짧은 안부")).toBeVisible();

  const beforeReload = await exportDebugSaveBundle(page);

  await page.reload();
  const reloadedCounterTile = page.getByTestId("lobby-reference-tile-counter");
  await reloadedCounterTile.scrollIntoViewIfNeeded();
  await reloadedCounterTile.click();

  await expect(page.getByText("오늘의 손님 · 소연")).toBeVisible();
  await expect(page.getByText("단골", { exact: true })).toBeVisible();
  await expect(page.getByText("짧은 안부")).toBeVisible();

  const afterReload = await exportDebugSaveBundle(page);
  expect(afterReload.customers).toEqual(beforeReload.customers);
});

test("offline reward waits for claim and survives reload", async ({ page }) => {
  test.setTimeout(90_000);
  const fixedTime = "2026-04-23T10:00:00";
  const nowMs = new Date(fixedTime).getTime();
  const offlineStartedAtMs = nowMs - 30 * 60 * 1000;
  const bundle = buildDebugSaveBundle({
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

  await installFixedClock(page, fixedTime);
  await page.emulateMedia({ reducedMotion: "reduce" });

  await page.addInitScript((seed) => {
    if (window.sessionStorage.getItem("__offline-reward-seeded__") === "1") {
      return;
    }
    window.localStorage.setItem(
      "coffee-2048-save-v2",
      JSON.stringify({
        state: seed.app,
        version: 4,
      }),
    );
    window.localStorage.setItem(
      "coffee2048_customers_v1",
      JSON.stringify({
        state: seed.customers,
        version: 6,
      }),
    );
    window.sessionStorage.setItem("__offline-reward-seeded__", "1");
  }, bundle);
  await page.goto("/lobby");

  const claimButton = page.getByRole("button", { name: "보상 받기" });
  await claimButton.scrollIntoViewIfNeeded();
  await expect(page.getByText("오프라인 보상")).toBeVisible();
  await expect(claimButton).toBeVisible();

  await page.reload();

  const beforeClaim = await exportDebugSaveBundle(page);
  const expectedOfflineCoins = 15;
  expect(beforeClaim.app.playerResources.coins).toBe(1_000);
  expect(beforeClaim.app.cafeState.menuStock.americano).toBe(0);
  expect(beforeClaim.app.cafeState.displaySellingActive).toBe(false);
  expect(beforeClaim.app.cafeState.pendingOfflineReward).toMatchObject({
    soldCount: 3,
    pendingCoins: expectedOfflineCoins,
  });
  expect(beforeClaim.app.cafeState.pendingOfflineReward?.generatedAtMs).toBeGreaterThanOrEqual(
    nowMs,
  );
  expect(beforeClaim.app.cafeState.pendingOfflineReward?.generatedAtMs).toBeLessThan(
    nowMs + 5_000,
  );

  await claimButton.click();

  const afterClaim = await exportDebugSaveBundle(page);
  expect(afterClaim.app.playerResources.coins).toBe(1_000 + expectedOfflineCoins);
  expect(afterClaim.app.cafeState.pendingOfflineReward).toBeNull();
  expect(afterClaim.app.cafeState.lastOfflineSaleCoins).toBe(expectedOfflineCoins);
  expect(afterClaim.app.cafeState.lastOfflineSaleSoldCount).toBe(3);

  await page.reload();
  await expect(page.getByText("오프라인 보상")).toHaveCount(0);

  const afterReload = await exportDebugSaveBundle(page);
  expect(afterReload.app.playerResources.coins).toBe(1_000 + expectedOfflineCoins);
  expect(afterReload.app.cafeState.pendingOfflineReward).toBeNull();
  expect(afterReload.app.cafeState.lastOfflineSaleCoins).toBe(expectedOfflineCoins);
});
