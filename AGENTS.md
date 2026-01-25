# Agent Guide (AGENTS.md)

This file is for agentic coding tools operating in this repo.
Keep changes small, follow existing patterns, and verify with the commands here.

## Repo Snapshot

- Stack: Astro + TypeScript + React islands + Tailwind CSS v4, shadcn/ui (Radix primitives).
- Package manager/runtime: Bun (`packageManager: bun@1.1.38`). Node engine requirement: `>= 22.16.0`.
- Deployment target: Cloudflare Pages (static output), see `wrangler.jsonc`.

## Key Directories

- `src/pages/`: routes. i18n routes live in `src/pages/[lang]/...`.
- `src/pages/api/`: API endpoints (Astro `APIRoute`). Prefer `export const prerender = false` when runtime behavior needed.
- `src/components/`: Astro components; `src/components/react/` for React islands; `src/components/ui/` for shadcn-style TSX components.
- `src/layouts/`: page shells.
- `src/lib/`: utilities and data helpers.
- `src/i18n/`: locale strings + helpers.
- `src/content/`: content collections (blog/authors/projects/legal).
- `public/`: static assets (fonts/images/icons).
- `scripts/`: build helpers (friends data generation).
- `dist/`: build output (generated).

## Development Commands

- Install: `bun install`
- Dev server (port 1234): `bun run dev`
- Build: `bun run build`
- Preview build: `bun run preview`
- Friends data refresh only: `bun run build-friends-data`
- Clean install (if lockfile changes): `bun install --frozen-lockfile`

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

## Error Handling

- Validate inputs early; return `400` for client errors.
- Catch and log unexpected failures (existing pattern uses `console.error(...)`) and return `500`.
- Do not introduce empty `catch` blocks.
- Prefer early exits and guard clauses over deeply nested conditionals.

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

- Supported locales: `zh-cn` (default) and `en`.
- Translation strings: `src/i18n/ui.ts`.
- Helpers: `src/i18n/utils.ts`.
- Pages generally assume a `lang` param from route: `src/pages/[lang]/...`.
- When adding UI text, update `src/i18n/ui.ts` for both locales.

## Cloudflare Pages Constraints

- The site builds to static output (`astro.config.ts` sets `output: 'static'`).
- Avoid Node-only APIs at runtime in routes/components.
- For request-time features, prefer Astro API routes or middleware-compatible patterns.
- Keep fetches deterministic at build time, or isolate runtime fetches in API routes.

## Cursor / Copilot Rules

- No `.cursorrules`, `.cursor/rules/`, or `.github/copilot-instructions.md` found in this repo.
- Additional project guidance exists in `CLAUDE.md` and PR templates under `.github/`.

## PR / Commit Expectations

- Commit messages typically follow Conventional Commits (`feat:`, `fix:`, `chore:`).
- If you change UI, include testing notes and screenshots in the PR description (see `.github/pull_request_template.md`).
