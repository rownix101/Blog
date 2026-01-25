# Custom Comments System Guide

This guide explains how to set up and use the custom comments system for your blog.

## Features

- **User Authentication**: Email/password registration, Google OAuth
- **Two-Factor Authentication (2FA)**: TOTP and email-based 2FA support
- **Bot Protection**: Cloudflare Turnstile integration
- **Email Notifications**: Resend integration for verification and notifications
- **D1 Database**: Cloudflare D1 for data storage
- **Comment Management**: Create, edit, delete comments with nested replies
- **Spam Detection**: Basic spam filtering
- **Auto-approval**: Verified users with 2FA enabled get auto-approved comments

## Setup Instructions

### 1. Database Setup

First, create a D1 database in Cloudflare:

```bash
# Create D1 database
wrangler d1 create blog-comments

# Note the database_id from the output
```

Update `wrangler.jsonc` with your database ID:

```json
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "blog-comments",
      "database_id": "your-database-id-here"
    }
  ]
}
```

Initialize the database schema:

```bash
# Apply schema
wrangler d1 execute blog-comments --file=./schema.sql

# Or use the remote database
wrangler d1 execute blog-comments --remote --file=./schema.sql
```

If you already have an existing database, you must apply schema updates manually. For example, to add password support:

```bash
wrangler d1 execute blog-comments --remote --command "ALTER TABLE users ADD COLUMN password_hash TEXT;"
```

### 2. Environment Variables

Create a `.env` file in your project root with the following variables:

```bash
# Resend - Email service
RESEND_API_KEY=re_xxxxxxxxxxxxxx

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Cloudflare Turnstile
TURNSTILE_SECRET_KEY=0x4xxxxxxxxxxxxx
PUBLIC_TURNSTILE_SITE_KEY=0x4xxxxxxxxxxxxx

# Session Configuration
SESSION_SECRET=your-random-secret-key-at-least-32-characters
SESSION_MAX_AGE=2592000

# 2FA Configuration
TWO_FACTOR_ISSUER=YourBlogName
```

### 3. OAuth Provider Setup

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new OAuth 2.0 client ID
3. Add authorized redirect URIs:
   - `https://your-domain.com/api/comments/auth/oauth/google/callback`
4. Copy Client ID and Client Secret

#### Apple Sign In

Apple Sign In is not supported.

#### Cloudflare Turnstile

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to Turnstile → Add Site
3. Select "Widget Mode" and "Managed Challenge"
4. Copy Site Key and Secret Key

#### Resend

1. Go to [Resend Dashboard](https://resend.com/)
2. Get your API key
3. Verify your domain (required for sending emails)

### 4. Usage

To use the custom comments system instead of Giscus, replace the `GiscusComments` component with `CustomComments` in your blog post template:

```astro
---
import CustomComments from '@/components/CustomComments.astro'
---

<!-- Your blog content -->
<CustomComments lang={lang} />
```

Or update the existing GiscusComments.astro to use the new component.

## API Endpoints

### Authentication

- `POST /api/comments/auth/register` - Register new user
- `POST /api/comments/auth/login` - Login with email/password
- `POST /api/comments/auth/logout` - Logout
- `GET /api/comments/auth/me` - Get current user info

### OAuth

- `GET /api/comments/auth/oauth/google` - Get Google OAuth URL
- `POST /api/comments/auth/oauth/google` - Handle Google OAuth callback

### 2FA

- `GET /api/comments/auth/2fa/enable` - Generate 2FA secret
- `POST /api/comments/auth/2fa/enable` - Enable 2FA
- `POST /api/comments/auth/2fa/verify` - Verify 2FA code
- `POST /api/comments/auth/2fa/disable` - Disable 2FA
- `POST /api/comments/auth/2fa/send-email` - Send email 2FA code

### Comments

- `GET /api/comments?post_id={id}` - Get comments for a post
- `POST /api/comments` - Create a new comment
- `GET /api/comments/{id}` - Get a single comment
- `PUT /api/comments/{id}` - Update a comment
- `DELETE /api/comments/{id}` - Delete a comment

## Database Schema

### Tables

- `users` - User accounts
- `oauth_accounts` - OAuth provider connections
- `sessions` - User sessions
- `two_factor_tokens` - 2FA verification tokens
- `comments` - Comments and replies

## Security Features

- **Password Hashing**: PBKDF2 (Web Crypto) for password storage
- **Session Management**: Secure HTTP-only cookies
- **CSRF Protection**: State parameter for OAuth
- **Bot Protection**: Turnstile verification
- **Spam Filtering**: Keyword-based spam detection
- **Content Sanitization**: HTML sanitization for comments
- **Rate Limiting**: Can be added via Cloudflare Workers

## Deployment

Deploy to Cloudflare Pages:

```bash
# Build the project
bun run build

# Deploy
wrangler pages deploy dist
```

Make sure your D1 database is bound to your Pages project:

```bash
# Bind D1 database to Pages project
wrangler pages deployment create --project-name=your-project --branch=main \
  --d1=blog-comments
```

## Troubleshooting

### Database Connection Issues

Make sure the D1 binding is correctly configured in `wrangler.jsonc` and bound to your Pages project.

### OAuth Callback Failures

Check that redirect URIs match exactly between your OAuth provider configuration and your domain.

### Turnstile Not Loading

Ensure the Turnstile script is loaded and the site key is correctly set in environment variables.

### Email Not Sending

Verify your Resend API key and domain configuration. Check Resend dashboard for error logs.

## Future Enhancements

- Add rate limiting
- Implement comment moderation dashboard
- Add email notification preferences
- Support markdown in comments
- Add comment reactions/likes
- Implement comment search
- Add admin panel for comment management
