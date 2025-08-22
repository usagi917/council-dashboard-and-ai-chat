import { test, expect } from "@playwright/test";

test.describe("Graph Page", () => {
  test("should load the graph page", async ({ page }) => {
    await page.goto("/graph");

    // Check for the page title
    await expect(page.getByText("発言分析グラフ")).toBeVisible();

    // Check for the subtitle
    await expect(
      page.getByText("議会発言をAIで分析・分類し、代表的な発言を確認できます")
    ).toBeVisible();
  });

  test("should show empty state when no data", async ({ page }) => {
    await page.goto("/graph");

    // Check for empty state message
    await expect(page.getByText("データが見つかりません")).toBeVisible();
  });
});
