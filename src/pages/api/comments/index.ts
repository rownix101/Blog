import type { APIRoute } from 'astro'
import {
  createComment,
  getCommentsByPostIdWithUser,
  getUserById,
  validateSession,
} from '@/lib/db'
import { generateId, sanitizeHTML } from '@/lib/auth'
import { verifyTurnstileToken } from '@/lib/turnstile'
import {
  validatePostId,
  validateCommentContent,
  checkSpam,
  validateAndSanitizeInput,
  RateLimiter,
} from '@/lib/validation'

// Rate limiter for comment creation
const commentRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
})

export const prerender = false

// GET - Get comments for a post
export const GET: APIRoute = async ({ request, url, locals }) => {
  try {
    const postId = url.searchParams.get('post_id')

    if (!postId) {
      return new Response(JSON.stringify({ error: 'post_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Validate post ID
    const postIdValidation = validatePostId(postId)
    if (!postIdValidation.valid) {
      return new Response(JSON.stringify({ error: postIdValidation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get D1 database
    const db = (locals.runtime as any).env.DB
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const comments = await getCommentsByPostIdWithUser(db, postId)

    return new Response(JSON.stringify({ comments }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Get comments error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// POST - Create a new comment
export const POST: APIRoute = async ({ request, url, locals }) => {
  // Rate limiting
  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for') ||
    'unknown'
  const rateLimitCheck = commentRateLimiter.check(clientIp)

  if (!rateLimitCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many comment attempts. Please try again later.',
        retryAfter: Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil(
            (rateLimitCheck.resetTime - Date.now()) / 1000,
          ).toString(),
        },
      },
    )
  }

  try {
    const body = await request.json()
    const { post_id, content, parent_id, turnstile_token } = body

    if (!post_id || !content) {
      return new Response(
        JSON.stringify({ error: 'post_id and content are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    // Get session token from cookie
    const sessionToken = request.headers
      .get('cookie')
      ?.match(/session_token=([^;]+)/)?.[1]

    if (!sessionToken) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get D1 database
    const db = (locals.runtime as any).env.DB
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Verify session and get user
    const { user: validUser } = await validateSession(db, sessionToken)

    if (!validUser) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const user = validUser

    // Validate post ID
    const postIdValidation = validatePostId(post_id)
    if (!postIdValidation.valid) {
      return new Response(JSON.stringify({ error: postIdValidation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Validate content
    const contentValidation = validateCommentContent(content)
    if (!contentValidation.valid) {
      return new Response(JSON.stringify({ error: contentValidation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Sanitize content
    const sanitizedContent = sanitizeHTML(content)

    // Check for spam
    const spamCheck = checkSpam(sanitizedContent)
    if (spamCheck.isSpam) {
      return new Response(
        JSON.stringify({
          error: spamCheck.reason || 'Comment contains spam content',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    // Verify Turnstile token
    if (turnstile_token) {
      const remoteIp =
        request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-forwarded-for') ||
        undefined
      const turnstileValid = await verifyTurnstileToken(
        turnstile_token,
        remoteIp,
      )

      if (!turnstileValid) {
        return new Response(
          JSON.stringify({ error: 'Failed to verify you are human' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }
    }

    // Determine comment status
    // Respect freedom of speech: auto-approve all comments
    let status: 'pending' | 'approved' = 'approved'

    // Create comment
    const commentId = generateId()
    const comment = await createComment(db, {
      id: commentId,
      post_id,
      user_id: user.id,
      parent_id: parent_id || null,
      content: sanitizedContent,
      status,
    })

    // Return comment with user info
    const commentWithUser = {
      ...comment,
      user: {
        id: user.id,
        username: user.username,
        avatar_url: user.avatar_url,
      },
    }

    return new Response(
      JSON.stringify({
        message: 'Comment created successfully',
        comment: commentWithUser,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Create comment error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
