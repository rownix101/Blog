import { COMMENTS } from '@/consts'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

// Common email template with site branding
function getEmailHtml(title: string, bodyContent: string, footerText: string) {
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: hsl(20 10% 8%);
            background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
            margin: 0;
            padding: 40px 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 24px;
            box-shadow: 0 20px 40px -10px rgba(249, 115, 22, 0.15), 0 8px 16px -8px rgba(0, 0, 0, 0.08);
            overflow: hidden;
          }
          .email-header {
            background: linear-gradient(135deg, hsl(12 76% 61%) 0%, hsl(12 76% 70%) 100%);
            padding: 48px 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          .email-header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -20%;
            width: 300px;
            height: 300px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
          }
          .email-header::after {
            content: '';
            position: absolute;
            bottom: -30%;
            left: -10%;
            width: 200px;
            height: 200px;
            background: rgba(255, 255, 255, 0.08);
            border-radius: 50%;
          }
          .logo {
            font-size: 28px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.02em;
            margin-bottom: 8px;
            position: relative;
            z-index: 1;
          }
          .tagline {
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
            font-weight: 400;
            letter-spacing: 0.02em;
            position: relative;
            z-index: 1;
          }
          .email-body {
            padding: 48px 40px;
          }
          .title {
            font-size: 24px;
            font-weight: 700;
            color: hsl(20 10% 8%);
            margin-bottom: 24px;
            letter-spacing: -0.02em;
          }
          .text {
            color: hsl(20 10% 35%);
            margin-bottom: 24px;
            font-size: 16px;
            line-height: 1.8;
          }
          .text strong {
            color: hsl(12 76% 61%);
            font-weight: 600;
          }
          .code-container {
            margin: 32px 0;
            text-align: center;
          }
          .code-card {
            background: linear-gradient(135deg, hsl(30 15% 99%) 0%, hsl(30 10% 95%) 100%);
            border: 2px solid hsl(12 76% 61%);
            border-radius: 16px;
            padding: 32px;
            text-align: center;
            position: relative;
            box-shadow: 0 4px 12px rgba(249, 115, 22, 0.1);
          }
          .code-label {
            font-size: 13px;
            color: hsl(20 5% 50%);
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 16px;
          }
          .code {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 42px;
            font-weight: 700;
            letter-spacing: 12px;
            color: hsl(12 76% 61%);
            line-height: 1;
            text-shadow: 0 2px 4px rgba(249, 115, 22, 0.1);
          }
          .code-hint {
            font-size: 13px;
            color: hsl(20 5% 45%);
            margin-top: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .info-box {
            background: hsl(30 15% 98%);
            border-left: 4px solid hsl(12 76% 61%);
            border-radius: 8px;
            padding: 20px 24px;
            margin: 32px 0;
          }
          .info-box p {
            font-size: 14px;
            color: hsl(20 10% 40%);
            line-height: 1.7;
            margin: 0;
          }
          .button-container {
            margin: 32px 0;
            text-align: center;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, hsl(12 76% 61%) 0%, hsl(12 76% 70%) 100%);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
            transition: all 0.2s;
          }
          .button:hover {
            box-shadow: 0 6px 16px rgba(249, 115, 22, 0.4);
            transform: translateY(-1px);
          }
          .comment {
            background: hsl(30 15% 97%);
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid hsl(12 76% 61%);
            font-style: italic;
          }
          .highlight {
            font-weight: 600;
            color: hsl(12 76% 61%);
          }
          .email-footer {
            background: hsl(30 15% 98%);
            padding: 32px 40px;
            text-align: center;
            border-top: 1px solid hsl(30 10% 90%);
          }
          .footer {
            font-size: 13px;
            color: hsl(20 5% 45%);
            line-height: 1.7;
            margin-bottom: 16px;
          }
          .copyright {
            font-size: 12px;
            color: hsl(20 5% 40%);
            opacity: 0.7;
          }

          @media (max-width: 600px) {
            body {
              padding: 20px 12px;
            }
            .container {
              border-radius: 20px;
            }
            .email-header {
              padding: 36px 24px;
            }
            .logo {
              font-size: 24px;
            }
            .email-body {
              padding: 36px 24px;
            }
            .title {
              font-size: 20px;
            }
            .text {
              font-size: 15px;
            }
            .code-card {
              padding: 24px;
            }
            .code {
              font-size: 32px;
              letter-spacing: 8px;
            }
            .email-footer {
              padding: 24px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="email-header">
            <div class="logo">Rownix's Blog</div>
            <div class="tagline">欢迎加入我们的社区</div>
          </div>
          <div class="email-body">
            <h1 class="title">${title}</h1>
            ${bodyContent}
          </div>
          <div class="email-footer">
            <p class="footer">${footerText}</p>
            <p class="copyright">&copy; ${new Date().getFullYear()} Rownix's Blog. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

// Send email using Resend
export async function sendEmail(options: EmailOptions): Promise<void> {
  if (!COMMENTS.resendApiKey) {
    throw new Error('Resend API key is not configured')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${COMMENTS.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'server@rownix.dev',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to send email: ${error}`)
  }
}

// Send verification email
export async function sendVerificationEmail(
  email: string,
  code: string,
  lang: string = 'zh-cn',
): Promise<void> {
  const t = {
    'zh-cn': {
      subject: '验证您的邮箱地址',
      title: '验证您的邮箱地址',
      greeting: '感谢您的注册！请使用下方的验证码完成注册：',
      expire: '此验证码将在 15 分钟后失效。',
      ignore: '如果您没有请求此验证，请忽略此邮件。',
    },
    'zh-tw': {
      subject: '驗證您的電子郵件地址',
      title: '驗證您的電子郵件地址',
      greeting: '感謝您的註冊！請使用下方的驗證碼完成註冊：',
      expire: '此驗證碼將在 15 分鐘後失效。',
      ignore: '如果您沒有請求此驗證，請忽略此郵件。',
    },
    en: {
      subject: 'Verify your email address',
      title: 'Verify your email address',
      greeting:
        'Thank you for signing up! Please use the verification code below to complete your registration:',
      expire: 'This code will expire in 15 minutes.',
      ignore:
        "If you didn't request this verification, please ignore this email.",
    },
    ja: {
      subject: 'メールアドレスの確認',
      title: 'メールアドレスの確認',
      greeting:
        'ご登録ありがとうございます！以下の認証コードを使用して登録を完了してください：',
      expire: 'このコードは15分後に無効になります。',
      ignore:
        'この認証をリクエストしていない場合は、このメールを無視してください。',
    },
    de: {
      subject: 'E-Mail-Adresse bestätigen',
      title: 'E-Mail-Adresse bestätigen',
      greeting:
        'Vielen Dank für Ihre Registrierung! Bitte verwenden Sie den untenstehenden Bestätigungscode, um Ihre Registrierung abzuschließen:',
      expire: 'Dieser Code läuft in 15 Minuten ab.',
      ignore:
        'Wenn Sie diese Bestätigung nicht angefordert haben, ignorieren Sie bitte diese E-Mail.',
    },
    es: {
      subject: 'Verifica tu dirección de correo electrónico',
      title: 'Verifica tu dirección de correo electrónico',
      greeting:
        '¡Gracias por registrarte! Por favor usa el código de verificación a continuación para completar tu registro:',
      expire: 'Este código expirará en 15 minutos.',
      ignore:
        'Si no solicitaste esta verificación, por favor ignora este correo electrónico.',
    },
  }

  const content = t[lang as keyof typeof t] || t['zh-cn']

  const bodyContent = `
    <p class="text">${content.greeting}</p>
    <div class="code-container">
      <div class="code-card">
        <div class="code-label">验证码</div>
        <div class="code">${code}</div>
        <div class="code-hint">${content.expire}</div>
      </div>
    </div>
    <div class="info-box">
      <p><strong>提示：</strong>如果您在 15 分钟内未能完成验证，可以重新请求发送验证码。</p>
    </div>
  `

  const html = getEmailHtml(content.title, bodyContent, content.ignore)

  await sendEmail({
    to: email,
    subject: content.subject,
    html,
    text: `${content.subject}: ${code}`,
  })
}

// Send 2FA code email
export async function sendTwoFactorEmail(
  email: string,
  code: string,
): Promise<void> {
  const bodyContent = `
    <p class="text">Use the code below to complete your sign-in:</p>
    <div class="code-container">
      <div class="code-card">
        <div class="code-label">验证码</div>
        <div class="code">${code}</div>
        <div class="code-hint">This code will expire in 5 minutes.</div>
      </div>
    </div>
  `

  const html = getEmailHtml(
    'Your two-factor authentication code',
    bodyContent,
    "If you didn't request this code, please ignore this email and secure your account.",
  )

  await sendEmail({
    to: email,
    subject: 'Your two-factor authentication code',
    html,
    text: `Your 2FA code is: ${code}`,
  })
}

// Send password reset email
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
): Promise<void> {
  const bodyContent = `
    <p class="text">We received a request to reset your password. Click the button below to create a new password:</p>
    <div class="button-container">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>
    <p class="text">This link will expire in 1 hour.</p>
  `

  const html = getEmailHtml(
    'Reset your password',
    bodyContent,
    "If you didn't request this password reset, please ignore this email.",
  )

  await sendEmail({
    to: email,
    subject: 'Reset your password',
    html,
    text: `Reset your password: ${resetUrl}`,
  })
}

// Send comment notification email
export async function sendCommentNotificationEmail(
  email: string,
  authorName: string,
  postTitle: string,
  commentContent: string,
  postUrl: string,
): Promise<void> {
  const bodyContent = `
    <p class="text"><strong class="highlight">${authorName}</strong> left a new comment:</p>
    <div class="comment">${commentContent}</div>
    <div class="button-container">
      <a href="${postUrl}" class="button">View Comment</a>
    </div>
  `

  const html = getEmailHtml(
    `New comment on "${postTitle}"`,
    bodyContent,
    "If you don't want to receive these notifications, you can unsubscribe from email settings.",
  )

  await sendEmail({
    to: email,
    subject: `New comment on "${postTitle}"`,
    html,
    text: `${authorName} commented: "${commentContent}"\n\nView: ${postUrl}`,
  })
}
