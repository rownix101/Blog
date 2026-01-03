interface Env {
  // Define environment variables if needed
}

interface FriendApplication {
  id: string
  name: string
  url: string
  description: string
  avatar?: string
  category?: string
  contact: string
  applicantGithub?: string
  submittedAt: string
  status: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as { application: FriendApplication; lang?: string }
    const application = body.application
    const lang = body.lang || 'zh-cn'

    // Validate required fields
    if (!application || !application.name || !application.url || !application.description || !application.contact) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Convert application to friend format
    const newFriend = {
      id: application.id,
      name: application.name,
      url: application.url,
      description: application.description,
      avatar: application.avatar || '',
      category: application.category || '',
      contact: application.contact,
      addedAt: new Date().toISOString(),
      status: 'active',
      rel: 'friend'
    }

    // Generate YAML content manually (simple implementation without js-yaml)
    const newFriendYaml = generateYaml(newFriend)

    // Generate GitHub URLs and instructions
    const githubRepo = 'rownix101/Blog'
    const forkUrl = `https://github.com/${githubRepo}/fork`
    const editUrl = `https://github.com/${githubRepo}/edit/main/src/data/friends/friends.yaml`
    const prUrl = `https://github.com/${githubRepo}/compare/main...quick-pr?template=friend-application.md&title=Add+friend+link:+${encodeURIComponent(application.name)}`

    const guideUrl = `/${lang}/friends/guide`

    return new Response(
      JSON.stringify({
        success: true,
        redirect: guideUrl,
        applicationData: application,
        preparedContent: newFriendYaml,
        instructions: {
          forkUrl,
          editUrl,
          prUrl,
          fileName: 'friends.yaml',
          filePath: 'src/data/friends/friends.yaml',
          commitMessage: `Add friend link: ${application.name}`,
          prTitle: `Add friend link: ${application.name}`,
          prBody: generatePersonalizedPRBody(application, lang),
          note: 'This is a YAML entry for the new friend. Please add it to the friends.yaml file manually.'
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Redirect-To': guideUrl
        }
      }
    )
  } catch (error) {
    console.error('Error submitting friend application:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

function generateYaml(friend: Record<string, unknown>): string {
  const lines: string[] = ['- id: ' + friend.id]
  lines.push('  name: ' + friend.name)
  lines.push('  url: ' + friend.url)
  lines.push('  description: ' + friend.description)
  if (friend.avatar) lines.push('  avatar: ' + friend.avatar)
  if (friend.category) lines.push('  category: ' + friend.category)
  lines.push('  contact: ' + friend.contact)
  lines.push('  addedAt: ' + friend.addedAt)
  lines.push('  status: ' + friend.status)
  lines.push('  rel: ' + friend.rel)
  return lines.join('\n')
}

function generatePersonalizedPRBody(app: FriendApplication, lang: string): string {
  const isZh = lang === 'zh-cn'

  if (isZh) {
    return `## 🔗 友链申请：${app.name}

### 📋 基本信息

| 项目 | 内容 |
|------|------|
| **网站名称** | ${app.name} |
| **网站地址** | [${app.url}](${app.url}) |
| **网站描述** | ${app.description} |
| **分类** | ${app.category || '未指定'} |
| **联系邮箱** | ${app.contact} |
| **GitHub** | ${app.applicantGithub ? `[@${app.applicantGithub}](https://github.com/${app.applicantGithub})` : '未提供'} |
| **提交时间** | ${new Date(app.submittedAt).toLocaleDateString('zh-CN')} |

${app.avatar ? `
### 🖼️ 网站头像

![${app.name} 头像](${app.avatar})

` : ''}

### ✅ 申请清单

- [x] 我已阅读并同意友链申请规则
- [x] 我的网站可以正常访问
- [x] 我已在网站中添加了本站的友链
- [x] 网站内容健康向上，符合法律法规

### 🔗 友链验证

请在审核时验证以下信息：
- 网站可访问性：${app.url}
- 回链检查：确认已添加本站链接
- 内容质量：人工审核
- 分类准确性：${app.category || '待定'}

### 📝 审核备注

<!-- 审核员请在此添加审核意见 -->

---

${app.applicantGithub ? `**申请人**: [@${app.applicantGithub}](https://github.com/${app.applicantGithub})` : '**申请人**: 游客用户'}

📅 **申请时间**: ${new Date(app.submittedAt).toLocaleString('zh-CN')}

🤖 *此 PR 由友链申请系统自动生成*`
  } else {
    return `## 🔗 Friend Link Application: ${app.name}

### 📋 Basic Information

| Item | Content |
|------|--------|
| **Website Name** | ${app.name} |
| **Website URL** | [${app.url}](${app.url}) |
| **Description** | ${app.description} |
| **Category** | ${app.category || 'Not specified'} |
| **Contact Email** | ${app.contact} |
| **GitHub** | ${app.applicantGithub ? `[@${app.applicantGithub}](https://github.com/${app.applicantGithub})` : 'Not provided'} |
| **Submitted** | ${new Date(app.submittedAt).toLocaleDateString()} |

${app.avatar ? `
### 🖼️ Website Avatar

![${app.name} Avatar](${app.avatar})

` : ''}

### ✅ Application Checklist

- [x] I have read and agree to the friend link rules
- [x] My website is accessible
- [x] I have added this blog's link to my website
- [x] Website content is appropriate and legal

### 🔗 Link Verification

Please verify the following during review:
- Website accessibility: ${app.url}
- Reciprocal link: Confirm this blog's link is added
- Content quality: Manual review
- Category accuracy: ${app.category || 'To be determined'}

### 📝 Review Notes

<!-- Reviewers please add your comments here -->

---

${app.applicantGithub ? `**Applicant**: [@${app.applicantGithub}](https://github.com/${app.applicantGithub})` : '**Applicant**: Guest User'}

📅 **Application Time**: ${new Date(app.submittedAt).toLocaleString()}

🤖 *This PR was automatically generated by the friend link application system*`
  }
}
