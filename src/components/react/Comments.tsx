import React, { useState, useEffect } from 'react'
import { COMMENTS } from '@/consts'
import { ui } from '@/i18n/ui'
import { useTranslations } from '@/i18n/utils'
import { getUserAvatarUrl } from '@/lib/auth'
import { validatePassword } from '@/lib/validation'
import type { CommentWithUser } from '@/types/comment'

interface CommentsProps {
  postId: string
  lang: keyof typeof ui
  className?: string
}

type TranslationFunction = ReturnType<typeof useTranslations>

interface User {
  id: string
  email: string
  username: string
  avatar_url: string | null
  email_verified: number
  two_factor_enabled: number
  created_at: number
  updated_at: number
  two_factor_secret: string | null
}

export default function Comments({
  postId,
  lang,
  className = '',
}: CommentsProps) {
  const t = useTranslations(lang)
  const [comments, setComments] = useState<CommentWithUser[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  // Fetch comments
  useEffect(() => {
    fetchComments()
    fetchUser()
  }, [postId])

  // Load Turnstile script
  useEffect(() => {
    if (COMMENTS.turnstileSiteKey && !window.turnstile) {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
  }, [])

  const fetchComments = async () => {
    try {
      setError(null)
      const response = await fetch(
        `/api/comments?post_id=${encodeURIComponent(postId)}`,
        { cache: 'no-store' },
      )
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      } else {
        throw new Error('Failed to fetch comments')
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
      setError(t('comments.fetch_failed'))
    } finally {
      setLoading(false)
    }
  }

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/comments/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
    }
  }

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/comments/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setShowLogin(false)
      } else {
        const error = await response.json()
        alert(error.error || t('comments.login_failed'))
      }
    } catch (error) {
      console.error('Login error:', error)
      alert(t('comments.login_failed'))
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const response = await fetch('/api/comments/auth/oauth/google')
      if (response.ok) {
        const data = await response.json()
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error('Google login error:', error)
      alert(t('comments.login_google_failed'))
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/comments/auth/logout', { method: 'POST' })
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleSubmitComment = async (content: string, parentId?: string) => {
    if (!user) {
      setShowLogin(true)
      return
    }

    if (!user && !turnstileToken && COMMENTS.turnstileSiteKey) {
      alert(t('comments.verification_required'))
      return
    }

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          content,
          parent_id: parentId || null,
          turnstile_token: turnstileToken,
        }),
      })
      if (response.ok) {
        await fetchComments()
        setReplyTo(null)
        setTurnstileToken(null)
        // Reset Turnstile widget if it exists and was used
        if (window.turnstile && document.getElementById('turnstile-widget')) {
          try {
            window.turnstile.reset()
          } catch (error) {
            // Ignore reset errors if widget is not ready or not found
            console.debug('Turnstile reset info:', error)
          }
        }
      } else {
        const error = await response.json()
        alert(error.error || t('comments.post_failed'))
      }
    } catch (error) {
      console.error('Submit comment error:', error)
      alert(t('comments.post_failed'))
    }
  }

  const handleEditComment = async (commentId: string, content: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (response.ok) {
        await fetchComments()
        setEditingId(null)
      } else {
        const error = await response.json()
        alert(error.error || t('comments.edit_failed'))
      }
    } catch (error) {
      console.error('Edit comment error:', error)
      alert(t('comments.edit_failed'))
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm(t('comments.confirm_delete'))) {
      return
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        await fetchComments()
      } else {
        const error = await response.json()
        alert(error.error || t('comments.delete_failed'))
      }
    } catch (error) {
      console.error('Delete comment error:', error)
      alert(t('comments.delete_failed'))
    }
  }

  const renderComment = (comment: CommentWithUser, depth = 0) => {
    const isOwner = user?.id === comment.user.id
    const isEditing = editingId === comment.id

    return (
      <div
        key={comment.id}
        className={`mb-4 ${depth > 0 ? 'border-border ml-8 border-l-2 pl-4' : ''}`}
      >
        <div className="flex items-start gap-3">
          <img
            src={getUserAvatarUrl(comment.user)}
            alt={comment.user.username}
            className="h-10 w-10 rounded-full"
          />
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="font-medium">{comment.user.username}</span>
              <span className="text-muted-foreground text-sm">
                {new Date(comment.created_at * 1000).toLocaleDateString()}
              </span>
            </div>

            {isEditing ? (
              <CommentForm
                initialContent={comment.content}
                onSubmit={(content) => handleEditComment(comment.id, content)}
                onCancel={() => setEditingId(null)}
                showTurnstile={false}
                t={t}
              />
            ) : (
              <div className="prose prose-sm dark:prose-invert mb-2 max-w-none">
                {comment.content}
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              {!replyTo && !isEditing && (
                <button
                  onClick={() => setReplyTo(comment.id)}
                  className="text-muted-foreground hover:text-primary"
                >
                  {t('comments.reply')}
                </button>
              )}
              {isOwner && !isEditing && (
                <>
                  <button
                    onClick={() => setEditingId(comment.id)}
                    className="text-muted-foreground hover:text-primary"
                  >
                    {t('comments.edit')}
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    {t('comments.delete')}
                  </button>
                </>
              )}
            </div>

            {replyTo === comment.id && (
              <div className="mt-4">
                <CommentForm
                  onSubmit={(content) => {
                    handleSubmitComment(content, comment.id)
                    setReplyTo(null)
                  }}
                  onCancel={() => setReplyTo(null)}
                  showTurnstile={!user}
                  t={t}
                />
              </div>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4">
                {comment.replies.map((reply) =>
                  renderComment(reply, depth + 1),
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {user ? (
        <div className="bg-muted mb-6 rounded-lg p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={getUserAvatarUrl(user)}
                alt={user.username}
                className="h-10 w-10 rounded-full"
              />
              <div>
                <div className="font-medium">{user.username}</div>
                <div className="text-muted-foreground text-sm">
                  {user.email}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="border-border hover:bg-accent rounded border px-4 py-2 text-sm"
            >
              {t('comments.logout')}
            </button>
          </div>
          <CommentForm
            onSubmit={(content) => handleSubmitComment(content)}
            showTurnstile={!user}
            onTurnstileChange={setTurnstileToken}
            t={t}
          />
        </div>
      ) : (
        <div className="bg-muted mb-6 rounded-lg p-4 text-center">
          <p className="mb-4">{t('comments.sign_in_prompt')}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowLogin(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded px-4 py-2"
            >
              {t('comments.login')}
            </button>
            <button
              onClick={() => setShowRegister(true)}
              className="border-border hover:bg-accent rounded border px-4 py-2"
            >
              {t('comments.register')}
            </button>
            <div className="flex justify-end">
              <button
                onClick={handleGoogleLogin}
                className="border-border hover:bg-accent flex items-center gap-2 rounded border px-4 py-2"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {t('comments.provider_google')}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center">{t('comments.loading')}</div>
      ) : error ? (
        <div className="text-destructive py-8 text-center">{error}</div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => renderComment(comment))}
        </div>
      ) : (
        <div className="text-muted-foreground py-8 text-center">
          {t('comments.empty')}
        </div>
      )}

      {showLogin && (
        <LoginForm
          onClose={() => setShowLogin(false)}
          onLogin={handleLogin}
          onGoogleLogin={handleGoogleLogin}
          t={t}
        />
      )}

      {showRegister && (
        <RegisterForm
          onClose={() => setShowRegister(false)}
          onRegister={(user) => {
            setShowRegister(false)
            if (user) {
              setUser(user)
            } else {
              setShowLogin(true)
            }
          }}
          t={t}
          lang={lang}
        />
      )}
    </div>
  )
}

interface CommentFormProps {
  initialContent?: string
  onSubmit: (content: string) => void
  onCancel?: () => void
  showTurnstile?: boolean
  onTurnstileChange?: (token: string | null) => void
  t: TranslationFunction
}

function CommentForm({
  initialContent = '',
  onSubmit,
  onCancel,
  showTurnstile = false,
  onTurnstileChange,
  t,
}: CommentFormProps) {
  const [content, setContent] = useState(initialContent)
  const [turnstileLoaded, setTurnstileLoaded] = useState(false)

  useEffect(() => {
    if (showTurnstile && COMMENTS.turnstileSiteKey && window.turnstile) {
      setTurnstileLoaded(true)
    }
  }, [showTurnstile])

  useEffect(() => {
    if (showTurnstile && turnstileLoaded && window.turnstile) {
      const container = document.getElementById('turnstile-widget')
      if (container && !container.hasChildNodes()) {
        window.turnstile.render(container, {
          sitekey: COMMENTS.turnstileSiteKey,
          callback: (token: string) => {
            onTurnstileChange?.(token)
          },
          'error-callback': () => {
            onTurnstileChange?.(null)
          },
          'expired-callback': () => {
            onTurnstileChange?.(null)
          },
        })
      }
    }
  }, [showTurnstile, turnstileLoaded, onTurnstileChange])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (content.trim()) {
      onSubmit(content)
      setContent('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t('comments.placeholder')}
        className="border-border focus:ring-primary min-h-[100px] w-full resize-none rounded-lg border p-3 text-[16px] focus:ring-2 focus:outline-none"
        rows={4}
      />
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded px-4 py-2"
          >
            {t('comments.post')}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="border-border hover:bg-accent rounded border px-4 py-2"
            >
              {t('comments.cancel')}
            </button>
          )}
        </div>
        {showTurnstile && COMMENTS.turnstileSiteKey && (
          <div id="turnstile-widget"></div>
        )}
      </div>
    </form>
  )
}

interface LoginFormProps {
  onClose: () => void
  onLogin: (email: string, password: string) => void
  onGoogleLogin: () => void
  t: TranslationFunction
}

function LoginForm({ onClose, onLogin, onGoogleLogin, t }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin(email, password)
  }

  return (
    <div className="pt-safe pb-safe fixed inset-0 z-50 overflow-y-auto bg-black/50">
      <div className="flex min-h-full items-start justify-center p-4 sm:items-center">
        <div className="bg-background relative w-full max-w-md rounded-lg p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold">{t('comments.login')}</h3>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t('comments.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-border focus:ring-primary w-full rounded border px-3 py-2 text-[16px] focus:ring-2 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t('comments.password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-border focus:ring-primary w-full rounded border px-3 py-2 text-[16px] focus:ring-2 focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded py-2"
            >
              {t('comments.login')}
            </button>
          </form>
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="border-border w-full border-t"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background text-muted-foreground px-2">
                  {t('comments.or_continue')}
                </span>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              <button
                onClick={onGoogleLogin}
                className="border-border hover:bg-accent flex items-center justify-center gap-2 rounded border py-2"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {t('comments.provider_google')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface PasswordStrengthMeterProps {
  password: string
  t: TranslationFunction
}

function PasswordStrengthMeter({ password, t }: PasswordStrengthMeterProps) {
  const result = validatePassword(password)

  const strengthConfig = {
    'very-weak': {
      color: 'bg-red-600',
      text: t('comments.password_very_weak'),
      width: '20%',
      textColor: 'text-red-600',
    },
    weak: {
      color: 'bg-red-500',
      text: t('comments.password_weak'),
      width: '40%',
      textColor: 'text-red-500',
    },
    medium: {
      color: 'bg-yellow-500',
      text: t('comments.password_medium'),
      width: '60%',
      textColor: 'text-yellow-500',
    },
    strong: {
      color: 'bg-green-500',
      text: t('comments.password_strong'),
      width: '80%',
      textColor: 'text-green-500',
    },
    'very-strong': {
      color: 'bg-green-600',
      text: t('comments.password_very_strong'),
      width: '100%',
      textColor: 'text-green-600',
    },
  }

  const config = strengthConfig[result.strength]

  return (
    <div className="mt-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {t('comments.password_strength')}
        </span>
        <span className={password ? config.textColor : 'text-muted-foreground'}>
          {password ? config.text : '-'}
        </span>
      </div>
      <div className="bg-muted mt-1 h-1.5 w-full overflow-hidden rounded-full">
        <div
          className={`h-full transition-all duration-300 ${password ? config.color : 'bg-muted'}`}
          style={{ width: password ? config.width : '0%' }}
        />
      </div>
      {!result.valid && password && result.error && (
        <p className="mt-1 text-xs text-red-500">{result.error}</p>
      )}
      {password && result.valid && (
        <p className="mt-1 text-xs text-green-500">
          {t('comments.password_strength_requirements')}
        </p>
      )}
    </div>
  )
}

interface RegisterFormProps {
  onClose: () => void
  onRegister: (user?: User) => void
  t: TranslationFunction
  lang: string
}

function RegisterForm({ onClose, onRegister, t, lang }: RegisterFormProps) {
  const [step, setStep] = useState<'email' | 'verify'>('email')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/comments/auth/verification/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, lang }),
      })
      if (response.ok) {
        setStep('verify')
        alert(t('comments.verification_code_sent'))
      } else {
        const error = await response.json()
        alert(error.error || t('comments.send_code_failed'))
      }
    } catch (error) {
      console.error('Send code error:', error)
      alert(t('comments.send_code_failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!acceptedTerms) {
      alert(t('comments.terms_consent_required'))
      return
    }

    if (password !== confirmPassword) {
      alert(t('comments.password_mismatch'))
      return
    }

    try {
      const response = await fetch('/api/comments/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          username,
          password,
          code,
          acceptedTerms,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          onRegister(data.user)
        } else {
          onRegister()
        }
      } else {
        const error = await response.json()
        alert(error.error || t('comments.register_failed'))
      }
    } catch (error) {
      console.error('Registration error:', error)
      alert(t('comments.register_failed'))
    }
  }

  return (
    <div className="pt-safe pb-safe fixed inset-0 z-50 overflow-y-auto bg-black/50">
      <div className="flex min-h-full items-start justify-center p-4 sm:items-center">
        <div className="bg-background relative w-full max-w-md rounded-lg p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold">{t('comments.register')}</h3>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
          {step === 'email' ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {t('comments.email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-border focus:ring-primary w-full rounded border px-3 py-2 text-[16px] focus:ring-2 focus:outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded py-2 disabled:opacity-50"
              >
                {loading
                  ? t('comments.loading')
                  : t('comments.send_verification_code')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {t('comments.email')}
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="border-border bg-muted text-muted-foreground w-full rounded border px-3 py-2 text-[16px]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {t('comments.verification_code_label')}
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="border-border focus:ring-primary w-full rounded border px-3 py-2 text-[16px] focus:ring-2 focus:outline-none"
                  required
                  placeholder={t('comments.verification_code_placeholder')}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {t('comments.username')}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border-border focus:ring-primary w-full rounded border px-3 py-2 text-[16px] focus:ring-2 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {t('comments.password')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-border focus:ring-primary w-full rounded border px-3 py-2 text-[16px] focus:ring-2 focus:outline-none"
                  required
                />
                <PasswordStrengthMeter password={password} t={t} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {t('comments.confirm_password')}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border-border focus:ring-primary w-full rounded border px-3 py-2 text-[16px] focus:ring-2 focus:outline-none"
                  required
                />
              </div>
              <div className="flex items-start gap-2">
                <input
                  id="comments-terms-consent"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="accent-primary mt-1 h-4 w-4"
                />
                <label
                  htmlFor="comments-terms-consent"
                  className="text-muted-foreground text-sm leading-5"
                >
                  {t('comments.terms_consent_prefix')}
                  <a href={`/${lang}/terms`} className="text-primary underline">
                    {t('footer.terms')}
                  </a>
                  {t('comments.terms_consent_connector')}
                  <a
                    href={`/${lang}/privacy`}
                    className="text-primary underline"
                  >
                    {t('footer.privacy')}
                  </a>
                  {t('comments.terms_consent_suffix')}
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="border-border hover:bg-accent rounded border px-4 py-2"
                >
                  {t('comments.back')}
                </button>
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 rounded py-2"
                >
                  {t('comments.register')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
