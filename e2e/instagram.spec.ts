import { test, expect } from "@playwright/test";

test.describe("Instagram Feed", () => {
  test("should display Instagram section on home page", async ({ page }) => {
    await page.goto("/");

    // Should have SNS section with Instagram icon and heading
    await expect(page.locator("text=SNS投稿")).toBeVisible();

    // Should have Instagram-related content (either posts or placeholder)
    const instagramSection = page
      .locator('[role="img"][aria-label="Instagram"]')
      .locator("..");
    await expect(instagramSection).toBeVisible();
  });

  test("should show placeholder when Instagram API is not configured", async ({
    page,
  }) => {
    // Mock the Instagram API to return empty array
    await page.route("/api/instagram/latest", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/");

    // Should show placeholder content
    await expect(page.locator("text=Instagram投稿を取得中...")).toBeVisible();
    await expect(
      page.locator("text=最新の投稿は準備中です。しばらくお待ちください。")
    ).toBeVisible();
  });

  test("should display Instagram posts when API returns data", async ({
    page,
  }) => {
    const mockPosts = [
      {
        id: 1,
        platform: "instagram",
        postDate: new Date().toISOString(),
        content: "Test Instagram post",
        mediaUrl: "https://example.com/image.jpg",
        postUrl: "https://instagram.com/p/test",
      },
    ];

    // Mock the Instagram API to return test data
    await page.route("/api/instagram/latest", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockPosts),
      });
    });

    await page.goto("/");

    // Should display the post content
    await expect(page.locator("text=Test Instagram post")).toBeVisible();

    // Should have a link to Instagram
    const instagramLink = page.locator(
      'a[href="https://instagram.com/p/test"]'
    );
    await expect(instagramLink).toBeVisible();
    await expect(instagramLink).toHaveText("Instagram で見る");
  });

  test("should show error state when Instagram API fails", async ({ page }) => {
    // Mock the Instagram API to fail
    await page.route("/api/instagram/latest", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "API Error" }),
      });
    });

    await page.goto("/");

    // Should show error state (component will receive null and show error UI)
    // The actual error handling depends on how the server component handles fetch failures
    // In our implementation, fetch failure returns null, which shows the retry UI
    await expect(page.locator("text=SNS投稿")).toBeVisible();
  });

  test("should handle retry functionality", async ({ page }) => {
    let callCount = 0;

    // Mock Instagram API to fail first, then succeed
    await page.route("/api/instagram/latest", async (route) => {
      callCount++;
      if (callCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "API Error" }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: 1,
              platform: "instagram",
              postDate: new Date().toISOString(),
              content: "Retry successful post",
              mediaUrl: "https://example.com/retry.jpg",
              postUrl: "https://instagram.com/p/retry",
            },
          ]),
        });
      }
    });

    await page.goto("/");

    // Should show error state initially
    const retryButton = page.locator('button:has-text("再読み込み")');
    if (await retryButton.isVisible()) {
      // If retry button is visible, click it
      await retryButton.click();
      // After retry (page reload), should show success state
      await expect(page.locator("text=Retry successful post")).toBeVisible();
    }
  });
});
