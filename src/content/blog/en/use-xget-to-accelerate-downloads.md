---
title: 'Accelerate Your Downloads with xget'
description: 'Slow module pulls, Docker image download troubles? xget has got you covered'
date: '2026-01-02'
tags: ['proxy', 'xget', 'ubuntu', 'linux', 'docker']
authors: ['rownix']
draft: false
---

Xget is a download acceleration engine built on Cloudflare Workers. It intelligently parses requests, accurately identifies target platforms (such as GitHub, Docker Hub, Hugging Face, etc.), and automatically converts URLs to the correct upstream addresses. Leveraging Cloudflare's global network of 300+ edge nodes and caching capabilities, it can significantly boost your download speeds.

Most importantly, it also supports Tencent EdgeOne Pages, and I've deployed a public instance for everyone:

- **Service URL**: `get.rownix.dev`
- **Original Repository**: <https://github.com/xixu-me/xget>

If you wish to self-host for a more stable experience, you can refer to the original repository's deployment guide.

Let's start with Docker pulls as an example:
If you need to use the acceleration service long-term, it's recommended to configure the Docker daemon.
First, you need to edit the `/etc/docker/daemon.json` file to:

```json
{
  "registry-mirrors": ["https://get.rownix.dev/cr/docker"]
}
```

After saving the file, execute the following command to restart Docker and apply the changes:

```bash
sudo systemctl restart docker
```

Verify if the configuration is effective:

```bash
docker info | grep "Registry Mirrors" -A 1
```

This way, every future Docker pull will go through this proxy.

However, if you only want to use it temporarily, it doesn't have to be so troublesome.
**If you want to pull official repository images** (such as nginx, redis, etc.):

```bash
sudo docker pull get.rownix.dev/cr/docker/library/nginx:latest
```

**Pull user repository images** (such as bitnami, linuxserver, etc.):

```bash
sudo docker pull get.rownix.dev/cr/docker/bitnami/nginx:latest
```

The charm of `Xget` goes far beyond this—it also supports:

- GitHub (Releases, Raw files)
- Package managers like NPM / PyPI / Maven
- Hugging Face (models and datasets)
- Google Fonts / CDN resources
- Major Linux distribution software repositories (Ubuntu, Fedora, Arch, OpenSUSE), etc.

For more details, see: <https://github.com/xixu-me/xget/blob/main/README.md>

However, Xget's support scope is limited, so we've partnered with 365 VPN to offer a limited-time promotion.
We'll be selecting 10 lucky winners from the comments section to receive monthly memberships worth US$4 each (though this might feel like giving alms).
365 VPN uses dedicated connections with support for up to 10Gbps bandwidth. Hurry and use 365 VPN to accelerate your connections.

👉 Registration link: <https://ref.365tz87989.com/?r=TBNM5I>