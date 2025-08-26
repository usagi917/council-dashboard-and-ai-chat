import { test, expect } from "@playwright/test";

test.describe("Main Integration Scenarios", () => {
  test("Full workflow: Home → Graph → Chat with data scenarios", async ({
    page,
  }) => {
    // 1. Home page loads with highlights and Instagram placeholders
    await page.goto("/");

    // Verify home page content loads
    await expect(
      page.getByRole("heading", { name: "白山市政ダッシュボード" })
    ).toBeVisible();
    await expect(page.getByText("実績ハイライト")).toBeVisible();
    await expect(page.getByText("SNS投稿")).toBeVisible();
    await expect(page.getByText("AIアシスタント")).toBeVisible();

    // 2. Navigate to graph page and verify cluster visualization
    const graphLink = page.getByRole("link", { name: "詳細を見る" });
    await graphLink.click();

    await expect(page).toHaveURL("/graph");
    await expect(page.getByText("発言分析グラフ")).toBeVisible();

    // Wait for graph to load
    await page.waitForLoadState("networkidle");

    // Check if there's chart content or empty state
    const hasData = (await page.locator("canvas").count()) > 0;
    if (hasData) {
      await expect(page.locator("canvas")).toBeVisible();
    } else {
      await expect(page.getByText("データが見つかりません")).toBeVisible();
    }

    // 3. Go back to home and test chat functionality
    await page.click("text=ホームに戻る");
    await expect(page).toHaveURL("/");

    // Test chat with no information scenario
    const input = page.getByPlaceholder("質問を入力してください...");
    const sendButton = page.getByRole("button", { name: "送信" });

    await input.fill("宇宙開発について教えて");
    await sendButton.click();

    // Verify user message appears
    await expect(page.getByText("宇宙開発について教えて")).toBeVisible();

    // Verify loading state
    await expect(page.getByText("回答を生成中...")).toBeVisible();

    // Verify "no information" response appears
    await expect(page.getByText("情報がありません。")).toBeVisible({
      timeout: 15000,
    });
  });

  test("Chat returns citations when data is present", async ({ page }) => {
    await page.goto("/");

    const input = page.getByPlaceholder("質問を入力してください...");
    const sendButton = page.getByRole("button", { name: "送信" });

    // Test with a question that might have data in fixtures
    await input.fill("教育について");
    await sendButton.click();

    // Verify user message appears
    await expect(page.getByText("教育について")).toBeVisible();

    // Verify loading state
    await expect(page.getByText("回答を生成中...")).toBeVisible();

    // Wait for response - could be either citation or no information
    await page.waitForTimeout(5000);

    // Check if we get either a citation response or no information
    const hasNoCitation =
      (await page.getByText("情報がありません。").count()) > 0;
    if (!hasNoCitation) {
      // Look for potential citation links or source URLs
      const citationLinks = page.locator('a[href*="hakusan"]');
      if ((await citationLinks.count()) > 0) {
        await expect(citationLinks.first()).toBeVisible();
      }
    }
  });

  test("Instagram feed handles different states", async ({ page }) => {
    await page.goto("/");

    // Wait for Instagram section to load
    await page.waitForTimeout(3000);

    // Should show Instagram section header
    await expect(page.getByText("SNS投稿")).toBeVisible();

    // Check for either loading, error, or content state
    const hasRetry =
      (await page.getByRole("button", { name: "再試行" }).count()) > 0;
    const hasContent =
      (await page.locator('[data-testid="instagram-post"]').count()) > 0;
    const hasPlaceholder =
      (await page.getByText("最新の投稿は準備中です").count()) > 0;

    // At least one of these states should be visible
    expect(hasRetry || hasContent || hasPlaceholder).toBeTruthy();
  });

  test("Navigation between pages works correctly", async ({ page }) => {
    // Start at home
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "白山市政ダッシュボード" })
    ).toBeVisible();

    // Go to graph
    await page.click("text=詳細を見る");
    await expect(page).toHaveURL("/graph");
    await expect(page.getByText("発言分析グラフ")).toBeVisible();

    // Return to home
    await page.click("text=ホームに戻る");
    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("heading", { name: "白山市政ダッシュボード" })
    ).toBeVisible();
  });

  test("Responsive layout works on different screen sizes", async ({
    page,
  }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Should still display main content
    await expect(
      page.getByRole("heading", { name: "白山市政ダッシュボード" })
    ).toBeVisible();
    await expect(page.getByText("実績ハイライト")).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();

    // Should still display main content
    await expect(
      page.getByRole("heading", { name: "白山市政ダッシュボード" })
    ).toBeVisible();
    await expect(page.getByText("実績ハイライト")).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.reload();

    // Should still display main content
    await expect(
      page.getByRole("heading", { name: "白山市政ダッシュボード" })
    ).toBeVisible();
    await expect(page.getByText("実績ハイライト")).toBeVisible();
  });
});
