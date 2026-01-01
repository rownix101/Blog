# 浏览器语言检测与自动重定向

本项目实现了智能的浏览器语言检测和自动重定向功能，Cookie 权重高于浏览器语言设置。

## 功能特性

1. **浏览器语言检测**: 自动检测用户的浏览器语言设置
2. **Cookie 优先**: Cookie 中的语言偏好具有最高优先级
3. **智能匹配**: 支持直接匹配和前缀匹配（如 `en-US` 匹配 `en`）
4. **自动重定向**: 根路径 `/` 自动重定向到检测到的语言版本
5. **持久化存储**: 语言偏好通过 Cookie 保存一年

## 实现文件

### 1. 语言检测工具 (`src/lib/language-detector.ts`)

- `getBrowserLanguage(request: Request)`: 获取浏览器语言，优先检查 Cookie
- `createLanguageCookie(locale: string)`: 创建语言 Cookie
- `shouldRedirect(request: Request)`: 检查是否需要重定向（已废弃，现在使用 middleware）

### 2. 中间件 (`src/middleware.ts`)

处理根路径 `/` 的重定向逻辑：
- 检测浏览器语言或读取 Cookie
- 重定向到对应的语言版本
- 设置语言 Cookie
- 简化实现，避免响应克隆问题

### 3. 根路径页面 (`src/pages/index.astro`)

服务器端渲染的根路径页面，用于处理重定向：
- `export const prerender = false`: 禁用预渲染以支持动态重定向
- 使用 `Astro.redirect()` 进行重定向

### 4. 语言选择器组件 (`src/components/LanguagePicker.astro`)

增强的语言切换组件：
- 点击切换语言时设置 Cookie
- 客户端语言检测脚本（仅在首次访问时）

## 语言匹配逻辑

### 优先级顺序

1. **Cookie 中的语言设置** (`language=zh-cn`)
2. **Accept-Language 头中的直接匹配** (`Accept-Language: zh-cn`)
3. **Accept-Language 头中的前缀匹配** (`Accept-Language: zh-TW` → `zh-cn`)
4. **默认语言** (`zh-cn`)

### 匹配规则

- 直接匹配: `en` → `en`, `zh-cn` → `zh-cn`
- 前缀匹配: `en-US` → `en`, `zh-TW` → `zh-cn`
- 特殊处理: 所有中文语言代码 (`zh-*`) 都映射到 `zh-cn`

## 测试结果

### 浏览器语言检测

```bash
# 英语浏览器
curl -I "http://localhost:1235/" -H "Accept-Language: en-US,en;q=0.9"
# → 重定向到 /en/

# 中文浏览器
curl -I "http://localhost:1235/" -H "Accept-Language: zh-CN,zh;q=0.9"
# → 重定向到 /zh-cn/

# 不支持的语言（有英文备选）
curl -I "http://localhost:1235/" -H "Accept-Language: fr-FR,fr;q=0.9,en;q=0.8"
# → 重定向到 /en/

# 不支持的语言（无英文备选）
curl -I "http://localhost:1235/" -H "Accept-Language: fr-FR,fr;q=0.9"
# → 重定向到 /zh-cn/（默认语言）
```

### Cookie 优先级测试

```bash
# Cookie 优先于浏览器语言
curl -I "http://localhost:1235/" \
  -H "Accept-Language: zh-CN,zh;q=0.9" \
  -H "Cookie: language=en"
# → 重定向到 /en/（Cookie 优先）
```

## Cookie 设置

- **名称**: `language`
- **路径**: `/`
- **有效期**: 31536000 秒（1年）
- **SameSite**: `Lax`
- **HttpOnly**: `true`

## 使用说明

1. **首次访问**: 用户访问根路径 `/` 时，系统自动检测浏览器语言并重定向
2. **手动切换**: 用户可以通过语言选择器手动切换语言
3. **持久化**: 用户的语言选择会保存在 Cookie 中，下次访问时自动应用

## 部署注意事项

- 需要服务器端渲染支持（已设置 `export const prerender = false`）
- 生产环境需要安装适配器（如 `@astrojs/vercel` 或 `@astrojs/node`）
- Cloudflare Pages Functions 支持中间件和 SSR

## 扩展功能

可以轻松扩展支持更多语言：

1. 在 `src/i18n/ui.ts` 中添加新语言配置
2. 在 `src/content/blog/` 中创建对应语言的内容目录
3. 更新 `astro.config.ts` 中的 `locales` 配置

语言检测逻辑会自动支持新添加的语言。