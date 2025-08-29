# 本番環境テスト手順書

池元勝議員ダッシュボード（MVP）の本番環境に近いテスト手順

## 目次

1. [環境セットアップ](#環境セットアップ)
2. [段階的テスト](#段階的テスト)
3. [負荷テスト](#負荷テスト)
4. [E2E統合テスト](#e2e統合テスト)
5. [パフォーマンステスト](#パフォーマンステスト)
6. [セキュリティテスト](#セキュリティテスト)

## 環境セットアップ

### 1. ローカル本番環境構築

```bash
# 1. 環境変数設定（本番相当）
cp .env.example .env.local
# 実際のAPIキーを設定

# 2. データベース接続確認
pnpm setup-db

# 3. 依存関係インストール
pnpm install
```

### 2. Supabaseプロジェクト設定

```bash
# Supabase CLI（オプション）
npx supabase login
npx supabase projects list
npx supabase link --project-ref your_project_id

# データベーススキーマ適用
npx supabase db push
```

## 段階的テスト

### Stage 1: モックモード（開発環境）

```bash
# InMemoryリポジトリでテスト
USE_SUPABASE=false pnpm dev

# 基本機能確認
curl http://localhost:3000/api/health
# → {"ok": true}

# テスト実行
pnpm test    # 単体テスト
pnpm e2e     # E2Eテスト
```

### Stage 2: ステージング環境（Supabase接続）

```bash
# Supabase接続モード
USE_SUPABASE=true pnpm dev

# データベース操作確認
curl "http://localhost:3000/api/speeches?page=1&size=5"

# チャット機能確認（データなしで「情報がありません」）
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "教育政策について教えて"}'
```

### Stage 3: 本番相当環境（全サービス接続）

```bash
# 全環境変数設定
export USE_SUPABASE=true
export OPENAI_API_KEY=sk-proj-real-key...
export IG_GRAPH_TOKEN_LONG_LIVED=IGQ-real-token...

pnpm dev

# データパイプライン実行
pnpm ingest ./fixtures
pnpm embed    # 🚨 OpenAI課金注意
pnpm cluster
```

## 負荷テスト

### APIレート制限テスト

```bash
# 60req/min制限のテスト
for i in {1..65}; do
  curl -w "%{http_code}\n" -o /dev/null -s \
    "http://localhost:3000/api/health"
done
# 最後の5回は 429 (Too Many Requests) が返るべき
```

### 並行リクエストテスト

```bash
# 並行チャットリクエスト（10並行）
seq 10 | xargs -P 10 -I {} curl -X POST \
  http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "議会について"}'
```

## E2E統合テスト

### 本番データでのE2Eテスト

```bash
# 本番環境変数でE2Eテスト実行
USE_SUPABASE=true pnpm exec playwright test

# 特定シナリオのみ実行
pnpm exec playwright test --grep "integration"
```

### 主要ユーザージャーニー

```bash
# Playwright UI Mode（ブラウザで確認）
pnpm exec playwright test --ui

# 手動テスト項目：
# 1. ホーム表示 → 実績ハイライト円グラフ表示
# 2. 円グラフクリック → 代表発言リンク表示
# 3. チャット入力 → ストリーミング回答 + 引用
# 4. Instagram投稿表示（またはエラー処理）
```

## パフォーマンステスト

### レスポンス時間測定

```bash
# API別レスポンス時間
curl -w "@curl-format.txt" -o /dev/null \
  "http://localhost:3000/api/speeches"

# curl-format.txt 内容:
#      time_namelookup:  %{time_namelookup}\n
#         time_connect:  %{time_connect}\n
#      time_appconnect:  %{time_appconnect}\n
#     time_pretransfer:  %{time_pretransfer}\n
#        time_redirect:  %{time_redirect}\n
#   time_starttransfer:  %{time_starttransfer}\n
#                     ----------\n
#           time_total:  %{time_total}\n
```

### Next.js Bundle分析

```bash
# Bundle Analyzer
pnpm build && pnpm analyze

# Core Web Vitals確認
# Chrome DevTools → Lighthouse で測定
```

## セキュリティテスト

### 環境変数漏洩チェック

```bash
# サーバー専用キーのクライアント露出チェック
pnpm validate-env

# ログ出力にキー混入がないかチェック
USE_SUPABASE=true pnpm dev 2>&1 | grep -E "(sk-|IGQ|eyJ)"
# 何も出力されないことを確認
```

### CSPテスト

```bash
# Content Security Policy確認
curl -I http://localhost:3000/ | grep -i "content-security-policy"

# ブラウザConsoleでCSP違反がないことを確認
```

## 本番デプロイ前チェックリスト

### 必須確認項目

- [ ] 全テスト（unit/integration/e2e）が緑
- [ ] 実際のAPIキーで全機能動作確認
- [ ] レート制限が正常に動作
- [ ] セキュリティヘッダが適用
- [ ] 環境変数が適切に設定
- [ ] CSP違反なし
- [ ] パフォーマンス要件満足（< 2秒）

### 運用準備

```bash
# 本番用環境変数ファイル作成
cp .env.example .env.production
# 本番APIキーを設定

# 本番デプロイコマンド（例：Vercel）
npx vercel --prod --env-file .env.production
```

## トラブルシューティング

### よくある問題

1. **Supabase接続エラー**
   ```bash
   # 環境変数確認
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $SUPABASE_SERVICE_ROLE_KEY
   
   # 接続テスト
   pnpm setup-db
   ```

2. **OpenAI API エラー**
   ```bash
   # API キー確認
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

3. **Instagram API エラー**
   ```bash
   # トークン有効期限確認
   curl "https://graph.facebook.com/me?access_token=$IG_GRAPH_TOKEN_LONG_LIVED"
   ```

### ログ確認

```bash
# アプリケーションログ
tail -f .next/cache/logs/*.log

# Supabaseログ（Dashboard確認）
# OpenAI APIログ（Usage確認）
# Instagram APIログ（Graph API Explorer確認）
```

## 継続的監視

### 定期実行スクリプト

```bash
#!/bin/bash
# health-check.sh
response=$(curl -s http://localhost:3000/api/health)
if [[ $response == *'"ok":true'* ]]; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed: $response"
  exit 1
fi
```

### アラート設定

```bash
# cron設定例（5分間隔でヘルスチェック）
*/5 * * * * /path/to/health-check.sh || mail -s "Service Down" admin@example.com
```