# Repository Guidelines

## Project Structure & Module Organization
- `src/` is the application source (Astro + React). Key areas: `src/pages/` for routes, `src/components/` for UI, `src/layouts/` for page shells, `src/styles/` for global styles, `src/lib/` for helpers, `src/i18n/` for localization, and `src/content/` for MDX content (blog, authors, projects).
- `public/` holds static assets (fonts, images, icons).
- `scripts/` contains build helpers (notably friends data generation).
- `docs/` and top-level `*.md` files capture project notes and docs.
- `dist/` is the build output (generated).
- `content/` appears to mirror or migrate content; prefer `src/content/` for active site content unless a script explicitly references `content/`.

## Build, Test, and Development Commands
- `bun install` installs dependencies.
- `bun run dev` starts Astro dev server after building friends data.
- `bun run build` builds the production site after rebuilding friends data.
- `bun run preview` serves the production build locally.
- `bun run build-friends-data` runs `scripts/build-friends-data.js` to refresh data inputs.
- `bun run prettier` formats `*.ts`, `*.tsx`, `*.css`, and `*.astro` files.

## Coding Style & Naming Conventions
- Primary stack: Astro, TypeScript, React, Tailwind CSS.
- Formatting: Prettier with no semicolons and single quotes (see `package.json`).
- Components use PascalCase filenames (`src/components/FloatingSidebar.astro`, `src/components/react/Newsletter.tsx`).
- Content files use kebab-case and live under `src/content/*` with frontmatter (see `README.md`).

## Testing Guidelines
- No automated test runner is configured. Validate changes with `bun run build` and spot-check `bun run dev` or `bun run preview` for UI regressions.

## Commit & Pull Request Guidelines
- Commit messages follow a Conventional Commits style (`feat:`, `fix:`, `chore:`, `revert:`).
- PRs should include a short summary, testing notes (commands run), and screenshots for UI changes. Link related issues when applicable.

## Configuration & Secrets
- Optional integrations (Brevo, analytics, Giscus) are configured via `.env` (see `README.md`). Never commit secrets.
