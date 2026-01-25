---
title: 'Beschleunige deine Downloads mit xget'
description: 'Langsame Modul-Downloads, Probleme beim Ziehen von Docker-Images? xget hilft'
date: '2026-01-02'
tags: ['proxy', 'xget', 'ubuntu', 'linux', 'docker']
authors: ['rownix']
draft: false
---

Xget ist eine Download-Beschleunigungs-Engine auf Basis von Cloudflare Workers. Sie analysiert Requests, erkennt Zielplattformen (GitHub, Docker Hub, Hugging Face usw.) und schreibt URLs automatisch auf die korrekten Upstream-Adressen um. Mit Cloudflares globalem Netz (300+ Edge-Nodes) und Caching kann das die Download-Geschwindigkeit deutlich verbessern.

Wichtig: Es unterstuetzt auch Tencent EdgeOne Pages. Ich habe eine oeffentliche Instanz fuer alle deployed:

- **Service-URL**: `get.rownix.dev`
- **Original-Repo**: <https://github.com/xixu-me/xget>

Wenn du es selbst hosten willst (stabiler), schau dir die Deployment-Anleitung im Original-Repo an.

Nehmen wir Docker-Pulls als Beispiel:
Wenn du den Service langfristig nutzt, empfiehlt sich die Konfiguration des Docker-Daemons.
Editiere dazu `/etc/docker/daemon.json` wie folgt:

```json
{
  "registry-mirrors": ["https://get.rownix.dev/cr/docker"]
}
```

Nach dem Speichern Docker neu starten:

```bash
sudo systemctl restart docker
```

Pruefen, ob es wirkt:

```bash
docker info | grep "Registry Mirrors" -A 1
```

Ab dann laeuft jeder Docker-Pull ueber diesen Proxy.

Wenn du es nur temporaer brauchst, geht es auch ohne Daemon-Konfig.
**Offizielle Images ziehen** (z.B. nginx, redis usw.):

```bash
sudo docker pull get.rownix.dev/cr/docker/library/nginx:latest
```

**User-Repo-Images ziehen** (z.B. bitnami, linuxserver usw.):

```bash
sudo docker pull get.rownix.dev/cr/docker/bitnami/nginx:latest
```

`Xget` kann noch mehr, zum Beispiel:

- GitHub (Releases, Raw-Dateien)
- Package-Manager wie NPM / PyPI / Maven
- Hugging Face (Modelle und Datasets)
- Google Fonts / CDN-Ressourcen
- Repos vieler Linux-Distributionen (Ubuntu, Fedora, Arch, OpenSUSE) usw.

Mehr Details: <https://github.com/xixu-me/xget/blob/main/README.md>

Der Support-Umfang von Xget ist begrenzt, deshalb haben wir mit 365 VPN eine zeitlich begrenzte Aktion.
Wir ziehen 10 Gewinner aus den Kommentaren, die Monatsmitgliedschaften im Wert von je US$4 bekommen.
365 VPN nutzt dedizierte Leitungen mit bis zu 10Gbps Bandbreite. Nutz 365 VPN, um deine Verbindung zu beschleunigen.

👉 Registrierungslink: <https://ref.365tz87989.com/?r=TBNM5I>
