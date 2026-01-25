import type { IconMap, SocialLink, Site } from '@/types'

export const SITE: Site = {
  title: "Rownix's Blog",
  description: '活着就是为了改变世界，难道还有其他原因吗？',
  href: 'https://www.rownix.dev',
  author: 'rownix101',
  locale: 'en-US',
  featuredPostCount: 2,
  postsPerPage: 6,
}

// Google Analytics
// Configure via environment variable: PUBLIC_GOOGLE_ANALYTICS_ID
export const ANALYTICS = {
  google: import.meta.env.PUBLIC_GOOGLE_ANALYTICS_ID || '',
}

// Umami Analytics
// Configure via environment variable: PUBLIC_UMAMI_WEBSITE_ID
export const UMAMI = {
  websiteId:
    import.meta.env.PUBLIC_UMAMI_WEBSITE_ID ||
    '22fac2db-2da8-4086-baad-b20d1c35a380',
}

// Vercel KV for likes and caching
// These will be automatically provided by Vercel when you add KV
export const KV = {
  url: import.meta.env.KV_URL || '',
  token: import.meta.env.KV_REST_API_TOKEN || '',
  restUrl: import.meta.env.KV_REST_API_URL || '',
}

// Brevo Newsletter
// Get your API key from https://app.brevo.com/settings/keys/api
// Set it as an environment variable: BREVO_API_KEY=your-api-key
// Optional: Set BREVO_LIST_ID to automatically add subscribers to a specific list
// Optional: Set BREVO_TEMPLATE_ID for double opt-in confirmation email (default: 5)
export const BREVO = {
  apiKey: import.meta.env.BREVO_API_KEY || '',
  listId: import.meta.env.BREVO_LIST_ID || '',
  templateId: import.meta.env.BREVO_TEMPLATE_ID || '5',
}

// Giscus Comments
// Configure via environment variables: PUBLIC_GISCUS_REPO, PUBLIC_GISCUS_REPO_ID, PUBLIC_GISCUS_CATEGORY, PUBLIC_GISCUS_CATEGORY_ID
// Get configuration from https://giscus.app/
export const GISCUS = {
  repo: import.meta.env.PUBLIC_GISCUS_REPO || 'rownix101/Blog',
  repoId: import.meta.env.PUBLIC_GISCUS_REPO_ID || 'R_kgDOQwpn1g',
  category: import.meta.env.PUBLIC_GISCUS_CATEGORY || 'Q&A',
  categoryId:
    import.meta.env.PUBLIC_GISCUS_CATEGORY_ID || 'DIC_kwDOQwpn1s4C0d9L',
  theme:
    import.meta.env.MODE === 'development'
      ? '/giscus-theme.css' // Local development
      : SITE.href + '/giscus-theme.css', // Production
  lazy: true,
}

export const NAV_LINKS: SocialLink[] = [
  {
    href: '/blog',
    label: 'Blog',
  },
  {
    href: '/about',
    label: 'About',
  },
  {
    href: '/friends',
    label: 'Friends',
  },
  {
    href: '/sponsor',
    label: 'Sponsor',
  },
]

export const SOCIAL_LINKS: SocialLink[] = [
  {
    href: 'https://github.com/rownix101',
    label: 'GitHub',
  },
  {
    href: 'https://x.com/rownix101',
    label: 'X',
  },
  {
    href: 'mailto:rownix101@gmail.com',
    label: 'Email',
  },
  {
    href: '/rss.xml',
    label: 'RSS',
  },
]

export const ICON_MAP: IconMap = {
  Website: 'lucide:globe',
  GitHub: 'lucide:github',
  LinkedIn: 'lucide:linkedin',
  X: 'simple-icons:x',
  Twitter: 'simple-icons:x',
  Email: 'lucide:mail',
  RSS: 'lucide:rss',
}

// Custom Comments System
export const COMMENTS = {
  resendApiKey: import.meta.env.RESEND_API_KEY || '',
  googleClientId: import.meta.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: import.meta.env.GOOGLE_CLIENT_SECRET || '',
  appleClientId: import.meta.env.APPLE_CLIENT_ID || '',
  appleTeamId: import.meta.env.APPLE_TEAM_ID || '',
  appleKeyId: import.meta.env.APPLE_KEY_ID || '',
  applePrivateKey: import.meta.env.APPLE_PRIVATE_KEY || '',
  turnstileSecretKey: import.meta.env.TURNSTILE_SECRET_KEY || '',
  turnstileSiteKey: import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || '',
  sessionSecret: import.meta.env.SESSION_SECRET || '',
  sessionMaxAge: parseInt(import.meta.env.SESSION_MAX_AGE || '2592000'),
  twoFactorIssuer: import.meta.env.TWO_FACTOR_ISSUER || 'MyBlog',
}

export const OAUTH_PROVIDERS = {
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scopes: ['openid', 'email', 'profile'],
  },
  apple: {
    authUrl: 'https://appleid.apple.com/auth/authorize',
    tokenUrl: 'https://appleid.apple.com/auth/token',
    scopes: ['name', 'email'],
  },
}
