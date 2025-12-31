# Cloudflare Pages 部署指南

## 📋 概述

本指南帮助你将 merox-erudite 博客主题从 Vercel 迁移到 Cloudflare Pages。

## 🚀 部署步骤

### 1. 创建 Cloudflare D1 数据库

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择你的账户
3. 点击 **Workers & Pages** → **D1** → **Create database**
4. 数据库名称：`blog-comments`
5. 点击 **Create**

### 2. 初始化数据库

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 初始化数据库
wrangler d1 execute blog-comments --file=./database/schema-d1.sql
```

### 3. 创建 Cloudflare KV 命名空间

1. 在 Cloudflare Dashboard 中，点击 **Workers & Pages** → **KV**
2. 点击 **Create namespace**
3. 命名空间名称：`COMMENT_KV`
4. 记录显示的 KV namespace ID

### 4. 更新 wrangler.toml

编辑 `wrangler.toml` 文件，替换占位符：

```toml
# 替换为实际的数据库 ID 和 KV namespace ID
[[d1_databases]]
binding = "DB"
database_name = "blog-comments"
database_id = "your-actual-d1-database-id"

[[kv_namespaces]]
binding = "COMMENT_KV"
id = "your-actual-kv-namespace-id"
preview_id = "your-actual-kv-preview-id"
```

### 5. 部署到 Cloudflare Pages

#### 方法一：通过 GitHub 连接（推荐）

1. 推送代码到 GitHub 仓库
2. 在 Cloudflare Dashboard 中：
   - 点击 **Workers & Pages** → **Create application**
   - 选择 **Pages** → **Connect to Git**
   - 选择你的 GitHub 仓库
3. 配置构建设置：
   - **构建命令**: `npm run build`
   - **构建输出目录**: `dist`
   - **Node.js 版本**: `20` 或更高
4. 点击 **Save and Deploy**

#### 方法二：通过 Wrangler 部署

```bash
# 构建项目
npm run build

# 部署到 Pages
wrangler pages deploy dist
```

### 6. 绑定资源

在 Cloudflare Pages 项目设置中：

1. 进入你的 Pages 项目
2. 点击 **Settings** → **Functions**
3. 在 **D1 database bindings** 中：
   - Variable name: `DB`
   - D1 database: `blog-comments`
4. 在 **KV namespace bindings** 中：
   - Variable name: `COMMENT_KV`
   - KV namespace: 选择你创建的 KV 命名空间

### 7. 设置环境变量

在 **Settings** → **Environment variables** 中添加：

```bash
# 必需的环境变量
COMMENT_JWT_SECRET=your-secure-jwt-secret-here

# 可选的环境变量
BREVO_API_KEY=your-brevo-api-key
BREVO_LIST_ID=your-brevo-list-id
PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
PUBLIC_UMAMI_WEBSITE_ID=your-umami-website-id
COMMENT_MODERATION_ENABLED=false
COMMENT_MAX_LENGTH=2000
```

## 🔧 本地开发

### 安装依赖

```bash
npm install
```

### 本地开发环境

```bash
# 启动开发服务器
npm run dev

# 本地 D1 数据库操作
wrangler d1 execute blog-comments --local --file=./database/schema-d1.sql
```

### 本地环境变量

创建 `.dev.vars` 文件（本地开发使用）：

```bash
COMMENT_JWT_SECRET=your-local-jwt-secret
```

## 📊 功能验证

部署后，验证以下功能：

1. **评论系统**
   - 创建评论
   - 回复评论
   - 用户登录

2. **点赞功能**
   - 点赞/取消点赞
   - 点赞计数

3. **其他功能**
   - 博客文章加载
   - 国际化切换
   - RSS 订阅

## 🛠️ 故障排除

### 常见问题

1. **数据库连接失败**
   ```bash
   # 检查 D1 数据库绑定
   wrangler d1 list
   ```

2. **KV 存储错误**
   ```bash
   # 检查 KV 命名空间
   wrangler kv:namespace list
   ```

3. **构建失败**
   ```bash
   # 清理并重新构建
   rm -rf node_modules dist
   npm install
   npm run build
   ```

4. **Functions 不工作**
   - 检查 `wrangler.toml` 配置
   - 确认资源绑定正确
   - 查看 Pages 部署日志

### 调试技巧

1. **查看实时日志**
   - 在 Cloudflare Dashboard 中查看 **Real-time logs**

2. **本地调试**
   ```bash
   # 本地运行 Functions
   wrangler pages dev dist
   ```

3. **数据库调试**
   ```bash
   # 查询 D1 数据库
   wrangler d1 execute blog-comments --command="SELECT * FROM comments"
   ```

## 📈 性能优化

1. **缓存策略**
   - 静态资源自动缓存
   - API 响应缓存已在代码中设置

2. **CDN 加速**
   - Cloudflare 全球 CDN
   - 自动压缩和优化

3. **数据库优化**
   - D1 自动扩展
   - 查询索引已优化

## 🔄 从 Vercel 迁移

如果你之前使用 Vercel，需要：

1. **域名迁移**
   - 更新 DNS 记录指向 Cloudflare
   - 配置 SSL 证书

2. **数据迁移**
   - 导出现有评论数据
   - 转换为 D1 兼容格式
   - 导入到新数据库

3. **环境变量**
   - 从 Vercel 复制环境变量
   - 在 Cloudflare Pages 中重新设置

## 🎉 完成

现在你的博客已经成功运行在 Cloudflare Pages 上！

- 🌍 全球 CDN 加速
- ⚡ 边缘计算支持
- 💾 D1 数据库
- 🗄️ KV 存储
- 🔒 免费 SSL 证书

享受更快的访问速度和更低的延迟吧！

---

## 📞 支持

如果遇到问题：

1. 查看本文档的故障排除部分
2. 检查 Cloudflare 部署日志
3. 提交 GitHub Issue