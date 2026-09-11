import 'dotenv/config'

import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || ''
const RESEND_FROM_NAME = process.env.RESEND_FROM_NAME || 'DawoLife'

// Lazy singleton so the Resend SDK is only constructed when a key is present.
let resendClient: Resend | null = null
function getResendClient(): Resend | null {
  if (!RESEND_API_KEY) return null
  if (!resendClient) resendClient = new Resend(RESEND_API_KEY)
  return resendClient
}

export function isResendConfigured(): boolean {
  return Boolean(RESEND_API_KEY && RESEND_FROM_EMAIL)
}

/**
 * Returns the production BASE_URL only when it is a real public HTTPS host.
 * Localhost / http URLs are dropped: emails that link to "localhost" are a
 * major spam signal for Gmail and get sent straight to the spam folder.
 */
function publicBaseUrl(): string {
  const base = process.env.BASE_URL || ''
  return /^https:\/\//.test(base) && !/localhost|127\.0\.0\.1/.test(base) ? base : ''
}

/** Sends a test email via Resend and returns a credential-free result. */
export async function testResendConnection(to: string): Promise<{ ok: boolean; message: string }> {
  if (!isResendConfigured()) {
    return {
      ok: false,
      message: 'Resend is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.',
    }
  }
  const resend = getResendClient()!
  const { error } = await resend.emails.send({
    from: `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`,
    to: [to],
    subject: 'DawoLife Resend Test',
    html: '<h2 style="color:#f97316;">DawoLife Resend Test</h2><p>Resend is working successfully.</p>',
    text: 'DawoLife Resend is working successfully.',
  })
  if (error) return { ok: false, message: error.message }
  return { ok: true, message: 'Test email sent via Resend.' }
}

interface SendEmailParams {
  to: { email: string; name: string }
  subject: string
  htmlContent: string
  textContent?: string
  replyTo?: string
}

export async function sendEmail({ to, subject, htmlContent, textContent, replyTo }: SendEmailParams) {
  // 1) Resend API (preferred transactional provider for OTP delivery).
  if (isResendConfigured()) {
    const resend = getResendClient()!
    const { error } = await resend.emails.send({
      from: `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`,
      to: [to.email],
      subject,
      html: htmlContent,
      text: textContent || undefined,
      ...(replyTo ? { replyTo } : {}),
    })
    if (error) {
      throw new Error(`Resend email failed: ${error.message}`)
    }
    console.log(`[Resend] sent "${subject}" to ${to.email}`)
    return
  }

  console.warn('Resend not configured. Skipping email to', to.email)
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const base = publicBaseUrl()
  if (!base) {
    console.warn('[Email] Skipping verification link — BASE_URL is not a public HTTPS host.')
    return
  }
  const link = `${base}/api/auth/verify-email?token=${encodeURIComponent(token)}`
  await sendEmail({
    to: { email, name },
    subject: 'Verify your DawoLife email address',
    htmlContent: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#f97316;">Welcome to DawoLife!</h2>
        <p>Hi ${name},</p>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${link}" style="display:inline-block;background:#f97316;color:#fff;padding:12px 32px;border-radius:999px;text-decoration:none;margin:16px 0;">
          Verify Email
        </a>
        <p style="color:#64748b;font-size:14px;">Or copy this link into your browser:<br/>${link}</p>
        <p style="color:#64748b;font-size:14px;">This link expires in 24 hours.</p>
      </div>
    `,
    textContent: `Welcome to DawoLife!\n\nHi ${name},\n\nVerify your email address by opening this link:\n${link}\n\nThis link expires in 24 hours.\n\nIf you did not create a DawoLife account, you can ignore this email.`,
  })
}

export async function sendOtpEmail(email: string, name: string, otp: string, verifyToken?: string) {
  const base = publicBaseUrl()
  const verifyLink = verifyToken && base
    ? `${base}/api/auth/verify-email?token=${encodeURIComponent(verifyToken)}`
    : ''
  await sendEmail({
    to: { email, name },
    subject: 'Your DawoLife verification code',
    htmlContent: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#f97316;">Verify your email</h2>
        <p>Hi ${name},</p>
        <p>Welcome to DawoLife! To finish creating your account, use this <strong>verification code</strong>:</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#0f172a;background:#f1f5f9;border-radius:12px;padding:16px;text-align:center;">
          ${otp}
        </p>
        <p style="color:#64748b;font-size:14px;">Enter this code on the verification page to confirm your email address. Please do not share it with anyone.</p>
        ${verifyLink ? `
        <p style="color:#64748b;font-size:14px;">Or click the button below to verify instantly:</p>
        <a href="${verifyLink}" style="display:inline-block;background:#f97316;color:#fff;padding:12px 32px;border-radius:999px;text-decoration:none;margin:8px 0 16px;">
          Verify Email
        </a>
        <p style="color:#64748b;font-size:14px;word-break:break-all;">${verifyLink}</p>
        ` : ''}
        <p style="color:#64748b;font-size:14px;">This code and link expire in 1 hour. If you did not create a DawoLife account, you can ignore this email.</p>
      </div>
    `,
    textContent: `Welcome to DawoLife!\n\nHi ${name},\n\nTo finish creating your account, use this verification code:\n\n${otp}\n\nEnter this code on the verification page to confirm your email address. Please do not share it with anyone.\n\n${verifyLink ? `Or verify instantly by opening this link:\n${verifyLink}\n\n` : ''}This code expires in 1 hour. If you did not create a DawoLife account, you can ignore this email.`,
  })
}

export async function sendResetPasswordEmail(email: string, name: string, otp: string) {
  await sendEmail({
    to: { email, name },
    subject: 'Reset your DawoLife password',
    htmlContent: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#f97316;">Reset your password</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your DawoLife account password. Use the code below to set a new one:</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#0f172a;background:#f1f5f9;border-radius:12px;padding:16px;text-align:center;">
          ${otp}
        </p>
        <p style="color:#64748b;font-size:14px;">This code expires in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `,
    textContent: `Hi ${name},\n\nWe received a request to reset your DawoLife account password. Use this code to set a new one:\n\n${otp}\n\nThis code expires in 1 hour. If you did not request a password reset, you can safely ignore this email.`,
  })
}

export async function sendApprovalEmail(email: string, name: string) {
  await sendEmail({
    to: { email, name },
    subject: 'Your DawoLife agent account has been approved',
    htmlContent: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#f97316;">Account Approved!</h2>
        <p>Hi ${name},</p>
        <p>Your agent account has been approved. You can now start listing properties and vehicles on DawoLife.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/agent" style="display:inline-block;background:#f97316;color:#fff;padding:12px 32px;border-radius:999px;text-decoration:none;margin:16px 0;">
          Go to Dashboard
        </a>
      </div>
    `,
  })
}

export async function sendRejectionEmail(email: string, name: string, reason: string) {
  await sendEmail({
    to: { email, name },
    subject: 'Your DawoLife agent account application status',
    htmlContent: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#ef4444;">Application Update</h2>
        <p>Hi ${name},</p>
        <p>Your agent account application has been reviewed and was not approved at this time.</p>
        <p style="background:#fef2f2;border-radius:8px;padding:12px;color:#991b1b;">
          <strong>Reason:</strong> ${reason}
        </p>
        <p>You may update your profile and resubmit your application.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/agent/profile" style="display:inline-block;background:#f97316;color:#fff;padding:12px 32px;border-radius:999px;text-decoration:none;margin:16px 0;">
          Update Profile
        </a>
      </div>
    `,
  })
}