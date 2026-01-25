---
title: '使用 xget 加速你的下載'
description: '模組拉取慢，Docker 映像下載困難？xget 幫你解決'
date: '2026-01-02'
tags: ['proxy', 'xget', 'ubuntu', 'linux', 'docker']
authors: ['rownix']
draft: false
---

Xget 是一個基於 Cloudflare Workers 構建的下載加速引擎。它能智慧解析請求，精準識別目標平台（如 GitHub、Docker Hub、Hugging Face 等），並自動把 URL 轉換為正確的上游地址。借助 Cloudflare 遍布全球的 300+ 邊緣節點快取能力，可顯著提升你的下載速度。

最重要的是它也支援 Tencent EdgeOne Pages，我給大家部署了一份公共實例：

- **服務地址**：`get.rownix.dev`
- **原始倉庫**：<https://github.com/xixu-me/xget>

如果你希望自建服務以獲得更穩定的體驗，可以參考原倉庫的部署指南。

我們先拿 Docker 的拉取舉例：
如果你需要長期使用加速服務，建議配置 Docker 守護進程。
首先你需要把 `/etc/docker/daemon.json` 編輯為：

```json
{
  "registry-mirrors": ["https://get.rownix.dev/cr/docker"]
}
```

保存檔案後，執行以下命令重啟 Docker 以套用更改：

```bash
sudo systemctl restart docker
```

驗證配置是否生效：

```bash
docker info | grep "Registry Mirrors" -A 1
```

這樣以後每一次 Docker 拉取都會透過這個代理拉取。

不過如果你只是想臨時使用，也不必這麼麻煩。
**如果你想拉取官方倉庫映像**（如 nginx、redis 等）：

```bash
sudo docker pull get.rownix.dev/cr/docker/library/nginx:latest
```

**拉取使用者倉庫映像**（如 bitnami、linuxserver 等）：

```bash
sudo docker pull get.rownix.dev/cr/docker/bitnami/nginx:latest
```

`Xget` 的能力遠不止如此，它還支援：

- GitHub（Releases、Raw 檔案）
- NPM / PyPI / Maven 等套件管理器
- Hugging Face（模型與資料集）
- Google Fonts / CDN 資源
- 主流 Linux 發行版的軟體源（Ubuntu、Fedora、Arch、OpenSUSE）等

更多詳見：<https://github.com/xixu-me/xget/blob/main/README.zh-Hans.md>

不過 Xget 的支援範圍有限，所以我們與 365 VPN 合作推出限時福利，
將在留言區抽取 10 位幸運讀者送出價值 US$4 的月度會員。
365 VPN 採用專線連線，最高支援 10Gbps 頻寬，快使用 365 VPN 來加速你的連線。

👉 註冊連結：<https://ref.365tz87989.com/?r=TBNM5I>
