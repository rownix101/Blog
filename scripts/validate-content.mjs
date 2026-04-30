import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const articlesDir = join(root, 'src/content/articles');
const publicDir = join(root, 'static');
const requiredFields = ['slug', 'lang', 'title', 'description', 'date', 'topic'];
const supportedLangs = new Set(['zh', 'en']);
const errors = [];
const warnings = [];

const stripQuotes = (value) => value.replace(/^['"]|['"]$/g, '');

const parseFrontmatter = (file, raw) => {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);

  if (!match) {
    errors.push(`${file}: missing frontmatter block`);
    return {};
  }

  return Object.fromEntries(
    match[1]
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf(':');

        if (separator === -1) {
          errors.push(`${file}: invalid frontmatter line "${line}"`);
          return [line, ''];
        }

        return [line.slice(0, separator).trim(), stripQuotes(line.slice(separator + 1).trim())];
      })
  );
};

const articles = readdirSync(articlesDir)
  .filter((file) => file.endsWith('.md'))
  .map((file) => {
    const path = join(articlesDir, file);
    const metadata = parseFrontmatter(file, readFileSync(path, 'utf8'));

    return { file, metadata };
  });

const seenByLang = new Set();
const slugsByLang = new Map();

for (const { file, metadata } of articles) {
  for (const field of requiredFields) {
    if (!metadata[field]) {
      errors.push(`${file}: missing required field "${field}"`);
    }
  }

  if (metadata.lang && !supportedLangs.has(metadata.lang)) {
    errors.push(`${file}: unsupported lang "${metadata.lang}"`);
  }

  if (metadata.date && Number.isNaN(Date.parse(metadata.date))) {
    errors.push(`${file}: invalid date "${metadata.date}"`);
  }

  if (metadata.slug && metadata.lang) {
    const key = `${metadata.lang}/${metadata.slug}`;

    if (seenByLang.has(key)) {
      errors.push(`${file}: duplicate slug "${metadata.slug}" for lang "${metadata.lang}"`);
    }

    seenByLang.add(key);
    slugsByLang.set(metadata.slug, new Set([...(slugsByLang.get(metadata.slug) ?? []), metadata.lang]));
  }

  if (metadata.coverImage) {
    if (!metadata.coverImage.startsWith('/')) {
      errors.push(`${file}: coverImage must be an absolute public path`);
    }

    if (!existsSync(join(publicDir, metadata.coverImage))) {
      errors.push(`${file}: coverImage does not exist: ${metadata.coverImage}`);
    }

    if (!metadata.coverAlt) {
      warnings.push(`${file}: coverImage is missing coverAlt`);
    }
  }

  if (metadata.coverImageAvif) {
    if (!metadata.coverImageAvif.startsWith('/')) {
      errors.push(`${file}: coverImageAvif must be an absolute public path`);
    }

    if (!existsSync(join(publicDir, metadata.coverImageAvif))) {
      errors.push(`${file}: coverImageAvif does not exist: ${metadata.coverImageAvif}`);
    }
  }
}

for (const [slug, langs] of slugsByLang) {
  if (langs.has('zh') && !langs.has('en')) {
    warnings.push(`${slug}: missing English version`);
  }
}

for (const warning of warnings) {
  console.warn(`Warning: ${warning}`);
}

if (errors.length) {
  for (const error of errors) {
    console.error(`Error: ${error}`);
  }

  process.exit(1);
}

console.log(`Validated ${articles.length} article files with ${warnings.length} warning(s).`);
