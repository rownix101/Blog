---
title: 'Node 已死，Bun 当立'
description: '为什么我决定将我的博客从 Node.js 迁移到 Bun，以及这带来的性能提升'
date: '2026-01-17'
tags: ['bun', 'node', 'javascript', 'performance']
authors: ['rownix']
draft: false
---

最近，我将这个博客的构建工具链从 Node.js 迁移到了 Bun。

## 为什么要迁移？

Bun 作为一个一体化的 JavaScript 运行时，不仅启动速度快，而且内置了包管理器、测试运行器和打包工具。这意味着我不再需要维护复杂的配置文件，也不再需要等待漫长的 `npm install`。

## 迁移过程

迁移过程非常简单：

1. 删除 `node_modules` 和 `package-lock.json`
2. 运行 `bun install`
3. 修改启动脚本

## 结果

构建速度提升了显著，开发服务器的启动几乎是瞬间完成的。

如果你还在忍受 Node.js 的缓慢，不妨试试 Bun。
