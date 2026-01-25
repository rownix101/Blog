import type {
  Comment,
  CommentWithUser,
  Session,
  TwoFactorToken,
  User,
  OAuthAccount,
} from '@/types/comment'

export interface Env {
  DB: D1Database
}

// User operations
export async function createUser(
  db: D1Database,
  data: {
    id: string
    email: string
    username: string
    password_hash?: string | null
    avatar_url?: string
    email_verified?: number
  },
): Promise<User> {
  const now = Math.floor(Date.now() / 1000)
  const result = await db
    .prepare(
      `INSERT INTO users (id, email, username, password_hash, avatar_url, email_verified, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      data.id,
      data.email,
      data.username,
      data.password_hash ?? null,
      data.avatar_url || null,
      data.email_verified || 0,
      now,
      now,
    )
    .run()

  if (!result.success) {
    throw new Error('Failed to create user')
  }

  return getUserById(db, data.id) as Promise<User>
}

export async function getUserById(
  db: D1Database,
  id: string,
): Promise<User | null> {
  const result = await db
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first<User>()
  return result || null
}

export async function getUserByEmail(
  db: D1Database,
  email: string,
): Promise<User | null> {
  const result = await db
    .prepare('SELECT * FROM users WHERE email = ?')
    .bind(email)
    .first<User>()
  return result || null
}

export async function getUserByUsername(
  db: D1Database,
  username: string,
): Promise<User | null> {
  const result = await db
    .prepare('SELECT * FROM users WHERE username = ?')
    .bind(username)
    .first<User>()
  return result || null
}

export async function updateUserTwoFactor(
  db: D1Database,
  userId: string,
  { enabled, secret }: { enabled: boolean; secret?: string },
): Promise<void> {
  const now = Math.floor(Date.now() / 1000)
  await db
    .prepare(
      'UPDATE users SET two_factor_enabled = ?, two_factor_secret = ?, updated_at = ? WHERE id = ?',
    )
    .bind(enabled ? 1 : 0, secret || null, now, userId)
    .run()
}

export async function verifyUserEmail(
  db: D1Database,
  userId: string,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000)
  await db
    .prepare('UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?')
    .bind(now, userId)
    .run()
}

// OAuth account operations
export async function createOAuthAccount(
  db: D1Database,
  data: {
    id: string
    user_id: string
    provider: string
    provider_user_id: string
    provider_email?: string
    provider_username?: string
    provider_avatar_url?: string
    access_token?: string
    refresh_token?: string
    expires_at?: number
  },
): Promise<OAuthAccount> {
  const now = Math.floor(Date.now() / 1000)
  await db
    .prepare(
      `INSERT INTO oauth_accounts (id, user_id, provider, provider_user_id, provider_email, provider_username,
       provider_avatar_url, access_token, refresh_token, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      data.id,
      data.user_id,
      data.provider,
      data.provider_user_id,
      data.provider_email || null,
      data.provider_username || null,
      data.provider_avatar_url || null,
      data.access_token || null,
      data.refresh_token || null,
      data.expires_at || null,
      now,
      now,
    )
    .run()

  return getOAuthAccountById(db, data.id) as Promise<OAuthAccount>
}

export async function getOAuthAccountById(
  db: D1Database,
  id: string,
): Promise<OAuthAccount | null> {
  const result = await db
    .prepare('SELECT * FROM oauth_accounts WHERE id = ?')
    .bind(id)
    .first<OAuthAccount>()
  return result || null
}

export async function getOAuthAccountByProvider(
  db: D1Database,
  provider: string,
  providerUserId: string,
): Promise<OAuthAccount | null> {
  const result = await db
    .prepare(
      'SELECT * FROM oauth_accounts WHERE provider = ? AND provider_user_id = ?',
    )
    .bind(provider, providerUserId)
    .first<OAuthAccount>()
  return result || null
}

export async function getOAuthAccountsByUserId(
  db: D1Database,
  userId: string,
): Promise<OAuthAccount[]> {
  const result = await db
    .prepare('SELECT * FROM oauth_accounts WHERE user_id = ?')
    .bind(userId)
    .all<OAuthAccount>()
  return result.results || []
}

// Session operations
export async function createSession(
  db: D1Database,
  data: {
    id: string
    user_id: string
    token: string
    user_agent?: string
    ip_address?: string
    expires_at: number
  },
): Promise<Session> {
  const now = Math.floor(Date.now() / 1000)
  await db
    .prepare(
      `INSERT INTO sessions (id, user_id, token, user_agent, ip_address, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      data.id,
      data.user_id,
      data.token,
      data.user_agent || null,
      data.ip_address || null,
      data.expires_at,
      now,
    )
    .run()

  return getSessionByToken(db, data.token) as Promise<Session>
}

export async function getSessionByToken(
  db: D1Database,
  token: string,
): Promise<Session | null> {
  const result = await db
    .prepare('SELECT * FROM sessions WHERE token = ?')
    .bind(token)
    .first<Session>()
  return result || null
}

export async function deleteSession(
  db: D1Database,
  token: string,
): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run()
}

export async function deleteAllUserSessions(
  db: D1Database,
  userId: string,
): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run()
}

export async function deleteExpiredSessions(db: D1Database): Promise<void> {
  const now = Math.floor(Date.now() / 1000)
  await db.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now).run()
}

// Two factor token operations
export async function createTwoFactorToken(
  db: D1Database,
  data: {
    id: string
    user_id: string
    token: string
    type: 'email' | 'recovery'
    expires_at: number
  },
): Promise<TwoFactorToken> {
  const now = Math.floor(Date.now() / 1000)
  await db
    .prepare(
      `INSERT INTO two_factor_tokens (id, user_id, token, type, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(data.id, data.user_id, data.token, data.type, data.expires_at, now)
    .run()

  return getTwoFactorToken(db, data.token) as Promise<TwoFactorToken>
}

export async function getTwoFactorToken(
  db: D1Database,
  token: string,
): Promise<TwoFactorToken | null> {
  const result = await db
    .prepare('SELECT * FROM two_factor_tokens WHERE token = ?')
    .bind(token)
    .first<TwoFactorToken>()
  return result || null
}

export async function markTwoFactorTokenUsed(
  db: D1Database,
  token: string,
): Promise<void> {
  await db
    .prepare('UPDATE two_factor_tokens SET used = 1 WHERE token = ?')
    .bind(token)
    .run()
}

export async function deleteExpiredTwoFactorTokens(
  db: D1Database,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000)
  await db
    .prepare('DELETE FROM two_factor_tokens WHERE expires_at < ?')
    .bind(now)
    .run()
}

// Comment operations
export async function createComment(
  db: D1Database,
  data: {
    id: string
    post_id: string
    user_id: string
    parent_id?: string
    content: string
    status?: 'pending' | 'approved' | 'rejected' | 'spam'
  },
): Promise<Comment> {
  const now = Math.floor(Date.now() / 1000)
  await db
    .prepare(
      `INSERT INTO comments (id, post_id, user_id, parent_id, content, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      data.id,
      data.post_id,
      data.user_id,
      data.parent_id || null,
      data.content,
      data.status || 'pending',
      now,
      now,
    )
    .run()

  return getCommentById(db, data.id) as Promise<Comment>
}

export async function getCommentById(
  db: D1Database,
  id: string,
): Promise<Comment | null> {
  const result = await db
    .prepare('SELECT * FROM comments WHERE id = ?')
    .bind(id)
    .first<Comment>()
  return result || null
}

export async function getCommentsByPostId(
  db: D1Database,
  postId: string,
): Promise<Comment[]> {
  const result = await db
    .prepare(
      'SELECT * FROM comments WHERE post_id = ? AND status = ? ORDER BY created_at ASC',
    )
    .bind(postId, 'approved')
    .all<Comment>()
  return result.results || []
}

export async function getCommentsByPostIdWithUser(
  db: D1Database,
  postId: string,
): Promise<CommentWithUser[]> {
  const result = await db
    .prepare(
      `SELECT comments.*, users.* FROM comments
       JOIN users ON comments.user_id = users.id
       WHERE comments.post_id = ? AND comments.status = ?
       ORDER BY comments.created_at ASC`,
    )
    .bind(postId, 'approved')
    .all()

  const comments = (result.results || []) as any[]
  const commentMap = new Map<string, CommentWithUser>()
  const rootComments: CommentWithUser[] = []

  // Build comment map and separate root comments
  for (const row of comments) {
    const comment: CommentWithUser = {
      id: row.id,
      post_id: row.post_id,
      user_id: row.user_id,
      parent_id: row.parent_id,
      content: row.content,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user: {
        id: row.id_1,
        email: row.email,
        username: row.username,
        avatar_url: row.avatar_url,
        created_at: row.created_at_1,
        updated_at: row.updated_at_1,
        email_verified: row.email_verified,
        two_factor_enabled: row.two_factor_enabled,
        two_factor_secret: row.two_factor_secret,
      },
      replies: [],
    }
    commentMap.set(comment.id, comment)

    if (!comment.parent_id) {
      rootComments.push(comment)
    }
  }

  // Build reply tree
  for (const comment of commentMap.values()) {
    if (comment.parent_id) {
      const parent = commentMap.get(comment.parent_id)
      if (parent) {
        parent.replies = parent.replies || []
        parent.replies.push(comment)
      }
    }
  }

  return rootComments
}

export async function updateComment(
  db: D1Database,
  id: string,
  data: Partial<Pick<Comment, 'content' | 'status'>>,
): Promise<Comment> {
  const now = Math.floor(Date.now() / 1000)
  const updates: string[] = []
  const values: any[] = []

  if (data.content !== undefined) {
    updates.push('content = ?')
    values.push(data.content)
  }
  if (data.status !== undefined) {
    updates.push('status = ?')
    values.push(data.status)
  }

  updates.push('updated_at = ?')
  values.push(now)
  values.push(id)

  await db
    .prepare(`UPDATE comments SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run()

  return getCommentById(db, id) as Promise<Comment>
}

export async function deleteComment(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM comments WHERE id = ?').bind(id).run()
}

export async function getPendingComments(db: D1Database): Promise<Comment[]> {
  const result = await db
    .prepare('SELECT * FROM comments WHERE status = ? ORDER BY created_at DESC')
    .bind('pending')
    .all<Comment>()
  return result.results || []
}
