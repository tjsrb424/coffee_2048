import { expect, test, type Page } from "@playwright/test";
import {
  buildDebugSaveBundle,
  dayKeyUtc,
  exportDebugSaveBundle,
  importDebugSaveBundle,
  installFixedClock,
} from "./ownershipTestUtils";

test.describe.configure({ mode: "serial" });

const SALE_IMPORT_GUARD_MS = 60_000;
const SELL_ONCE_AFTER_IMPORT_MS = SALE_IMPORT_GUARD_MS + 4_100;

async function openCounterSheet(page: Page) {
  const counterTile = page.getByTestId("lobby-reference-tile-counter");
  await counterTile.scrollIntoViewIfNeeded();
  await counterTile.click();
}

async function openCounterSheetAndStartSale(page: Page) {
  await openCounterSheet(page);
  await expect(page.getByRole("button", { name: "판매 중지" })).toBeVisible();
}

function quotaRngSeedForDay(dayKey: number) {
  return (dayKey * 1103515245 + 12345) >>> 0;
}

function nextQuotaRng(seed: number) {
  let x = seed | 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return x >>> 0;
}

function featuredDailyQuotaForDayForTest(dayKey: number) {
  const roll = (nextQuotaRng(quotaRngSeedForDay(dayKey)) % 10_000) / 10_000;
  return roll < 0.55 ? 1 : 2;
}

test("customer affection write path from live sale survives reload", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const fixedTime = "2026-04-21T15:30:00";
  const nowMs = new Date(fixedTime).getTime();
  const dayKey = dayKeyUtc(nowMs);

  await installFixedClock(page, fixedTime);
  await page.emulateMedia({ reducedMotion: "reduce" });

  await importDebugSaveBundle(
    page,
    buildDebugSaveBundle({
      nowMs,
      app: {
        cafeState: {
          displaySellingActive: true,
          lastAutoSellAtMs: nowMs + SALE_IMPORT_GUARD_MS,
          menuStock: {
            americano: 1,
          },
        },
        meta: {
          lastHeartRegenAtMs: nowMs + SALE_IMPORT_GUARD_MS,
          lastSeenAtMs: nowMs + SALE_IMPORT_GUARD_MS,
        },
      },
      customers: {
        featuredCustomerId: "han_eun",
        featuredDailyQuotaTotal: 2,
        featuredDailyQuotaUsed: 0,
        featuredQuotaDayKey: dayKey,
        lastFeaturedDayKey: dayKey,
        saleSession: {
          startedAtMs: nowMs,
          queue: ["han_eun"],
          currentRemainingCups: 1,
          featuredQueued: true,
        },
        byId: {
          han_eun: {
            affection: 4,
            isRegular: false,
            storyIndex: 0,
            lastAffectionAtMs: 0,
          },
        },
      },
    }),
  );

  await openCounterSheetAndStartSale(page);

  await page.clock.runFor(SALE_IMPORT_GUARD_MS + 9_000);

  await expect(page.getByText("오늘의 손님 · 한은")).toBeVisible();

  const beforeReload = await exportDebugSaveBundle(page);
  expect(beforeReload.customers.featuredCustomerId).toBe("han_eun");
  expect(beforeReload.customers.byId.han_eun).toMatchObject({
    affection: 6,
    isRegular: false,
    storyIndex: 1,
  });
  expect(beforeReload.customers.byId.han_eun?.lastAffectionAtMs).toBeGreaterThan(
    nowMs,
  );

  await page.reload();
  await openCounterSheet(page);
  await expect(page.getByText("오늘의 손님 · 한은")).toBeVisible();

  const afterReload = await exportDebugSaveBundle(page);
  expect(afterReload.customers).toEqual(beforeReload.customers);
});

test("customer regular status write path survives reload", async ({ page }) => {
  test.setTimeout(90_000);
  const fixedTime = "2026-04-21T16:00:00";
  const nowMs = new Date(fixedTime).getTime();
  const dayKey = dayKeyUtc(nowMs);

  await installFixedClock(page, fixedTime);
  await page.emulateMedia({ reducedMotion: "reduce" });

  await importDebugSaveBundle(
    page,
    buildDebugSaveBundle({
      nowMs,
      app: {
        cafeState: {
          displaySellingActive: true,
          lastAutoSellAtMs: nowMs + SALE_IMPORT_GUARD_MS,
          menuStock: {
            americano: 1,
          },
        },
        meta: {
          lastHeartRegenAtMs: nowMs + SALE_IMPORT_GUARD_MS,
          lastSeenAtMs: nowMs + SALE_IMPORT_GUARD_MS,
        },
      },
      customers: {
        featuredCustomerId: "han_eun",
        featuredDailyQuotaTotal: 1,
        featuredDailyQuotaUsed: 0,
        featuredQuotaDayKey: dayKey,
        lastFeaturedDayKey: dayKey,
        saleSession: {
          startedAtMs: nowMs,
          queue: ["han_eun"],
          currentRemainingCups: 1,
          featuredQueued: true,
        },
        byId: {
          han_eun: {
            affection: 10,
            isRegular: false,
            storyIndex: 1,
            lastAffectionAtMs: nowMs - 60_000,
          },
        },
      },
    }),
  );

  await openCounterSheetAndStartSale(page);

  await page.clock.runFor(SELL_ONCE_AFTER_IMPORT_MS);

  await expect(page.getByText("오늘의 손님 · 한은")).toBeVisible();
  const regularBadgeInCounterSheet = page
    .locator("div")
    .filter({ has: page.getByText("오늘의 손님 · 한은") })
    .filter({ has: page.getByText("단골", { exact: true }) })
    .first();
  await expect(regularBadgeInCounterSheet).toBeVisible();

  const beforeReload = await exportDebugSaveBundle(page);
  expect(beforeReload.customers.byId.han_eun).toMatchObject({
    affection: 12,
    isRegular: true,
    storyIndex: 1,
  });

  await page.reload();
  await openCounterSheet(page);
  await expect(page.getByText("오늘의 손님 · 한은")).toBeVisible();
  await expect(regularBadgeInCounterSheet).toBeVisible();

  const afterReload = await exportDebugSaveBundle(page);
  expect(afterReload.customers.byId.han_eun?.isRegular).toBe(true);
  expect(afterReload.customers).toEqual(beforeReload.customers);
});

test("customer preferred menu bonus write path survives reload and beats baseline", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const fixedTime = "2026-04-21T17:00:00";
  const nowMs = new Date(fixedTime).getTime();
  const dayKey = dayKeyUtc(nowMs);
  const initialAffection = 3;
  const autoSellWindowMs = SELL_ONCE_AFTER_IMPORT_MS;

  await installFixedClock(page, fixedTime);
  await page.emulateMedia({ reducedMotion: "reduce" });

  await importDebugSaveBundle(
    page,
    buildDebugSaveBundle({
      nowMs,
      app: {
        cafeState: {
          displaySellingActive: true,
          lastAutoSellAtMs: nowMs + SALE_IMPORT_GUARD_MS,
          menuStock: {
            latte: 1,
          },
        },
        meta: {
          lastHeartRegenAtMs: nowMs + SALE_IMPORT_GUARD_MS,
          lastSeenAtMs: nowMs + SALE_IMPORT_GUARD_MS,
        },
      },
      customers: {
        featuredCustomerId: "han_eun",
        featuredDailyQuotaTotal: 2,
        featuredDailyQuotaUsed: 0,
        featuredQuotaDayKey: dayKey,
        lastFeaturedDayKey: dayKey,
        saleSession: {
          startedAtMs: nowMs,
          queue: ["han_eun"],
          currentRemainingCups: 1,
          featuredQueued: true,
        },
        byId: {
          han_eun: {
            affection: initialAffection,
            isRegular: false,
            storyIndex: 0,
            lastAffectionAtMs: 0,
          },
        },
      },
    }),
  );

  await openCounterSheetAndStartSale(page);
  await expect(page.getByText("선호 · 아메리카노")).toBeVisible();

  await page.clock.runFor(autoSellWindowMs);

  await expect(page.getByText("오늘의 손님 · 애정 +1")).toBeVisible();

  const baseline = await exportDebugSaveBundle(page);
  const baselineAffection = baseline.customers.byId.han_eun?.affection ?? 0;
  expect(baseline.customers.byId.han_eun).toMatchObject({
    affection: 4,
    isRegular: false,
    storyIndex: 0,
  });
  expect(baseline.customers.featuredDailyQuotaUsed).toBe(1);
  expect(baseline.app.cafeState.menuStock.latte).toBe(0);
  expect(baseline.app.cafeState.displaySellingActive).toBe(false);
  expect(baseline.app.cafeState.lastAutoSellAtMs).toBeGreaterThan(nowMs);

  const bonusSeedNowMs = nowMs + autoSellWindowMs;
  await importDebugSaveBundle(page, {
    format: "coffee2048-debug-save-bundle",
    app: {
      ...baseline.app,
      cafeState: {
        ...baseline.app.cafeState,
        displaySellingActive: true,
        lastAutoSellAtMs: bonusSeedNowMs + SALE_IMPORT_GUARD_MS,
        menuStock: {
          ...baseline.app.cafeState.menuStock,
          americano: 1,
          latte: 0,
        },
      },
      meta: {
        ...baseline.app.meta,
        lastHeartRegenAtMs: bonusSeedNowMs + SALE_IMPORT_GUARD_MS,
        lastSeenAtMs: bonusSeedNowMs + SALE_IMPORT_GUARD_MS,
      },
    },
    customers: {
      ...baseline.customers,
      featuredDailyQuotaTotal: 2,
      featuredDailyQuotaUsed: 1,
      featuredQuotaDayKey: dayKey,
      lastFeaturedDayKey: dayKey,
      saleSession: {
        startedAtMs: bonusSeedNowMs,
        queue: ["han_eun"],
        currentRemainingCups: 1,
        featuredQueued: true,
      },
    },
  });

  await openCounterSheetAndStartSale(page);

  await page.clock.runFor(autoSellWindowMs);

  await expect(page.getByText("오늘의 손님 · 애정 +2")).toBeVisible();

  const preferred = await exportDebugSaveBundle(page);
  const preferredAffection = preferred.customers.byId.han_eun?.affection ?? 0;
  const baselineDelta = baselineAffection - initialAffection;
  const preferredDelta = preferredAffection - baselineAffection;

  expect(baselineDelta).toBe(1);
  expect(preferredDelta).toBe(2);
  expect(preferredDelta).toBe(baselineDelta + 1);
  expect(preferred.customers.byId.han_eun).toMatchObject({
    affection: 6,
    isRegular: false,
    storyIndex: 1,
  });
  expect(preferred.customers.byId.han_eun?.lastAffectionAtMs).toBeGreaterThan(
    baseline.customers.byId.han_eun?.lastAffectionAtMs ?? 0,
  );
  expect(preferred.customers.featuredDailyQuotaUsed).toBe(2);
  expect(preferred.app.cafeState.menuStock.americano).toBe(0);
  expect(preferred.app.cafeState.displaySellingActive).toBe(false);
  expect(preferred.app.cafeState.lastAutoSellAtMs).toBeGreaterThan(bonusSeedNowMs);

  await page.reload();
  await openCounterSheet(page);
  await expect(page.getByText("오늘의 손님 · 한은")).toBeVisible();
  await expect(page.getByText("선호 · 아메리카노")).toBeVisible();

  const afterReload = await exportDebugSaveBundle(page);
  expect(afterReload.customers.byId.han_eun).toMatchObject({
    affection: 6,
    isRegular: false,
    storyIndex: 1,
  });
  expect(afterReload.customers.featuredDailyQuotaUsed).toBe(2);
  expect(afterReload.customers).toEqual(preferred.customers);
});

test("customer daily quota resets on next day and persists after next-day sale", async ({
  page,
}) => {
  test.setTimeout(150_000);
  const dayOneTime = "2026-04-21T18:00:00";
  const dayTwoTime = "2026-04-22T09:00:00";
  const dayOneMs = new Date(dayOneTime).getTime();
  const dayTwoMs = new Date(dayTwoTime).getTime();
  const dayOneKey = dayKeyUtc(dayOneMs);
  const dayTwoKey = dayKeyUtc(dayTwoMs);
  const dayTwoQuotaTotal = featuredDailyQuotaForDayForTest(dayTwoKey);
  const autoSellWindowMs = SALE_IMPORT_GUARD_MS + 8_200;

  await installFixedClock(page, dayOneTime);
  await page.emulateMedia({ reducedMotion: "reduce" });

  await importDebugSaveBundle(
    page,
    buildDebugSaveBundle({
      nowMs: dayOneMs,
      app: {
        cafeState: {
          displaySellingActive: true,
          lastAutoSellAtMs: dayOneMs + SALE_IMPORT_GUARD_MS,
          menuStock: {
            americano: 2,
          },
        },
      },
      customers: {
        featuredCustomerId: "han_eun",
        featuredDailyQuotaTotal: 2,
        featuredDailyQuotaUsed: 0,
        featuredQuotaDayKey: dayOneKey,
        lastFeaturedDayKey: dayOneKey,
        saleSession: {
          startedAtMs: dayOneMs,
          queue: ["han_eun", "han_eun"],
          currentRemainingCups: 1,
          featuredQueued: true,
        },
        byId: {
          han_eun: {
            affection: 1,
            isRegular: false,
            storyIndex: 0,
            lastAffectionAtMs: 0,
          },
        },
      },
    }),
  );

  await openCounterSheetAndStartSale(page);

  await page.clock.runFor(autoSellWindowMs);

  const dayOneAfterSales = await exportDebugSaveBundle(page);
  expect(dayOneAfterSales.customers.featuredCustomerId).toBe("han_eun");
  expect(dayOneAfterSales.customers.featuredDailyQuotaTotal).toBe(2);
  expect(dayOneAfterSales.customers.featuredDailyQuotaUsed).toBe(2);
  expect(dayOneAfterSales.customers.featuredQuotaDayKey).toBe(dayOneKey);
  expect(dayOneAfterSales.app.cafeState.menuStock.americano).toBe(0);
  expect(dayOneAfterSales.app.cafeState.displaySellingActive).toBe(false);

  await page.reload();
  await openCounterSheet(page);
  await expect(page.getByText("오늘의 손님 · 한은")).toBeVisible();

  const dayOneAfterReload = await exportDebugSaveBundle(page);
  expect(dayOneAfterReload.customers.featuredDailyQuotaUsed).toBe(2);
  expect(dayOneAfterReload.customers.featuredQuotaDayKey).toBe(dayOneKey);
  expect(dayOneAfterReload.customers).toEqual(dayOneAfterSales.customers);

  const nextDayPage = await page.context().newPage();
  await installFixedClock(nextDayPage, dayTwoTime);
  await nextDayPage.emulateMedia({ reducedMotion: "reduce" });

  await importDebugSaveBundle(nextDayPage, {
    format: "coffee2048-debug-save-bundle",
    app: {
      ...dayOneAfterReload.app,
      cafeState: {
        ...dayOneAfterReload.app.cafeState,
        displaySellingActive: true,
        lastAutoSellAtMs: dayTwoMs + SALE_IMPORT_GUARD_MS,
        menuStock: {
          ...dayOneAfterReload.app.cafeState.menuStock,
          americano: 1,
        },
      },
      meta: {
        ...dayOneAfterReload.app.meta,
        lastHeartRegenAtMs: dayTwoMs + SALE_IMPORT_GUARD_MS,
        lastSeenAtMs: dayTwoMs + SALE_IMPORT_GUARD_MS,
      },
    },
    customers: {
      ...dayOneAfterReload.customers,
      // 대표 손님 교체 테스트로 범위가 넓어지지 않게 day-boundary는 quota만 검증한다.
      lastFeaturedDayKey: dayTwoKey,
    },
  });

  await nextDayPage.reload();
  await openCounterSheet(nextDayPage);
  await expect(nextDayPage.getByText("오늘의 손님 · 한은")).toBeVisible();

  const dayTwoReset = await exportDebugSaveBundle(nextDayPage);
  expect(dayTwoReset.customers.featuredCustomerId).toBe("han_eun");
  expect(dayTwoReset.customers.featuredQuotaDayKey).toBe(dayTwoKey);
  expect(dayTwoReset.customers.featuredDailyQuotaTotal).toBe(dayTwoQuotaTotal);
  expect(dayTwoReset.customers.featuredDailyQuotaUsed).toBe(0);

  await nextDayPage.reload();
  await openCounterSheet(nextDayPage);
  await expect(nextDayPage.getByText("오늘의 손님 · 한은")).toBeVisible();

  const dayTwoResetAfterReload = await exportDebugSaveBundle(nextDayPage);
  expect(dayTwoResetAfterReload.customers).toEqual(dayTwoReset.customers);

  await importDebugSaveBundle(nextDayPage, {
    format: "coffee2048-debug-save-bundle",
    app: {
      ...dayTwoResetAfterReload.app,
      cafeState: {
        ...dayTwoResetAfterReload.app.cafeState,
        displaySellingActive: true,
        lastAutoSellAtMs: dayTwoMs + SALE_IMPORT_GUARD_MS,
        menuStock: {
          ...dayTwoResetAfterReload.app.cafeState.menuStock,
          americano: 1,
        },
      },
      meta: {
        ...dayTwoResetAfterReload.app.meta,
        lastHeartRegenAtMs: dayTwoMs + SALE_IMPORT_GUARD_MS,
        lastSeenAtMs: dayTwoMs + SALE_IMPORT_GUARD_MS,
      },
    },
    customers: {
      ...dayTwoResetAfterReload.customers,
      saleSession: {
        startedAtMs: dayTwoMs,
        queue: ["han_eun"],
        currentRemainingCups: 1,
        featuredQueued: true,
      },
    },
  });

  await openCounterSheetAndStartSale(nextDayPage);

  await nextDayPage.clock.runFor(SELL_ONCE_AFTER_IMPORT_MS);

  const dayTwoAfterSale = await exportDebugSaveBundle(nextDayPage);
  expect(dayTwoAfterSale.customers.featuredQuotaDayKey).toBe(dayTwoKey);
  expect(dayTwoAfterSale.customers.featuredDailyQuotaTotal).toBe(dayTwoQuotaTotal);
  expect(dayTwoAfterSale.customers.featuredDailyQuotaUsed).toBe(1);
  expect(dayTwoAfterSale.app.cafeState.menuStock.americano).toBe(0);
  expect(dayTwoAfterSale.app.cafeState.displaySellingActive).toBe(false);

  await nextDayPage.reload();
  await openCounterSheet(nextDayPage);
  await expect(nextDayPage.getByText("오늘의 손님 · 한은")).toBeVisible();

  const dayTwoAfterSaleReload = await exportDebugSaveBundle(nextDayPage);
  expect(dayTwoAfterSaleReload.customers.featuredQuotaDayKey).toBe(dayTwoKey);
  expect(dayTwoAfterSaleReload.customers.featuredDailyQuotaUsed).toBe(1);
  expect(dayTwoAfterSaleReload.customers).toEqual(dayTwoAfterSale.customers);

  await nextDayPage.close();
});

test("featured customer rotates on next day and stays after reload", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const dayOneTime = "1970-01-01T12:00:00";
  const dayTwoTime = "1970-01-02T00:00:00.008Z";
  const dayOneMs = new Date(dayOneTime).getTime();
  const dayTwoMs = new Date(dayTwoTime).getTime();
  const dayOneKey = dayKeyUtc(dayOneMs);
  const dayTwoKey = dayKeyUtc(dayTwoMs);

  await installFixedClock(page, dayOneTime);
  await page.emulateMedia({ reducedMotion: "reduce" });

  await importDebugSaveBundle(
    page,
    buildDebugSaveBundle({
      nowMs: dayOneMs,
      customers: {
        featuredCustomerId: "han_eun",
        featuredQuotaDayKey: dayOneKey,
        lastFeaturedDayKey: dayOneKey,
      },
    }),
  );

  await openCounterSheet(page);
  await expect(page.getByText("오늘의 손님 · 한은")).toBeVisible();

  const dayOneState = await exportDebugSaveBundle(page);
  expect(dayOneState.customers.featuredCustomerId).toBe("han_eun");
  expect(dayOneState.customers.lastFeaturedDayKey).toBe(dayOneKey);

  const nextDayPage = await page.context().newPage();
  await installFixedClock(nextDayPage, dayTwoTime);
  await nextDayPage.emulateMedia({ reducedMotion: "reduce" });

  await importDebugSaveBundle(nextDayPage, dayOneState);
  await nextDayPage.reload();
  await openCounterSheet(nextDayPage);

  await expect(nextDayPage.getByText("오늘의 손님 · 효임")).toBeVisible();
  await expect(nextDayPage.getByText("오늘의 손님 · 한은")).toHaveCount(0);

  const rotated = await exportDebugSaveBundle(nextDayPage);
  expect(rotated.customers.featuredCustomerId).toBe("hyo_im");
  expect(rotated.customers.featuredCustomerId).not.toBe(
    dayOneState.customers.featuredCustomerId,
  );
  expect(rotated.customers.lastFeaturedDayKey).toBe(dayTwoKey);

  await nextDayPage.reload();
  await openCounterSheet(nextDayPage);
  await expect(nextDayPage.getByText("오늘의 손님 · 효임")).toBeVisible();

  const rotatedAfterReload = await exportDebugSaveBundle(nextDayPage);
  expect(rotatedAfterReload.customers.featuredCustomerId).toBe("hyo_im");
  expect(rotatedAfterReload.customers.lastFeaturedDayKey).toBe(dayTwoKey);
  expect(rotatedAfterReload.customers).toEqual(rotated.customers);

  await nextDayPage.close();
});

test("regular gift ping appears in counter sheet after sale and clears on reload", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const fixedTime = "2026-04-21T20:00:00";
  const nowMs = new Date(fixedTime).getTime();
  const dayKey = dayKeyUtc(nowMs);
  const seededSessionStartMs = 1_700_000_000_013;
  const regularGiftText = "효임이 다음엔 더 달콤한 걸로요 · +3코인";

  await installFixedClock(page, fixedTime);
  await page.emulateMedia({ reducedMotion: "reduce" });

  await importDebugSaveBundle(
    page,
    buildDebugSaveBundle({
      nowMs,
      app: {
        cafeState: {
          displaySellingActive: true,
          lastAutoSellAtMs: nowMs + SALE_IMPORT_GUARD_MS,
          menuStock: {
            americano: 1,
          },
        },
      },
      customers: {
        featuredCustomerId: "hyo_im",
        featuredDailyQuotaTotal: 1,
        featuredDailyQuotaUsed: 0,
        featuredQuotaDayKey: dayKey,
        lastFeaturedDayKey: dayKey,
        saleSession: {
          startedAtMs: seededSessionStartMs,
          queue: ["hyo_im"],
          currentRemainingCups: 1,
          featuredQueued: true,
        },
        byId: {
          hyo_im: {
            affection: 8,
            isRegular: false,
            storyIndex: 1,
            lastAffectionAtMs: nowMs - 60_000,
          },
        },
      },
    }),
  );

  await openCounterSheetAndStartSale(page);
  await expect(page.getByText("오늘의 손님 · 효임")).toBeVisible();
  await expect(page.getByText(regularGiftText)).toHaveCount(0);

  await page.clock.runFor(4_100);

  await expect(page.getByText(regularGiftText)).toBeVisible();

  const beforeReload = await exportDebugSaveBundle(page);
  expect(beforeReload.customers.featuredCustomerId).toBe("hyo_im");
  expect(beforeReload.customers.byId.hyo_im).toMatchObject({
    affection: 9,
    isRegular: false,
    storyIndex: 1,
  });

  await page.reload();
  await openCounterSheet(page);
  await expect(page.getByText("오늘의 손님 · 효임")).toBeVisible();
  await expect(page.getByText(regularGiftText)).toHaveCount(0);
});

test("sale session regenerates safely on next day and next sale still works", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const dayOneTime = "1970-01-01T12:00:00";
  const dayTwoTime = "1970-01-02T09:00:00";
  const dayOneMs = new Date(dayOneTime).getTime();
  const dayTwoMs = new Date(dayTwoTime).getTime();
  const dayOneKey = dayKeyUtc(dayOneMs);
  const dayTwoKey = dayKeyUtc(dayTwoMs);

  await installFixedClock(page, dayTwoTime);
  await page.emulateMedia({ reducedMotion: "reduce" });

  await importDebugSaveBundle(
    page,
    buildDebugSaveBundle({
      nowMs: dayTwoMs,
      app: {
        cafeState: {
          displaySellingActive: true,
          lastAutoSellAtMs: dayTwoMs + SALE_IMPORT_GUARD_MS,
          menuStock: {
            americano: 2,
          },
        },
      },
      customers: {
        featuredCustomerId: "han_eun",
        featuredDailyQuotaTotal: 1,
        featuredDailyQuotaUsed: 0,
        featuredQuotaDayKey: dayOneKey,
        lastFeaturedDayKey: dayOneKey,
        saleSession: {
          startedAtMs: dayOneMs,
          queue: ["han_eun"],
          currentRemainingCups: 1,
          featuredQueued: true,
        },
        byId: {
          han_eun: {
            affection: 5,
            isRegular: false,
            storyIndex: 0,
            lastAffectionAtMs: dayOneMs - 60_000,
          },
          hyo_im: {
            affection: 1,
            isRegular: false,
            storyIndex: 1,
            lastAffectionAtMs: dayOneMs - 60_000,
          },
        },
      },
    }),
  );

  await openCounterSheetAndStartSale(page);
  await expect(page.getByText("오늘의 손님 · 효임")).toBeVisible();
  await expect(page.getByText("오늘 들른 손님 · 한은")).toHaveCount(0);

  const dayTwoBeforeSale = await exportDebugSaveBundle(page);
  expect(dayTwoBeforeSale.customers.featuredCustomerId).toBe("hyo_im");
  expect(dayTwoBeforeSale.customers.featuredQuotaDayKey).toBe(dayTwoKey);
  expect(dayTwoBeforeSale.customers.featuredDailyQuotaUsed).toBe(0);

  await page.clock.runFor(4_100);

  const dayTwoAfterSale = await exportDebugSaveBundle(page);
  expect(dayTwoAfterSale.customers.featuredCustomerId).toBe("hyo_im");
  expect(dayTwoAfterSale.customers.featuredQuotaDayKey).toBe(dayTwoKey);
  expect(dayTwoAfterSale.app.cafeState.menuStock.americano).toBe(1);
  expect(dayTwoAfterSale.app.cafeState.displaySellingActive).toBe(true);

  await page.reload();
  await openCounterSheet(page);
  await expect(page.getByText("오늘의 손님 · 효임")).toBeVisible();
  await expect(page.getByText("오늘 들른 손님 · 한은")).toHaveCount(0);

  const dayTwoAfterReload = await exportDebugSaveBundle(page);
  expect(dayTwoAfterReload.customers.featuredCustomerId).toBe("hyo_im");
  expect(dayTwoAfterReload.customers.featuredQuotaDayKey).toBe(dayTwoKey);
  expect(dayTwoAfterReload.app.cafeState.menuStock.americano).toBe(1);
  expect(dayTwoAfterReload.app.cafeState.displaySellingActive).toBe(true);

  await page.clock.runFor(4_100);

  const dayTwoAfterSecondSale = await exportDebugSaveBundle(page);
  expect(dayTwoAfterSecondSale.customers.featuredCustomerId).toBe("hyo_im");
  expect(dayTwoAfterSecondSale.customers.featuredQuotaDayKey).toBe(dayTwoKey);
  expect(dayTwoAfterSecondSale.app.cafeState.menuStock.americano).toBe(0);
  expect(dayTwoAfterSecondSale.app.cafeState.displaySellingActive).toBe(false);
});
