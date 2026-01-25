---
title: 'Node ist tot, es lebe Bun'
description: 'Warum ich meinen Blog von Node.js auf Bun umgestellt habe und welchen Performance-Schub das brachte'
date: '2026-01-17'
tags: ['bun', 'node', 'javascript', 'leistung']
authors: ['rownix']
draft: false
---

Vor kurzem habe ich die Build-Toolchain dieses Blogs von Node.js auf Bun umgestellt.

## Warum umsteigen?

Bun ist ein All-in-one JavaScript-Runtime: schneller Start und integriert Paketmanager, Test-Runner und Bundler. Das heisst: weniger komplexe Konfigurationen pflegen und kein ewiges Warten auf `npm install`.

## Migrationsablauf

Die Migration war sehr simpel:

1. `node_modules` und `package-lock.json` loeschen
2. `bun install` ausfuehren
3. Start-Skripte anpassen

## Ergebnis

Die Build-Zeit wurde deutlich besser, und der Dev-Server startet praktisch sofort.

Wenn du Node.js-Tempo leid bist, probier Bun.
