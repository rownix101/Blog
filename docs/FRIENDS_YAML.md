# 友链 YAML 数据管理

本项目的友链系统支持通过 YAML 文件动态管理数据，并在构建时预编译为 TypeScript 数据，确保与 Cloudflare Pages 等静态托管平台兼容。

## 文件结构

```
src/data/friends/
├── friends.yaml   # 已批准的友链（主要数据文件）
└── rejected.yaml  # 已拒绝的友链申请（可选）
```

## 数据格式

### friends.yaml

```yaml
- id: unique-friend-id
  name: 朋友网站名称
  url: https://example.com/
  description: 网站描述
  avatar: https://example.com/avatar.jpg
  category: 技术博客
  contact: email@example.com
  addedAt: 2026-01-03T09:52:00.218Z
  status: active  # active, inactive
  rel: friend     # friend, sponsor, partner
```

### rejected.yaml

```yaml
- id: unique-application-id
  name: 申请网站名称
  url: https://example.com/
  description: 网站描述
  contact: email@example.com
  rejectedAt: 2026-01-03T09:52:00.218Z
  reason: 拒绝原因（可选）
```

## 构建流程

1. **预编译阶段**：`npm run build-friends-data` 脚本会读取所有 YAML 文件
2. **数据合并**：将 YAML 数据转换为 TypeScript 对象
3. **生成文件**：创建 `src/lib/friends-data.ts` 包含编译后的数据
4. **构建阶段**：Astro 使用生成的 TypeScript 数据进行静态渲染

## 开发工作流

### 添加新友链

1. 编辑 `src/data/friends/friends.yaml`
2. 添加新的友链条目
3. 重新构建项目：`npm run build` 或 `npm run dev`

### 处理申请

友链申请现在通过 API 处理，审核后直接添加到相应的文件：
   - 批准：添加到 `friends.yaml`
   - 拒绝：添加到 `rejected.yaml`（可选）

### 自动重新生成

每次运行 `npm run build`、`npm run dev` 或 `npm start` 时，都会自动重新生成 `friends-data.ts` 文件。

## 手动重新生成数据

如需手动重新生成数据文件：

```bash
npm run build-friends-data
```

## 注意事项

- **不要手动编辑** `src/lib/friends-data.ts` 文件，它会在构建时被覆盖
- 确保 YAML 文件格式正确，语法错误会导致构建失败
- 所有友链数据在构建时静态化，运行时无法动态修改
- 如需运行时动态数据，请考虑使用 Cloudflare KV 或其他数据库解决方案

## 类型定义

数据结构由 `src/types/friend.ts` 中的 TypeScript 类型定义确保类型安全：

```typescript
export interface Friend {
  id: string
  name: string
  url: string
  description: string
  avatar?: string
  category?: string
  contact: string
  addedAt: string
  status: 'active' | 'inactive'
  rel: 'friend' | 'sponsor' | 'partner'
}

export interface FriendApplication extends Omit<Friend, 'addedAt' | 'status' | 'rel'> {
  submittedAt: string
  status: 'pending'
  applicantGithub?: string
}
```