import type { Lang } from '$lib/i18n';
import { isLang } from '$lib/i18n';
import { marked, type Token } from 'marked';

export type TocItem = {
  id: string;
  label: string;
  depth: number;
};

export type Article = {
  slug: string;
  lang: Lang;
  title: string;
  description: string;
  date: string;
  updated?: string;
  topic: string;
  coverImage?: string;
  coverImageAvif?: string;
  coverAlt?: string;
  featured?: boolean;
  markdown: string;
  html: string;
  toc: TocItem[];
  minutes: number;
};

export type ArticleSummary = Pick<
  Article,
  | 'slug'
  | 'lang'
  | 'title'
  | 'description'
  | 'date'
  | 'updated'
  | 'topic'
  | 'coverImage'
  | 'coverImageAvif'
  | 'coverAlt'
  | 'featured'
  | 'minutes'
>;

type ArticleSource = Omit<Article, 'minutes'>;

const markdownFiles = import.meta.glob('../content/articles/*.md', {
  eager: true,
  import: 'default',
  query: '?raw'
}) as Record<string, string>;

const calculateReadingMinutes = (article: ArticleSource) => {
  const text = [article.title, article.description, article.markdown].join(' ');
  const cjkCharacters = text.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  const latinWords =
    text
      .replace(/[\u3400-\u9fff]/g, ' ')
      .match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g)?.length ?? 0;

  const minutes = cjkCharacters / 500 + latinWords / 220;
  return Math.max(1, Math.ceil(minutes));
};

const withReadingTime = (article: ArticleSource): Article => ({
  ...article,
  minutes: calculateReadingMinutes(article)
});

const toArticleSummary = (article: Article): ArticleSummary => ({
  slug: article.slug,
  lang: article.lang,
  title: article.title,
  description: article.description,
  date: article.date,
  updated: article.updated,
  topic: article.topic,
  coverImage: article.coverImage,
  coverImageAvif: article.coverImageAvif,
  coverAlt: article.coverAlt,
  featured: article.featured,
  minutes: article.minutes
});

const stripQuotes = (value: string) => value.replace(/^['"]|['"]$/g, '');

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    return entities[character];
  });

const textFromTokens = (tokens: Token[]): string =>
  tokens
    .map((token) => {
      if ('tokens' in token && token.tokens) {
        return textFromTokens(token.tokens);
      }

      if ('text' in token && typeof token.text === 'string') {
        return token.text;
      }

      return '';
    })
    .join('');

const slugifyHeading = (heading: string, fallback: string) => {
  const slug = heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return slug || fallback;
};

const uniqueHeadingId = (base: string, counts: Map<string, number>) => {
  const count = counts.get(base) ?? 0;
  counts.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
};

const isSafeUrl = (href: string) => {
  const trimmedHref = href.trim();

  if (
    trimmedHref.startsWith('#') ||
    trimmedHref.startsWith('/') ||
    trimmedHref.startsWith('./') ||
    trimmedHref.startsWith('../')
  ) {
    return true;
  }

  try {
    const url = new URL(trimmedHref);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol);
  } catch {
    return false;
  }
};

const isExternalHttpUrl = (href: string) => {
  try {
    const url = new URL(href.trim());
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};

const renderMarkdown = (markdown: string) => {
  const toc: TocItem[] = [];
  const headingCounts = new Map<string, number>();
  const renderer = new marked.Renderer();

  renderer.html = ({ text }) => escapeHtml(text);

  renderer.heading = function ({ tokens, depth }) {
    const label = textFromTokens(tokens).trim();
    const fallback = `section-${toc.length + 1}`;
    const id = uniqueHeadingId(slugifyHeading(label, fallback), headingCounts);

    if (depth === 2) {
      toc.push({ id, label, depth });
    }

    return `<h${depth} id="${escapeHtml(id)}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
  };

  renderer.link = function ({ href, title, tokens }) {
    const label = this.parser.parseInline(tokens);

    if (!isSafeUrl(href)) {
      return label;
    }

    const titleAttribute = title ? ` title="${escapeHtml(title)}"` : '';
    const externalAttributes = isExternalHttpUrl(href)
      ? ' target="_blank" rel="noopener noreferrer"'
      : '';

    return `<a href="${escapeHtml(href)}"${titleAttribute}${externalAttributes}>${label}</a>`;
  };

  renderer.image = function ({ href, title, text, tokens }) {
    if (!isSafeUrl(href)) {
      return escapeHtml(text);
    }

    const alt = tokens?.length ? textFromTokens(tokens) : text;
    const titleAttribute = title ? ` title="${escapeHtml(title)}"` : '';
    return `<img src="${escapeHtml(
      href
    )}" alt="${escapeHtml(
      alt
    )}" width="1200" height="675" loading="lazy" decoding="async"${titleAttribute}>`;
  };

  return {
    html: marked(markdown, { async: false, gfm: true, renderer }),
    toc
  };
};

const parseFrontmatter = (raw: string) => {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);

  if (!match) {
    throw new Error('Article markdown is missing frontmatter');
  }

  const metadata = Object.fromEntries(
    match[1]
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf(':');
        return [line.slice(0, separator).trim(), stripQuotes(line.slice(separator + 1).trim())];
      })
  );

  return {
    metadata,
    content: raw.slice(match[0].length).trim()
  };
};

const parseArticle = ([path, raw]: [string, string]): ArticleSource => {
  const { metadata, content } = parseFrontmatter(raw);
  const slug = metadata.slug || path.split('/').pop()?.replace(/\.md$/, '');
  const markdown = content.replace(/\r\n/g, '\n');
  const { html, toc } = renderMarkdown(markdown);

  if (!slug) {
    throw new Error(`Article markdown has no slug: ${path}`);
  }

  if (!isLang(metadata.lang)) {
    throw new Error(`Article markdown has invalid lang: ${path}`);
  }

  return {
    slug,
    lang: metadata.lang,
    title: metadata.title,
    description: metadata.description,
    date: metadata.date,
    updated: metadata.updated,
    topic: metadata.topic,
    coverImage: metadata.coverImage,
    coverImageAvif: metadata.coverImageAvif,
    coverAlt: metadata.coverAlt,
    featured: metadata.featured === 'true',
    markdown,
    html,
    toc
  };
};

const articles: ArticleSource[] = Object.entries(markdownFiles).map(parseArticle);

export const getArticles = (lang: Lang) =>
  articles
    .filter((article) => article.lang === lang)
    .map(withReadingTime)
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

export const getAllArticles = () =>
  articles.map(withReadingTime).sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

export const getArticleSummaries = (lang: Lang) => getArticles(lang).map(toArticleSummary);

export const getAllArticleSummaries = () => getAllArticles().map(toArticleSummary);

export const getArticle = (lang: Lang, slug: string) =>
  getArticles(lang).find((article) => article.slug === slug);

export const getArticleSummariesBySlug = (slug: string) =>
  getAllArticleSummaries().filter((article) => article.slug === slug);

export const getRelatedArticleSummaries = (article: Article, limit = 2) =>
  getArticleSummaries(article.lang)
    .filter((item) => item.slug !== article.slug)
    .sort((a, b) => {
      if (a.topic === article.topic && b.topic !== article.topic) {
        return -1;
      }

      if (a.topic !== article.topic && b.topic === article.topic) {
        return 1;
      }

      return Date.parse(b.date) - Date.parse(a.date);
    })
    .slice(0, limit);

export const getTopics = (lang: Lang) =>
  Array.from(new Set(getArticleSummaries(lang).map((article) => article.topic)));
