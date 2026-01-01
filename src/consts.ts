import type { IconMap, SocialLink, Site } from '@/types'

export const SITE: Site = {
  title: "Rownix's Blog",
  description:
    'A brief description of your blog. This will be used in meta tags and social sharing.',
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
  websiteId: import.meta.env.PUBLIC_UMAMI_WEBSITE_ID || '',
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

export const NAV_LINKS: SocialLink[] = [
  {
    href: '/blog',
    label: 'Blog',
  },
  {
    href: '/about',
    label: 'About',
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
  X: 'lucide:x',
  Twitter: 'lucide:x',
  Email: 'lucide:mail',
  RSS: 'lucide:rss',
}

// Newsletter consent text (centralized for GDPR compliance)
export const NEWSLETTER_CONSENT_TEXT = {
  text: 'I agree to receive newsletter emails.',
  privacyLink: '/privacy',
  privacyText: 'Privacy Policy',
}
