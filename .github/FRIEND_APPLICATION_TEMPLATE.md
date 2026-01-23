# 友链申请模板

## 基本信息

- **网站名称**: [你的网站名称]
- **网站地址**: [https://example.com]
- **网站描述**: [网站简介，10-200字符]
- **头像链接**: [https://example.com/avatar.png] (可选)
- **分类**: [技术/生活/学习/设计/其他] (可选)
- **联系邮箱**: [your@email.com]
- **GitHub 用户名**: [username] (可选)

## 申请步骤

### 1. 准备信息

确保你的网站：

- ✅ 可以正常访问
- ✅ 已添加本站友链
- ✅ 内容健康向上

### 2. 添加到 friends.yaml

在你的 Fork 中，编辑 `src/data/friends/friends.yaml` 文件，添加以下内容：

```yaml
- id: [自动生成的唯一ID]
  name: [你的网站名称]
  url: [你的网站地址]
  description: [网站描述]
  avatar: [头像链接，可选]
  category: [分类]
  contact: [联系邮箱]
  submittedAt: [提交时间，ISO格式]
  status: pending
  applicantGithub: [GitHub用户名，可选]
```

### 3. 提交 Pull Request

- 提交信息：`Add friend link: [你的网站名称]`
- PR 标题：`Add friend link: [你的网站名称]`
- 等待审核

## 字段说明

- **id**: 唯一标识符（系统自动生成）
- **name**: 网站名称（2-50字符）
- **url**: 网站地址（必须可访问）
- **description**: 网站描述（10-200字符）
- **avatar**: 网站Logo/头像链接（可选）
- **category**: 网站分类（可选）
- **contact**: 联系邮箱
- **submittedAt**: 提交时间（自动填充）
- **status**: 申请状态（保持为 "pending"）
- **applicantGithub**: GitHub用户名（可选）

## 友链交换

请在你的网站添加本站链接：

```html
<a href="https://www.rownix.dev" target="_blank" rel="noopener"
  >Rownix's Blog</a
>
```

## 审核流程

1. **自动检查**：
   - 网站可访问性
   - 是否已添加回链
   - 数据格式验证

2. **人工审核**：
   - 内容质量
   - 设计美观度
   - 分类准确性

3. **审核通过**后，你的网站将被添加到友链列表

大多数申请会在 24 小时内处理完毕。

## 有问题？

如有疑问，可以：

- 创建 [Issue](https://github.com/rownix101/Blog/issues/new?assignees=&labels=friend-application&template=friend-application.yml)
- 发送邮件联系

---

感谢申请友链！🎉
