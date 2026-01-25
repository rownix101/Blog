import fs from 'node:fs'
import path from 'node:path'

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeOutput(name, value) {
  const outPath = process.env.GITHUB_OUTPUT
  if (!outPath) return

  const safe = value ?? ''
  fs.appendFileSync(outPath, `${name}<<EOF\n${safe}\nEOF\n`)
}

function isHttpUrl(value) {
  try {
    const url = new URL(ensureHttpScheme(value))
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function ensureHttpScheme(value) {
  const trimmed = (value || '').trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function normalizeUrlForYaml(value) {
  const withScheme = ensureHttpScheme(value)
  if (!withScheme) return ''

  const url = new URL(withScheme)
  // Avoid storing hashes
  url.hash = ''
  return url.toString()
}

function normalizeUrlForComparison(value) {
  const withScheme = ensureHttpScheme(value)
  if (!withScheme) return ''

  const url = new URL(withScheme)
  url.hash = ''
  url.search = ''
  url.pathname = url.pathname.replace(/\/+$/, '')
  return `${url.origin}${url.pathname}`
}

function normalizeForYaml(value) {
  return (value || '').replace(/\r?\n/g, ' ').trim()
}

function yamlQuote(value) {
  const v = normalizeForYaml(value)
  return `'${v.replaceAll("'", "''")}'`
}

function slugifyAscii(value, fallback) {
  const s = (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return s || fallback
}

function parseHeadings(body) {
  const sections = new Map()
  let current = null
  for (const rawLine of (body || '').split('\n')) {
    const line = rawLine.trimEnd()
    if (line.startsWith('### ')) {
      current = line.slice(4).trim()
      if (!sections.has(current)) sections.set(current, [])
      continue
    }

    if (current) {
      sections.get(current).push(line)
    }
  }

  const result = new Map()
  for (const [k, lines] of sections.entries()) {
    result.set(k, lines.join('\n').trim())
  }
  return result
}

function parseBoldFields(body) {
  // Supports legacy markdown issue template format:
  // **Website Name:**
  // value
  const fields = new Map()
  const lines = (body || '').split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    // Supports:
    // - **Website Name:**
    // - **Website Name:** (optional)
    // - **Website Name:** (something)
    const m = line.match(/^\*\*(.+?):\*\*\s*(?:\(.+\))?\s*$/)
    const mNoColon = line.match(/^\*\*(.+?)\*\*\s*(?:\(.+\))?\s*$/)
    if (m || mNoColon) {
      const key = (m ? m[1] : mNoColon[1]).trim()
      const valueLines = []
      i++
      while (i < lines.length) {
        const next = lines[i]
        if (
          next.match(/^\*\*.+?:\*\*\s*(?:\(.+\))?\s*$/) ||
          next.match(/^\*\*.+?\*\*\s*(?:\(.+\))?\s*$/) ||
          next.startsWith('### ')
        ) {
          break
        }
        valueLines.push(next)
        i++
      }
      fields.set(key, valueLines.join('\n').trim())
      continue
    }

    i++
  }
  return fields
}

function pickField(maps, keys) {
  for (const key of keys) {
    for (const m of maps) {
      if (m.has(key)) {
        const v = (m.get(key) || '').trim()
        if (v) return v
      }
    }
  }
  return ''
}

function normalizeOptionalValue(value) {
  const raw = (value || '').trim()
  if (!raw) return ''

  // GitHub issue forms often emit placeholder text for optional fields.
  // Examples: "None", "_No response_", "*No response*".
  const stripped = raw
    .replace(/^[_*`]+/, '')
    .replace(/[_*`]+$/, '')
    .trim()
  const lowered = stripped.toLowerCase()

  if (
    lowered === 'none' ||
    lowered === 'no response' ||
    lowered === 'n/a' ||
    lowered === 'na' ||
    lowered === 'null'
  ) {
    return ''
  }

  return raw
}

function looksLikeFriendApplicationIssue(issue) {
  const title = (issue?.title || '').trim()
  // Be tolerant to extra whitespace/formatting and possible leading characters.
  // We only need a strong signal that this issue is a friend application.
  if (/\bfriend\s+link\s+application\s*:/i.test(title)) return true

  const body = issue?.body || ''
  // Issue form output format.
  if (body.includes('### Website Name') && body.includes('### Website URL')) {
    return true
  }

  return false
}

function validate({
  name,
  url,
  description,
  contact,
  avatar,
  category,
  reciprocalUrl,
}) {
  const errors = []

  if (!name || name.length < 2 || name.length > 50) {
    errors.push('Website Name must be 2-50 characters')
  }

  if (!url || !isHttpUrl(url)) {
    errors.push('Website URL must be a valid http(s) URL')
  }

  if (!description || description.length < 2 || description.length > 500) {
    errors.push('Description must be 2-500 characters')
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!contact || !emailRegex.test(contact)) {
    errors.push('Contact Email must be a valid email')
  }

  if (avatar && !isHttpUrl(avatar)) {
    errors.push('Avatar URL must be a valid http(s) URL')
  }

  if (category) {
    const allowed = new Set(['技术', '生活', '学习', '设计', '其他'])
    if (!allowed.has(category)) {
      errors.push('Category must be one of: 技术, 生活, 学习, 设计, 其他')
    }
  }

  if (!reciprocalUrl || !isHttpUrl(reciprocalUrl)) {
    errors.push('Reciprocal Link URL must be a valid http(s) URL')
  }

  return errors
}

function listExistingUrls(yamlText) {
  const urls = []
  for (const line of (yamlText || '').split('\n')) {
    const m = line.match(/^\s*url:\s*(.+?)\s*$/)
    if (!m) continue

    let raw = m[1].trim()
    raw = raw.replace(/^['"]/, '').replace(/['"]$/, '')

    const normalized = normalizeUrlForComparison(raw)
    if (normalized) urls.push(normalized)
  }
  return urls
}

function main() {
  try {
    run()
  } catch (error) {
    const msg = `An internal error occurred:\n${error.message}\n${error.stack}`
    console.error(msg)
    writeOutput('result', 'invalid')
    writeOutput('error_message', msg)
    // Exit with 0 so the workflow continues to the comment step
    process.exit(0)
  }
}

function run() {
  const eventPath = process.env.GITHUB_EVENT_PATH
  if (!eventPath) {
    throw new Error('Missing GITHUB_EVENT_PATH')
  }

  const event = readJson(eventPath)
  const issue = event.issue
  if (!issue) {
    console.log('No issue in event payload')
    return
  }

  const labels = (issue.labels || []).map((l) =>
    typeof l === 'string' ? l : l.name,
  )

  const action = event.action
  const labelName = event.label?.name

  const shouldRun =
    (action === 'opened' &&
      (labels.includes('friend-application') ||
        looksLikeFriendApplicationIssue(issue))) ||
    (action === 'labeled' && labelName === 'friend-application')

  if (!shouldRun) {
    console.log('Not a friend-application trigger; skipping')
    return
  }

  const body = issue.body || ''
  const headings = parseHeadings(body)
  const boldFields = parseBoldFields(body)

  const name = pickField(
    [headings, boldFields],
    ['Website Name', '网站名称', '站点名称'],
  )
  const rawUrl = pickField(
    [headings, boldFields],
    ['Website URL', '网站地址', '站点地址'],
  )
  const description = pickField(
    [headings, boldFields],
    ['Description', '网站描述', '站点描述'],
  )
  const avatar = normalizeOptionalValue(
    pickField(
      [headings, boldFields],
      ['Avatar URL (optional)', 'Avatar URL', '头像链接', '头像地址'],
    ),
  )
  const category = normalizeOptionalValue(
    pickField(
      [headings, boldFields],
      ['Category (optional)', 'Category', '分类'],
    ),
  )
  const contact = pickField(
    [headings, boldFields],
    ['Contact Email', '联系邮箱', '邮箱'],
  )
  const githubUsername = normalizeOptionalValue(
    pickField(
      [headings, boldFields],
      [
        'GitHub Username (optional)',
        'GitHub Username',
        'GitHub 用户名',
        'GitHub用户名',
      ],
    ),
  )
  const reciprocalUrl = pickField(
    [headings, boldFields],
    [
      'Reciprocal Link URL',
      'Where can we find the link back to this blog?',
      'Where can we find the link back to this blog?',
      'Reciprocal Link',
      '回链地址',
      '回链链接',
    ],
  )

  const url = normalizeUrlForYaml(rawUrl)
  const avatarUrl = avatar ? normalizeUrlForYaml(avatar) : ''
  const reciprocal = reciprocalUrl ? normalizeUrlForYaml(reciprocalUrl) : ''

  const errors = validate({
    name: normalizeForYaml(name),
    url,
    description: normalizeForYaml(description),
    contact: normalizeForYaml(contact),
    avatar: avatarUrl,
    category: normalizeForYaml(category),
    reciprocalUrl: reciprocal,
  })

  if (errors.length > 0) {
    const msg = `Validation failed:\n- ${errors.join('\n- ')}`
    console.error(msg)
    writeOutput('result', 'invalid')
    writeOutput('error_message', msg)
    return
  }

  const hostSlug = slugifyAscii(new URL(url).hostname, 'site')
  const nameSlug = slugifyAscii(normalizeForYaml(name), 'friend')
  const timestamp = Date.now()
  const id = `${nameSlug}-${hostSlug}-${timestamp}`

  const addedAt = new Date().toISOString()

  const entryLines = []
  entryLines.push(`- id: ${yamlQuote(id)}`)
  entryLines.push(`  name: ${yamlQuote(name)}`)
  entryLines.push(`  url: ${yamlQuote(url)}`)
  entryLines.push(`  description: ${yamlQuote(description)}`)
  if (avatarUrl) entryLines.push(`  avatar: ${yamlQuote(avatarUrl)}`)
  if (category) entryLines.push(`  category: ${yamlQuote(category)}`)
  entryLines.push(`  contact: ${yamlQuote(contact)}`)
  entryLines.push(`  addedAt: ${yamlQuote(addedAt)}`)
  entryLines.push('  status: active')
  entryLines.push('  rel: friend')

  const newEntry = entryLines.join('\n')

  const friendsPath =
    process.env.FRIENDS_YAML_PATH ||
    path.join(process.cwd(), 'src/data/friends/friends.yaml')
  const existing = fs.readFileSync(friendsPath, 'utf8')

  const existingUrls = new Set(listExistingUrls(existing))
  const urlKey = normalizeUrlForComparison(url)
  if (urlKey && existingUrls.has(urlKey)) {
    const msg = `Duplicate URL detected: ${url}`
    console.error(msg)
    writeOutput('result', 'duplicate')
    writeOutput('error_message', msg)
    return
  }

  const next = `${existing.replace(/\s*$/, '')}\n\n${newEntry}\n`
  fs.writeFileSync(friendsPath, next, 'utf8')

  writeOutput('result', 'ok')
  writeOutput('friend_id', id)

  const branch = `bot/friend-application-${issue.number}-${nameSlug}`
  writeOutput('branch', branch)

  const prTitle = `Add friend link: ${normalizeForYaml(name)}`
  const prBody = [
    '## Friend Link Application',
    '',
    `Closes #${issue.number}`,
    '',
    `- Website: ${normalizeForYaml(name)}`,
    `- URL: ${url}`,
    `- Description: ${normalizeForYaml(description)}`,
    category ? `- Category: ${normalizeForYaml(category)}` : null,
    `- Contact: ${normalizeForYaml(contact)}`,
    githubUsername ? `- GitHub: @${normalizeForYaml(githubUsername)}` : null,
    `- Reciprocal link: ${reciprocal}`,
    '',
    '```yaml',
    newEntry,
    '```',
  ]
    .filter(Boolean)
    .join('\n')

  writeOutput('pr_title', prTitle)
  writeOutput('pr_body', prBody)
}

main()
