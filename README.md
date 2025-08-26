# 池元勝議員 政治家ダッシュボード MVP

池元勝議員向けの政治家ダッシュボードMVPプロジェクト。議会発言・活動実績・SNS投稿をAI分析と可視化により透明性を持って表示するシステム。

## 概要

このシステムは以下の主要機能を提供します:

- **議会発言分析**: 会議録からの発言抽出とクラスタリング分析
- **実績可視化**: AI分析による発言テーマの円グラフ表示
- **RAGチャット**: 厳格な引用要件付きの質問応答システム
- **SNS連携**: Instagram投稿の自動取得と表示

## 技術スタック

- **フロントエンド**: Next.js (App Router) + TypeScript + Tailwind CSS
- **バックエンド**: Next.js Route Handlers + Supabase (PostgreSQL + pgvector)
- **AI**: OpenAI API (埋め込み用text-embedding-3-large、チャット用Responses API)
- **テスト**: Vitest + React Testing Library + Playwright (E2E)
- **Instagram連携**: Graph API (第一選択) + oEmbed (フォールバック)

## セットアップ

### 1. 必要な環境

- Node.js LTS (推奨: v18以上)
- pnpm (corepack経由でインストール)
- Git

```bash
# corepackを有効化
corepack enable
```

### 2. リポジトリのクローンと依存関係のインストール

```bash
git clone <repository-url>
cd ai-council-dashboard-and-ai-chat
pnpm install
```

### 3. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定:

```bash
# App
NEXT_PUBLIC_SITE_NAME=ikemoto-mvp

# OpenAI (サーバーサイドのみ)
OPENAI_API_KEY=sk-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # サーバーサイドのみ

# Instagram（Business/Creatorアカウント必須）
IG_GRAPH_TOKEN_LONG_LIVED=IGQ...
FB_APP_ID=...
FB_APP_CLIENT_TOKEN=...

# 機能フラグ
USE_SUPABASE=true  # false = InMemoryリポジトリを使用
```

### 4. データベースセットアップ（Supabase）

Supabaseプロジェクトで以下のテーブルを作成:

```sql
-- pgvector拡張を有効化
CREATE EXTENSION IF NOT EXISTS vector;

-- 議会発言メタデータ
CREATE TABLE speeches (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  session TEXT NOT NULL,
  speaker TEXT NOT NULL,
  content TEXT NOT NULL,
  source_url TEXT NOT NULL
);

-- RAG用テキストチャンク
CREATE TABLE speech_chunks (
  id BIGSERIAL PRIMARY KEY,
  speech_id BIGINT REFERENCES speeches(id),
  idx INT NOT NULL,
  text TEXT NOT NULL,
  source_url TEXT NOT NULL
);

-- ベクター埋め込み（3072次元）
CREATE TABLE speech_embeddings (
  chunk_id BIGINT PRIMARY KEY REFERENCES speech_chunks(id),
  embedding VECTOR(3072) NOT NULL
);

-- Instagram投稿
CREATE TABLE sns_posts (
  id BIGSERIAL PRIMARY KEY,
  platform TEXT NOT NULL,
  post_date TIMESTAMP WITH TIME ZONE NOT NULL,
  content TEXT,
  media_url TEXT,
  post_url TEXT NOT NULL
);

-- クラスタ分析結果
CREATE TABLE highlights (
  cluster_label TEXT PRIMARY KEY,
  count INT NOT NULL,
  sample_chunk_id BIGINT REFERENCES speech_chunks(id)
);
```

## 開発コマンド

### 基本的な開発作業

```bash
# 開発サーバー起動
pnpm dev

# テスト実行
pnpm test                           # 単体テスト
pnpm exec playwright install       # E2E依存関係インストール
pnpm exec playwright test          # E2Eテスト

# コード品質チェック
pnpm format      # Prettierによる整形
pnpm lint        # ESLintによるコード検査
pnpm typecheck   # TypeScriptの型チェック

# ヘルスチェック
curl http://localhost:3000/api/health
```

## データパイプライン（本番運用）

### 1. インジェスト（会議録データ取り込み）

静的HTML/PDFファイルを解析して議会発言データを取り込み:

```bash
# fixturesフォルダのファイルを処理
pnpm ts-node scripts/ingest.ts ./fixtures

# 実行例
pnpm ts-node scripts/ingest.ts ./data/council-records
```

実行すると以下の処理が行われます:

- HTML/PDFファイルの自動検出
- 議会発言の抽出と正規化
- テキストのチャンク分割
- データベースへの保存

### 2. 埋め込み生成（ベクター化）

**⚠️ 注意: OpenAI APIの課金が発生します**

```bash
# 全チャンクの埋め込みを生成
pnpm ts-node scripts/embed_all.ts
```

実行すると:

- 全speech_chunksを取得
- OpenAI text-embedding-3-largeで埋め込み生成
- レート制限に配慮した実行
- speech_embeddingsテーブルに保存

### 3. クラスタリング分析

```bash
# K-meansクラスタリング実行（K=6）
pnpm ts-node scripts/cluster.ts
```

実行すると:

- 全埋め込みベクターを取得
- K-meansクラスタリング実行
- 日本語ストップワード除去
- クラスタラベル自動生成
- highlightsテーブル更新

### 4. 完全なデータパイプライン実行例

```bash
# 1. 会議録データの取り込み
pnpm ts-node scripts/ingest.ts ./fixtures

# 2. 埋め込み生成（課金注意）
pnpm ts-node scripts/embed_all.ts

# 3. クラスタリング分析
pnpm ts-node scripts/cluster.ts

# 4. 開発サーバー起動
pnpm dev
```

## 主要APIエンドポイント

- `GET /api/health`: ヘルスチェック
- `GET /api/speeches`: ページネーション付き発言リスト
- `POST /api/chat`: 厳格な引用要件付きストリーミングRAGチャット
- `GET /api/instagram/latest`: Graph API → oEmbedフォールバック付きInstagram投稿

## アーキテクチャパターン

### ポート&アダプタアーキテクチャ

プロジェクトはClean Architectureのポート&アダプタパターンを採用:

```
src/
├── domain/          # ドメインモデル
├── ports/           # インターフェース定義
├── adapters/        # 実装（InMemory, Supabase）
├── ai/              # AI機能（埋め込み、RAG、クラスタリング）
├── ingest/          # データ取り込み
├── ui/              # UIコンポーネント
└── i18n/            # 国際化（エラーメッセージ）
```

### 依存性注入

環境変数によるアダプタ切り替え:

- `USE_SUPABASE=false`: InMemoryリポジトリ使用（テスト・開発）
- `USE_SUPABASE=true`: Supabaseリポジトリ使用（本番）

## 重要なセキュリティ考慮事項

1. **APIキーの保護**
   - 全APIキーはサーバーサイドのみで使用
   - クライアントサイドには絶対に露出させない
   - `.env*`ファイルはgit管理対象外

2. **RAG厳格モード**
   - 必ず出典URLを含むか「情報がありません」を返す
   - システムプロンプトで引用逸脱を防止
   - 根拠のない回答を禁止

3. **Instagram API**
   - Graph API（Business/Creator）を第一選択
   - oEmbedフォールバック（Basic Display API廃止対応）
   - 全API呼び出しはサーバーサイドのみ

## テスト戦略

- **単体テスト**: リポジトリ契約、パーサー、プロンプト生成、フォールバックロジック
- **統合テスト**: RAGパイプライン、Instagram APIフォールバック
- **E2Eテスト**: ホームページ描画、グラフ操作、引用付きチャット回答

```bash
# 全テスト実行
pnpm test && pnpm exec playwright test
```

## トラブルシューティング

### よくある問題

1. **埋め込み生成でエラー**
   - `OPENAI_API_KEY`が正しく設定されているか確認
   - レート制限に注意（scripts/embed_all.tsは制御済み）

2. **Instagram投稿が表示されない**
   - アカウントがBusiness/Creatorアカウントか確認
   - `IG_GRAPH_TOKEN_LONG_LIVED`の有効期限確認
   - oEmbedフォールバック用の`FB_APP_ID`と`FB_APP_CLIENT_TOKEN`確認

3. **Supabaseでベクター検索エラー**
   - `vector`拡張が有効化されているか確認
   - `speech_embeddings`テーブルのVECTOR(3072)列確認

### ログとデバッグ

アプリケーションは詳細なログを出力します:

- API呼び出し追跡
- エラー詳細記録
- パフォーマンス測定

ログはブラウザコンソール（開発時）またはサーバーログで確認できます。

## コントリビューション

1. Issueテンプレートを使用
2. TDD原則に従う（テスト先行）
3. コミット前に必ず品質チェック実行:
   ```bash
   pnpm format && pnpm lint && pnpm typecheck && pnpm test
   ```
4. Conventional Commitsに準拠

## ライセンス

このプロジェクトのライセンスについては、ライセンスファイルを確認してください。

---

**開発完了状況**: MVPの主要機能は実装完了。全168テスト通過、E2E統合テストも完備。
