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
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 4px; }
          .code { font-size: 24px; font-weight: bold; letter-spacing: 4px; background: #f3f4f6; padding: 16px 24px; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Verify your email address</h2>
          <p>Thank you for signing up! Please use the verification code below to complete your registration:</p>
          <div class="code">${code}</div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
        </div>
      </body>
    </html>
  `

  await sendEmail({
    to: email,
    subject: 'Verify your email address',
    html,
    text: `Your verification code is: ${code}`,
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
