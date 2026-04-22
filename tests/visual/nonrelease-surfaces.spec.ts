import { expect, test } from "@playwright/test";

test.describe("non-release surfaces", () => {
  test("lobby and settings do not advertise placeholder shop", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });

    await page.goto("/lobby");
    await page.getByRole("button", { name: "메뉴 열기" }).click();
    await expect(page.getByRole("link", { name: "상점" })).toHaveCount(0);

    await page.goto("/settings");
    await expect(page.getByText("1.0 BM 메모")).toBeVisible();
    await expect(page.getByRole("link", { name: "상점 열기" })).toHaveCount(0);
  });

  test("direct routes frame shop and extension as non-release surfaces", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });

    await page.goto("/shop");
    await expect(page.getByText("비출시 데모 보관함")).toBeVisible();
    await expect(page.getByText("1.0 BM 메모")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "출시 후 예정" }).first(),
    ).toBeDisabled();

    await page.goto("/extension");
    await expect(
      page.getByRole("heading", { name: "설비 업그레이드" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "출시 후 예정 메모" }),
    ).toBeVisible();
  });
});
