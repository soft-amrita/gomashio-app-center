# AGENTS.md — ごましおアプリセンターで作業するエージェントへ

このリポジトリを引き継ぐコーディングエージェント（Cursor / Codex / Claude Code 等）向けの作業ルール。

## リポジトリ概要
- 静的ウェブアプリ集「ごましおアプリセンター」。ルートの `index.html` がポータル、各サブフォルダが1アプリ。
- ビルド不要。リポジトリルートがそのまま公開ルート。公開先は Cloudflare Pages: https://gomashio-app-center.pages.dev
- デプロイは Wrangler: `npx wrangler pages deploy . --project-name gomashio-app-center --branch main`（リポジトリを clone した場所で実行。Cloudflare へのログインは実行環境側で行う）

## アプリ追加の手順
1. 英小文字ケバブケースのフォルダを作る（例: `new-app/`）
2. フォルダ内に `SPEC.md`（仕様）を置き、それに沿って `index.html` / `style.css` / `app.js` を実装する
3. ルート `index.html` の `APPS` 配列に1件追加する（slug / icon（絵文字）/ name / cat / desc / kw）
4. `README.md` のアプリ一覧に1行追加する
5. 動作確認: `node --check <folder>/app.js`、3ファイルが揃っていること

## ハウスルール（全アプリ共通）
- 3ファイル構成（index.html / style.css / app.js）、バニラJS/CSSのみ
- 外部ライブラリ・CDN・外部フォント・外部画像は禁止（オフラインで動くこと）。ただしポータルと各アプリの `<head>` に入っている Google AdSense のスクリプトタグは消さないこと
- UIは日本語、スマホ・PC両対応のレスポンシブ
- 各アプリのフッターにポータルへの戻りリンク（`../`）を置く
- データ保存が必要なら localStorage を使う（サーバー送信はしない）

## 注意
- `.done` ファイルや `build-apps.sh`、`build-log.txt` は制作側の作業ファイルで、公開物ではない
- ポータルのポイント・ネモ天気ウィジェットは wttr.in（無料API）を使用。失敗時は非表示になる設計なので、壊れていても他の機能に影響させない
