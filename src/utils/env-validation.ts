/**
 * Environment validation utilities for secrets and CI configuration
 */

export interface EnvironmentValidationResult {
  isValid: boolean;
  missingSecrets: string[];
  warnings: string[];
}

export interface CIEnvironmentResult {
  isCI: boolean;
  hasRequiredCISecrets: boolean;
  missingCISecrets: string[];
  secretLeakageRisk: boolean;
}

/**
 * Required environment variables for production
 */
const REQUIRED_SECRETS = [
  "OPENAI_API_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "IG_GRAPH_TOKEN_LONG_LIVED",
  "FB_APP_ID",
  "FB_APP_CLIENT_TOKEN",
] as const;

/**
 * Required CI environment variables for GitHub Actions
 */
const REQUIRED_CI_SECRETS = ["CODECOV_TOKEN", "GITHUB_TOKEN"] as const;

/**
 * Validates that all required environment secrets are present
 */
export function validateEnvironmentSecrets(): EnvironmentValidationResult {
  const missingSecrets: string[] = [];
  const warnings: string[] = [];

  for (const secret of REQUIRED_SECRETS) {
    const value = process.env[secret];

    if (!value) {
      missingSecrets.push(secret);
    } else {
      // Validate secret format
      if (secret === "OPENAI_API_KEY" && !value.startsWith("sk-")) {
        warnings.push(`${secret} should start with 'sk-'`);
      }
      if (
        secret === "NEXT_PUBLIC_SUPABASE_URL" &&
        !value.startsWith("https://")
      ) {
        warnings.push(`${secret} should be a valid HTTPS URL`);
      }
      if (secret === "IG_GRAPH_TOKEN_LONG_LIVED" && !value.startsWith("IGQ")) {
        warnings.push(
          `${secret} should be a long-lived Instagram token starting with 'IGQ'`
        );
      }
    }
  }

  return {
    isValid: missingSecrets.length === 0,
    missingSecrets,
    warnings,
  };
}

/**
 * Validates CI environment configuration and secrets
 */
export function validateCIEnvironment(): CIEnvironmentResult {
  const isCI = process.env.CI === "true";
  const missingCISecrets: string[] = [];

  if (isCI) {
    for (const secret of REQUIRED_CI_SECRETS) {
      if (!process.env[secret]) {
        missingCISecrets.push(secret);
      }
    }
  }

  return {
    isCI,
    hasRequiredCISecrets: !isCI || missingCISecrets.length === 0,
    missingCISecrets,
    secretLeakageRisk: detectSecretLeakage(),
  };
}

/**
 * Detects potential secret leakage in environment
 */
function detectSecretLeakage(): boolean {
  // Check if any environment variables contain sensitive patterns
  const sensitivePatterns = [
    /sk-[a-zA-Z0-9]{48,}/, // OpenAI API keys (more specific length)
    /[A-Za-z0-9+/]{64,}={0,2}/, // Base64 encoded secrets (longer for actual secrets)
    /IGQ[A-Za-z0-9_-]{50,}/, // Instagram tokens (more specific length)
  ];

  const allowedSecretVars = [
    "SECRET",
    "KEY",
    "TOKEN",
    "PASSWORD",
    "PASS",
    "API_KEY",
    "AUTH",
  ];

  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string") {
      for (const pattern of sensitivePatterns) {
        if (pattern.test(value)) {
          // Check if this environment variable is expected to contain secrets
          const isAllowedSecretVar = allowedSecretVars.some((allowed) =>
            key.includes(allowed)
          );
          if (!isAllowedSecretVar) {
            // Potential secret in non-secret environment variable
            return true;
          }
        }
      }
    }
  }

  return false;
}

/**
 * Gets environment configuration summary (safe for logging)
 */
export function getEnvironmentSummary() {
  const validation = validateEnvironmentSecrets();
  const ciValidation = validateCIEnvironment();

  return {
    environment: process.env.NODE_ENV || "development",
    isCI: ciValidation.isCI,
    hasAllSecrets: validation.isValid,
    secretCount: REQUIRED_SECRETS.filter((key) => process.env[key]).length,
    totalRequiredSecrets: REQUIRED_SECRETS.length,
    warnings: validation.warnings,
    // Never include actual secret values
  };
}
