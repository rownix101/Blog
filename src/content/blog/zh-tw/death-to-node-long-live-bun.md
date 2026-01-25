---
title: 'Node 已死，Bun 當立'
description: '為什麼我決定把部落格從 Node.js 遷移到 Bun，以及帶來的效能提升'
date: '2026-01-17'
tags: ['bun', 'node', 'javascript', 'performance']
authors: ['rownix']
draft: false
---

最近，我把這個部落格的建置工具鏈從 Node.js 遷移到了 Bun。

## 為什麼要遷移？

Bun 作為一個一體化的 JavaScript 執行環境，不僅啟動速度快，而且內建了套件管理器、測試執行器和打包工具。這代表我不再需要維護一堆複雜的設定，也不必再等漫長的 `npm install`。

## 遷移過程

過程非常簡單：

1. 刪除 `node_modules` 和 `package-lock.json`
2. 執行 `bun install`
3. 修改啟動腳本

## 結果

建置速度提升很明顯，開發伺服器幾乎是瞬間啟動。

如果你也受夠了 Node.js 的緩慢，不妨試試 Bun。
