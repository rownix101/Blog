// Data validation utilities

export interface ValidationResult {
  valid: boolean
  error?: string
}

// Email validation with strict rules
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' }
  }

  if (email.length > 255) {
    return { valid: false, error: 'Email is too long (max 255 characters)' }
  }

  // RFC 5322 compliant email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' }
  }

  // Check for suspicious patterns
  const suspiciousPatterns = ['<script', 'javascript:', 'data:', 'vbscript:']
  const lowerEmail = email.toLowerCase()
  for (const pattern of suspiciousPatterns) {
    if (lowerEmail.includes(pattern)) {
      return { valid: false, error: 'Email contains suspicious content' }
    }
  }

  return { valid: true }
}

// Username validation
export function validateUsername(username: string): ValidationResult {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' }
  }

  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' }
  }

  if (username.length > 20) {
    return { valid: false, error: 'Username must be no more than 20 characters' }
  }

  // Only allow alphanumeric, underscore, and hyphen
  const usernameRegex = /^[a-zA-Z0-9_-]+$/
  if (!usernameRegex.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' }
  }

  // Check for reserved usernames
  const reservedUsernames = ['admin', 'root', 'system', 'api', 'www', 'mail', 'ftp', 'localhost']
  if (reservedUsernames.includes(username.toLowerCase())) {
    return { valid: false, error: 'This username is reserved' }
  }

  return { valid: true }
}

// Password strength validation
export interface PasswordStrength {
  valid: boolean
  strength: 'very-weak' | 'weak' | 'medium' | 'strong' | 'very-strong'
  error?: string
}

export function validatePassword(password: string): PasswordStrength {
  if (!password || typeof password !== 'string') {
    return { valid: false, strength: 'very-weak', error: 'Password is required' }
  }

  if (password.length < 8) {
    return { valid: false, strength: 'very-weak', error: 'Password must be at least 8 characters' }
  }

  if (password.length > 128) {
    return { valid: false, strength: 'very-weak', error: 'Password is too long (max 128 characters)' }
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password',
    '123456',
    '12345678',
    'qwerty',
    'abc123',
    'password1',
    'admin',
    'welcome',
    'monkey',
    'dragon',
  ]
  if (commonPasswords.includes(password.toLowerCase())) {
    return { valid: false, strength: 'very-weak', error: 'Password is too common' }
  }

  // Check for sequential characters
  const checkSequential = (str: string, minSequence: number = 4): boolean => {
    const lowerStr = str.toLowerCase()
    for (let i = 0; i <= lowerStr.length - minSequence; i++) {
      let isSequential = true
      const direction = lowerStr.charCodeAt(i + 1) - lowerStr.charCodeAt(i)

      if (direction === 0) continue

      for (let j = 1; j < minSequence; j++) {
        if (lowerStr.charCodeAt(i + j + 1) - lowerStr.charCodeAt(i + j) !== direction) {
          isSequential = false
          break
        }
      }

      if (isSequential && Math.abs(direction) === 1) {
        return true
      }
    }
    return false
  }

  if (checkSequential(password, 4)) {
    return {
      valid: false,
      strength: 'very-weak',
      error: 'Password must not contain sequential characters (e.g., "abcd", "1234")',
    }
  }

  // Check for repeated characters
  const checkRepeated = (str: string, minRepeat: number = 3): boolean => {
    const lowerStr = str.toLowerCase()
    for (let i = 0; i <= lowerStr.length - minRepeat; i++) {
      const char = lowerStr[i]
      let isRepeated = true
      for (let j = 1; j < minRepeat; j++) {
        if (lowerStr[i + j] !== char) {
          isRepeated = false
          break
        }
      }
      if (isRepeated) return true
    }
    return false
  }

  if (checkRepeated(password, 3)) {
    return {
      valid: false,
      strength: 'very-weak',
      error: 'Password must not contain repeated characters (e.g., "aaa", "111")',
    }
  }

  // Check for keyboard patterns
  const checkKeyboardPatterns = (str: string, minSequence: number = 4): boolean => {
    const lowerStr = str.toLowerCase()

    // QWERTY keyboard rows
    const keyboardRows = [
      'qwertyuiop',
      'asdfghjkl',
      'zxcvbnm',
      // Reverse rows
      'poiuytrewq',
      'lkjhgfdsa',
      'mnbvcxz',
    ]

    // QWERTY keyboard columns
    const keyboardColumns = [
      'qaz',
      'wsx',
      'edc',
      'rfv',
      'tgb',
      'yhn',
      'ujm',
      'ik',
      'ol',
      'p',
      // Reverse columns
      'zaq',
      'xsw',
      'cde',
      'vfr',
      'bgt',
      'nhy',
      'mju',
      'ki',
      'lo',
    ]

    // Numeric keypad diagonals
    const keypadDiagonals = [
      '147',
      '258',
      '369',
      '753',
      '963',
      '159',
      '357',
      // Reverse diagonals
      '741',
      '852',
      '963',
      '357',
      '369',
      '951',
      '753',
    ]

    // Check all patterns
    const allPatterns = [...keyboardRows, ...keyboardColumns, ...keypadDiagonals]

    for (const pattern of allPatterns) {
      if (pattern.length < minSequence) continue

      // Check forward pattern
      if (lowerStr.includes(pattern.substring(0, minSequence))) {
        return true
      }

      // Check if password contains any substring from the pattern
      for (let i = 0; i <= pattern.length - minSequence; i++) {
        const subPattern = pattern.substring(i, i + minSequence)
        if (lowerStr.includes(subPattern)) {
          return true
        }
      }
    }

    return false
  }

  if (checkKeyboardPatterns(password, 4)) {
    return {
      valid: false,
      strength: 'very-weak',
      error: 'Password must not contain keyboard patterns (e.g., "qwer", "asdf", "753")',
    }
  }

  // Calculate strength
  let score = 0

  // Length bonus
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1

  // Character variety
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1

  // Map score to 5-level strength
  let strength: 'very-weak' | 'weak' | 'medium' | 'strong' | 'very-strong' = 'very-weak'
  if (score >= 6) {
    strength = 'very-strong'
  } else if (score >= 5) {
    strength = 'strong'
  } else if (score >= 4) {
    strength = 'medium'
  } else if (score >= 3) {
    strength = 'weak'
  }

  // Require at least medium strength for registration
  if (score < 4) {
    return {
      valid: false,
      strength,
      error: 'Password must contain at least 8 characters with a mix of uppercase, lowercase, numbers, and special characters',
    }
  }

  return { valid: true, strength }
}

// Comment content validation
export function validateCommentContent(content: string): ValidationResult {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Comment content is required' }
  }

  if (content.trim().length === 0) {
    return { valid: false, error: 'Comment cannot be empty' }
  }

  if (content.length > 5000) {
    return { valid: false, error: 'Comment is too long (max 5000 characters)' }
  }

  // Check for excessive repetition (spam detection)
  const words = content.split(/\s+/)
  const wordCount = words.length
  const uniqueWords = new Set(words.map((w) => w.toLowerCase()))
  const uniqueRatio = uniqueWords.size / wordCount

  if (wordCount > 10 && uniqueRatio < 0.3) {
    return { valid: false, error: 'Comment contains too much repetition' }
  }

  // Check for excessive capitalization
  const uppercaseCount = (content.match(/[A-Z]/g) || []).length
  const totalChars = content.replace(/\s/g, '').length
  if (totalChars > 20 && uppercaseCount / totalChars > 0.7) {
    return { valid: false, error: 'Comment contains too much capitalization' }
  }

  // Check for excessive punctuation
  const punctuationCount = (content.match(/[!?.,;:]/g) || []).length
  if (punctuationCount > 20) {
    return { valid: false, error: 'Comment contains excessive punctuation' }
  }

  return { valid: true }
}

// Spam detection
export interface SpamCheckResult {
  isSpam: boolean
  confidence: number
  reason?: string
}

export function checkSpam(content: string): SpamCheckResult {
  if (!content || typeof content !== 'string') {
    return { isSpam: false, confidence: 0 }
  }

  const lowerContent = content.toLowerCase()

  // Spam keywords
  const spamKeywords = [
    'viagra',
    'casino',
    'poker',
    'xxx',
    'porn',
    'free money',
    'click here',
    'buy now',
    'make money fast',
    'work from home',
    'lose weight',
    'winner',
    'congratulations',
    'you have won',
    'lottery',
    'inheritance',
    'nigerian',
    'western union',
    'money transfer',
    'bitcoin investment',
    'crypto investment',
    'forex trading',
    'binary options',
    'multi-level marketing',
    'mlm',
    'pyramid scheme',
    'get rich quick',
    'easy money',
    'passive income',
    'financial freedom',
    'debt relief',
    'credit repair',
    'loan approval',
    'guaranteed approval',
    'no credit check',
    'bad credit ok',
  ]

  let keywordScore = 0
  for (const keyword of spamKeywords) {
    if (lowerContent.includes(keyword)) {
      keywordScore += 1
    }
  }

  // Check for URLs (spam often contains many URLs)
  const urlRegex = /https?:\/\/[^\s]+/g
  const urls = content.match(urlRegex) || []
  if (urls.length > 3) {
    return { isSpam: true, confidence: 0.8, reason: 'Too many URLs' }
  }

  // Check for email addresses
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const emails = content.match(emailRegex) || []
  if (emails.length > 2) {
    return { isSpam: true, confidence: 0.7, reason: 'Too many email addresses' }
  }

  // Check for phone numbers
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
  const phones = content.match(phoneRegex) || []
  if (phones.length > 1) {
    return { isSpam: true, confidence: 0.6, reason: 'Contains phone numbers' }
  }

  // Calculate spam probability
  let spamProbability = 0
  if (keywordScore > 0) {
    spamProbability = Math.min(keywordScore * 0.3, 0.9)
  }

  const isSpam = spamProbability > 0.5
  const confidence = spamProbability

  return {
    isSpam,
    confidence,
    reason: isSpam ? 'Detected spam patterns' : undefined,
  }
}

// Sanitize HTML content
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  let sanitized = html

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Remove style tags
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')

  // Remove object tags
  sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')

  // Remove embed tags
  sanitized = sanitized.replace(/<embed\b[^>]*>/gi, '')

  // Remove on* event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*"[^"]*"/gi, '')
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*'[^']*'/gi, '')
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]+/gi, '')

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '')

  // Remove data: protocol (except for images)
  sanitized = sanitized.replace(/data:(?!image\/)/gi, '')

  // Remove vbscript: protocol
  sanitized = sanitized.replace(/vbscript:/gi, '')

  // Remove file: protocol
  sanitized = sanitized.replace(/file:/gi, '')

  // Allow only safe HTML tags
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'a', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
  const tagRegex = /<\/?([a-z][a-z0-9]*)[^>]*>/gi

  sanitized = sanitized.replace(tagRegex, (match, tagName) => {
    const lowerTagName = tagName.toLowerCase()
    if (allowedTags.includes(lowerTagName)) {
      // For anchor tags, only allow href and title attributes
      if (lowerTagName === 'a') {
        return match.replace(/\s+href\s*=\s*["']javascript:[^"']*["']/gi, ' href="#"')
          .replace(/\s+target\s*=\s*["']_self["']/gi, ' target="_blank"')
          .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
      }
      return match
    }
    return ''
  })

  return sanitized.trim()
}

// Validate and sanitize user input
export function validateAndSanitizeInput(input: string, maxLength: number = 1000): ValidationResult {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'Input is required' }
  }

  if (input.length > maxLength) {
    return { valid: false, error: `Input is too long (max ${maxLength} characters)` }
  }

  // Check for null bytes
  if (input.includes('\0')) {
    return { valid: false, error: 'Input contains invalid characters' }
  }

  // Check for control characters (except newlines and tabs)
  const controlChars = input.match(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g)
  if (controlChars) {
    return { valid: false, error: 'Input contains invalid characters' }
  }

  return { valid: true }
}

// Validate URL
export function validateURL(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' }
  }

  if (url.length > 2048) {
    return { valid: false, error: 'URL is too long (max 2048 characters)' }
  }

  try {
    const parsed = new URL(url)

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed' }
    }

    // Prevent localhost in production
    if (import.meta.env.PROD && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')) {
      return { valid: false, error: 'Localhost URLs are not allowed' }
    }

    // Prevent private IP addresses
    const privateIPs = /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.)/
    if (privateIPs.test(parsed.hostname)) {
      return { valid: false, error: 'Private IP addresses are not allowed' }
    }

    return { valid: true }
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }
}

// Validate OAuth state
export function validateOAuthState(state: string): ValidationResult {
  if (!state || typeof state !== 'string') {
    return { valid: false, error: 'OAuth state is required' }
  }

  if (state.length < 16 || state.length > 128) {
    return { valid: false, error: 'Invalid OAuth state length' }
  }

  // Only allow alphanumeric and some special characters
  const stateRegex = /^[a-zA-Z0-9._-]+$/
  if (!stateRegex.test(state)) {
    return { valid: false, error: 'Invalid OAuth state format' }
  }

  return { valid: true }
}

// Validate 2FA code
export function validateTwoFactorCode(code: string): ValidationResult {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: '2FA code is required' }
  }

  // Remove spaces and dashes
  const cleanedCode = code.replace(/[\s-]/g, '')

  if (cleanedCode.length !== 6) {
    return { valid: false, error: '2FA code must be 6 digits' }
  }

  if (!/^\d+$/.test(cleanedCode)) {
    return { valid: false, error: '2FA code must contain only digits' }
  }

  return { valid: true }
}

// Validate Turnstile token
export function validateTurnstileToken(token: string): ValidationResult {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Turnstile token is required' }
  }

  if (token.length < 100 || token.length > 1000) {
    return { valid: false, error: 'Invalid Turnstile token length' }
  }

  return { valid: true }
}

// Validate post ID
export function validatePostId(postId: string): ValidationResult {
  if (!postId || typeof postId !== 'string') {
    return { valid: false, error: 'Post ID is required' }
  }

  if (postId.length > 255) {
    return { valid: false, error: 'Post ID is too long' }
  }

  // Prevent path traversal
  if (postId.includes('..') || postId.includes('~')) {
    return { valid: false, error: 'Invalid post ID' }
  }

  return { valid: true }
}