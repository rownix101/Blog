import { COMMENTS } from '@/consts'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
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

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: hsl(20 10% 8%); background-color: hsl(30 15% 99%); margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: hsl(30 15% 99%); }
          .card { background-color: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid hsl(30 10% 88%); }
          .title { font-size: 24px; font-weight: 700; color: hsl(20 10% 8%); margin-bottom: 24px; letter-spacing: -0.02em; }
          .text { color: hsl(20 10% 12%); margin-bottom: 24px; }
          .code-container { margin: 32px 0; text-align: center; }
          .code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: hsl(12 76% 61%); background: hsl(16 60% 95%); padding: 24px 32px; border-radius: 8px; display: inline-block; border: 1px solid hsl(12 76% 61%); }
          .footer { margin-top: 32px; font-size: 14px; color: hsl(20 5% 40%); text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <h1 class="title">${content.title}</h1>
            <p class="text">${content.greeting}</p>
            <div class="code-container">
              <div class="code">${code}</div>
            </div>
            <p class="text">${content.expire}</p>
            <div class="footer">
              <p>${content.ignore}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

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
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .code { font-size: 24px; font-weight: bold; letter-spacing: 4px; background: #f3f4f6; padding: 16px 24px; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Your two-factor authentication code</h2>
          <p>Use the code below to complete your sign-in:</p>
          <div class="code">${code}</div>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't request this code, please ignore this email and secure your account.</p>
        </div>
      </body>
    </html>
  `

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
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Reset your password</h2>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <p><a href="${resetUrl}" class="button">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
        </div>
      </body>
    </html>
  `

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
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .comment { background: #f9fafb; padding: 16px; border-radius: 4px; margin: 16px 0; border-left: 4px solid #6366f1; }
          .button { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>New comment on "${postTitle}"</h2>
          <p><strong>${authorName}</strong> left a new comment:</p>
          <div class="comment">${commentContent}</div>
          <p><a href="${postUrl}" class="button">View Comment</a></p>
          <p>If you don't want to receive these notifications, you can unsubscribe from email settings.</p>
        </div>
      </body>
    </html>
  `

  await sendEmail({
    to: email,
    subject: `New comment on "${postTitle}"`,
    html,
    text: `${authorName} commented: "${commentContent}"\n\nView: ${postUrl}`,
  })
}
