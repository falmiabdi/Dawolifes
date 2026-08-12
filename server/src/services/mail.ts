import nodemailer, { type Transporter } from 'nodemailer'

// SMTP mail service for Brevo (and any compatible relay).
//
// Reads credentials from the environment and never hard-codes, logs, or
// returns them. When the SMTP_* variables are absent, callers fall back to
// the Brevo REST API transport in services/email.ts so local development that
// still uses BREVO_API_KEY keeps working unchanged.

interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  fromEmail: string
  fromName: string
}

let cachedTransporter: Transporter | null = null

// Mask a secret so we can log which key is in use without exposing it fully.
function maskSecret(value: string): string {
  if (!value) return '(empty)'
  if (value.length <= 8) return '*'.repeat(value.length)
  return `${value.slice(0, 4)}…${value.slice(-4)} (len ${value.length})`
}

export function readSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST || process.env.SMTP_NAME || process.env.BREVO_SMTP_NAME
  const user = process.env.SMTP_USER || process.env.BREVO_SMTP_USER
  // Fall back to BREVO_SMTP_KEY when SMTP_PASSWORD is not set.
  const pass = process.env.SMTP_PASSWORD || process.env.BREVO_SMTP_KEY
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_EMAIL || process.env.BREVO_FROM_EMAIL
  if (!host || !user || !pass || !fromEmail) return null
  return {
    host,
    port: Number(process.env.SMTP_PORT || process.env.BREVO_PORT) || 587,
    secure: false,
    user,
    pass,
    fromEmail,
    fromName: process.env.SMTP_FROM_NAME || process.env.BREVO_FROM_NAME || 'DawoLife',
  }
}

export function isSmtpConfigured(): boolean {
  return readSmtpConfig() !== null
}

export function getSmtpTransporter(): Transporter | null {
  const cfg = readSmtpConfig()
  if (!cfg) return null
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
    })
    console.log(
      `[SMTP] transporter created → host=${cfg.host}:${cfg.port} user=${cfg.user} from=${cfg.fromEmail} ` +
        `pass=${maskSecret(cfg.pass)} (env keys: SMTP_PASSWORD=${process.env.SMTP_PASSWORD ? 'set' : 'unset'} BREVO_SMTP_KEY=${process.env.BREVO_SMTP_KEY ? 'set' : 'unset'})`
    )
  }
  return cachedTransporter
}

export interface SmtpMailParams {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendMailViaSmtp({ to, subject, html, text }: SmtpMailParams): Promise<void> {
  const cfg = readSmtpConfig()
  if (!cfg) {
    throw new Error('SMTP is not configured (SMTP_HOST/SMTP_USER/SMTP_PASSWORD/SMTP_FROM_EMAIL required)')
  }
  const transporter = getSmtpTransporter()!
  try {
    await transporter.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
      to,
      subject,
      html,
      text: text || subject,
    })
    console.log(`[SMTP] sent "${subject}" to ${to}`)
  } catch (err: any) {
    console.error(
      `[SMTP] send FAILED to=${to} host=${cfg.host}:${cfg.port} user=${cfg.user} pass=${maskSecret(cfg.pass)} ` +
        `code=${err?.code || ''} responseCode=${err?.responseCode || ''} response=${JSON.stringify(err?.response || '')}`
    )
    throw err
  }
}

export interface SmtpVerifyResult {
  ok: boolean
  message: string
}

// Verifies the SMTP connection without sending a message. Errors are mapped to
// human-readable, credential-free messages so the result can be surfaced to an
// admin without leaking SMTP_PASSWORD, the SMTP key, or auth details.
export async function verifySmtpConnection(): Promise<SmtpVerifyResult> {
  const cfg = readSmtpConfig()
  if (!cfg) {
    return {
      ok: false,
      message: 'SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD and SMTP_FROM_EMAIL (or SMTP_EMAIL).',
    }
  }

  // Always verify against a fresh transporter so a bad cached config doesn't
  // mask a fix.
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  })

  try {
    await transporter.verify()
    return { ok: true, message: 'SMTP connection verified successfully.' }
  } catch (err: any) {
    return { ok: false, message: sanitizeSmtpError(err) }
  } finally {
    try {
      transporter.close()
    } catch {
      // ignore
    }
  }
}

function sanitizeSmtpError(err: any): string {
  const code = typeof err?.code === 'string' ? err.code : ''
  const raw = typeof err?.message === 'string' ? err.message : String(err || 'Unknown SMTP error')

  // Strip any credential-like fragments just in case a library echo includes them.
  const clean = raw.replace(/(smtp\s?key|password|pass|user|auth)[^\n]*/gi, '$1=***')

  if (code === 'EAUTH') {
    return 'SMTP authentication failed. Check SMTP_USER and SMTP_PASSWORD (Brevo SMTP key).'
  }
  if (code === 'EENVELOPE') {
    // Brevo rejects unverified senders with a 550 / "Sender not allowed" style error.
    if (/sender|from|not allowed|not verified|550/i.test(clean)) {
      return 'Sender email is not verified in Brevo. Verify SMTP_FROM_EMAIL as a sender in the Brevo dashboard.'
    }
    return `Brevo rejected the request: ${clean}`
  }
  if (code === 'ETIMEDOUT' || code === 'ESOCKET' || /timeout/i.test(clean)) {
    return 'SMTP connection timed out. Check SMTP_HOST, SMTP_PORT, network access and firewall rules.'
  }
  if (code === 'ECONNECTION' || code === 'ECONNREFUSED' || code === 'EENETUNREACH' || code === 'EHOSTUNREACH') {
    return 'SMTP connection failed. Check SMTP_HOST and SMTP_PORT, and that the host is reachable from Render.'
  }
  if (code === 'EDNS' || code === 'EAI_AGAIN' || code === 'ENOTFOUND') {
    return 'SMTP host could not be resolved. Check SMTP_HOST.'
  }
  return `SMTP error (${code || 'unknown'}): ${clean}`
}