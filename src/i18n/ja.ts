export const messages = {
  errors: {
    dataFetchFailed: "データの取得に失敗しました",
    noInformation: "情報がありません。",
    chatError: "チャットでエラーが発生しました",
    instagramFetchFailed: "Instagram投稿の取得に失敗しました",
    speechesFetchFailed: "発言データの取得に失敗しました",
    highlightsFetchFailed: "ハイライトデータの取得に失敗しました",
  },
  loading: {
    fetchingData: "データを取得中...",
    processing: "処理中...",
    generatingResponse: "回答を生成中...",
  },
  actions: {
    retry: "再試行",
    refresh: "更新",
    contact: "お問い合わせ",
  },
  emptyState: {
    noData: "データがありません",
    noResults: "検索結果がありません",
    suggestion: "データを更新するか、お問い合わせください",
  },
} as const;

type NestedMessageKey =
  | keyof typeof messages
  | `${keyof typeof messages}.${string}`
  | string;

export function getMessage(key: NestedMessageKey): string {
  const keys = key.split(".");

  if (keys.length === 1) {
    const section = messages[keys[0] as keyof typeof messages];
    if (typeof section === "object") {
      return "エラーが発生しました"; // fallback for section-only keys
    }
    return section || "エラーが発生しました";
  }

  if (keys.length === 2) {
    const [section, messageKey] = keys;
    const sectionMessages = messages[section as keyof typeof messages];

    if (sectionMessages && typeof sectionMessages === "object") {
      const message = (sectionMessages as Record<string, string>)[messageKey];
      return message || "エラーが発生しました";
    }
  }

  return "エラーが発生しました";
}
