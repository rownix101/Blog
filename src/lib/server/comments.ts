import type { Lang } from '$lib/i18n';

type D1PreparedStatement = {
  bind: (...values: unknown[]) => D1PreparedStatement;
  all: <T = unknown>() => Promise<{ results?: T[] }>;
  run: () => Promise<{ meta: { last_row_id?: number | string } }>;
};

export type D1DatabaseBinding = {
  prepare: (query: string) => D1PreparedStatement;
};

export type CommentPlatformEnv = {
  COMMENTS_DB?: D1DatabaseBinding;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  COMMENT_NOTIFY_EMAIL?: string;
  [key: string]: unknown;
};

export type PublicComment = {
  id: number;
  authorName: string;
  body: string;
  createdAt: string;
};

export type NewComment = {
  articleLang: Lang;
  articleSlug: string;
  articleTitle: string;
  articleUrl: string;
  authorName: string;
  authorEmail: string | null;
  body: string;
};

type CommentRow = {
  id: number;
  author_name: string;
  body: string;
  created_at: string;
};

export const COMMENT_LIMITS = {
  authorNameMax: 48,
  emailMax: 254,
  bodyMin: 2,
  bodyMax: 1200
} as const;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

export const normalizeCommentInput = (input: {
  authorName?: unknown;
  authorEmail?: unknown;
  body?: unknown;
}) => {
  const authorName =
    typeof input.authorName === 'string' ? normalizeWhitespace(input.authorName) : '';
  const authorEmail =
    typeof input.authorEmail === 'string' ? normalizeWhitespace(input.authorEmail).toLowerCase() : '';
  const body = typeof input.body === 'string' ? input.body.trim().replace(/\r\n/g, '\n') : '';

  const errors: Record<string, string> = {};

  if (!authorName) {
    errors.authorName = 'Name is required.';
  } else if (authorName.length > COMMENT_LIMITS.authorNameMax) {
    errors.authorName = `Name must be ${COMMENT_LIMITS.authorNameMax} characters or fewer.`;
  }

  if (authorEmail && authorEmail.length > COMMENT_LIMITS.emailMax) {
    errors.authorEmail = 'Email is too long.';
  } else if (authorEmail && !emailPattern.test(authorEmail)) {
    errors.authorEmail = 'Email is invalid.';
  }

  if (body.length < COMMENT_LIMITS.bodyMin) {
    errors.body = 'Comment is too short.';
  } else if (body.length > COMMENT_LIMITS.bodyMax) {
    errors.body = `Comment must be ${COMMENT_LIMITS.bodyMax} characters or fewer.`;
  }

  return {
    value: {
      authorName,
      authorEmail: authorEmail || null,
      body
    },
    errors
  };
};

export const listComments = async (
  db: D1DatabaseBinding,
  articleLang: Lang,
  articleSlug: string
): Promise<PublicComment[]> => {
  const result = await db
    .prepare(
      `SELECT id, author_name, body, created_at
       FROM article_comments
       WHERE article_lang = ? AND article_slug = ? AND status = 'approved'
       ORDER BY created_at ASC, id ASC
       LIMIT 100`
    )
    .bind(articleLang, articleSlug)
    .all<CommentRow>();

  return (result.results ?? []).map((row) => ({
    id: row.id,
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at
  }));
};

export const createComment = async (db: D1DatabaseBinding, comment: NewComment) => {
  const createdAt = new Date().toISOString();
  const result = await db
    .prepare(
      `INSERT INTO article_comments (
        article_lang,
        article_slug,
        author_name,
        author_email,
        body,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, 'approved', ?)`
    )
    .bind(
      comment.articleLang,
      comment.articleSlug,
      comment.authorName,
      comment.authorEmail,
      comment.body,
      createdAt
    )
    .run();

  return {
    id: Number(result.meta.last_row_id),
    authorName: comment.authorName,
    body: comment.body,
    createdAt
  } satisfies PublicComment;
};

const getEnvValue = (env: CommentPlatformEnv | undefined, key: string) => {
  const value = env?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

export const sendCommentNotification = async (
  env: CommentPlatformEnv | undefined,
  comment: NewComment
) => {
  const apiKey = getEnvValue(env, 'RESEND_API_KEY');
  const from = getEnvValue(env, 'RESEND_FROM_EMAIL');
  const to = getEnvValue(env, 'COMMENT_NOTIFY_EMAIL');

  if (!apiKey || !from || !to) return;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to,
      subject: `New comment: ${comment.articleTitle}`,
      text: [
        `Article: ${comment.articleTitle}`,
        `URL: ${comment.articleUrl}`,
        `Name: ${comment.authorName}`,
        `Email: ${comment.authorEmail ?? 'not provided'}`,
        '',
        comment.body
      ].join('\n')
    })
  });

  if (!response.ok) {
    throw new Error(`Resend comment notification failed with ${response.status}`);
  }
};
