import { test, expect } from "@playwright/test";

test("home page displays main dashboard content", async ({ page }) => {
  await page.goto("/");

  // Check that the main heading is visible
  await expect(
    page.getByRole("heading", { name: "白山市政ダッシュボード" })
  ).toBeVisible();

  // Check hero section content
  await expect(page.getByText("池元勝市議の").first()).toBeVisible();
  await expect(page.getByText("政治活動").first()).toBeVisible();
});

test("home page displays highlights and Instagram sections", async ({
  page,
}) => {
  await page.goto("/");

  // Check that highlights section exists
  await expect(page.getByText("実績ハイライト")).toBeVisible();

  // Check that SNS section exists
  await expect(page.getByText("SNS投稿")).toBeVisible();

  // Check that AI chat section exists
  await expect(page.getByText("AIアシスタント")).toBeVisible();
});

test("health API returns ok", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.status()).toBe(200);

  const data = await response.json();
  expect(data).toEqual({ ok: true });
});
