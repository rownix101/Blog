---
title: 'Node ha muerto, viva Bun'
description: 'Por que decidi migrar mi blog de Node.js a Bun, y la mejora de rendimiento que me trajo'
date: '2026-01-17'
tags: ['bun', 'node', 'javascript', 'rendimiento']
authors: ['rownix']
draft: false
---

Hace poco migre la cadena de herramientas de build de este blog de Node.js a Bun.

## Por que migrar?

Bun es un runtime de JavaScript todo-en-uno: arranca rapido y trae integrado gestor de paquetes, runner de tests y bundler. Eso significa que ya no necesito mantener una configuracion complicada, ni esperar eternidades a `npm install`.

## Proceso de migracion

Fue muy simple:

1. Borrar `node_modules` y `package-lock.json`
2. Ejecutar `bun install`
3. Ajustar los scripts de arranque

## Resultado

La velocidad de build mejoro de forma notable, y el servidor de desarrollo arranca practicamente al instante.

Si aun estas sufriendo con la lentitud de Node.js, prueba Bun.
