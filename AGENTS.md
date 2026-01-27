# Agent Guide (AGENTS.md)

This file is for agentic coding tools operating in this repo.
Keep changes small, follow existing patterns, and verify with the commands here.

## Git Commit Requirements

**IMPORTANT:** All commits must use the following author information:
- Name: `rownix101`
- Email: `rownix101@gmail.com`

This ensures consistent commit history across the repository. Before committing, ensure your Git configuration is set correctly:

```bash
git config user.name "rownix101"
git config user.email "rownix101@gmail.com"
```

## Repo Snapshot

- Stack: Astro + TypeScript + React islands + Tailwind CSS v4, shadcn/ui (Radix primitives).
- Package manager/runtime: Bun (`packageManager: bun@1.1.38`). Node engine requirement: `>= 22.16.0`.
- Deployment target: Cloudflare Pages (static output), see `wrangler.jsonc`.
- Database: Cloudflare D1 for comments system.
- Storage: Cloudflare KV for comment-related data.

## Key Directories

- `src/pages/`: routes. i18n routes live in `src/pages/[lang]/...`.
- `src/pages/api/`: API endpoints (Astro `APIRoute`). Prefer `export const prerender = false` when runtime behavior needed.
  - `src/pages/api/comments/`: Custom comments system endpoints (auth, 2FA, OAuth, comments CRUD).
- `src/components/`: Astro components; `src/components/react/` for React islands; `src/components/ui/` for shadcn-style TSX components.
  - `CustomComments.astro`: Custom comments component (alternative to Giscus).
  - `react/Comments.tsx`: React island for comments UI.
- `src/layouts/`: page shells.
- `src/lib/`: utilities and data helpers.
  - `auth.ts`: Authentication utilities (password hashing, session tokens, JWT-like encoding).
  - `db.ts`: D1 database operations (users, sessions, comments, OAuth accounts).
  - `email.ts`: Resend email integration (verification, notifications).
  - `oauth.ts`: OAuth provider handling (Google).
  - `turnstile.ts`: Cloudflare Turnstile bot protection.
  - `validation.ts`: Input validation schemas.
  - `kv.ts`: KV storage operations.
- `src/i18n/`: locale strings + helpers.
- `src/content/`: content collections (blog/authors/projects/legal).
- `src/types/`: TypeScript type definitions.
  - `comment.ts`: Comments system types (User, Session, Comment, OAuthAccount).
  - `cloudflare.d.ts`: Cloudflare-specific type augmentations.
- `public/`: static assets (fonts/images/icons).
- `scripts/`: build helpers (friends data generation).
- `docs/`: additional documentation.
  - `COMMENTS_GUIDE.md`: Custom comments system setup and usage guide.
- `dist/`: build output (generated).

## Development Commands

- Install: `bun install`
- Dev server (port 1234): `bun run dev`
- Build: `bun run build`
- Preview build: `bun run preview`
- Friends data refresh only: `bun run build-friends-data`
- Clean install (if lockfile changes): `bun install --frozen-lockfile`

### Database Commands (D1)

- Create D1 database: `wrangler d1 create blog-comments`
- Apply schema locally: `wrangler d1 execute blog-comments --file=./schema.sql`
- Apply schema remotely: `wrangler d1 execute blog-comments --remote --file=./schema.sql`
- Query database: `wrangler d1 execute blog-comments --remote --command "SELECT * FROM comments LIMIT 10"`

### Cloudflare Commands

- Deploy to Pages: `wrangler pages deploy dist`
- Bind D1 to Pages: `wrangler pages deployment create --project-name=your-project --branch=main --d1=blog-comments`

## Lint / Format / Typecheck

- Formatting (repo standard): `bun run prettier`
  - Runs Prettier on `**/*.{ts,tsx,css,astro}` using:
    - `prettier-plugin-astro`
    - `prettier-plugin-tailwindcss` (sorts Tailwind classes)
    - `prettier-plugin-astro-organize-imports` (organizes imports)
  - Config lives in `package.json` (`semi: false`, `singleQuote: true`).
- Typecheck (Astro/TS): `bun run astro check`
  - The binary is available via the `astro` script: `"astro": "astro"`.
  - Note: the current repo baseline has TypeScript/Astro diagnostics; don't fix unrelated pre-existing errors unless your task requires it.
- Linting: no ESLint/Biome configuration found in this repo.

## Tests

- No automated unit/integration test runner is configured (no `*.test.*`, `*.spec.*`, or `__tests__` detected).
- Verification expectation for changes:
  - `bun run build` (must pass)
  - For UI changes: smoke-check `bun run dev` or `bun run preview`
  - If you add tests, run them alongside build in the same session.

## Running A Single Test

- Not applicable (no test runner configured).
- If you introduce tests in the future, prefer Bun's built-in runner and document it here (example: `bun test path/to/file.test.ts`).
- Keep tests colocated with the feature or under `src/__tests__/` if a shared setup is added.

## TypeScript & Imports

- TypeScript config: `tsconfig.json` extends `astro/tsconfigs/strict`.
  - Path alias: `@/*` maps to `./src/*` (use `@/lib/...`, `@/components/...`, etc.).
- Use type-only imports where appropriate: `import type { Foo } from '...'`.
- Import order/style:
  - Prefer absolute `@/` imports over long relative paths.
  - Let Prettier organize imports; do not hand-tune ordering.
- Favor explicit return types for exported helpers and API handlers.
- Avoid `any`; prefer narrow unions or `unknown` with explicit guards.

### Type Definitions

- Comment system types are in `src/types/comment.ts`:
  - `User`, `Session`, `Comment`, `OAuthAccount`, `CommentWithUser`
  - `CommentStatus` union type: `'pending' | 'approved' | 'rejected' | 'spam'`
  - `OAuthProvider` union type: `'google'`
- Cloudflare-specific types in `src/types/cloudflare.d.ts`
- Shared types should be added to `src/types/` following existing patterns

## Formatting & General Style

- Prettier is the source of truth. Do not add semicolons.
- Use single quotes in TS/TSX/Astro.
- Keep diffs minimal; avoid drive-by refactors while fixing bugs.
- Favor small, focused components and helpers; extract shared logic to `src/lib/`.
- Keep Tailwind classes ordered (Prettier plugin handles sorting).

## React / UI Conventions

- UI components live in `src/components/ui/` and follow a shadcn-like pattern:
  - Tailwind classes in `className` and `cva` variants.
  - Use `cn()` from `src/lib/utils.ts` to combine classes.
- Prefer existing primitives:
  - Buttons: `src/components/ui/button.tsx` (`Button`, `buttonVariants`).
  - Dialog/Dropdown/etc. under `src/components/ui/`.
- When adding UI, reuse `cn()` and existing variants instead of ad-hoc class strings.
- Use React islands (`src/components/react/`) only when interactivity is required.

## Astro Conventions

- Routes:
  - i18n pages live under `src/pages/[lang]/...`.
  - Root redirect behavior is handled in `src/pages/index.astro` (cookie + Accept-Language).
- API routes:
  - Use `import type { APIRoute } from 'astro'`.
  - Return `Response` with explicit status and `Content-Type`.
  - Prefer JSON errors shaped like `{ error: string }` for API endpoints.
- Use `export const prerender = false` for runtime behavior in API routes.
- Avoid Node-only APIs in components; the build targets static output.

### API Route Patterns

- Access D1 database via `Astro.locals.env.DB` (bound by Cloudflare adapter)
- Access KV via `Astro.locals.env.COMMENT_KV`
- Validate sessions using `validateSession()` from `src/lib/db.ts`
- Return early for validation errors (400/401/403)
- Log unexpected errors with `console.error()` and return 500
- Use `Astro.cookies` for session cookie management

## Error Handling

- Validate inputs early; return `400` for client errors.
- Catch and log unexpected failures (existing pattern uses `console.error(...)`) and return `500`.
- Do not introduce empty `catch` blocks.
- Prefer early exits and guard clauses over deeply nested conditionals.
- For comments system:
  - Use validation schemas from `src/lib/validation.ts`
  - Return specific error messages for common failures (invalid email, weak password, etc.)
  - Handle D1 query failures gracefully
  - Validate Turnstile tokens before processing forms
  - Check session validity for protected endpoints

## Naming Conventions

- Components (Astro/React): PascalCase filenames (`Header.astro`, `Newsletter.tsx`).
- Utilities: kebab-case or camelCase filenames as already used under `src/lib/`.
- Types:
  - Prefer `PascalCase` type names (`FriendApplication`).
  - Keep shared types in `src/types/` or `src/types.ts` following existing structure.
- Content:
  - Content collections configured in `src/content.config.ts`.
  - Blog posts live under `src/content/blog/<lang>/...` and must satisfy schema (title/description/date/etc.).
- Constants: `SCREAMING_SNAKE_CASE` for config-like values, otherwise `camelCase`.

## i18n Notes

- Supported locales: `zh-cn` (default), `zh-tw`, `en`, `es`, `de`, `ja`.
- Translation strings: `src/i18n/ui.ts`.
- Helpers: `src/i18n/utils.ts`.
- Pages generally assume a `lang` param from route: `src/pages/[lang]/...`.
- When adding UI text, update `src/i18n/ui.ts` for all supported locales.
- Blog content is organized by language: `src/content/blog/<lang>/...`.
- Comments system uses unified identifiers across languages (removes language prefix from pathname).

## Comments System

The project includes a custom comments system as an alternative to Giscus:

### Features

- User authentication (email/password, Google OAuth)
- Two-Factor Authentication (2FA) with TOTP and email-based codes
- Cloudflare Turnstile bot protection
- Resend email integration for verification and notifications
- D1 database for persistent storage
- Comment management (create, edit, delete, nested replies)
- Spam detection and auto-approval for verified users with 2FA
- Unified comments across all language versions

### Components

- `src/components/CustomComments.astro`: Astro wrapper component
- `src/components/react/Comments.tsx`: React island with full UI

### Usage

Replace `GiscusComments` with `CustomComments` in blog post templates:

```astro
---
import CustomComments from '@/components/CustomComments'
---

<CustomComments lang={lang} />
```

### API Endpoints

- `POST /api/comments/auth/register` - User registration
- `POST /api/comments/auth/login` - Email/password login
- `POST /api/comments/auth/logout` - Logout
- `GET /api/comments/auth/me` - Current user info
- `GET /api/comments/auth/oauth/google` - Google OAuth URL
- `POST /api/comments/auth/oauth/google` - OAuth callback
- `GET /api/comments/auth/2fa/enable` - Generate 2FA secret
- `POST /api/comments/auth/2fa/enable` - Enable 2FA
- `POST /api/comments/auth/2fa/verify` - Verify 2FA code
- `POST /api/comments/auth/2fa/disable` - Disable 2FA
- `POST /api/comments/auth/2fa/send-email` - Send email 2FA code
- `GET /api/comments/auth/verification/send` - Send verification email
- `GET /api/comments?post_id={id}` - Get comments for a post
- `POST /api/comments` - Create comment
- `GET /api/comments/{id}` - Get single comment
- `PUT /api/comments/{id}` - Update comment
- `DELETE /api/comments/{id}` - Delete comment

### Database Schema

See `schema.sql` for complete schema:
- `users` - User accounts
- `oauth_accounts` - OAuth provider connections
- `sessions` - User sessions
- `comments` - Comments and replies

### Environment Variables Required

- `RESEND_API_KEY` - Resend email service
- `GOOGLE_CLIENT_ID` - Google OAuth
- `GOOGLE_CLIENT_SECRET` - Google OAuth
- `TURNSTILE_SECRET_KEY` - Cloudflare Turnstile
- `PUBLIC_TURNSTILE_SITE_KEY` - Cloudflare Turnstile
- `SESSION_SECRET` - Session encryption (min 32 chars)
- `SESSION_MAX_AGE` - Session expiration (default: 2592000)
- `TWO_FACTOR_ISSUER` - 2FA issuer name

### Security Features

- Password hashing with PBKDF2 (Web Crypto, 100k iterations)
- Secure HTTP-only session cookies
- CSRF protection via OAuth state parameter
- Turnstile bot verification
- Content sanitization for comments
- Session validation and automatic cleanup

## Authentication & Authorization

### Password Handling

- Use `hashPassword()` from `src/lib/auth.ts` for password hashing
- Never store plain text passwords
- PBKDF2 with 100k iterations (Cloudflare Workers limit)

### Session Management

- Sessions stored in D1 database
- Token-based authentication with expiration
- Use `validateSession()` from `src/lib/db.ts` to validate requests
- Sessions automatically cleaned up on expiration

### OAuth Flow

- Google OAuth is currently supported
- OAuth accounts linked to users via `oauth_accounts` table
- State parameter for CSRF protection
- Access/refresh tokens stored for future API calls

### 2FA Implementation

- TOTP-based 2FA (Time-based One-Time Password)
- Email-based 2FA as fallback
- Users with 2FA enabled get auto-approved comments
- Use `src/lib/auth.ts` for TOTP generation/verification

## Cloudflare Pages Constraints

- The site builds to static output (`astro.config.ts` sets `output: 'static'`).
- Avoid Node-only APIs at runtime in routes/components.
- For request-time features, prefer Astro API routes or middleware-compatible patterns.
- Keep fetches deterministic at build time, or isolate runtime fetches in API routes.
- D1 database is bound via `wrangler.jsonc` and available as `env.DB` in API routes.
- KV namespace is bound via `wrangler.jsonc` and available as `env.COMMENT_KV`.
- Use `compatibility_flags: ["nodejs_compat"]` for Node.js API compatibility in Workers.
- External modules listed in `vite.ssr.external` are not bundled (Node.js polyfills).

## Cursor / Copilot Rules

- No `.cursorrules`, `.cursor/rules/`, or `.github/copilot-instructions.md` found in this repo.
- Additional project guidance exists in `CLAUDE.md` and PR templates under `.github/`.

## PR / Commit Expectations

- Commit messages typically follow Conventional Commits (`feat:`, `fix:`, `chore:`).
- If you change UI, include testing notes and screenshots in the PR description (see `.github/pull_request_template.md`).

## Environment Variables

### Required for Comments System

See `.env.example` for complete reference:

```bash
# Email Service (Resend)
RESEND_API_KEY=your-resend-api-key

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Bot Protection (Turnstile)
TURNSTILE_SECRET_KEY=your-turnstile-secret-key
PUBLIC_TURNSTILE_SITE_KEY=your-turnstile-site-key

# Session Configuration
SESSION_SECRET=your-random-secret-key-at-least-32-characters
SESSION_MAX_AGE=2592000

# 2FA Configuration
TWO_FACTOR_ISSUER=YourBlogName
```

### Optional Features

```bash
# Newsletter (Brevo)
BREVO_API_KEY=your-api-key-here
BREVO_LIST_ID=your-list-id-here
BREVO_TEMPLATE_ID=5

# Analytics
PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
PUBLIC_UMAMI_WEBSITE_ID=your-umami-website-id

# Giscus Comments (alternative)
PUBLIC_GISCUS_REPO=owner/repo
PUBLIC_GISCUS_REPO_ID=R_kgDO...
PUBLIC_GISCUS_CATEGORY=Q&A
PUBLIC_GISCUS_CATEGORY_ID=DIC_kwDO...
```

## Testing Comments System

When working on comments-related features:

1. Set up local D1 database: `wrangler d1 execute blog-comments --file=./schema.sql`
2. Configure environment variables in `.dev.vars` or `.env`
3. Test API endpoints via `bun run dev` (port 1234)
4. Verify authentication flows (register, login, OAuth, 2FA)
5. Test comment CRUD operations
6. Check email delivery (Resend dashboard)
7. Validate Turnstile integration
8. Test cross-language comment synchronization
