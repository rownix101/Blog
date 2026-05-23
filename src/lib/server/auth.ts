import type { D1DatabaseBinding } from './comments';

export type AuthKV = import('@cloudflare/workers-types').KVNamespace;

export type User = {
  id: number;
  email: string;
  displayName: string;
  emailVerified: boolean;
};

type UserRow = {
  id: number;
  email: string;
  display_name: string;
  email_verified: number;
};

const SESSION_TTL = 60 * 60 * 24 * 30; // 30 days in seconds
const TOKEN_TTL = 60 * 60; // 1 hour in seconds

const randomToken = () => crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');

// --- User DB operations ---

export const findUserByEmail = async (db: D1DatabaseBinding, email: string): Promise<User | null> => {
  const result = await db
    .prepare('SELECT id, email, display_name, email_verified FROM users WHERE email = ?')
    .bind(email)
    .all<UserRow>();
  const row = result.results?.[0];
  if (!row) return null;
  return { id: row.id, email: row.email, displayName: row.display_name, emailVerified: Boolean(row.email_verified) };
};

export const findUserById = async (db: D1DatabaseBinding, id: number): Promise<User | null> => {
  const result = await db
    .prepare('SELECT id, email, display_name, email_verified FROM users WHERE id = ?')
    .bind(id)
    .all<UserRow>();
  const row = result.results?.[0];
  if (!row) return null;
  return { id: row.id, email: row.email, displayName: row.display_name, emailVerified: Boolean(row.email_verified) };
};

export const createUser = async (db: D1DatabaseBinding, email: string, displayName: string): Promise<User> => {
  const result = await db
    .prepare('INSERT INTO users (email, display_name) VALUES (?, ?)')
    .bind(email, displayName)
    .run();
  return { id: Number(result.meta.last_row_id), email, displayName, emailVerified: false };
};

export const verifyUserEmail = async (db: D1DatabaseBinding, id: number): Promise<void> => {
  await db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').bind(id).run();
};

// --- OAuth: find existing linked account, or create/link user ---

export type OAuthProvider = 'google' | 'x';

type OAuthAccountRow = { user_id: number };

/**
 * Find or create a user for an OAuth login.
 * - If the provider+subject is already linked → return that user.
 * - Else if the email matches an existing user → link the account and return the user.
 * - Else → create a new user (email already verified via OAuth) and link the account.
 */
export const findOrCreateOAuthUser = async (
  db: D1DatabaseBinding,
  provider: OAuthProvider,
  subject: string,       // provider's stable user ID
  email: string,
  displayName: string
): Promise<User> => {
  // 1. Check for existing OAuth link
  const existing = await db
    .prepare('SELECT user_id FROM oauth_accounts WHERE provider = ? AND subject = ?')
    .bind(provider, subject)
    .all<OAuthAccountRow>();

  if (existing.results?.[0]) {
    const user = await findUserById(db, existing.results[0].user_id);
    if (user) return user;
  }

  // 2. Check for existing user by email
  let user = await findUserByEmail(db, email);

  if (!user) {
    // 3. Create new user, mark email as verified (OAuth provider already verified it)
    const result = await db
      .prepare('INSERT INTO users (email, display_name, email_verified) VALUES (?, ?, 1)')
      .bind(email, displayName)
      .run();
    user = { id: Number(result.meta.last_row_id), email, displayName, emailVerified: true };
  } else if (!user.emailVerified) {
    // Verify the email since the OAuth provider confirmed it
    await verifyUserEmail(db, user.id);
    user = { ...user, emailVerified: true };
  }

  // 4. Link OAuth account
  await db
    .prepare('INSERT OR IGNORE INTO oauth_accounts (provider, subject, user_id) VALUES (?, ?, ?)')
    .bind(provider, subject, user.id)
    .run();

  return user;
};

// --- KV token operations ---

const tokenKey = (token: string) => `token:${token}`;
const sessionKey = (token: string) => `session:${token}`;
const oauthStateKey = (state: string) => `oauth_state:${state}`;

export const createMagicToken = async (kv: AuthKV, userId: number, purpose: 'verify' | 'login'): Promise<string> => {
  const token = randomToken();
  await kv.put(tokenKey(token), JSON.stringify({ userId, purpose }), { expirationTtl: TOKEN_TTL });
  return token;
};

export const consumeMagicToken = async (
  kv: AuthKV,
  token: string,
  expectedPurpose: 'verify' | 'login'
): Promise<number | null> => {
  const raw = await kv.get(tokenKey(token));
  if (!raw) return null;
  const data = JSON.parse(raw) as { userId: number; purpose: string };
  if (data.purpose !== expectedPurpose) return null;
  await kv.delete(tokenKey(token));
  return data.userId;
};

export const createSession = async (kv: AuthKV, userId: number): Promise<string> => {
  const token = randomToken();
  await kv.put(sessionKey(token), String(userId), { expirationTtl: SESSION_TTL });
  return token;
};

export const getSessionUserId = async (kv: AuthKV, token: string): Promise<number | null> => {
  const raw = await kv.get(sessionKey(token));
  if (!raw) return null;
  return Number(raw);
};

export const deleteSession = async (kv: AuthKV, token: string): Promise<void> => {
  await kv.delete(sessionKey(token));
};

// --- OAuth state (CSRF protection, 10 min TTL) ---

export type OAuthStatePayload = {
  provider: OAuthProvider;
  returnTo: string;
  lang: string;
  codeVerifier?: string; // PKCE verifier for X OAuth
};

export const createOAuthState = async (
  kv: AuthKV,
  payload: OAuthStatePayload
): Promise<string> => {
  const state = randomToken();
  await kv.put(oauthStateKey(state), JSON.stringify(payload), { expirationTtl: 600 });
  return state;
};

export const consumeOAuthState = async (
  kv: AuthKV,
  state: string
): Promise<OAuthStatePayload | null> => {
  const raw = await kv.get(oauthStateKey(state));
  if (!raw) return null;
  await kv.delete(oauthStateKey(state));
  return JSON.parse(raw) as OAuthStatePayload;
};

// --- Email sending ---

const buildEmailHtml = (
  purpose: 'verify' | 'login',
  lang: 'zh' | 'en',
  link: string
): string => {
  const content = {
    verify: {
      zh: {
        heading: '验证你的邮箱',
        body: '点击下方按钮验证邮箱并完成注册。链接 <strong style="color:#09090b">1小时内</strong> 有效，过期后需重新注册。',
        cta: '验证邮箱',
        disclaimer: '如果你没有注册，请忽略此邮件。'
      },
      en: {
        heading: 'Verify your email',
        body: 'Click the button below to verify your email and complete registration. The link is valid for <strong style="color:#09090b">1 hour</strong>.',
        cta: 'Verify email',
        disclaimer: "If you didn't register, you can safely ignore this email."
      }
    },
    login: {
      zh: {
        heading: '你的登录链接',
        body: '点击下方按钮登录。链接 <strong style="color:#09090b">1小时内</strong> 有效，且只能使用一次。',
        cta: '立即登录',
        disclaimer: '如果你没有请求登录，请忽略此邮件。'
      },
      en: {
        heading: 'Your login link',
        body: 'Click the button below to sign in. The link is valid for <strong style="color:#09090b">1 hour</strong> and can only be used once.',
        cta: 'Sign in',
        disclaimer: "If you didn't request this, you can safely ignore this email."
      }
    }
  };

  const c = content[purpose][lang];

  return `<!DOCTYPE html>
<html lang="${lang}" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${c.heading}</title>
</head>
<body style="margin:0;padding:0;background:#fafafa;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#09090b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header / Brand -->
          <tr>
            <td style="padding-bottom:32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Brand mark: black square + pink offset square via nested table (box-shadow not supported in email clients) -->
                  <td style="padding-right:7px;padding-bottom:7px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:18px;height:18px;background:#09090b;"></td>
                        <td style="width:7px;"></td>
                      </tr>
                      <tr>
                        <td style="height:7px;"></td>
                        <td style="width:7px;height:7px;background:#ec4899;"></td>
                      </tr>
                    </table>
                  </td>
                  <td style="padding-left:7px;font-size:15px;font-weight:800;color:#09090b;letter-spacing:-0.01em;vertical-align:middle;">
                    BLOG
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border:1px solid #d4d4d8;padding:36px 36px 32px;">

              <!-- Top accent bar -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="height:6px;background:#09090b;"></td>
                </tr>
              </table>

              <!-- Heading -->
              <p style="margin:0 0 16px;font-size:24px;font-weight:800;line-height:1.1;color:#09090b;">
                ${c.heading}
              </p>

              <!-- Body -->
              <p style="margin:0 0 28px;font-size:15px;line-height:1.75;color:#3f3f46;">
                ${c.body}
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#09090b;">
                    <a href="${link}"
                       style="display:inline-block;padding:14px 28px;background:#09090b;color:#ffffff;font-size:15px;font-weight:800;text-decoration:none;letter-spacing:0.01em;">
                      ${c.cta} &#8594;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="margin:0 0 24px;font-size:12px;color:#71717a;line-height:1.6;">
                ${lang === 'zh' ? '按钮无法点击？复制以下链接到浏览器：' : 'Button not working? Copy and paste this link into your browser:'}<br>
                <a href="${link}" style="color:#ec4899;word-break:break-all;font-weight:700;">${link}</a>
              </p>

              <!-- Divider -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="height:1px;background:#e4e4e7;"></td>
                </tr>
              </table>

              <!-- Disclaimer -->
              <p style="margin:0;font-size:12px;color:#71717a;line-height:1.6;">
                ${c.disclaimer}
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;font-weight:700;">
                © ${new Date().getFullYear()} BLOG
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export const sendMagicLinkEmail = async (
  resendApiKey: string,
  fromEmail: string,
  toEmail: string,
  link: string,
  purpose: 'verify' | 'login',
  lang: 'zh' | 'en'
): Promise<void> => {
  const subjects = {
    verify: { zh: '验证你的邮箱', en: 'Verify your email' },
    login: { zh: '登录链接', en: 'Your login link' }
  };
  const textBodies = {
    verify: {
      zh: `点击以下链接验证邮箱并完成注册（1小时内有效）：\n\n${link}\n\n如果你没有注册，请忽略此邮件。`,
      en: `Click the link below to verify your email and complete registration (valid for 1 hour):\n\n${link}\n\nIf you did not register, please ignore this email.`
    },
    login: {
      zh: `点击以下链接登录（1小时内有效）：\n\n${link}\n\n如果你没有请求登录，请忽略此邮件。`,
      en: `Click the link below to log in (valid for 1 hour):\n\n${link}\n\nIf you did not request this, please ignore this email.`
    }
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${resendApiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: fromEmail,
      to: toEmail,
      subject: subjects[purpose][lang],
      html: buildEmailHtml(purpose, lang, link),
      text: textBodies[purpose][lang]
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to send email: ${response.status}`);
  }
};

// --- Input validation ---

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email: unknown): string | null => {
  if (typeof email !== 'string' || !emailPattern.test(email.trim())) return null;
  return email.trim().toLowerCase();
};

export const validateDisplayName = (name: unknown): string | null => {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 48) return null;
  return trimmed;
};
