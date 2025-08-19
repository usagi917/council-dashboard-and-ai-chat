import { test, expect } from "@playwright/test";

test("home page displays Hakusan Dashboard", async ({ page }) => {
  await page.goto("/");

  // Check that the main heading is visible
  await expect(
    page.getByRole("heading", { name: "Hakusan Dashboard" })
  ).toBeVisible();
});

test("health API returns ok", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.status()).toBe(200);

  const data = await response.json();
  expect(data).toEqual({ ok: true });
});
