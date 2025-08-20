"use client";

import { useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const question = input.trim();
    setInput("");
    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString() + "-user",
      role: "user",
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      // Handle streaming or regular response
      const contentType = response.headers.get("content-type");
      let assistantContent: string;

      if (contentType?.includes("text/plain")) {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let content = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            content += decoder.decode(value, { stream: true });
          }
        }

        assistantContent = content;
      } else {
        assistantContent = await response.text();
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: Date.now().toString() + "-assistant",
        role: "assistant",
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);

      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString() + "-error",
        role: "assistant",
        content: "エラーが発生しました。もう一度お試しください。",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="backdrop-blur-apple bg-white/70 border border-white/20 rounded-apple-lg shadow-apple-card animate-scale-in">
      {/* Header */}
      <div className="flex items-center justify-between p-8 pb-6 border-b border-white/20">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-apple-purple to-apple-pink rounded-apple-sm mr-4 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>AI Chat icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h2 className="text-headline text-apple-gray-900">AIアシスタント</h2>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-caption text-apple-gray-500">
          <div
            className={`w-2 h-2 rounded-full ${isLoading ? "bg-apple-orange animate-pulse" : "bg-apple-green"}`}
          ></div>
          <span>{isLoading ? "AI回答中..." : "待機中"}</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="h-96 overflow-y-auto p-6 space-y-4 scroll-smooth">
        {messages.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-16 h-16 bg-apple-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-apple-blue"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>Question icon</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-callout text-apple-gray-600 mb-2">
              池元勝市議の政治活動について質問してください
            </p>
            <p className="text-footnote text-apple-gray-500">
              議会発言や実績について詳しく回答いたします
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex animate-fade-in ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div
              className={`max-w-xs lg:max-w-md rounded-apple-lg shadow-apple-elevated ${
                message.role === "user"
                  ? "bg-gradient-to-r from-apple-blue to-apple-indigo text-white ml-4"
                  : "bg-white/90 backdrop-blur-sm text-apple-gray-900 mr-4 border border-white/30"
              }`}
            >
              <div className="px-5 py-4">
                <p className="text-callout leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
                <p
                  className={`text-caption mt-3 ${
                    message.role === "user"
                      ? "text-white/70"
                      : "text-apple-gray-500"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white/90 backdrop-blur-sm border border-white/30 max-w-xs lg:max-w-md rounded-apple-lg shadow-apple-elevated mr-4">
              <div className="px-5 py-4">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-apple-blue rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-apple-indigo rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-apple-purple rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-callout text-apple-gray-600">
                    回答を生成中...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 pt-4 border-t border-white/20">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="質問を入力してください..."
              className="w-full px-5 py-4 pr-12 bg-white/80 backdrop-blur-sm border border-white/30 rounded-apple-lg 
                       text-callout text-apple-gray-900 placeholder-apple-gray-500
                       focus:outline-none focus:ring-2 focus:ring-apple-blue/50 focus:border-apple-blue/50 focus:bg-white/90
                       disabled:bg-apple-gray-100 disabled:text-apple-gray-400 disabled:cursor-not-allowed
                       transition-all duration-200"
              disabled={isLoading}
              autoComplete="off"
            />
            {input.trim() && (
              <button
                type="button"
                onClick={() => setInput("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-apple-gray-400 hover:text-apple-gray-600 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>Clear input</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6 py-4 bg-gradient-to-r from-apple-blue to-apple-indigo text-white rounded-apple-lg 
                     font-semibold text-callout shadow-apple-elevated
                     hover:from-apple-indigo hover:to-apple-purple hover:shadow-apple-lg
                     disabled:from-apple-gray-300 disabled:to-apple-gray-400 disabled:cursor-not-allowed disabled:shadow-none
                     active:scale-95 transition-all duration-200
                     flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>送信中</span>
              </>
            ) : (
              <>
                <span>送信</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>Send message</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-footnote text-apple-gray-500">
            AIが議会発言データに基づいて回答します •
            正確性を保証するものではありません
          </p>
        </div>
      </div>
    </div>
  );
}
