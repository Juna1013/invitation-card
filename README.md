# Invitation Card 💌

Invitation Card は、同窓会の招待状を、Apple Wallet のイベントパス風の和のデザインで生成するツールです。名簿の1人につき1枚のカード（PNG 画像）を、クラスごとの配色（日本の伝統色）で出力します。会場の地図リンクを付けた PDF も出力できます。

React で描いたカードを、Playwright（Chromium）で画像にしています。カードの文言とクラスごとの配色は、`card.yaml` の1ファイルで管理します。

## Setup locally 🖥️

Invitation Card の開発環境をローカルで立ち上げる場合は以下の手順に従ってください。

### Attention

- 事前に [Node.js](https://nodejs.org) (v22 以上を推奨) をインストールしておく必要があります。
- 画像の生成に Chromium を使います。手順 3 でインストールします。
- 実際の名簿（`roster.csv` など）は個人情報のため、Git の管理対象外にしています。コミットしないでください。

### 1. clone git repository

```bash
git clone "https://github.com/Juna1013/invitation-card" && cd "./invitation-card"
```

### 2. install dependencies

```bash
npm install
```

### 3. install browser

```bash
npx playwright install chromium
```

### 4. generate sample cards

```bash
npm run sample
```

`samples/cards/` に、クラスごとに1枚ずつ、計9枚のカード画像（1200×1776 px、角丸の外側は透明）が出力されます。サンプル名簿（`samples/roster.sample.csv`）を使い、氏名はすべて「〇〇 〇〇」の伏字になります。

## Customize ✏️

カードの文言（タイトル・日時・会場など）、項目名、クラスごとの配色は、[card.yaml](./card.yaml) だけを編集します。

```yaml
event:
  title: 勝田一中 同窓会
  date: "2027-01-11"
  venue: ホテルクリスタルパレス
  map_url: https://www.google.com/maps/search/?api=1&query=...
```

- 配色は、プリセット名（白練・鬱金色・常磐緑など）または `#rrggbb` で指定します。
- 設定に不備があるときは、実行時に不備の箇所がすべて表示されます。
- 設計の詳細は [docs/design.md](./docs/design.md) を参照してください。

## Scripts 📜

| コマンド | 内容 |
|---|---|
| `npm run sample` | サンプルのカード画像（PNG）を `samples/cards/` に出力 |
| `npm run sample:pdf` | 場所欄が地図リンクになる PDF を `samples/pdf/` に出力 |
| `npm run overview` | 9クラスの一覧画像を `samples/overview.png` に出力（先に `npm run sample:pdf` を実行） |
| `npm run sample:public` | 学校名を伏せた公開用のカード画像を出力（SNS 向け） |
| `npm run sample:pdf:public` `npm run overview:public` | 学校名を伏せた公開用の PDF と一覧画像を出力 |

- 画像（PNG）にはクリックできるリンクを埋め込めません。リンクが必要な場合は PDF を使うか、メール本文に `map_url` を記載してください。
- 公開用で伏せる語句は、`card.yaml` の `public_masks` で指定します。

## License 📄

このリポジトリのコードは [MIT License](./LICENSE) で公開しています。ただし、次のものは MIT の対象外です。

- `src/assets/wagasa/` の和傘の SVG（3点）: 出典（[shikosai34/shikosai34-web](https://github.com/shikosai34/shikosai34-web)）にライセンス表記がありません。再利用や再配布の前に、出典側の了承を確認してください。これを使って生成したカード画像（`samples/` 以下を含む）も同様です。
- フォント（Noto Sans JP・IBM Plex Mono）: [SIL Open Font License 1.1](https://openfontlicense.org)。`@fontsource` のパッケージとして取得します。
