---
title: 'xgetでダウンロードを加速する'
description: 'モジュールのプルが遅い、Dockerイメージのダウンロードが難しい？xgetが解決します'
date: '2026-01-02'
tags: ['プロキシ', 'xget', 'ubuntu', 'linux', 'docker']
authors: ['rownix']
draft: false
---

XgetはCloudflare Workersベースのダウンロード加速エンジンです。リクエストをインテリジェントに解析し、ターゲットプラットフォーム（GitHub、Docker Hub、Hugging Faceなど）を的確に識別し、URLを正しい上流アドレスに自動変換します。Cloudflareの世界300以上のエッジノードキャッシュ能力を活用することで、ダウンロード速度を大幅に向上できます。

さらに重要なのは、Tencent EdgeOne Pagesもサポートしており、皆様のために公開インスタンスをデプロイしました：

- **サービスアドレス**: `get.rownix.dev`
- **オリジナルリポジトリ**: <https://github.com/xixu-me/xget>

より安定した体験を得るために独自サービスを構築したい場合は、オリジナルリポジトリのデプロイガイドを参考にしてください。

まずDockerのプルを例にします：
長期にわたって加速サービスを使用したい場合、Dockerデーモンを設定することをお勧めします。
まず`/etc/docker/daemon.json`ファイルを編集します：

```json
{
  "registry-mirrors": ["https://get.rownix.dev/cr/docker"]
}
```

ファイルを保存後、変更を適用するために以下のコマンドを実行してDockerを再起動します：

```bash
sudo systemctl restart docker
```

設定が有効か確認します：

```bash
docker info | grep "Registry Mirrors" -A 1
```

これで、今後のすべてのDockerプルはこのプロキシ経由で行われます。

ただ、一時的に使用したいだけなら、そこまで面倒にする必要はありません。
**公式リポジトリのイメージ**（nginx、redisなど）をプルしたい場合：

```bash
sudo docker pull get.rownix.dev/cr/docker/library/nginx:latest
```

**ユーザーリポジトリのイメージ**（bitnami、linuxserverなど）をプルしたい場合：

```bash
sudo docker pull get.rownix.dev/cr/docker/bitnami/nginx:latest
```

`Xget`の魅力はこれだけではありません。以下もサポートしています：

- GitHub（Releases、Rawファイル）
- NPM / PyPI / Mavenなどのパッケージマネージャー
- Hugging Face（モデルとデータセット）
- Google Fonts / CDNリソース
- 主要なLinuxディストリビューションのソフトウェアソース（Ubuntu、Fedora、Arch、OpenSUSEなど）

詳細は：<https://github.com/xixu-me/xget/blob/main/README.zh-Hans.md>

ただ、Xgetの対応範囲は限られているため、365 VPNと提携して期間限定キャンペーンを実施します。
コメント欄で10名の幸運な読者を抽選で選び、価値US$4の月額会員をプレゼントします（どうも物乞いをしているような気分ですが）。
365 VPNは専用線接続を採用しており、最大10Gbps帯域をサポートします。365 VPNを使って接続を加速してください。

👉 登録リンク：<https://ref.365tz87989.com/?r=TBNM5I>
