---
title: 'De verdad merece la pena todo el lio de serverless?'
description: 'Mi primer articulo del ano, preguntando si serverless es mas rapido y mas barato que un servidor tradicional'
date: '2026-01-01'
tags: ['serverless', 'cloudflare', 'vercel', 'computacion-en-la-nube']
authors: ['rownix']
draft: false
---

Primero, rompamos un mito comun: irte a serverless no significa automaticamente ir mas rapido. Mucha gente cree que con desplegar en Vercel o Cloudflare ya obtiene velocidad "de misil". En realidad, serverless sigue siendo basicamente **contenedor + CDN**. A nivel de arquitectura, no hay una diferencia esencial frente a comprar un VPS, desplegar contenedores y ponerle una CDN. Lo que realmente pesa es la ruta de red entre cliente y servidor, una buena arquitectura y una calidad de codigo decente. Si estas ahogado en deuda tecnica de nivel enterprise, ninguna magia serverless te va a rescatar.

Ademas, como serverless corre sobre virtualizacion de contenedores, su rendimiento normalmente no iguala al de una maquina fisica o un servidor dedicado. Sumale el doloroso **cold start**, especialmente con carga alta, y puede que responda mas lento que un servidor baratisimo (2C2G) con CDN que te cuesta cuatro duros.

## Entonces, por que usar Serverless?

Si el rendimiento no es su fuerte, por que tanta vuelta con serverless? Porque resuelve otros problemas mas importantes.

### Alta disponibilidad

Serverless suele ofrecer **mejor disponibilidad** que un servidor unico. La mayoria no puede comprar decenas de servidores para redundancia como las grandes empresas. Pero las plataformas serverless son distribuidas por naturaleza: tu aplicacion se despliega en varios nodos, y si uno cae, el servicio sigue.

### Casi cero operacion

Probablemente es la mayor ventaja. Ya no tienes que:

- Levantarte a las 3 AM por un servidor caido
- Perseguir parches y actualizaciones de seguridad
- Estresarte por falta de disco o memoria
- Pelearte con balanceadores y autoescalado

La plataforma se encarga; tu te concentras en el codigo.

### Escala elastica: aguanta picos

Gracias a su elasticidad, si de repente te entra un pico de trafico (por ejemplo, una oleada tipo Black Friday), no tienes que temer que el sitio se caiga. Con un servidor tradicional, o se cae, o compras capacidad cara que se queda ociosa casi todo el tiempo.

### Pago por uso

Serverless suele ser pago por uso: solo pagas lo que consumes. Para proyectos personales o startups con trafico irregular, suele ser mas economico que pagar una cuota fija mensual. Un blog con unos miles de visitas al mes puede salir gratis en Cloudflare o Vercel, mientras que un servidor tradicional te cobra igual, este o no haga nada.

## Entonces, merece la pena?

Si: muchisimo. Serverless no es una bala de plata, tiene limites claros, pero sus ventajas son reales. La clave es decidir segun tu situacion, no por moda.
