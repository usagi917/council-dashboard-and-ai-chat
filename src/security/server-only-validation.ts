/**
 * センシティブな API キーがクライアント側に公開されていないか検証するユーティリティ
 */

interface ValidationResult {
  isValid: boolean;
  violations: string[];
}
// サーバーのみで使用すべき環境変数名
const SERVER_ONLY_ENV_KEYS = [
  "OPENAI_API_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "IG_GRAPH_TOKEN_LONG_LIVED",
  "FB_APP_CLIENT_TOKEN",
] as const;

// クライアント側に公開される環境変数の接頭辞
const CLIENT_ENV_PREFIX = "NEXT_PUBLIC_";

interface ClientExposureCheck {
  isMatch: (value: string, envKey: string) => boolean;
  violation: (envKey: string) => string;
}

// クライアント公開用の環境変数から検出する危険なパターン一覧
const CLIENT_EXPOSURE_CHECKS: ClientExposureCheck[] = [
  {
    isMatch: (value) => /^sk[-_]/.test(value),
    violation: (envKey) =>
      `OpenAI key pattern detected in client-exposed variable: ${envKey}`,
  },
  {
    isMatch: (value, envKey) =>
      /^eyJ/.test(value) &&
      value.length > 100 &&
      envKey !== "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    violation: (envKey) =>
      `Potential service role key detected in client-exposed variable: ${envKey}`,
  },
  {
    isMatch: (value) => /^(IGQ|EAA)/.test(value),
    violation: (envKey) =>
      `Instagram token pattern detected in client-exposed variable: ${envKey}`,
  },
];

/**
 * サーバー専用の環境変数が誤ってクライアントに公開されていないか検証する
 */
export function validateServerOnlyEnvVars(): ValidationResult {
  const violations: string[] = [];

  // 明示的にサーバー専用と定めたキーが公開されていないか確認
  SERVER_ONLY_ENV_KEYS.forEach((keyName) => {
    const publicKeyName = `${CLIENT_ENV_PREFIX}${keyName}`;
    if (process.env[publicKeyName]) {
      violations.push(`${keyName} exposed as ${publicKeyName}`);
    }
  });

  // クライアント公開用の環境変数を走査して危険なパターンを検出
  Object.entries(process.env).forEach(([envKey, value]) => {
    if (!envKey.startsWith(CLIENT_ENV_PREFIX) || typeof value !== "string") {
      return;
    }
    CLIENT_EXPOSURE_CHECKS.forEach(({ isMatch, violation }) => {
      if (isMatch(value, envKey)) {
        violations.push(violation(envKey));
      }
    });
  });

  return {
    isValid: violations.length === 0,
    violations,
  };
}

/**
 * 1つでも違反があれば例外を投げる（CI や起動時チェック向け）
 */
export function assertServerOnlyEnvVars(): void {
  const result = validateServerOnlyEnvVars();

  if (!result.isValid) {
    throw new Error(
      `Security violation: Sensitive API keys exposed to client-side:\n${result.violations.join("\n")}`
    );
  }
}

/**
 * アプリ初期化時に実行するランタイムチェック（サーバー側のみ）
 */
export function verifyServerOnlyEnvVarsAtRuntime(): void {
  // サーバー側のみで実行
  if (typeof window !== "undefined") return;

  const result = validateServerOnlyEnvVars();

  if (!result.isValid) {
    console.error("🚨 Security Alert: Sensitive API keys may be exposed!");
    result.violations.forEach((violation) => {
      console.error(`  - ${violation}`);
    });

    // 本番環境ではログだけでなく例外を投げる
    if (process.env.NODE_ENV === "production") {
      throw new Error("Security violation: API keys exposed to client-side");
    }
  }
}
