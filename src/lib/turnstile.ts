import { COMMENTS } from '@/consts'

export interface TurnstileVerificationResponse {
  success: boolean
  'error-codes'?: string[]
  challenge_ts?: string
  hostname?: string
}

// Verify Turnstile token
export async function verifyTurnstileToken(token: string, remoteIp?: string): Promise<boolean> {
  if (!COMMENTS.turnstileSecretKey) {
    console.warn('Turnstile secret key is not configured')
    return false
  }

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      secret: COMMENTS.turnstileSecretKey,
      response: token,
      ...(remoteIp && { remoteip: remoteIp }),
    }),
  })

  if (!response.ok) {
    console.error('Turnstile verification request failed:', response.statusText)
    return false
  }

  const data: TurnstileVerificationResponse = await response.json()

  if (!data.success) {
    console.error('Turnstile verification failed:', data['error-codes'])
    return false
  }

  return true
}

// Generate Turnstile widget HTML
export function generateTurnstileWidget(options: {
  siteKey?: string
  callback?: string
  'error-callback'?: string
  'expired-callback'?: string
  theme?: 'light' | 'dark' | 'auto'
  language?: string
  tabindex?: number
  'response-field'?: boolean
  'response-field-name'?: string
  size?: 'normal' | 'compact'
  retry?: 'auto' | 'never'
  'retry-interval'?: number
  appearance?: 'always' | 'execute' | 'interaction-only'
}): string {
  const siteKey = options.siteKey || COMMENTS.turnstileSiteKey
  if (!siteKey) {
    return '<div class="text-red-500">Turnstile site key is not configured</div>'
  }

  const widgetId = `turnstile-widget-${Math.random().toString(36).substr(2, 9)}`

  const attributes: string[] = []
  for (const [key, value] of Object.entries(options)) {
    if (key !== 'siteKey' && value !== undefined) {
      attributes.push(`data-${key}="${value}"`)
    }
  }

  return `
    <div id="${widgetId}" class="cf-turnstile" data-sitekey="${siteKey}" ${attributes.join(' ')}></div>
  `
}

// Get Turnstile token from widget
export function getTurnstileToken(widgetId: string): string | null {
  const widget = document.getElementById(widgetId) as any
  return widget?.turnstile?.getResponse() || null
}

// Reset Turnstile widget
export function resetTurnstileWidget(widgetId: string): void {
  const widget = document.getElementById(widgetId) as any
  widget?.turnstile?.reset()
}

// Render Turnstile widget programmatically
export function renderTurnstileWidget(
  containerId: string,
  options: {
    siteKey?: string
    callback?: (token: string) => void
    'error-callback'?: () => void
    'expired-callback'?: () => void
    theme?: 'light' | 'dark' | 'auto'
    language?: string
    tabindex?: number
    'response-field'?: boolean
    'response-field-name'?: string
    size?: 'normal' | 'compact'
    retry?: 'auto' | 'never'
    'retry-interval'?: number
    appearance?: 'always' | 'execute' | 'interaction-only'
  },
): void {
  const widgetId = `turnstile-widget-${Math.random().toString(36).substr(2, 9)}`

  // Load Turnstile script if not already loaded
  if (!window.turnstile) {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  }

  // Wait for Turnstile to load
  const checkTurnstile = () => {
    if (window.turnstile) {
      const container = document.getElementById(containerId)
      if (container) {
        window.turnstile.render(container, {
          sitekey: options.siteKey || COMMENTS.turnstileSiteKey,
          ...options,
        })
      }
    } else {
      setTimeout(checkTurnstile, 100)
    }
  }

  checkTurnstile()
}

// Declare Turnstile types for TypeScript
declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string
          callback?: (token: string) => void
          'error-callback'?: () => void
          'expired-callback'?: () => void
          theme?: 'light' | 'dark' | 'auto'
          language?: string
          tabindex?: number
          'response-field'?: boolean
          'response-field-name'?: string
          size?: 'normal' | 'compact'
          retry?: 'auto' | 'never'
          'retry-interval'?: number
          appearance?: 'always' | 'execute' | 'interaction-only'
        },
      ) => string
      reset: (widgetId?: string) => void
      getResponse: (widgetId?: string) => string | null
      remove: (widgetId?: string) => void
    }
  }
}

export {}