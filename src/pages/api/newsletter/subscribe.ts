import type { APIRoute } from 'astro'
import { BREVO } from '@/consts'

export const prerender = false

interface SubscribeRequest {
  email: string
}

interface BrevoContactResponse {
  id?: number
  code?: string
  message?: string
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body: SubscribeRequest = await request.json()
    const { email } = body

    // Validate email
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if Brevo API key is configured
    if (!BREVO.apiKey) {
      console.error('BREVO_API_KEY is not configured')
      return new Response(
        JSON.stringify({ error: 'Newsletter service is temporarily unavailable' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create or update contact in Brevo
    const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO.apiKey,
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        listIds: BREVO.listId ? [parseInt(BREVO.listId)] : undefined,
        updateEnabled: true,
      }),
    })

    // Handle Brevo API response
    if (brevoResponse.ok) {
      const data: BrevoContactResponse = await brevoResponse.json()
      console.log(`Newsletter subscription successful: ${email}`)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Subscription successful',
          contactId: data.id 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Handle specific Brevo errors
    const errorData: BrevoContactResponse = await brevoResponse.json()
    
    if (errorData.code === 'duplicate_parameter') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'You are already subscribed' 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.error('Brevo API error:', errorData)
    return new Response(
      JSON.stringify({ error: 'Subscription failed. Please try again later.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// Handle OPTIONS for CORS
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
