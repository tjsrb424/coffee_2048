import { test, expect } from "@playwright/test";
import { prepareVisualPage } from "./visualTestUtils";

test("lobby visual snapshot", async ({ page }) => {
  // 하트 회복 카운트다운 등 시간 의존 UI를 고정
  await page.clock.install({ time: new Date(2024, 3, 15, 12, 0, 0).getTime() });
  // framer-motion·AnimatedNumber·무한 배경 등 모션을 멈춰 스냅샷이 수렴하도록 함
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/lobby");

  await prepareVisualPage(page);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((r) =>
      requestAnimationFrame(() => requestAnimationFrame(() => r())),
    );
  });

  await expect(page).toHaveScreenshot("lobby-page.png", {
    fullPage: true,
    animations: "disabled",
  });
});

test("lobby bottom tile cluster snapshot", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium");

  await page.clock.install({ time: new Date(2024, 3, 15, 12, 0, 0).getTime() });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/lobby");

  await prepareVisualPage(page);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((r) =>
      requestAnimationFrame(() => requestAnimationFrame(() => r())),
    );
  });

  const tileGrid = page.getByTestId("lobby-reference-tile-grid");
  await tileGrid.scrollIntoViewIfNeeded();

  await expect(tileGrid).toHaveScreenshot("lobby-bottom-tiles.png", {
    animations: "disabled",
  });
});
