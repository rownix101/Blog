# Vercel Postgres 评论系统设置指南

## 📋 概述

这是一个基于 Vercel Postgres 的自定义评论系统，替代原有的 Disqus 评论。具有以下特点：

- ✅ **完全控制**：数据和功能完全自主
- ✅ **高性能**：基于 Vercel Edge Functions
- ✅ **安全性**：JWT 认证 + XSS 防护
- ✅ **用户友好**：支持匿名评论和用户注册
- ✅ **嵌套回复**：支持评论回复功能
- ✅ **Markdown 支持**：支持基础 Markdown 语法

## 🚀 部署步骤

### 1. 设置 Vercel Postgres

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入你的项目
3. 点击 **Storage** → **Create Database**
4. 选择 **Postgres** 并选择提供商（推荐 Neon 或 Supabase）
5. 创建数据库

### 2. 初始化数据库

1. 在 Vercel Postgres 控制台中，打开 **Query** 标签
2. 复制 `database/schema.sql` 中的内容
3. 粘贴到查询编辑器并执行

### 3. 设置 Vercel KV（点赞功能）

1. 在 Vercel Dashboard 中，进入你的项目
2. 点击 **Storage** → **Create Database**
3. 选择 **KV** 并创建（推荐使用 Upstash Redis）
4. KV 环境变量会自动添加到项目中

### 4. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

```bash
# Vercel Postgres（会自动添加）
POSTGRES_URL=your-postgres-url
POSTGRES_PRISMA_URL=your-postgres-prisma-url
POSTGRES_URL_NON_POOLING=your-postgres-non-pooling-url
POSTGRES_USER=your-postgres-user
POSTGRES_HOST=your-postgres-host
POSTGRES_PASSWORD=your-postgres-password
POSTGRES_DATABASE=your-postgres-database

# Vercel KV（会自动添加）
KV_URL=your-kv-url
KV_REST_API_TOKEN=your-kv-rest-api-token
KV_REST_API_URL=your-kv-rest-api-url

# 评论系统配置
COMMENT_JWT_SECRET=your-secure-jwt-secret
COMMENT_MODERATION_ENABLED=false  # 可选：启用评论审核
COMMENT_MAX_LENGTH=2000           # 可选：评论最大长度
```

**生成 JWT Secret：**
```bash
openssl rand -base64 32
```

### 4. 本地开发环境

创建 `.env` 文件：
```bash
# 从 Vercel 复制 Postgres 环境变量
POSTGRES_URL=your-local-postgres-url
COMMENT_JWT_SECRET=your-local-jwt-secret
```

### 5. 测试部署

```bash
# 构建项目
npm run build

# 预览构建结果
npm run preview
```

## 🔧 功能特性

### 核心功能
- **用户认证**：基于 JWT 的会话管理
- **评论发布**：支持匿名和注册用户
- **嵌套回复**：多级评论回复
- **点赞功能**：基于 Vercel KV 的实时点赞
- **内容安全**：自动 XSS 过滤和 HTML 清理
- **Markdown 支持**：基础 Markdown 语法渲染

### 安全特性
- **输入验证**：严格的邮箱和内容验证
- **XSS 防护**：自动过滤危险 HTML 标签
- **JWT 认证**：安全的用户会话管理
- **IP 记录**：用于反垃圾和滥用检测
- **点赞防刷**：基于用户指纹的点赞限制

### 性能优化
- **懒加载**：评论按需加载
- **缓存策略**：API 响应缓存
- **数据库索引**：查询性能优化
- **Edge Functions**：全球 CDN 加速
- **KV 存储**：毫秒级点赞响应

## 📊 数据库结构

### 主要表结构

```sql
users           -- 用户信息
├── id          -- 主键
├── email       -- 邮箱（唯一）
├── name        -- 姓名
├── avatar_url  -- 头像 URL
└── website     -- 个人网站

comments        -- 评论内容
├── id          -- 主键
├── post_id     -- 文章 ID
├── user_id     -- 用户 ID
├── parent_id   -- 父评论 ID（支持嵌套）
├── content     -- 原始内容
├── html_content-- 渲染后的 HTML
└── status      -- 状态（published/pending/deleted）

sessions        -- 用户会话
├── id          -- 主键
├── user_id     -- 用户 ID
├── token       -- JWT token
└── expires_at  -- 过期时间
```

## 🛠️ API 接口

### 评论相关

- `GET /api/comments?post_id={id}` - 获取评论列表
- `POST /api/comments` - 创建新评论
- `PUT /api/comments/{id}` - 更新评论
- `DELETE /api/comments/{id}` - 删除评论

### 点赞功能

- `POST /api/likes/{commentId}` - 点赞/取消点赞
- `GET /api/likes/{commentId}` - 获取点赞状态

### 用户认证

- `POST /api/auth/login` - 用户登录/注册

## 🎨 自定义样式

评论系统使用 Tailwind CSS，你可以通过修改以下类来自定义样式：

```css
/* 主要容器 */
#comments-section

/* 评论表单 */
#comment-form-container
#login-form
#comment-form

/* 评论列表 */
#comments-list
.comment

/* 点赞按钮 */
.like-button
.like-button-container
.like-icon

/* 按钮和交互元素 */
.bg-primary
.text-primary-foreground
```

## 🔍 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查环境变量是否正确
   - 确认 Vercel Postgres 已正确配置

2. **评论无法提交**
   - 检查 JWT_SECRET 是否设置
   - 查看浏览器控制台错误信息

3. **点赞功能不工作**
   - 检查 KV 环境变量是否正确
   - 确认 KV 数据库已创建

4. **样式异常**
   - 确认 Tailwind CSS 正常工作
   - 检查 CSS 类名是否正确

### 调试模式

在浏览器控制台中启用调试：
```javascript
localStorage.setItem('comment_debug', 'true')
```

## 📈 性能监控

建议设置以下监控：

1. **Vercel Analytics** - 监控 API 性能
2. **Postgres 查询监控** - 监控数据库性能
3. **错误追踪** - 记录和分析错误

## 🔄 从 Disqus 迁移

如果你需要从 Disqus 迁移现有评论：

1. 从 Disqus 导出评论数据
2. 编写迁移脚本转换数据格式
3. 导入到 Vercel Postgres
4. 更新评论 ID 映射关系

## 🤝 贡献和扩展

### 可以添加的功能

- [ ] 评论点赞功能
- [ ] 评论搜索
- [ ] 管理后台
- [ ] 反垃圾过滤
- [ ] 邮件通知
- [ ] 评论导出

### 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

---

## 📞 支持

如果遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查 Vercel 部署日志
3. 提交 GitHub Issue

---

**注意**：这个评论系统是专门为你的 Astro 博客定制的，与其他 CMS 的兼容性需要额外适配。