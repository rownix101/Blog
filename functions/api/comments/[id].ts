// Cloudflare Pages Function - Single Comment API
// 更新和删除单条评论

interface Env {
  DB: D1Database
  COMMENT_JWT_SECRET: string
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

interface UpdateCommentRequest {
  content: string
  token: string
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

// HTML 处理函数
const processMarkdown = (content: string): string => {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
}

const sanitizeHTML = (html: string): string => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
}

export const onRequestPut = async ({ request, env, params }: {
  request: Request;
  env: Env;
  params: { id: string }
}) => {
  try {
    const commentId = parseInt(params.id)
    if (isNaN(commentId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid comment ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body: UpdateCommentRequest = await request.json()
    const { content, token } = body

    if (!content?.trim() || !token) {
      return new Response(
        JSON.stringify({ error: 'content and token are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 验证 JWT token
    const decoded = verifyToken(token, env.COMMENT_JWT_SECRET)
    if (!decoded || !decoded.userId) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 检查评论是否存在且属于该用户
    const comments = await queryDB(env, 'SELECT user_id FROM comments WHERE id = ?', [commentId])

    if (comments.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Comment not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (comments[0].user_id !== decoded.userId) {
      return new Response(
        JSON.stringify({ error: 'You can only edit your own comments' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 更新评论
    const htmlContent = processMarkdown(sanitizeHTML(content.trim()))
    await queryDB(env, `
      UPDATE comments
      SET content = ?, html_content = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [content.trim(), htmlContent, commentId])

    // 获取完整的评论信息
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
        message: 'Comment updated successfully'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Update comment error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to update comment' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export const onRequestDelete = async ({ request, env, params }: {
  request: Request;
  env: Env;
  params: { id: string }
}) => {
  try {
    const commentId = parseInt(params.id)
    if (isNaN(commentId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid comment ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(request.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 验证 JWT token
    const decoded = verifyToken(token, env.COMMENT_JWT_SECRET)
    if (!decoded || !decoded.userId) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 检查评论是否存在且属于该用户
    const comments = await queryDB(env, 'SELECT user_id FROM comments WHERE id = ?', [commentId])

    if (comments.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Comment not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (comments[0].user_id !== decoded.userId) {
      return new Response(
        JSON.stringify({ error: 'You can only delete your own comments' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 软删除评论（标记为 deleted 而不是真正删除）
    await queryDB(env, 'UPDATE comments SET status = ? WHERE id = ?', ['deleted', commentId])

    return new Response(
      JSON.stringify({ message: 'Comment deleted successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Delete comment error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to delete comment' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}