export interface RequestInfo {
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
}

export interface Logger {
  info(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  debug(message: string, meta?: unknown): void;
  apiError(message: string, error: Error, requestInfo?: RequestInfo): void;
}

class SimpleLogger implements Logger {
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private log(level: string, message: string, meta?: unknown): void {
    const timestamp = this.formatTimestamp();
    const logMessage = `${timestamp} [${level}] ${message}`;

    switch (level) {
      case "ERROR":
      case "API-ERROR":
        console.error(logMessage, ...(meta !== undefined ? [meta] : []));
        break;
      case "WARN":
        console.warn(logMessage, ...(meta !== undefined ? [meta] : []));
        break;
      case "INFO":
        console.info(logMessage, ...(meta !== undefined ? [meta] : []));
        break;
      case "DEBUG":
        if (process.env.NODE_ENV === "development") {
          console.log(logMessage, ...(meta !== undefined ? [meta] : []));
        }
        break;
      default:
        console.log(logMessage, ...(meta !== undefined ? [meta] : []));
    }
  }

  info(message: string, meta?: unknown): void {
    this.log("INFO", message, meta);
  }

  error(message: string, meta?: unknown): void {
    this.log("ERROR", message, meta);
  }

  warn(message: string, meta?: unknown): void {
    this.log("WARN", message, meta);
  }

  debug(message: string, meta?: unknown): void {
    this.log("DEBUG", message, meta);
  }

  apiError(message: string, error: Error, requestInfo?: RequestInfo): void {
    const meta = {
      error,
      ...(requestInfo && { request: requestInfo }),
    };
    this.log("API-ERROR", message, meta);
  }
}

export const logger = new SimpleLogger();
