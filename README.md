# ポイ活レコメンくん

複数のポイントサイトを横断比較し、「今見る価値がある案件」をトップ画面から発見できる、発見型ポイ活Webアプリ。

## デモ

https://{your-github-username}.github.io/poikatsu-recommend/

## 機能（MVP）

- **今日の注目案件** — スコアと変化量で算出したおすすめ案件を横スクロールで表示
- **本日上昇した案件** — 前日比でポイントが上がった案件をランキング表示
- **高還元ランキング** — 全案件の最高還元額順ランキング
- **カテゴリ絞り込み** — クレカ・証券・通信など9カテゴリ
- **案件一覧** — 検索・フィルター・ソートに対応
- **案件詳細** — サイト別比較・7日間推移グラフ・外部リンク
- **お気に入り** — ローカル状態で案件を保存

## 技術スタック

| 役割 | 技術 |
|------|------|
| フロントエンド | Vite + React + TypeScript |
| ルーティング | React Router v6 (HashRouter) |
| グラフ | Recharts |
| アイコン | Lucide React |
| ホスティング | GitHub Pages |
| CI/CD | GitHub Actions |

## ローカル開発

```bash
npm install
npm run dev
```

## デプロイ

`main` ブランチへのプッシュで GitHub Actions が自動ビルド＆デプロイします。

### 初回セットアップ

1. このリポジトリを GitHub にプッシュ
2. Settings > Pages > Source を **GitHub Actions** に設定
3. `vite.config.ts` の `base` をリポジトリ名に合わせて変更

```ts
// vite.config.ts
base: '/your-repo-name/',
```

## 今後の拡張 (Phase 2)

- Supabase による実データ取得・保存
- ハピタス・モッピーのスクレイピング (GitHub Actions 定期実行)
- 差分検知の精度向上
- 個人パーソナライズ対応
