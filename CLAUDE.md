# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **merox-erudite**, a customized Astro blog theme based on astro-erudite with enhanced features including newsletter integration, Disqus comments, analytics support, and internationalization (i18n) with Chinese (zh-cn) and English (en) support.

## Common Development Commands

### Development & Building
- `npm run dev` - Start development server on port 1234
- `npm run build` - Build the production site (includes Astro type checking)
- `npm run preview` - Preview the production build
- `npm run astro <command>` - Run any Astro CLI command

### Code Formatting
- `npm run prettier` - Format all TypeScript, CSS, and Astro files
- Uses Prettier with plugins for Astro, Tailwind, and import organization

### Post-install
- `npm run postinstall` - Runs patch-package automatically

## Architecture & Structure

### Internationalization (i18n)
- **Default locale**: zh-cn (Chinese Simplified)
- **Supported locales**: zh-cn, en
- **URL structure**: `/{lang}/path/` with prefixDefaultLocale: true
- Translation files: `src/i18n/ui.ts` (translation strings) and `src/i18n/utils.ts` (utility functions)
- Content organization: `src/content/blog/{lang}/` and `src/pages/[lang]/`

### Content Collections
- **Blog posts**: `src/content/blog/{lang}/` - MDX files with frontmatter
- **Authors**: `src/content/authors/` - Author profile files
- **Projects**: `src/content/projects/` - Project showcase files

### Key Configuration Files
- `astro.config.ts` - Main Astro configuration with i18n, integrations, and Expressive Code setup
- `src/consts.ts` - Site configuration, social links, and feature toggles
- `src/content.config.ts` - Content collection schemas and validation
- `src/types.ts` - TypeScript type definitions

### Data Utilities (`src/lib/data-utils.ts`)
Core functions for content management:
- `getAllPosts(lang)` - Get published posts for a language
- `getAllPostsAndSubposts(lang)` - Includes subposts in results
- `getAdjacentPosts(currentId)` - Navigation between posts and subposts
- `getSubpostsForParent(parentId)` - Get subposts for series content
- `isSubpost(postId)` - Check if content is a subpost
- `getParentId(subpostId)` - Get parent post ID from subpost
- `getTOCSections(postId)` - Generate table of contents for posts with subposts

### Subposts System
- Supports series content with parent-child post relationships
- Subposts are nested under parent posts: `/{lang}/parent/subpost/`
- Order controlled by `order` field in frontmatter
- Combined reading time calculation for parent + subposts

### Styling & Theming
- Tailwind CSS v4 with Vite integration
- Geist font family (files in `public/fonts/`)
- CSS custom properties for theming in `src/styles/global.css`
- shadcn/ui components with Radix UI primitives

### Enhanced Features
- **Newsletter**: Brevo integration (configure via env: BREVO_API_KEY, BREVO_LIST_ID)
- **Comments**: Custom Vercel Postgres comment system with JWT authentication (see COMMENT_SYSTEM_SETUP.md)
- **Analytics**: Google Analytics and Umami support
- **Code Blocks**: Expressive Code with collapsible sections and line numbers
- **Math**: KaTeX for $\LaTeX$ rendering
- **MDX**: Enhanced with remark-emoji and rehype-external-links
- **Likes**: Vercel KV-based comment liking system

## Development Notes

### Content Creation
- Blog posts use folder structure: `src/content/blog/{lang}/post-name/index.mdx`
- Author IDs reference filename without extension
- Draft posts are excluded from builds
- Tags support automatic counting and sorting

### Environment Variables
Create `.env` file for optional features:
```
# Newsletter
BREVO_API_KEY=your-api-key
BREVO_LIST_ID=your-list-id

# Analytics
PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
PUBLIC_UMAMI_WEBSITE_ID=your-umami-id

# Comment System (Vercel Postgres)
POSTGRES_URL=your-postgres-url
POSTGRES_PRISMA_URL=your-postgres-prisma-url
POSTGRES_URL_NON_POOLING=your-postgres-non-pooling-url
POSTGRES_USER=your-postgres-user
POSTGRES_HOST=your-postgres-host
POSTGRES_PASSWORD=your-postgres-password
POSTGRES_DATABASE=your-postgres-database

# Comment System (Vercel KV for likes)
KV_URL=your-kv-url
KV_REST_API_TOKEN=your-kv-rest-api-token
KV_REST_API_URL=your-kv-rest-api-url

# Comment System (JWT)
COMMENT_JWT_SECRET=your-secure-jwt-secret
COMMENT_MODERATION_ENABLED=false
COMMENT_MAX_LENGTH=2000
```

### Type Safety
- Strict TypeScript configuration
- Content collection validation via Zod schemas
- Proper typing for i18n translations and post metadata

### Performance
- Static site generation with Astro
- Lazy loading for comments with API-based loading
- View transitions for smooth navigation
- Optimized font loading and image handling
- Edge Functions for comment API endpoints
- KV storage for millisecond-level like responses