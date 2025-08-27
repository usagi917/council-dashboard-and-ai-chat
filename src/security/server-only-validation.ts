/**
 * Security validation utility to ensure sensitive API keys are never exposed client-side
 */

interface ValidationResult {
  isValid: boolean;
  violations: string[];
}

const SENSITIVE_KEYS = [
  "OPENAI_API_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "IG_GRAPH_TOKEN_LONG_LIVED",
  "FB_APP_CLIENT_TOKEN",
] as const;

/**
 * Validates that sensitive API keys are not accidentally exposed as NEXT_PUBLIC_ variables
 */
export function validateServerOnlyKeys(): ValidationResult {
  const violations: string[] = [];

  // Check if any sensitive keys are exposed as NEXT_PUBLIC_
  SENSITIVE_KEYS.forEach((keyName) => {
    const publicKeyName = `NEXT_PUBLIC_${keyName}`;
    if (process.env[publicKeyName]) {
      violations.push(`${keyName} exposed as ${publicKeyName}`);
    }
  });

  // Check for common patterns of key exposure
  Object.keys(process.env).forEach((envKey) => {
    if (envKey.startsWith("NEXT_PUBLIC_")) {
      const value = process.env[envKey];
      if (value) {
        // Check for OpenAI key patterns
        if (value.startsWith("sk-") || value.startsWith("sk_")) {
          violations.push(
            `OpenAI key pattern detected in client-exposed variable: ${envKey}`
          );
        }

        // Check for Supabase service role key patterns (JWT starting with eyJ)
        // But exclude NEXT_PUBLIC_SUPABASE_ANON_KEY which is meant to be client-exposed
        if (
          value.startsWith("eyJ") &&
          value.length > 100 &&
          envKey !== "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        ) {
          violations.push(
            `Potential service role key detected in client-exposed variable: ${envKey}`
          );
        }

        // Check for Instagram long-lived token patterns
        if (value.startsWith("IGQ") || value.startsWith("EAA")) {
          violations.push(
            `Instagram token pattern detected in client-exposed variable: ${envKey}`
          );
        }
      }
    }
  });

  return {
    isValid: violations.length === 0,
    violations,
  };
}

/**
 * Throws an error if any violations are found - useful for CI/startup checks
 */
export function assertServerOnlyKeys(): void {
  const result = validateServerOnlyKeys();

  if (!result.isValid) {
    throw new Error(
      `Security violation: Sensitive API keys exposed to client-side:\n${result.violations.join("\n")}`
    );
  }
}

/**
 * Runtime check that can be called during app initialization (server-side only)
 */
export function checkServerOnlyKeysAtRuntime(): void {
  // Only run on server-side
  if (typeof window === "undefined") {
    const result = validateServerOnlyKeys();

    if (!result.isValid) {
      console.error("🚨 Security Alert: Sensitive API keys may be exposed!");
      result.violations.forEach((violation) => {
        console.error(`  - ${violation}`);
      });

      // In production, we might want to throw instead of just logging
      if (process.env.NODE_ENV === "production") {
        throw new Error("Security violation: API keys exposed to client-side");
      }
    }
  }
}
