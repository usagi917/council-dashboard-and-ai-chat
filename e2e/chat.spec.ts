import { test, expect } from "@playwright/test";

test.describe("Chat functionality", () => {
  test("should display chat interface on home page", async ({ page }) => {
    await page.goto("/");

    // Check that the chat section is visible
    await expect(
      page.getByRole("heading", { name: "AIチャット" })
    ).toBeVisible();

    // Check that the input field is present
    await expect(
      page.getByPlaceholder("質問を入力してください...")
    ).toBeVisible();

    // Check that the send button is present
    await expect(page.getByRole("button", { name: "送信" })).toBeVisible();
  });

  test("should display placeholder message when no messages", async ({
    page,
  }) => {
    await page.goto("/");

    // Check placeholder text
    await expect(
      page.getByText("池元勝市議の政治活動について質問してください")
    ).toBeVisible();
  });

  test("should return 'no information' when no relevant data found", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.getByPlaceholder("質問を入力してください...");
    const sendButton = page.getByRole("button", { name: "送信" });

    // Type a question that should not have matching data
    await input.fill("宇宙開発について教えて");
    await sendButton.click();

    // Check that user message appears
    await expect(page.getByText("宇宙開発について教えて")).toBeVisible();

    // Check loading state appears
    await expect(page.getByText("回答を生成中...")).toBeVisible();

    // Wait for the response - should be "no information" message
    await expect(page.getByText("情報がありません。")).toBeVisible();
  });

  test("should show loading state during API call", async ({ page }) => {
    await page.goto("/");

    const input = page.getByPlaceholder("質問を入力してください...");
    const sendButton = page.getByRole("button", { name: "送信" });

    await input.fill("教育について");
    await sendButton.click();

    // Loading state should appear
    await expect(page.getByText("回答を生成中...")).toBeVisible();
  });

  test("should disable input and button during loading", async ({ page }) => {
    await page.goto("/");

    const input = page.getByPlaceholder("質問を入力してください...");
    const sendButton = page.getByRole("button", { name: "送信" });

    await input.fill("テスト質問");
    await sendButton.click();

    // Input and button should be disabled during loading
    await expect(input).toBeDisabled();
    await expect(sendButton).toBeDisabled();
  });

  test("should clear input after sending message", async ({ page }) => {
    await page.goto("/");

    const input = page.getByPlaceholder("質問を入力してください...");
    const sendButton = page.getByRole("button", { name: "送信" });

    await input.fill("テスト質問");
    await sendButton.click();

    // Input should be cleared
    await expect(input).toHaveValue("");
  });
});
