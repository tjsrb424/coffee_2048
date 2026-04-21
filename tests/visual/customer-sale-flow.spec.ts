import { expect, test, type Page } from "@playwright/test";
import {
  buildDebugSaveBundle,
  dayKeyUtc,
  exportDebugSaveBundle,
  importDebugSaveBundle,
  installFixedClock,
} from "./ownershipTestUtils";

test.describe.configure({ mode: "serial" });

async function openCounterSheet(page: Page) {
  const counterTile = page.getByTestId("lobby-reference-tile-counter");
  await counterTile.scrollIntoViewIfNeeded();
  await counterTile.click();
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
          lastAutoSellAtMs: nowMs,
          menuStock: {
            americano: 2,
          },
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
          queue: ["guest_023", "han_eun"],
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

  await openCounterSheet(page);
  await expect(page.getByRole("button", { name: "판매 중지" })).toBeVisible();

  await page.clock.runFor(9_000);

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
          lastAutoSellAtMs: nowMs,
          menuStock: {
            americano: 1,
          },
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

  await openCounterSheet(page);
  await expect(page.getByRole("button", { name: "판매 중지" })).toBeVisible();

  await page.clock.runFor(5_000);

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
