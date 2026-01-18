<div align="center">

## merox-erudite

[![License](https://img.shields.io/github/license/meroxdotdev/merox-erudite?color=0a0a0a&logo=github&logoColor=fff&style=for-the-badge)](LICENSE)

</div>

**merox-erudite** is a customized version of the [astro-erudite](https://github.com/jktrn/astro-erudite) theme, enhanced with additional features and modifications for a more complete blogging experience.

> **📖 Want to learn more about the original theme?**  
> This theme is based on [astro-erudite](https://github.com/jktrn/astro-erudite) by [@jktrn](https://github.com/jktrn). For detailed documentation, architecture details, and the original design philosophy, visit the [official astro-erudite repository](https://github.com/jktrn/astro-erudite).

## 🧩 二改说明

这是基于 astro-erudite 的二次改造版本，核心差异如下：

- 内容统一收敛到 `src/content/`（避免旧 `content/` 目录造成内容漂移）
- OG 图片路由使用 `src/pages/og/[...route].ts`
- 运行时统一使用 Bun（`bun install` / `bun run dev` / `bun run build`）
- Cloudflare Pages 静态输出配置已适配（见 `astro.config.ts`、`wrangler.jsonc`）

## 🎯 What's Different from astro-erudite?

This theme includes several enhancements and customizations:

### ✨ New Features

- **Newsletter Integration** - Brevo (formerly Sendinblue) newsletter subscription with GDPR-compliant consent
- **Giscus Comments** - Integrated comment system powered by GitHub discussions
- **Google AdSense** - Built-in AdSense component with view transition support
- **Analytics Support** - Google Analytics and Umami Analytics integration
- **SEO Enhancements** - FAQ Schema and HowTo Schema components for better search visibility
- **Enhanced Homepage** - Custom hero section with experience timeline and skills showcase
- **Improved Typography** - Geist font family integration
- **Better Accessibility** - Enhanced focus indicators and screen reader support

### 🎨 Design Improvements

- Custom color palette optimized for readability
- Improved contrast ratios for better accessibility
- Enhanced dark mode support
- Modern hero section with background image support
- Experience timeline component
- Skills showcase with animated tech badges

### 🔧 Technical Enhancements

- Updated dependencies to latest versions
- Improved error handling and error boundaries
- Better view transition support
- Optimized performance with lazy loading
- Enhanced TypeScript types

## 📋 Features

All features from astro-erudite plus:

- [Astro](https://astro.build/)'s [Islands](https://docs.astro.build/en/concepts/islands/) architecture
- [shadcn/ui](https://ui.shadcn.com/) with [Tailwind](https://tailwindcss.com/) styling
- [Expressive Code](https://expressive-code.com/) for code blocks
- Blog authoring with [MDX](https://mdxjs.com/) and $\LaTeX$ math rendering
- Astro [View Transitions](https://docs.astro.build/en/guides/view-transitions/)
- SEO optimization with granular metadata
- [RSS](https://en.wikipedia.org/wiki/RSS) feed and sitemap generation
- Subpost support for series content
- Author profiles and multi-author support
- Project tags and categorization
- **Newsletter subscription** (Brevo integration)
- **Giscus comments** (optional)
- **Google AdSense** support (optional)
- **Analytics** (Google Analytics & Umami)

## 🚀 Getting Started

1. **Use this template** - Click the "Use this template" button to create a new repository

2. **Clone the repository:**
   ```bash
   git clone https://github.com/[YOUR_USERNAME]/[YOUR_REPO_NAME].git
   cd [YOUR_REPO_NAME]
   ```

3. **Install dependencies:**
   ```bash
   bun install
   ```

4. **Configure environment variables** (optional):
   Create a `.env` file with:
   ```env
   # Newsletter (Brevo)
   BREVO_API_KEY=your-api-key
   BREVO_LIST_ID=your-list-id
   BREVO_TEMPLATE_ID=5

   # Analytics
   PUBLIC_GOOGLE_ANALYTICS_ID=your-ga-id
   PUBLIC_UMAMI_WEBSITE_ID=your-umami-id

   # Giscus Comments
   PUBLIC_GISCUS_REPO=your-username/your-repo
   PUBLIC_GISCUS_REPO_ID=your-repo-id
   PUBLIC_GISCUS_CATEGORY=General
   PUBLIC_GISCUS_CATEGORY_ID=your-category-id
   ```

5. **Start the development server:**
   ```bash
   bun run dev
   ```

6. **Open your browser** and visit `http://localhost:1234`

## ⚙️ Configuration

### Site Configuration

Edit `src/consts.ts` to customize:

```ts
export const SITE: Site = {
  title: 'Your Site Name',
  description: 'Your site description',
  href: 'https://yourdomain.com',
  author: 'your-author-id',
  locale: 'en-US',
  featuredPostCount: 2,
  postsPerPage: 6,
}

export const NAV_LINKS: SocialLink[] = [
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
]

export const SOCIAL_LINKS: SocialLink[] = [
  { href: 'https://github.com/username', label: 'GitHub' },
  // ... more links
]
```

### Newsletter Setup

1. Sign up for [Brevo](https://www.brevo.com/) (free tier available)
2. Get your API key from Settings → API Keys
3. Create a list and get the List ID
4. Add environment variables to `.env`

### Giscus Setup

1. Install the [Giscus app](https://github.com/apps/giscus) on your GitHub repository
2. Enable discussions on your repository (Settings → General → Features)
3. Visit [giscus.app](https://giscus.app/) to generate configuration
4. Add the environment variables to `.env`:
   - `PUBLIC_GISCUS_REPO`: Your GitHub repository (username/repo)
   - `PUBLIC_GISCUS_REPO_ID`: Repository ID (provided by Giscus)
   - `PUBLIC_GISCUS_CATEGORY`: Discussion category (usually "General")
   - `PUBLIC_GISCUS_CATEGORY_ID`: Category ID (provided by Giscus)

### AdSense Setup

1. Edit `src/components/AdSense.astro`
2. Replace `ca-pub-XXXXX` with your AdSense publisher ID
3. Replace `data-ad-slot` with your ad slot ID

## 📝 Adding Content

### Blog Posts

Add MDX files to `src/content/blog/`:

```yaml
---
title: 'Your Post Title'
description: 'A brief description'
date: 2024-01-01
tags: ['tag1', 'tag2']
image: './image.png'
authors: ['author-id']
draft: false
---
```

### Authors

Add author files to `src/content/authors/`:

```yaml
---
name: 'Author Name'
pronouns: 'they/them'
avatar: 'https://gravatar.com/avatar/...'
bio: 'Author bio'
website: 'https://example.com'
github: 'https://github.com/username'
---
```

## 🎨 Customization

### Colors

Edit `src/styles/global.css` to customize the color palette:

```css
:root {
  --primary: hsl(214 95% 52%);
  /* ... more colors */
}

[data-theme='dark'] {
  --primary: hsl(214 95% 62%);
  /* ... more colors */
}
```

### Fonts

The theme uses Geist font family. Font files are in `public/fonts/`. To change fonts:

1. Replace font files in `public/fonts/`
2. Update `@font-face` declarations in `src/styles/global.css`
3. Update `--font-sans` and `--font-mono` in the theme configuration

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 💻 Development Transparency

**Important Note:** This theme was developed exclusively using [Cursor](https://cursor.sh/) (an AI-powered code editor) with paid subscription. I am not a programmer by profession—I'm a System Administrator with a passion for sharing knowledge through blogging.

The development process involved:
- Iterative conversations with Cursor's AI assistant
- Learning and understanding code through AI explanations
- Testing and refining features with AI guidance
- Building on the excellent foundation of astro-erudite

This transparency is important because:
1. **Honesty** - You should know how this theme was created
2. **Accessibility** - It demonstrates that you don't need to be a professional developer to create useful tools
3. **AI-Assisted Development** - Shows the potential of AI coding assistants for non-programmers

While the code was written with AI assistance, all decisions about features, design, and implementation were made by me based on my needs as a blogger. The theme has been tested and is fully functional.

## 🙏 Credits

### Original Theme

This theme is a fork and customization of **[astro-erudite](https://github.com/jktrn/astro-erudite)** by [@jktrn](https://github.com/jktrn).

For comprehensive documentation, detailed feature explanations, and the original theme's design philosophy, please visit the [official astro-erudite repository](https://github.com/jktrn/astro-erudite).

### Additional Credits

- Originally inspired by [Astro Micro](https://astro-micro.vercel.app/) by [trevortylerlee](https://github.com/trevortylerlee)
- Developed with [Cursor](https://cursor.sh/) AI coding assistant

## 📚 Resources

### Official Theme Documentation

- **[astro-erudite Repository](https://github.com/jktrn/astro-erudite)** - Original theme with comprehensive documentation
- **[astro-erudite Live Demo](https://astro-erudite.vercel.app/)** - See the original theme in action

### Technology Documentation

- [Astro Documentation](https://docs.astro.build/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [MDX Documentation](https://mdxjs.com/)

---

Built with ❤️ by [merox](https://merox.dev)

*Developed using [Cursor](https://cursor.sh/) AI coding assistant*
