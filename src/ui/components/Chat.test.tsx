import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Chat } from "./Chat";

// Mock fetch
global.fetch = vi.fn();

describe("Chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render input and send button", () => {
    render(<Chat />);

    expect(
      screen.getByPlaceholderText("質問を入力してください...")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "送信" })).toBeInTheDocument();
  });

  it("should disable send button when input is empty", () => {
    render(<Chat />);

    const sendButton = screen.getByRole("button", { name: "送信" });
    expect(sendButton).toBeDisabled();
  });

  it("should enable send button when input has text", async () => {
    render(<Chat />);

    const input = screen.getByPlaceholderText("質問を入力してください...");
    const sendButton = screen.getByRole("button", { name: "送信" });

    fireEvent.change(input, { target: { value: "test question" } });

    expect(sendButton).toBeEnabled();
  });

  it("should send question and display response", async () => {
    const mockResponse = new Response("テスト回答です", {
      headers: { "Content-Type": "text/plain" },
    });

    vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

    render(<Chat />);

    const input = screen.getByPlaceholderText("質問を入力してください...");
    const sendButton = screen.getByRole("button", { name: "送信" });

    fireEvent.change(input, { target: { value: "test question" } });
    fireEvent.click(sendButton);

    expect(screen.getByText("test question")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("テスト回答です")).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "test question" }),
    });
  });

  it("should display loading state during request", async () => {
    // Mock a delayed response
    const mockResponse = new Promise((resolve) => {
      setTimeout(() => resolve(new Response("回答")), 100);
    });

    vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any);

    render(<Chat />);

    const input = screen.getByPlaceholderText("質問を入力してください...");
    const sendButton = screen.getByRole("button", { name: "送信" });

    fireEvent.change(input, { target: { value: "test question" } });
    fireEvent.click(sendButton);

    expect(screen.getByText("回答を生成中...")).toBeInTheDocument();
  });

  it("should handle API errors", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

    render(<Chat />);

    const input = screen.getByPlaceholderText("質問を入力してください...");
    const sendButton = screen.getByRole("button", { name: "送信" });

    fireEvent.change(input, { target: { value: "test question" } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(
        screen.getByText("エラーが発生しました。もう一度お試しください。")
      ).toBeInTheDocument();
    });
  });
});
