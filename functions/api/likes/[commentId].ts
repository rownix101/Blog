// Cloudflare Pages Function - Comment Likes API
// 基于 Cloudflare KV 的点赞功能

interface Env {
  COMMENT_KV: KVNamespace
}

// Cloudflare KV 类型定义
interface KVNamespace {
  get(key: string): Promise<string | null>
  put(key: string, value: string, options?: KVPutOptions): Promise<void>
  delete(key: string): Promise<void>
  increment(key: string, options?: KVIncrementOptions): Promise<number>
  decrement(key: string, options?: KVDecrementOptions): Promise<number>
}

interface KVPutOptions {
  expiration?: number
  expirationTtl?: number
}

interface KVIncrementOptions {
  expiration?: number
  expirationTtl?: number
}

interface KVDecrementOptions {
  expiration?: number
  expirationTtl?: number
}

// 生成唯一用户指纹（基于 IP 和 User-Agent）
const generateUserFingerprint = (request: Request): string => {
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  return btoa(`${ip}:${userAgent}`).substring(0, 32)
}

// 获取点赞统计
const getLikeStats = async (env: Env, commentId: string, request: Request) => {
  try {
    const totalLikes = await env.COMMENT_KV.get(`comment:${commentId}:likes`)
    const userFingerprint = generateUserFingerprint(request)
    const userLiked = await env.COMMENT_KV.get(`comment:${commentId}:liked:${userFingerprint}`)

    return {
      totalLikes: parseInt(totalLikes || '0'),
      userLiked: userLiked === '1'
    }
  } catch (error) {
    console.error('Get like stats error:', error)
    return { totalLikes: 0, userLiked: false }
  }
}

// 处理点赞请求
export const onRequestPost = async ({ request, env, params }: {
  request: Request;
  env: Env;
  params: { commentId: string }
}) => {
  try {
    const commentId = params.commentId
    const userFingerprint = generateUserFingerprint(request)

    if (!commentId) {
      return new Response(
        JSON.stringify({ error: 'Comment ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 检查用户是否已经点赞
    const existingLike = await env.COMMENT_KV.get(`comment:${commentId}:liked:${userFingerprint}`)

    if (existingLike === '1') {
      // 取消点赞
      await Promise.all([
        env.COMMENT_KV.delete(`comment:${commentId}:liked:${userFingerprint}`),
        env.COMMENT_KV.decrement(`comment:${commentId}:likes`)
      ])

      const stats = await getLikeStats(env, commentId, request)
      return new Response(
        JSON.stringify({
          liked: false,
          totalLikes: stats.totalLikes,
          message: 'Like removed'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    } else {
      // 添加点赞
      await Promise.all([
        env.COMMENT_KV.put(`comment:${commentId}:liked:${userFingerprint}`, '1', { expirationTtl: 86400 * 30 }), // 30天过期
        env.COMMENT_KV.increment(`comment:${commentId}:likes`)
      ])

      const stats = await getLikeStats(env, commentId, request)
      return new Response(
        JSON.stringify({
          liked: true,
          totalLikes: stats.totalLikes,
          message: 'Comment liked!'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Like operation error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process like' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// 获取点赞状态
export const onRequestGet = async ({ request, env, params }: {
  request: Request;
  env: Env;
  params: { commentId: string }
}) => {
  try {
    const commentId = params.commentId

    if (!commentId) {
      return new Response(
        JSON.stringify({ error: 'Comment ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const stats = await getLikeStats(env, commentId, request)

    return new Response(
      JSON.stringify({
        totalLikes: stats.totalLikes,
        userLiked: stats.userLiked
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60' // 1分钟缓存
        }
      }
    )
  } catch (error) {
    console.error('Get likes error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get likes' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}