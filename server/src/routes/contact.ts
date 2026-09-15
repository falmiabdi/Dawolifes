import { Router } from 'express'
import { isResendConfigured, sendEmail } from '../services/email.js'







const router = Router()

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function isEmailConfigured(): boolean {
  return isResendConfigured()
}

router.post('/', async (req, res) => {
  const { name, email, phone, service, message } = req.body ?? {}

  const cleanName = String(name ?? '').trim()
  const cleanEmail = String(email ?? '').trim().toLowerCase()
  const cleanPhone = String(phone ?? '').trim()
  const cleanService = String(service ?? '').trim()
  const cleanMessage = String(message ?? '').trim()

  if (!cleanName || !cleanEmail || !cleanMessage) {
    return res.status(400).json({ success: false, error: 'Name, email, and message are required.' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ success: false, error: 'A valid email address is required.' })
  }
  if (!isEmailConfigured()) {
    return res.status(503).json({
      success: false,
      error: 'The contact email service is not configured. Please try again later.',
    })
  }

  const to = process.env.CONTACT_EMAIL || process.env.RESEND_FROM_EMAIL || 'support@dawolife.com'

  const subject = `New contact message from ${cleanName}${cleanService ? ` (${cleanService})` : ''}`
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#f97316;margin-bottom:4px;">New Contact Message</h2>
      <p style="color:#94a3b8;font-size:13px;margin-top:0;">Sent via the DawoLife contact form</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:8px 0;color:#64748b;width:110px;">Name</td>
          <td style="padding:8px 0;font-weight:600;">${escapeHtml(cleanName)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748b;">Email</td>
          <td style="padding:8px 0;"><a href="mailto:${escapeHtml(cleanEmail)}">${escapeHtml(cleanEmail)}</a></td>
        </tr>
        ${cleanPhone ? `<tr><td style="padding:8px 0;color:#64748b;">Phone</td><td style="padding:8px 0;">${escapeHtml(cleanPhone)}</td></tr>` : ''}
        ${cleanService ? `<tr><td style="padding:8px 0;color:#64748b;">Service</td><td style="padding:8px 0;">${escapeHtml(cleanService)}</td></tr>` : ''}
      </table>
      <div style="margin-top:16px;padding:16px;background:#f8fafc;border-radius:8px;white-space:pre-wrap;font-size:14px;line-height:1.5;">
        ${escapeHtml(cleanMessage)}
      </div>
      <p style="color:#94a3b8;font-size:12px;margin-top:20px;">Reply directly to this email or click the address above to reply to the customer.</p>
    </div>
  `
  const text = [
    'New Contact Message',
    '------------------------------',
    `Name: ${cleanName}`,
    `Email: ${cleanEmail}`,
    ...(cleanPhone ? [`Phone: ${cleanPhone}`] : []),
    ...(cleanService ? [`Service: ${cleanService}`] : []),
    '',
    cleanMessage,
  ].join('\n')

  try {
    await sendEmail({
      to: { email: to, name: process.env.RESEND_FROM_NAME || 'DawoLife' },
      subject,
      htmlContent: html,
      textContent: text,
      replyTo: cleanEmail,
    })
    res.json({ success: true })
  } catch (err: any) {
    console.error(`[contact] send failed: ${err?.message || err}`)
    res.status(502).json({ success: false, error: 'Failed to send your message. Please try again later.' })
  }
})

export default router