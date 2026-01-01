# 语言 Cookie 行为详解

本文档详细说明 `language` Cookie 在什么情况下会被设置或更新。

## Cookie 配置

```javascript
document.cookie = `language=${langCode}; path=/; max-age=31536000; sameSite=Lax`
```

- **名称**: `language`
- **路径**: `/` (全站有效)
- **有效期**: 31536000 秒 (1年)
- **SameSite**: `Lax` (防止 CSRF 攻击)
- **HttpOnly**: `false` (客户端可访问)

## Cookie 更新的时机

### 1. 🎯 **用户手动切换语言** (最常见)

**触发位置**: `src/components/LanguageSwitcher.astro`

```javascript
function handleLanguageChange(langCode) {
  // 立即更新 Cookie
  document.cookie = `language=${langCode}; path=/; max-age=31536000; sameSite=Lax`
  console.log(`语言已切换到: ${languages[langCode] || langCode}`)
}
```

**用户操作**: 点击语言选择器中的语言选项

**效果**:
- Cookie 立即更新为新选择的语言
- 页面跳转到对应语言版本
- 新 Cookie 在后续访问中生效

### 2. 🏠 **首次访问根路径**

**触发位置**: `src/middleware.ts`

```typescript
if (url.pathname === '/' || url.pathname === '') {
  const targetLang = getBrowserLanguage(request)
  // 设置 Cookie 并重定向
  return new Response(null, {
    status: 302,
    headers: {
      'Location': redirectUrl.toString(),
      'Set-Cookie': createLanguageCookie(targetLang)
    }
  })
}
```

**触发条件**:
- 用户访问网站根路径 `/`
- 没有 `language` Cookie 或 Cookie 已过期

**效果**:
- 根据浏览器语言设置 Cookie
- 自动重定向到对应语言版本

### 3. 🔄 **页面加载时的 Cookie 同步**

**触发位置**: `src/components/LanguageSwitcher.astro`

```javascript
document.addEventListener('DOMContentLoaded', () => {
  const pathSegments = window.location.pathname.split('/').filter(Boolean)
  const currentLangFromPath = pathSegments[0]

  // 如果路径语言与 Cookie 不同，更新 Cookie
  if (currentLangFromPath in languages) {
    const cookieLang = getCookieLanguage()
    if (cookieLang !== currentLangFromPath) {
      document.cookie = `language=${currentLangFromPath}; path=/; max-age=31536000; sameSite=Lax`
    }
  }
})
```

**触发条件**:
- 页面加载完成
- URL 路径中的语言与 Cookie 中的语言不一致

**效果**:
- Cookie 同步为当前页面语言
- 确保后续访问的一致性

## 实际场景示例

### 场景 1: 新用户首次访问
```
1. 用户访问 https://example.com/
2. 浏览器发送 Accept-Language: en-US,en;q=0.9
3. 中间件检测到英文偏好
4. 设置 Cookie: language=en
5. 重定向到 https://example.com/en/
```

### 场景 2: 用户手动切换语言
```
1. 用户在 /zh-cn/ 页面点击语言选择器
2. 选择 "English"
3. handleLanguageChange('en') 被调用
4. Cookie 更新为: language=en
5. 页面跳转到 /en/
```

### 场景 3: 直接访问不同语言页面
```
1. 用户有 Cookie: language=zh-cn
2. 直接访问 https://example.com/en/
3. 页面加载时检测到路径语言 (en) ≠ Cookie 语言 (zh-cn)
4. Cookie 更新为: language=en
5. 下次访问根路径时会重定向到英文版
```

### 场景 4: Cookie 过期后访问
```
1. 用户的 language Cookie 已过期
2. 访问 https://example.com/
3. 中间件检测到无 Cookie
4. 重新检测浏览器语言
5. 设置新的 Cookie 并重定向
```

## Cookie 优先级验证

```bash
# 测试 Cookie 优先于浏览器语言
curl -I "http://localhost:1235/" \
  -H "Accept-Language: zh-CN,zh;q=0.9" \
  -H "Cookie: language=en"

# 响应: 302 → /en/ (Cookie 优先)
```

## 开发调试

### 查看 Cookie
在浏览器控制台中运行：
```javascript
// 查看所有 Cookie
console.log(document.cookie)

// 查看语言 Cookie
console.log(getCookieLanguage())
```

### 清除 Cookie
```javascript
// 清除语言 Cookie
document.cookie = 'language=; path=/; max-age=0'
```

### 手动设置 Cookie
```javascript
// 设置为中文
document.cookie = 'language=zh-cn; path=/; max-age=31536000; sameSite=Lax'

// 设置为英文
document.cookie = 'language=en; path=/; max-age=31536000; sameSite=Lax'
```

## 注意事项

1. **HttpOnly 限制**: Cookie 未设置为 HttpOnly，因此客户端 JavaScript 可以访问和修改
2. **SameSite=Lax**: 提供 CSRF 保护，同时允许跨站导航时携带 Cookie
3. **1年有效期**: 减少频繁重新检测的需要，但用户清除浏览器数据后会重置
4. **路径同步**: Cookie 只在用户明确切换语言或访问不同语言页面时更新，避免不必要的写入

## 故障排除

如果语言切换不生效，检查：
1. 浏览器是否阻止了 Cookie
2. Cookie 的有效期是否已过
3. JavaScript 是否被禁用（影响客户端切换）
4. 中间件是否正确配置（影响服务器端重定向）