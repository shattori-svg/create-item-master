# 技術調査レポート: Gemini モデル移行（2.5 系サポート終了対応）

- **調査日**: 2026-08-04
- **調査対象**: Gemini API (generativelanguage / AI Studio), Gemini 3.x モデル群
- **調査コンテキスト**: Google Cloud から「2026-10-20 で Gemini Enterprise Agent Platform（旧 Vertex AI）の Gemini 2.5 Flash / Flash Lite / Pro をサポート終了」の通知を受領。本リポジトリ（`/api/ai-suggest` で `gemini-2.5-flash` を呼び出し）の影響範囲調査とモデル移行のため。

---

## 0. 前提の切り分け（重要）

受領した通知は **Gemini Enterprise Agent Platform（旧 Vertex AI）エンドポイント**が対象。通知本文にも明記されている:

> この更新は Gemini Enterprise Agent Platform にのみ適用されます。AI Studio で Gemini を使用しているプロジェクトには、異なるサポート終了日が適用されることがあります。

本リポジトリは **AI Studio 系（`generativelanguage.googleapis.com` + API キー）** を使用しており、Vertex AI SDK / `aiplatform` エンドポイントは一切使っていない（`server.js:766` の 1 箇所のみ）。したがって **2026-10-20 の期日は本アプリには直接適用されない**。

ただし `gemini-2.5-flash` 自体は AI Studio 側でも旧世代であり、Google は 2.5 系の退役を明確に意図している（下記）。**この機会に移行しておくのが妥当**という判断。

なお通知に記載された影響プロジェクト `lopia-th-poc-01-dev`（3 件）は、本アプリ以外の Vertex AI 利用（別リポジトリ／別サービス）が該当している可能性が高い。**本リポジトリの改修だけでは通知への対応は完了しない** — 同プロジェクト内の他の Vertex AI 利用箇所を別途棚卸しすること。

---

## Gemini API（generativelanguage / AI Studio）

### 基本情報

- **公式モデル一覧**: https://ai.google.dev/gemini-api/docs/models
- **公式 deprecation 一覧**: https://ai.google.dev/gemini-api/docs/deprecations

2026-08 時点の GA（安定版）Flash 系モデル ID:

| モデル ID | 状態 | リリース | 公式 shutdown 日 | 入力 $/1M | 出力 $/1M | thinking_level 既定 |
|---|---|---|---|---|---|---|
| `gemini-2.5-flash` | GA（旧世代） | 2025-06-17 | 未公表（AI Studio 側） | 0.30 | 2.50 | – |
| `gemini-2.5-flash-lite` | GA（旧世代） | 2025-07-22 | 未公表 | 0.10 | 0.40 | – |
| `gemini-3.1-flash-lite` | GA | 2026-05-07 | **2027-05-07**（後継: 3.5-flash-lite） | 0.25 | 1.50 | minimal |
| `gemini-3.5-flash-lite` | GA | 2026-05-19 | 未公表 | 0.30 | 2.50 | minimal |
| `gemini-3.5-flash` | GA | 2026-05 | 未公表 | 1.50 | 9.00 | medium |
| `gemini-3.6-flash` | GA | 2026-07-21 | 未公表 | 1.50 | 7.50 | medium |

- 公式 deprecations ページ上、`gemini-2.5-flash` の AI Studio 側 shutdown 日は「未公表」。ただしコミュニティでは 2026-10-16 前後との報告あり（非公式）。公式表の shutdown 日は「**最も早い退役日**」であり確定日ではない、と注記されている。
- `gemini-3.1-flash-lite` は **既に shutdown 日（2027-05-07）と後継（`gemini-3.5-flash-lite`）が公示済み**。通知の推奨表に載っているが、移行先に選ぶと 1 年以内に再移行が必要になる。**選ばない**。
- `gemini-flash-latest` 等のエイリアスは存在するが、破壊的変更の予告期間が 2 週間しかないため本番利用は非推奨。

### 破壊的変更（2.5 → 3.x）

1. **`thinking_budget`（int）→ `thinking_level`（enum: minimal / low / medium / high）**。3.x では thinking を完全に無効化できない。
2. **`temperature` / `top_p` / `top_k` は deprecated かつ無視される**。将来世代では指定すると HTTP 400。既定値 1.0 のまま使うことが強く推奨。
3. **`candidate_count` は非サポート**（削除必須）。
4. **model role で終わるリクエスト（prefilled model turn）は HTTP 400**。
5. **Thought signatures**: 応答の推論状態を表す暗号化トークン。**マルチターンの Function Calling で必須**。単発・関数呼び出しなしのリクエストでは往復不要。
6. **応答 `parts` に thought パート（`part.thought === true`）が混在し得る**。`includeThoughts: false` が一部モデルで無視される既知バグも報告されている（cookbook issue #1198）。`parts[0].text` 固定読みは危険。

### API サーフェスの状況（generateContent vs Interactions API）

- 2026-06-22 に **Interactions API が GA** となり、Gemini の主要インターフェースに。新規プロジェクトは Interactions API 推奨。
- `generateContent` は **「legacy」表記になったが、引き続き完全サポート**され、Gemini 3.x モデルも呼べる。shutdown 日の公示はない。
- ただし今後のエージェント系新機能は Interactions API 限定で提供される見込み。
- **判断**: 本アプリの用途（単発・1 行のテキスト分類）では Interactions API に移行する便益がない。`generateContent` を維持する。

### 移行先の選定

**`gemini-3.5-flash-lite` を採用。**

| 候補 | 判断 |
|---|---|
| `gemini-3.5-flash-lite` | **採用**。GA、shutdown 未公示、テキスト単価が `gemini-2.5-flash` と完全同一（0.30 / 2.50）、thinking_level 既定が `minimal` で低レイテンシ。分類タスクに十分。 |
| `gemini-3.1-flash-lite` | 却下。単価は安いが 2027-05-07 shutdown 公示済み → 再移行が発生。 |
| `gemini-3.5-flash` / `gemini-3.6-flash` | 却下。入力単価 5 倍。thinking 既定 medium でレイテンシ増。1 コードを返すだけの用途に過剰。 |
| `gemma-4` | 却下。self-host / 別提供形態で運用負荷が増える。 |

コスト影響: **テキスト入出力の単価は変わらない**（0.30 / 2.50）。ただし thinking トークンが出力として課金されるため、`minimal` でも実出力トークンは 2.5 系より増える可能性がある。分類プロンプトは 1 回あたり出力数十トークン規模のため、金額影響は実質無視できる。

### 推奨アクション（本リポジトリ）

1. `server.js` のモデル ID を `gemini-3.5-flash-lite` に変更し、**環境変数 `GEMINI_MODEL` で上書き可能に**する（次回の退役時にコード変更不要にする）。
2. 応答パースを `parts[0].text` 固定から **thought パートを除外して text を連結**する実装に変更（3.x 必須級の修正）。
3. `temperature` 等は元々未指定 → 変更不要。`thinking_level` も 3.5-flash-lite の既定が `minimal` なので未指定のままでよい（不明フィールドで 400 を招くリスクを回避）。
4. API キーを URL クエリからリクエストヘッダ（`x-goog-api-key`）に移動（ログ経由の漏洩防止）。
5. `.env.example` / `README.md` に `GEMINI_MODEL` を記載。README の「ブラウザから直接 Gemini API を呼ぶ」という古い記述も是正。

### 情報源

- [Gemini API models](https://ai.google.dev/gemini-api/docs/models)
- [Gemini deprecations](https://ai.google.dev/gemini-api/docs/deprecations)
- [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini 3 Developer Guide](https://ai.google.dev/gemini-api/docs/gemini-3)
- [Gemini thinking](https://ai.google.dev/gemini-api/docs/thinking)
- [Interactions API overview](https://ai.google.dev/gemini-api/docs/interactions-overview)
- [Interactions API GA 発表](https://blog.google/innovation-and-ai/technology/developers-tools/interactions-api-general-availability/) (2026-06-22)
- [Gemini 3.6 Flash & 3.5 Flash-Lite developer guide](https://dev.to/googleai/gemini-36-flash-35-flash-lite-developer-guide-268i)
- [cookbook issue #1198: includeThoughts:false が無視され thought パートが返る](https://github.com/google-gemini/cookbook/issues/1198)

---

## 総合判断

- 受領通知（Vertex AI / 2026-10-20）は **本リポジトリには直接該当しない**が、`gemini-2.5-flash` 自体が旧世代なので移行する。
- 移行先は **`gemini-3.5-flash-lite`**（GA・単価据え置き・shutdown 未公示）。モデル ID は `GEMINI_MODEL` 環境変数で切替可能にする。
- 必須のコード修正は **応答パースの thought パート対応**。これを入れないと、将来 thought パートが返り始めたときに分類コードの誤抽出（`raw.includes(code)` が thought 文中の別コードに一致）が起こり得る。
- 残リスク: `lopia-th-poc-01-dev` プロジェクト内の **他の Vertex AI 利用箇所は未調査**。通知への完全対応にはその棚卸しが必要。
