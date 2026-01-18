import React, { useState } from 'react'
import {
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { NEWSLETTER_CONSENT_TEXT } from '@/consts'

interface NewsletterProps {
  className?: string
}

type Status = 'idle' | 'loading' | 'success' | 'error'

const Newsletter: React.FC<NewsletterProps> = ({ className }) => {
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!email.trim()) {
      setStatus('error')
      setMessage('Please enter your email address')
      return
    }

    if (!validateEmail(email)) {
      setStatus('error')
      setMessage('Please enter a valid email address')
      return
    }

    // GDPR compliance: Require explicit consent
    if (!consent) {
      setStatus('error')
      setMessage('Please accept the privacy policy to subscribe')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe')
      }

      setStatus('success')
      setMessage('Successfully subscribed! Please check your email to confirm.')
      setEmail('')
      setConsent(false)

      // Reset success message after 5 seconds
      setTimeout(() => {
        setStatus('idle')
        setMessage('')
      }, 5000)
    } catch (error) {
      setStatus('error')
      setMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again later.',
      )
    }
  }

  return (
    <div className={cn('w-full', className)}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col items-start gap-3 sm:flex-row">
          <div className="group relative w-full sm:min-w-0 sm:flex-1">
            <Mail className="text-muted-foreground group-focus-within:text-primary pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 flex-shrink-0 -translate-y-1/2 transition-colors" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={status === 'loading'}
              className="border-border/60 bg-background/80 text-foreground placeholder:text-muted-foreground/60 focus:ring-primary/20 focus:border-primary/50 h-10 w-full rounded-md border pr-4 pl-10 text-sm backdrop-blur-sm transition-all focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Email address"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={status === 'loading'}
            size="lg"
            variant="default"
            className="group w-full gap-2 sm:w-auto sm:flex-shrink-0"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Subscribing...</span>
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                <span>Subscribe</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </div>

        {/* GDPR Compliant Consent Checkbox */}
        <div className="flex items-start gap-2.5 pl-1">
          <input
            type="checkbox"
            id="newsletter-consent-footer"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            disabled={status === 'loading'}
            className="border-border text-primary focus:ring-primary/20 mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer rounded focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
            required
          />
          <label
            htmlFor="newsletter-consent-footer"
            className="text-muted-foreground cursor-pointer text-xs leading-relaxed"
          >
            {NEWSLETTER_CONSENT_TEXT.text}{' '}
            <a
              href={NEWSLETTER_CONSENT_TEXT.privacyLink}
              className="hover:text-foreground underline transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              {NEWSLETTER_CONSENT_TEXT.privacyText}
            </a>
          </label>
        </div>

        {message && (
          <div
            className={cn(
              'flex items-center gap-1.5 text-xs',
              status === 'success'
                ? 'text-green-600 dark:text-green-400'
                : 'text-destructive',
            )}
            role="alert"
          >
            {status === 'success' ? (
              <CheckCircle2 className="h-3 w-3 shrink-0" />
            ) : (
              <AlertCircle className="h-3 w-3 shrink-0" />
            )}
            <span>{message}</span>
          </div>
        )}
      </form>
    </div>
  )
}

export default Newsletter
