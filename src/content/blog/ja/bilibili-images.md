---
title: 1分でBilibiliの画像ホスティングを無料で使う方法
date: 2026-01-18
description: 1円もかけずに、世界中へ高速で画像を配信する方法
tags:
  - 日記
  - 画像ホスティング
  - 配信
---

**⚠️ 免責事項：この記事の内容は技術学習と研究目的のみに限られます。いかなる違法な目的や悪用にも使用しないでください。利用者は関連する法律・規制およびプラットフォームの利用規約を遵守する必要があり、不適切な使用によって生じた結果は利用者自身の責任となります。**

---

## 技術原理

本質的に、これはBilibiliの画像アップロードAPIの特性を活用した技術ソリューションです。Bilibiliの公開アップロードAPIを呼び出すことで、画像リソースをBilibiliのサーバーに保存し、強力なCDNネットワークを活用して世界中にコンテンツを配信することで、高速かつ安定した画像の直リンクサービスを提供します。

## API呼び出し方法

### APIエンドポイント

```
POST https://api.bilibili.com/x/upload/web/image
```

### リクエスト例

```bash
curl -X POST "https://api.bilibili.com/x/upload/web/image" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
  -b "SESSDATA=your_SESSDATA;bili_jct=your_BILI_JCT" \
  -F "bucket=live" \
  -F "csrf=your_BILI_JCT" \
  -F "file=@image.png;filename=image.png"
```

### SESSDATAとBILI_JCTの取得方法

1. Bilibiliのトップページを開き、ログインしていることを確認します。
2. `F12`キーを押してブラウザの開発者ツールを開きます。
3. **Application（アプリケーション）**タブに切り替えます。
4. 左サイドバーの**Storage → Cookies**で`*.bilibili.com`ドメインを選択します。
5. Cookieリストから`SESSDATA`と`BILI_JCT`を探し、その`Value`フィールドが取得したい値です。

### パラメータ説明

| パラメータ | タイプ   | 説明                                 |
| ---------- | -------- | ------------------------------------ |
| SESSDATA   | Cookie   | Bilibiliユーザーセッション識別子     |
| bili_jct   | Cookie   | Bilibili CSRFトークン                |
| bucket     | FormData | ストレージバケット、通常`live`を指定 |
| csrf       | FormData | CSRF検証、値はbili_jctと同じ         |
| file       | FormData | 画像ファイル                         |

### レスポンス形式

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "image_url": "http://i0.hdslb.com/bfs/album/104c4f1ae6b66d78a5952a191281ec7883dc5c5c.jpg",
    "image_width": 818,
    "image_height": 1000
  }
}
```

### レスポンスフィールド説明

| フィールド   | タイプ  | 説明                            |
| ------------ | ------- | ------------------------------- |
| code         | Integer | ステータスコード、0は成功を意味 |
| message      | String  | レスポンスメッセージ            |
| image_url    | String  | 画像アクセスURL                 |
| image_width  | Integer | 画像幅（ピクセル）              |
| image_height | Integer | 画像高さ（ピクセル）            |

---

## 画像スタイルパラメータ詳細

Bilibiliの画像ホスティングはURLパラメータを通じて画像のリアルタイム処理をサポートしており、リサイズ、トリミング、フォーマット変換、品質圧縮などの操作が可能です。

### 一般的なスタイル例

| スタイルタイプ         | URL形式                                    | 説明                           |
| ---------------------- | ------------------------------------------ | ------------------------------ |
| 元画像                 | `baseURL/example.jpg`                      | 元のサイズと品質を保持         |
| 同解像度品質圧縮       | `baseURL/example.jpg@1e_1c.jpg`            | 解像度を維持、品質を下げる     |
| 固定幅、高さ自動調整   | `baseURL/example.jpg@104w_1e_1c.jpg`       | 固定幅、高さを等倍スケーリング |
| 固定高さ、幅自動調整   | `baseURL/example.jpg@104h_1e_1c.jpg`       | 固定高さ、幅を等倍スケーリング |
| 固定サイズ圧縮         | `baseURL/example.jpg@104w_104h_1e_1c.jpg`  | 固定サイズ、品質圧縮           |
| WebP形式（最小サイズ） | `baseURL/example.jpg@1e_1c.webp`           | 元解像度WebP形式               |
| 指定サイズWebP         | `baseURL/example.jpg@104w_104h_1e_1c.webp` | 固定サイズWebP形式             |

### パラメータ構文規則

**フォーマットパターン：**

```
(元画像URL)@(\d+[whsepqoc]_?)*(\.(webp|gif|png|jpg|jpeg))?$
```

### パラメータ詳細説明

| パラメータ | 値範囲                   | 説明                                                                                                                                             |
| ---------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **w**      | [1, 9223372036854775807] | 幅（width）、単位：ピクセル                                                                                                                      |
| **h**      | [1, 9223372036854775807] | 高さ（height）、単位：ピクセル                                                                                                                   |
| **s**      | [1, 9223372036854775807] | 不明なパラメータ（調査中）                                                                                                                       |
| **e**      | [0, 2]                   | リサイズモード（resize）<br>• 0: 縦横比を保持して小さい方を選択<br>• 1: 縦横比を保持して大きい方を選択<br>• 2: 縦横比を保持しない（cと併用不可） |
| **p**      | [1, 1000]                | 拡大倍率、デフォルト100（cと併用不可）                                                                                                           |
| **q**      | [1, 100]                 | 画質（quality）、デフォルト75                                                                                                                    |
| **o**      | [0, 1]                   | 不明なパラメータ（調査中）                                                                                                                       |
| **c**      | [0, 1]                   | トリミングモード（clip）<br>• 0: デフォルトモード<br>• 1: トリミングモード                                                                       |

### フォーマットサフィックス

以下の画像フォーマットがサポートされています：

- `webp` - 推奨、最小サイズ
- `png` - 可逆圧縮
- `jpeg` / `jpg` - 非可逆圧縮
- `gif` - アニメーション形式
- 指定しない場合は元のフォーマットを保持

### 使用上の注意

1. **パラメータは大文字小文字を区別しません**
2. **同じパラメータが複数ある場合、後のものが有効になります**
3. **計算後の実際の幅×高さは元画像サイズを超えてはいけません**、超える場合は幅高パラメータが無効になります
4. **WebP形式の使用を推奨**、最適な圧縮率を得られます

---

## 関連ツール・プロジェクト

### bilibili-img-uploader

これは機能が充実したブラウザ拡張ツールであり、**6年**にわたり安定稼働し、ユーザーに便利なBilibili画像ホスティングアップロードサービスを提供しています。

#### プロジェクト情報

- **プロジェクトアドレス**: [https://github.com/xlzy520/bilibili-img-uploader](https://github.com/xlzy520/bilibili-img-uploader)
- **ライセンス**: MIT License
- **プロジェクトステータス（記事公開時点）**: ⭐ 406+ Stars | 39+ Forks
- **技術スタック**: Vue 3 + TypeScript + Vite

#### 対応ブラウザ

| ブラウザ | インストール方法                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Chrome   | [Chrome Web Store](https://chrome.google.com/webstore/detail/b%E7%AB%99%E5%9B%BE%E5%BA%8A/domljbndjbjgpkhdbmfgmiclggdfojnd?hl=zh-CN) |
| Edge     | [Chrome Web Store](https://chrome.google.com/webstore/detail/b%E7%AB%99%E5%9B%BE%E5%BA%8A/domljbndjbjgpkhdbmfgmiclggdfojnd?hl=zh-CN) |
| Firefox  | [Firefox Add-ons](https://addons.mozilla.org/addon/%E5%93%94%E5%93%A9%E5%93%94%E5%93%A9%E5%9B%BE%E5%BA%8A/)                          |

#### 主な機能

**自動Cookie読み取り** - SESSDATAとbili_jctの手動設定が不要
**複数圧縮フォーマット** - WebP、JPEG、PNGなど複数の出力フォーマットをサポート
**リアルタイムプレビュー** - アップロード前に画像効果をプレビュー
**一括アップロード** - 複数画像を同時アップロード
**高速コピー** - 画像リンクをワンクリックでコピー
**短縮リンク生成** - Bilibili短縮リンク変換をサポート

#### Webオンライン版

ブラウザ拡張をインストールしたくない場合、Web版も使用できます：

- **アドレス**: [https://www.xiaojuzi.fun/bili-short-url/upload.html](https://www.xiaojuzi.fun/bili-short-url/upload.html)
- **注意**: SESSDATAとbili_jctを手動で入力する必要があります

#### ローカル開発ガイド

```bash
# 依存関係をインストール
pnpm install

# 開発モード（ホットリロード対応）
pnpm run dev

# 本番ビルド
pnpm run build
```

ビルド後、`chrome://extensions/`ページで開発者モードを有効にし、`extension`フォルダを読み込みます。

---

## ⚠️ 重要な注意事項

### API安定性の警告

プロジェクトのissue記録によると、Bilibiliは**2023年12月**に画像アップロードインターフェースを調整し、元のインターフェースが返す画像リンクの有効期間を**45分**に短縮しました。プロジェクトは新しいインターフェースを使用するように更新されていますが、以下の点に注意が必要です：

1. **インターフェースの可用性は不確定** - Bilibiliはいつでもインターフェースを調整または閉鎖する可能性があります
2. **画像の永続性は保証されません** - 重要な画像はローカルバックアップを作成することをお勧めします
3. **乱用しないでください** - 大量アップロードはアカウント制限の原因になる可能性があります

### Cookieセキュリティの注意

- SESSDATAとbili_jctは機密情報のため、適切に管理してください
- 公共の場や信頼できないウェブサイトでCookie情報を入力しないでください
- 定期的にBilibiliのパスワードを変更してアカウントのセキュリティを保護してください

---

## リファラ回避対策

Bilibiliの画像ホスティングにはリファラ（参照元）チェックがあり、他のウェブサイトに直接埋め込むと表示されない場合があります。以下の2つの解決策があります：

### 方案1: 全サイトでReferrerを無効化

HTMLの`<head>`タグに追加します：

```html
<meta name="referrer" content="no-referrer" />
```

これで全サイトのリソースリクエストがリファラ情報を送信しなくなります。

### 方案2: 個別リンク対応

単一リンクの場合、`rel="noreferrer"`属性を使用できます：

```html
<a href="画像URL" rel="noreferrer" target="_blank">
  <img src="画像URL" alt="説明" />
</a>
```

**注意**: `window.open`でリンクを開くとデフォルトでリファラが送信されるため、特別な処理が必要です。

---

## 📚 技術参考資料

本ドキュメントで整理した技術情報は主に以下を参考にしています：

- [xlzy520/bilibili-img-uploader](https://github.com/xlzy520/bilibili-img-uploader) - オープンソースブラウザ拡張プロジェクト
- [SocialSisterYi/bilibili-API-collect](https://github.com/SocialSisterYi/bilibili-API-collect) - Bilibili APIドキュメント収集プロジェクト

---

## 🤝 謝辞

[@xlzy520](https://github.com/xlzy520)およびすべての貢献者の方々、長年にわたるプロジェクトの保守と更新に感謝します。このプロジェクトに価値を感じた方は、ぜひStar⭐を付けて応援してください！

---

**最後にもう一度注意**: 本ドキュメントの内容は技術研究と学習交流のみを目的としています。プラットフォームのルールを遵守し、関連技術を合理的かつ合法的に使用してください。悪用によって生じた結果は利用者自身の責任です。
