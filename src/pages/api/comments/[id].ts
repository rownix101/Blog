import type { APIRoute } from 'astro'
import {
  deleteComment,
  getCommentById,
  getUserById,
  updateComment,
  validateSession,
} from '@/lib/db'
import { sanitizeHTML } from '@/lib/auth'
import { validateCommentContent, checkSpam } from '@/lib/validation'

export const prerender = false

// GET - Get a single comment
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { id } = params

    if (!id) {
      return new Response(JSON.stringify({ error: 'Comment ID is required' }), {
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

    const comment = await getCommentById(db, id)

    if (!comment) {
      return new Response(JSON.stringify({ error: 'Comment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ comment }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Get comment error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// PUT - Update a comment
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const { id } = params
    const body = await request.json()
    const { content } = body

    if (!id) {
      return new Response(JSON.stringify({ error: 'Comment ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!content) {
      return new Response(JSON.stringify({ error: 'Content is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
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
    const { verifySessionToken } = await import('@/lib/auth')
    const sessionData = verifySessionToken(sessionToken)

    if (!sessionData) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const user = await getUserById(db, sessionData.userId)
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get comment
    const comment = await getCommentById(db, id)
    if (!comment) {
      return new Response(JSON.stringify({ error: 'Comment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check if user is the comment author
    if (comment.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'You can only edit your own comments' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        },
      )
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

    // Update comment
    const updatedComment = await updateComment(db, id, {
      content: sanitizedContent,
    })

    return new Response(
      JSON.stringify({
        message: 'Comment updated successfully',
        comment: updatedComment,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Update comment error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// DELETE - Delete a comment
export const DELETE: APIRoute = async ({ params, request, locals }) => {
  try {
    const { id } = params

    if (!id) {
      return new Response(JSON.stringify({ error: 'Comment ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
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
    const { verifySessionToken } = await import('@/lib/auth')
    const sessionData = verifySessionToken(sessionToken)

    if (!sessionData) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const user = await getUserById(db, sessionData.userId)
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get comment
    const comment = await getCommentById(db, id)
    if (!comment) {
      return new Response(JSON.stringify({ error: 'Comment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check if user is the comment author
    if (comment.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'You can only delete your own comments' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    // Delete comment
    await deleteComment(db, id)

    return new Response(
      JSON.stringify({ message: 'Comment deleted successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Delete comment error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
