import type { APIRoute } from 'astro'
import { generateToken } from '@/lib/auth'
import { getUserByEmail } from '@/lib/db'
import { sendVerificationEmail } from '@/lib/email'
import { setVerificationCode, checkCooldown } from '@/lib/kv'
import { validateEmail } from '@/lib/validation'

export const prerender = false

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      return new Response(JSON.stringify({ error: emailValidation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const db = locals.runtime?.env.DB
    const kv = locals.runtime?.env.COMMENT_KV

    if (!db || !kv) {
      return new Response(
        JSON.stringify({ error: 'Database or KV not available' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const existingUser = await getUserByEmail(db, email.toLowerCase())
    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'Email already registered' }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const isCooldown = await checkCooldown(kv, email.toLowerCase())
    if (isCooldown) {
      return new Response(
        JSON.stringify({
          error: 'Please wait 60 seconds before requesting a new code',
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const verificationCode = generateToken(6)

    await setVerificationCode(kv, email.toLowerCase(), verificationCode)

    try {
      const lang = body.lang || 'zh-cn'
      await sendVerificationEmail(email, verificationCode, lang)
    } catch (error) {
      console.error('Failed to send verification email:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to send verification email' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response(JSON.stringify({ message: 'Verification code sent' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Send verification code error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
