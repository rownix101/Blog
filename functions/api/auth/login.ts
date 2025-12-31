// Cloudflare Pages Function - User Authentication
// 用户登录和注册

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

interface LoginRequest {
  email: string
  name?: string
  website?: string
}

interface User {
  id: number
  email: string
  name: string
  avatar_url?: string
  website?: string
  bio?: string
  created_at: string
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

// JWT 生成函数
const generateToken = (payload: any, secret: string): string => {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify({
    ...payload,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30天过期
  }))
  const signature = btoa(`${encodedHeader}.${encodedPayload}.${secret}`)
  return `${encodedHeader}.${encodedPayload}.${signature}`
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const body: LoginRequest = await request.json()
    const { email, name, website } = body

    // 验证必填字段
    if (!email?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 查找现有用户
    const existingUsers = await queryDB(env, 'SELECT * FROM users WHERE email = ?', [email])

    let user: User

    if (existingUsers.length > 0) {
      // 用户已存在，返回用户信息
      user = existingUsers[0]
    } else {
      // 新用户，需要提供姓名
      if (!name?.trim()) {
        return new Response(
          JSON.stringify({ error: 'Name is required for new users' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // 创建新用户
      await queryDB(env, `
        INSERT INTO users (email, name, website)
        VALUES (?, ?, ?)
      `, [email.trim(), name.trim(), website?.trim()])

      // 获取刚插入的用户信息
      const newUsers = await queryDB(env, 'SELECT * FROM users WHERE email = ?', [email.trim()])
      user = newUsers[0]
    }

    // 生成 JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name
    }, env.COMMENT_JWT_SECRET)

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          website: user.website,
          bio: user.bio,
          created_at: user.created_at
        },
        token,
        message: existingUsers.length > 0 ? 'Welcome back!' : 'Account created successfully!'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `comment_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${30 * 24 * 60 * 60}` // 30天
        }
      }
    )
  } catch (error) {
    console.error('Login error:', error)
    return new Response(
      JSON.stringify({ error: 'Authentication failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}