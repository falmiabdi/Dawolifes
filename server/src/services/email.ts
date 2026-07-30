const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || 'noreply@dawolife.com';
const FROM_NAME = process.env.BREVO_FROM_NAME || 'DawoLife';
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

interface SendEmailParams {
  to: { email: string; name: string };
  subject: string;
  htmlContent: string;
}

async function sendEmail({ to, subject, htmlContent }: SendEmailParams) {
  if (!BREVO_API_KEY) {
    console.warn('BREVO_API_KEY not set — skipping email to', to.email);
    return;
  }

  const res = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { email: FROM_EMAIL, name: FROM_NAME },
      to: [to],
      subject,
      htmlContent,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo email failed (${res.status}): ${body}`);
  }
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const link = `${BASE_URL}/api/auth/verify-email?token=${token}`;
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
  });
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
  });
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
  });
}
