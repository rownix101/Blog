---
title: '使用 xget 加速你的下载'
description: '模块拉取慢，Docker 镜像下载困难？xget 帮你解决'
date: '2026-01-02'
tags: ['proxy', 'xget', 'ubuntu', 'linux', 'docker']
authors: ['rownix']
draft: false
---

Xget 是一个基于 Cloudflare Workers 构建的下载加速引擎。它能够智能解析请求，精准识别目标平台（如 GitHub、Docker Hub、Hugging Face 等），并自动将 URL 转换为正确的上游地址。借助 Cloudflare 遍布全球的 300+ 边缘节点缓存能力，可显著提升你的下载速度。

最重要的是他还支持 Tecent Edgeone Pages，我给大家部署了一份公共实例：

- **服务地址**：`get.rownix.dev`
- **原作作仓库**：<https://github.com/xixu-me/xget>

如果你希望自建服务以获得更稳定的体验，可以参考原仓库的部署指南。

我们先拿docker的拉取举例：
如果你需要长期使用加速服务，建议配置 Docker 守护进程。
首先你需要编辑`/etc/docker/daemon.json`文件为

```json
{
  "registry-mirrors": ["https://get.rownix.dev/cr/docker"]
}
```

保存文件后，执行以下命令重启 Docker 以应用更改：

```bash
sudo systemctl restart docker
```

验证配置是否生效：

```bash
docker info | grep "Registry Mirrors" -A 1
```

这样你以后的每一次docker拉取都是通过这个代理拉取的了

不过如果你只是想临时使用的话倒也不必这么麻烦
**如果你想要拉取官方仓库镜像**（如 nginx、redis 等）：

```bash
sudo docker pull get.rownix.dev/cr/docker/library/nginx:latest
```

**拉取用户仓库镜像**（如 bitnami、linuxserver 等）：

```bash
sudo docker pull get.rownix.dev/cr/docker/bitnami/nginx:latest
```

`Xget`的魅力远不止如此，他还支持：

- GitHub（Releases、Raw 文件）
- NPM / PyPI / Maven 等包管理器
- Hugging Face（模型和数据集）
- Google Fonts / CDN 资源
- 主流Linux发行版的软件源（Ubuntu,Fedora,Arch,OpenSUSE）等

更多详见：<https://github.com/xixu-me/xget/blob/main/README.zh-Hans.md>

不过 Xget 的支持范围有限，所以我们与 365 VPN 合作推出限时福利，
将在评论区抽取10位幸运童鞋送出价值 US$4 的月度会员（怎么感觉这么像在打发要饭的）。
365 VPN 采用专线连接，最高支持 10Gbps 带宽，快使用365 VPN 来加速你的连接。

👉 注册链接：<https://ref.365tz87989.com/?r=TBNM5I>
