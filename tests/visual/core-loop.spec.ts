import { expect, test, type Page } from "@playwright/test";
import {
  buildDebugSaveBundle,
  importDebugSaveBundle,
  installFixedClock,
} from "./ownershipTestUtils";
import { STORAGE_KEY } from "../../src/features/meta/storage/storageKeys";
import type { AppPersistState } from "../../src/features/meta/types/gameState";

test.describe.configure({ mode: "serial" });

const FIXED_TIME = "2026-04-24T10:00:00";
const PUZZLE_KEYS = [
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowLeft",
  "ArrowLeft",
] as const;

async function openPuzzleFromLobby(page: Page) {
  await page.getByRole("button", { name: "PLAY" }).click();
  await page.clock.runFor(250);
  await expect(page).toHaveURL(/\/puzzle\/?$/);
  await expect(page.getByTestId("puzzle-board-visual-mask")).toBeVisible();
}

async function playDeterministicPuzzleRun(page: Page) {
  for (const key of PUZZLE_KEYS) {
    await page.keyboard.press(key);
    await page.clock.runFor(220);
  }
}

async function readPersistedAppState(page: Page): Promise<AppPersistState> {
  return page.evaluate((storageKey) => {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      throw new Error(`missing localStorage entry: ${storageKey}`);
    }
    return JSON.parse(raw).state as AppPersistState;
  }, STORAGE_KEY);
}

test("puzzle reward to cafe sale loop survives reload", async ({ page }) => {
  test.setTimeout(120_000);
  const nowMs = new Date(FIXED_TIME).getTime();

  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await installFixedClock(page, FIXED_TIME);
  await page.emulateMedia({ reducedMotion: "reduce" });

  await importDebugSaveBundle(
    page,
    buildDebugSaveBundle({
      nowMs,
      app: {
        playerResources: {
          coins: 0,
          beans: 4,
          hearts: 2,
        },
        cafeState: {
          espressoShots: 0,
        },
      },
    }),
  );

  await test.step("퍼즐 한 판 결과와 결과 모달을 확인한다", async () => {
    await openPuzzleFromLobby(page);
    await playDeterministicPuzzleRun(page);

    await page.getByRole("button", { name: "나가기" }).click();

    const resultDialog = page.getByRole("dialog", { name: "수고했어요" });
    await expect(resultDialog).toBeVisible();
    await expect(resultDialog).toContainText("이번 판 결과");
    await expect(resultDialog).toContainText("점수");
    await expect(resultDialog).toContainText("최고 타일");
    await expect(resultDialog).toContainText("16");
    await expect(resultDialog).toContainText("8");

    await resultDialog.getByRole("button", { name: "기본 받기" }).click();
    await page.clock.runFor(250);
    await expect(page).toHaveURL(/\/lobby\/?$/);
  });

  const afterPuzzle = await test.step("로비 저장 상태에 퍼즐 보상이 반영된다", async () => {
    const state = await readPersistedAppState(page);

    expect(state.puzzleProgress.totalRuns).toBe(1);
    expect(state.puzzleProgress.lastRunScore).toBe(16);
    expect(state.puzzleProgress.lastRunTile).toBe(8);
    expect(state.puzzleProgress.lastRunCoins).toBeGreaterThan(0);
    expect(state.playerResources.coins).toBeGreaterThanOrEqual(
      state.puzzleProgress.lastRunCoins,
    );
    expect(state.playerResources.hearts).toBe(1);

    return state;
  });

  const afterSale = await test.step("카페에서 로스팅 제작 진열 판매를 한 번 완료한다", async () => {
    await page.goto("/cafe");

    await page.getByRole("button", { name: /로스팅/ }).first().click();

    const americanoCard = page
      .locator("li")
      .filter({ has: page.getByRole("heading", { name: "아메리카노" }) })
      .first();
    await americanoCard.getByRole("button", { name: "제작하기" }).click();

    const craftedState = await readPersistedAppState(page);
    expect(craftedState.cafeState.espressoShots).toBe(2);
    expect(craftedState.cafeState.menuStock.americano).toBe(1);
    expect(craftedState.beverageCodex.entries.americano?.firstCraftedAtMs).not.toBeNull();

    await page.getByRole("button", { name: "판매 개시" }).click();
    await page.clock.runFor(4_100);
    await page.waitForFunction((storageKey) => {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return false;
      const state = JSON.parse(raw).state as AppPersistState;
      return (
        state.playerResources.coins > 1 &&
        state.cafeState.menuStock.americano === 0 &&
        state.cafeState.displaySellingActive === false
      );
    }, STORAGE_KEY);

    const soldState = await readPersistedAppState(page);
    expect(soldState.playerResources.coins).toBeGreaterThan(
      afterPuzzle.playerResources.coins,
    );
    expect(soldState.cafeState.menuStock.americano).toBe(0);
    expect(soldState.cafeState.displaySellingActive).toBe(false);
    expect(soldState.beverageCodex.entries.americano).toMatchObject({
      beverageId: "americano",
      totalSold: 1,
    });
    expect(soldState.beverageCodex.entries.americano?.firstSoldAtMs).not.toBeNull();

    return soldState;
  });

  await test.step("새로고침 후 핵심 루프 상태가 유지된다", async () => {
    await page.reload();

    const afterReload = await readPersistedAppState(page);
    expect(afterReload.playerResources).toEqual(afterSale.playerResources);
    expect(afterReload.puzzleProgress).toEqual(afterSale.puzzleProgress);
    expect(afterReload.accountLevel).toEqual(afterSale.accountLevel);
    expect(afterReload.cafeState.espressoShots).toBe(
      afterSale.cafeState.espressoShots,
    );
    expect(afterReload.cafeState.menuStock).toEqual(afterSale.cafeState.menuStock);
    expect(afterReload.cafeState.craftedDrinkIds).toEqual(
      afterSale.cafeState.craftedDrinkIds,
    );
    expect(afterReload.beverageCodex).toEqual(afterSale.beverageCodex);
  });
});
