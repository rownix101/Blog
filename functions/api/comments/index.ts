// Cloudflare Pages Function - Comments API
// 获取和创建评论

interface Env {
  DB: D1Database
  COMMENT_JWT_SECRET: string
  COMMENT_MODERATION_ENABLED?: string
  COMMENT_MAX_LENGTH?: string
}

// Cloudflare D1 类型定义
interface D1Database {
  prepare(sql: string): D1PreparedStatement
}

interface D1PreparedStatement {
  bind(...params: any[]): D1PreparedStatement
  all(): Promise<D1Result>
  run(): Promise<D1Result>
  first(): Promise<any>
}

interface D1Result {
  results: any[]
  success: boolean
  meta?: any
}

interface Comment {
  id: number
  post_id: string
  parent_id?: number
  content: string
  html_content?: string
  status: 'published' | 'pending' | 'deleted'
  created_at: string
  updated_at: string
  user_id?: number
  user_name?: string
  user_email?: string
  user_avatar?: string
  user_website?: string
  like_count?: number
  reply_count?: number
  replies?: Comment[]
}

interface CreateCommentRequest {
  post_id: string
  parent_id?: number
  content: string
  user?: {
    name: string
    email: string
    website?: string
  }
  token?: string // JWT token for logged in users
}

// 简单的 HTML 清理函数
const sanitizeHTML = (html: string): string => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
}

// 处理 Markdown 转换（简单实现）
const processMarkdown = (content: string): string => {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
}



// JWT 验证函数
const verifyToken = (token: string, secret: string): any => {
  try {
    const [header, payload, signature] = token.split('.')
    const expectedSignature = btoa(`${header}.${payload}.${secret}`)

    if (signature !== expectedSignature) return null

    const decoded = JSON.parse(atob(payload))
    if (decoded.exp < Date.now()) return null

    return decoded
  } catch {
    return null
  }
}

// 数据库查询函数 - 适配 Cloudflare D1
const queryDB = async (env: Env, sql: string, params: any[] = []): Promise<any[]> => {
  try {
    const stmt = env.DB.prepare(sql)
    const result = params.length > 0
      ? await stmt.bind(...params).all()
      : await stmt.all()

    return result.results || []
  } catch (error) {
    console.error('Database query error:', error)
    throw new Error(`Database query failed: ${error}`)
  }
}

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const url = new URL(request.url)
    const postId = url.searchParams.get('post_id')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    if (!postId) {
      return new Response(
        JSON.stringify({ error: 'post_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 获取评论（按创建时间排序，顶级评论在前）
    // D1 中需要手动计算点赞数和回复数
    const comments = await queryDB(env, `
      SELECT
        c.id,
        c.post_id,
        c.parent_id,
        c.content,
        c.html_content,
        c.status,
        c.created_at,
        c.updated_at,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.avatar_url as user_avatar,
        u.website as user_website,
        (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as like_count,
        (SELECT COUNT(*) FROM comments cr WHERE cr.parent_id = c.id AND cr.status = 'published') as reply_count
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ? AND c.status = 'published'
      ORDER BY c.created_at ASC
      LIMIT ? OFFSET ?
    `, [postId, limit, offset])

    // 构建嵌套评论结构
    const buildCommentTree = (comments: Comment[]): Comment[] => {
      const commentMap = new Map<number, Comment>()
      const rootComments: Comment[] = []

      // 创建映射
      comments.forEach(comment => {
        comment.replies = []
        commentMap.set(comment.id, comment)
      })

      // 构建树形结构
      comments.forEach(comment => {
        if (comment.parent_id && commentMap.has(comment.parent_id)) {
          const parent = commentMap.get(comment.parent_id)
          if (parent && parent.replies) {
            parent.replies.push(comment)
          }
        } else {
          rootComments.push(comment)
        }
      })

      return rootComments
    }

    const commentTree = buildCommentTree(comments)

    return new Response(
      JSON.stringify({
        comments: commentTree,
        pagination: {
          page,
          limit,
          hasMore: comments.length === limit
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300' // 5分钟缓存
        }
      }
    )
  } catch (error) {
    console.error('Get comments error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch comments' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const body: CreateCommentRequest = await request.json()
    const { post_id, parent_id, content, user, token } = body

    // 验证必填字段
    if (!post_id || !content?.trim()) {
      return new Response(
        JSON.stringify({ error: 'post_id and content are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 检查内容长度
    const maxLength = parseInt(env.COMMENT_MAX_LENGTH || '2000')
    if (content.length > maxLength) {
      return new Response(
        JSON.stringify({ error: `Comment too long (max ${maxLength} characters)` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    let userId: number | null = null

    // 处理用户认证
    if (token) {
      // 验证 JWT token
      const decoded = verifyToken(token, env.COMMENT_JWT_SECRET)
      if (decoded && decoded.userId) {
        userId = decoded.userId
      }
    } else if (user) {
      // 匿名用户，创建或获取用户记录
      if (!user.name?.trim() || !user.email?.trim()) {
        return new Response(
          JSON.stringify({ error: 'Name and email are required for anonymous comments' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(user.email)) {
        return new Response(
          JSON.stringify({ error: 'Invalid email format' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // 查找或创建用户
      const existingUsers = await queryDB(env, 'SELECT id FROM users WHERE email = ?', [user.email])

      if (existingUsers.length > 0) {
        userId = existingUsers[0].id
      } else {
        await queryDB(env, `
          INSERT INTO users (email, name, website)
          VALUES (?, ?, ?)
        `, [user.email, user.name, user.website])

        // 获取刚插入的用户 ID
        const lastInsertResult = await queryDB(env, 'SELECT last_insert_rowid() as id', [])
        userId = lastInsertResult[0].id
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'User information or authentication token is required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 处理内容
    const htmlContent = processMarkdown(sanitizeHTML(content))
    const status = env.COMMENT_MODERATION_ENABLED === 'true' ? 'pending' : 'published'

    // 创建评论
    await queryDB(env, `
      INSERT INTO comments (post_id, parent_id, user_id, content, html_content, status, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      post_id,
      parent_id || null,
      userId,
      content.trim(),
      htmlContent,
      status,
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      request.headers.get('user-agent')
    ])

    // 获取刚插入的评论 ID（D1 不支持 RETURNING）
    const lastInsertResult = await queryDB(env, 'SELECT last_insert_rowid() as id', [])
    const commentId = lastInsertResult[0].id

    // 获取完整的评论信息（包括用户信息）
    const fullComments = await queryDB(env, `
      SELECT
        c.id,
        c.post_id,
        c.parent_id,
        c.content,
        c.html_content,
        c.status,
        c.created_at,
        c.updated_at,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.avatar_url as user_avatar,
        u.website as user_website,
        (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as like_count,
        (SELECT COUNT(*) FROM comments cr WHERE cr.parent_id = c.id AND cr.status = 'published') as reply_count
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [commentId])

    return new Response(
      JSON.stringify({
        comment: fullComments[0],
        message: status === 'pending' ? 'Comment submitted for moderation' : 'Comment published successfully'
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Create comment error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create comment' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}