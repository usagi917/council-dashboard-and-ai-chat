# 運用ランブック (Operations Runbook)

池元勝議員ダッシュボード（MVP）の運用手順書

## 目次

1. [サービス概要](#サービス概要)
2. [環境・認証情報管理](#環境認証情報管理)
3. [定期メンテナンス](#定期メンテナンス)
4. [監視・アラート](#監視アラート)
5. [インシデント対応](#インシデント対応)
6. [データパイプライン運用](#データパイプライン運用)
7. [セキュリティ](#セキュリティ)
8. [トラブルシューティング](#トラブルシューティング)

## サービス概要

### 主要コンポーネント

- **フロントエンド**: Next.js (App Router) + Tailwind CSS
- **API**: Next.js Route Handlers (`/api/*`)
- **データベース**: Supabase (PostgreSQL + pgvector)
- **AI機能**: OpenAI API (埋め込み・チャット)
- **SNS連携**: Instagram Graph API / oEmbed フォールバック

### キーメトリクス

- レスポンス時間: < 2秒 (90percentile)
- アップタイム: > 99.9%
- API レート制限: 60 requests/min/IP
- データ更新頻度: 手動実行（会期終了後）

## 環境・認証情報管理

### 本番環境変数

```bash
# アプリケーション設定
NEXT_PUBLIC_SITE_NAME=ikemoto-mvp
USE_SUPABASE=true

# OpenAI API（サーバーサイドのみ）
OPENAI_API_KEY=sk-proj-... # 90日毎にローテーション推奨

# Supabase（PostgreSQL + pgvector）
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... # 読み取り専用、期限なし
SUPABASE_SERVICE_ROLE_KEY=eyJ... # 管理権限、年1回ローテーション

# Instagram API（Business/Creator アカウント必須）
IG_GRAPH_TOKEN_LONG_LIVED=IGQ... # 60日毎に更新必須
FB_APP_ID=1234567890 # Facebook App ID
FB_APP_CLIENT_TOKEN=abc123... # App Secret由来、年1回ローテーション
```

### 認証情報ローテーション手順

#### Instagram長期トークン更新（60日毎：必須）

1. Facebook Developer Console にログイン
2. 対象アプリ → Instagram → Basic Display
3. 「Generate Token」で新しい長期トークンを取得
4. 環境変数 `IG_GRAPH_TOKEN_LONG_LIVED` を更新
5. サービス再起動・動作確認
6. 旧トークンを無効化

**重要**: トークン期限切れでInstagram機能が完全停止します。

#### OpenAI APIキーローテーション（90日毎：推奨）

1. OpenAI Platform でプロジェクトAPIキーを生成
2. 環境変数 `OPENAI_API_KEY` を更新
3. チャット機能・埋め込み処理の動作確認
4. 旧キーを無効化

#### Supabase Service Role Key（年1回：推奨）

1. Supabase Dashboard → Settings → API
2. 新しいService Role Keyを生成
3. 環境変数 `SUPABASE_SERVICE_ROLE_KEY` を更新
4. データベース操作（CRUD・ベクター検索）の動作確認
5. 旧キーを無効化

## 定期メンテナンス

### 月次作業

- [ ] Instagram トークン有効期限確認（残り10日以下で更新）
- [ ] エラーログレビュー・パフォーマンス確認
- [ ] データベースバックアップ確認（Supabase自動バックアップ）

### 四半期作業

- [ ] 依存関係アップデート (`pnpm update`)
- [ ] セキュリティ脆弱性スキャン
- [ ] 不要データ削除（古いSNS投稿・一時ファイル）

### 年次作業

- [ ] 全認証情報のローテーション
- [ ] DR（災害復旧）テスト実施
- [ ] 利用規約・プライバシーポリシー見直し

## 監視・アラート

### ヘルスチェック

```bash
# サービス生存確認
curl -f https://your-domain.com/api/health
# 期待値: {"ok": true}
```

### 主要監視項目

1. **API レスポンス**: `/api/health` が 200 を返すか
2. **レート制限**: 429エラーの頻度
3. **データベース接続**: Supabaseへの接続状態
4. **外部API状態**: OpenAI・Instagram APIのエラー率
5. **ディスク使用量**: ログファイル肥大化

### アラート条件

- API レスポンス時間 > 5秒（5分間継続）
- エラー率 > 5%（10分間）
- Instagram API エラー率 > 50%（15分間）
- ディスク使用率 > 85%

## インシデント対応

### 重要度分類

- **P0（緊急）**: サービス全体停止
- **P1（高）**: 主要機能停止（チャット・グラフ表示）
- **P2（中）**: 部分機能停止（Instagram表示）
- **P3（低）**: パフォーマンス劣化・軽微なUI不具合

### エスカレーション手順

1. **初期対応**（5分以内）
   - ヘルスチェック実行
   - エラーログ確認
   - サービス再起動（必要に応じて）

2. **調査・修復**（30分以内）
   - 根本原因特定
   - 暫定修正またはフォールバック
   - ステークホルダーへの状況報告

3. **完全復旧**（2時間以内）
   - 恒久修正のデプロイ
   - 全機能動作確認
   - 事後検証・改善案作成

### 緊急時連絡先

- システム管理者: [連絡先情報]
- インフラ担当: [連絡先情報]
- 池元議員事務所: [連絡先情報]

## データパイプライン運用

### 会議録更新の手順（新しい会期データ追加時）

1. **データ取得・検証**

```bash
# 新しい会議録ファイルを fixtures/ に配置
# HTML形式推奨、PDFはフォールバック
cp new-session-data.html fixtures/

# データ形式確認
pnpm ingest ./fixtures --dry-run
```

2. **インジェスト実行**

```bash
# 会議録解析・チャンク化・DB投入
pnpm ingest ./fixtures
# 期待: "✅ Successfully processed X files, created Y speeches, Z chunks"
```

3. **埋め込み生成（課金注意）**

```bash
# OpenAI APIで埋め込みベクター生成
pnpm embed
# 期待: レート制限を守りながら1件/秒で処理
```

4. **クラスタリング・可視化更新**

```bash
# K-meansクラスタリング（K=6、シード固定）
pnpm cluster
# 期待: highlights テーブル更新、円グラフに反映
```

5. **動作確認**

- ホーム画面の円グラフ更新確認
- チャット機能で新しいデータが検索対象になることを確認
- `/graph` ページでクラスタ詳細表示確認

### データ品質管理

- **重複チェック**: 同一URLのspeech_chunksが複数作成されていないか
- **欠損データ**: speech_embeddings で embedding が NULL でないか
- **クラスタ品質**: highlights の代表サンプルが適切に選ばれているか

## セキュリティ

### API セキュリティ

- レート制限: 60 requests/min/IP（突発的負荷対策）
- CORS: 指定ドメインのみ許可
- CSP: Content Security Policy（report-only → enforcing移行予定）
- 機密情報: 全API keysはサーバーサイドのみ、クライアント露出禁止

### データ保護

- 個人情報: 議会発言は公開情報のため特別な暗号化不要
- アクセスログ: IP・UserAgent記録（90日保持）
- バックアップ: Supabase自動バックアップ（7日間保持）

### 脆弱性対応

1. 依存関係の定期更新（月次）
2. セキュリティアラートの監視（GitHub Dependabot）
3. 不正アクセス検知（レート制限超過パターン分析）

## トラブルシューティング

### よくある問題と解決策

#### 1. チャット機能が「情報がありません」しか返さない

**症状**: ユーザーの質問に対して引用付き回答ではなく、常に定型文のみ

**原因**:

- データベースに speech_chunks が存在しない
- speech_embeddings テーブルが空
- ベクター検索の閾値が高すぎる

**解決手順**:

```bash
# データ確認
pnpm setup-db  # テーブル存在確認
# または直接SQL実行
# SELECT COUNT(*) FROM speech_chunks;
# SELECT COUNT(*) FROM speech_embeddings;

# 埋め込みデータが不足している場合
pnpm embed

# クラスタリング再実行
pnpm cluster
```

#### 2. Instagram投稿が表示されない

**症状**: SNSセクションが常に「投稿を取得中...」またはエラー表示

**原因**:

- Instagram Graph API トークン期限切れ（60日）
- Business/Creator アカウント設定の変更
- Facebook App の設定変更・停止

**解決手順**:

1. トークン確認

```bash
# 手動でGraph API呼び出しテスト
curl "https://graph.facebook.com/v18.0/me?access_token=${IG_GRAPH_TOKEN_LONG_LIVED}"
```

2. トークン更新（前述のローテーション手順参照）

3. フォールバック確認
   - oEmbed が正常に動作しているか
   - エラーログで具体的なAPIレスポンス確認

#### 3. 埋め込み処理でOpenAI APIエラー

**症状**: `pnpm embed` 実行時にレート制限・認証エラー

**原因**:

- OpenAI APIキーの期限切れ・無効化
- 利用量上限到達（月次）
- APIキーの権限不足

**解決手順**:

1. APIキー確認

```bash
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

2. 利用量確認（OpenAI Dashboard）
3. 必要に応じてキーローテーション・プラン変更

#### 4. レート制限エラー（429）が頻発

**症状**: 特定のIPから短時間に大量リクエスト、正常ユーザーが影響を受ける

**対策**:

1. レート制限の調整（デフォルト: 60req/min）
2. より細かな制限（/api/chat は 10req/min など）
3. クライアントサイドでのリクエスト頻度制御
4. CDN・キャッシュレイヤーの導入検討

#### 5. データベース接続エラー

**症状**: Supabase への接続が断続的に失敗

**確認項目**:

- Supabase プロジェクトの状態（Dashboard で確認）
- 接続数上限（Free tier: 60 connections）
- 環境変数の設定ミス

**対策**:

- 接続プール設定の見直し
- 不要な長時間接続の切断
- Supabaseプランのアップグレード検討

### ログの確認方法

```bash
# アプリケーションログ確認（本番環境）
# コンソール出力（Next.js標準）
pm2 logs your-app-name

# 特定APIのエラー確認
grep "ERROR" /var/log/your-app/api.log | tail -50

# レート制限状況確認
grep "rate limit exceeded" /var/log/your-app/access.log | wc -l
```

### 緊急時の暫定対応

1. **全体的な障害**: サービスを一時的にメンテナンスモードに
2. **チャット機能のみ障害**: チャット機能を無効化、静的メッセージ表示
3. **Instagram機能のみ障害**: SNSセクションを非表示・プレースホルダー表示
4. **データベース障害**: 読み取り専用モード、InMemoryリポジトリに切り替え

---

## 更新履歴

- 2025-08-27: 初版作成（MVP対応）
- 予定: Instagram Business APIアップデート対応
- 予定: 監視・アラート自動化（Datadog/New Relic統合）

## 免責事項

このランブックは池元勝議員ダッシュボード（MVP版）に特化した運用手順です。本番環境への適用時は、セキュリティ・法的要件を再確認してください。

---

**最終更新**: 2025-08-27  
**担当者**: システム管理チーム
