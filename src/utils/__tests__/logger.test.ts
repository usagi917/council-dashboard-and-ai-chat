import { describe, it, expect, vi, beforeEach } from "vitest";
import { logger } from "../logger";

// Mock console methods
const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
const mockConsoleError = vi
  .spyOn(console, "error")
  .mockImplementation(() => {});
const mockConsoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
const mockConsoleInfo = vi.spyOn(console, "info").mockImplementation(() => {});

describe("logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should log info messages with timestamp and level", () => {
    logger.info("Test info message", { userId: "123" });

    expect(mockConsoleInfo).toHaveBeenCalledWith(
      expect.stringContaining("[INFO] Test info message"),
      { userId: "123" }
    );
  });

  it("should log error messages with timestamp and level", () => {
    const error = new Error("Test error");
    logger.error("Test error message", error);

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining("[ERROR] Test error message"),
      error
    );
  });

  it("should log warning messages with timestamp and level", () => {
    logger.warn("Test warning message");

    expect(mockConsoleWarn).toHaveBeenCalledWith(
      expect.stringContaining("[WARN] Test warning message")
    );
  });

  it("should log debug messages in development", () => {
    const originalEnv = process.env.NODE_ENV;
    // @ts-expect-error - Modifying readonly property for test
    process.env.NODE_ENV = "development";

    logger.debug("Test debug message");

    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining("[DEBUG] Test debug message")
    );

    // @ts-expect-error - Restoring readonly property for test
    process.env.NODE_ENV = originalEnv;
  });

  it("should not log debug messages in production", () => {
    const originalEnv = process.env.NODE_ENV;
    // @ts-expect-error - Modifying readonly property for test
    process.env.NODE_ENV = "production";

    logger.debug("Test debug message");

    expect(mockConsoleLog).not.toHaveBeenCalled();

    // @ts-expect-error - Restoring readonly property for test
    process.env.NODE_ENV = originalEnv;
  });

  it("should format API error logs with request info", () => {
    const requestInfo = {
      method: "POST",
      url: "/api/chat",
      userAgent: "test-agent",
    };
    const error = new Error("API error");

    logger.apiError("API request failed", error, requestInfo);

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining("[API-ERROR] API request failed"),
      {
        error,
        request: requestInfo,
      }
    );
  });
});
