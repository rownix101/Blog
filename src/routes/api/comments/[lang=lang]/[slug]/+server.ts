import { getArticle } from '$lib/content';
import {
  createComment,
  listComments,
  normalizeCommentInput,
  sendCommentNotification
} from '$lib/server/comments';
import { error, json, type RequestHandler } from '@sveltejs/kit';

const jsonHeaders = {
  'cache-control': 'no-store, no-cache, max-age=0, must-revalidate',
  'cdn-cache-control': 'no-store',
  'cloudflare-cdn-cache-control': 'no-store',
  expires: '0',
  pragma: 'no-cache'
};

const isMissingCommentsTable = (caughtError: unknown) =>
  caughtError instanceof Error && caughtError.message.includes('no such table: article_comments');

export const GET: RequestHandler = async ({ params, platform }) => {
  const { lang, slug } = params;
  const db = platform?.env?.COMMENTS_DB;

  if (!lang || !slug) {
    error(400, 'Invalid article route.');
  }

  const article = getArticle(lang, slug);

  if (!article) {
    error(404, 'Article not found');
  }

  if (!db) {
    return json({ enabled: false, comments: [] }, { headers: jsonHeaders });
  }

  try {
    const comments = await listComments(db, lang, slug);
    return json({ enabled: true, comments }, { headers: jsonHeaders });
  } catch (caughtError) {
    if (!isMissingCommentsTable(caughtError)) {
      console.error(caughtError);
    }
    return json({ enabled: false, comments: [] }, { headers: jsonHeaders });
  }
};

export const POST: RequestHandler = async ({ params, request, url, platform }) => {
  const { lang, slug } = params;
  const db = platform?.env?.COMMENTS_DB;

  if (!lang || !slug) {
    error(400, 'Invalid article route.');
  }

  const article = getArticle(lang, slug);

  if (!article) {
    error(404, 'Article not found');
  }

  if (!db) {
    return json(
      { message: 'Comments are not configured.' },
      { status: 503, headers: jsonHeaders }
    );
  }

  let payload: {
    authorName?: unknown;
    authorEmail?: unknown;
    body?: unknown;
    website?: unknown;
  };

  try {
    payload = await request.json();
  } catch {
    return json({ message: 'Invalid JSON body.' }, { status: 400, headers: jsonHeaders });
  }

  if (typeof payload.website === 'string' && payload.website.trim()) {
    return json({ message: 'Comment accepted.' }, { status: 202, headers: jsonHeaders });
  }

  const { value, errors } = normalizeCommentInput(payload);

  if (Object.keys(errors).length) {
    return json(
      { message: Object.values(errors)[0], errors },
      { status: 400, headers: jsonHeaders }
    );
  }

  const articleUrl = new URL(`/${lang}/articles/${slug}`, url.origin).toString();
  const newComment = {
    articleLang: lang,
    articleSlug: slug,
    articleTitle: article.title,
    articleUrl,
    ...value
  };
  let comment;

  try {
    comment = await createComment(db, newComment);
  } catch (caughtError) {
    if (!isMissingCommentsTable(caughtError)) {
      console.error(caughtError);
    }
    return json(
      { message: 'Comments are not configured.' },
      { status: 503, headers: jsonHeaders }
    );
  }

  const notification = sendCommentNotification(platform?.env, newComment);
  platform?.ctx?.waitUntil(notification.catch((error) => console.error(error)));

  return json({ comment }, { status: 201, headers: jsonHeaders });
};
