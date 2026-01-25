---
title: 'Acelera tus descargas con xget'
description: 'Descargas lentas de modulos, problemas bajando imagenes Docker? xget lo arregla'
date: '2026-01-02'
tags: ['proxy', 'xget', 'ubuntu', 'linux', 'docker']
authors: ['rownix']
draft: false
---

Xget es un motor de aceleracion de descargas basado en Cloudflare Workers. Analiza peticiones, identifica con precision la plataforma objetivo (GitHub, Docker Hub, Hugging Face, etc.) y convierte automaticamente las URLs al upstream correcto. Aprovechando la red global de Cloudflare (300+ nodos edge) y su cache, puede aumentar bastante tu velocidad de descarga.

Y lo mas importante: tambien soporta Tencent EdgeOne Pages, y he desplegado una instancia publica para todos:

- **URL del servicio**: `get.rownix.dev`
- **Repositorio original**: <https://github.com/xixu-me/xget>

Si quieres autoalojarlo para una experiencia mas estable, revisa la guia de despliegue del repositorio original.

Empecemos con pulls de Docker como ejemplo:
Si planeas usar el servicio a largo plazo, es recomendable configurar el daemon de Docker.
Primero, edita el archivo `/etc/docker/daemon.json` a:

```json
{
  "registry-mirrors": ["https://get.rownix.dev/cr/docker"]
}
```

Despues de guardar, ejecuta este comando para reiniciar Docker y aplicar cambios:

```bash
sudo systemctl restart docker
```

Verifica si la configuracion funciono:

```bash
docker info | grep "Registry Mirrors" -A 1
```

Asi, a partir de ahora cada `docker pull` pasara por este proxy.

Pero si solo quieres usarlo puntualmente, no tiene por que ser tan pesado.
**Si quieres tirar de imagenes del repositorio oficial** (como nginx, redis, etc.):

```bash
sudo docker pull get.rownix.dev/cr/docker/library/nginx:latest
```

**Para imagenes de repositorios de usuarios** (como bitnami, linuxserver, etc.):

```bash
sudo docker pull get.rownix.dev/cr/docker/bitnami/nginx:latest
```

La gracia de `Xget` va mucho mas alla: tambien soporta:

- GitHub (Releases, archivos Raw)
- Gestores de paquetes como NPM / PyPI / Maven
- Hugging Face (modelos y datasets)
- Google Fonts / recursos CDN
- Repositorios de software de distribuciones Linux (Ubuntu, Fedora, Arch, OpenSUSE), etc.

Mas detalles aqui: <https://github.com/xixu-me/xget/blob/main/README.md>

Eso si, el alcance de soporte de Xget es limitado, asi que nos hemos asociado con 365 VPN para una promo por tiempo limitado.
Elegiremos 10 ganadores en los comentarios para recibir membresias mensuales valoradas en US$4 cada una.
365 VPN usa conexiones dedicadas con hasta 10Gbps de ancho de banda. Date prisa y usa 365 VPN para acelerar tu conexion.

👉 Enlace de registro: <https://ref.365tz87989.com/?r=TBNM5I>
