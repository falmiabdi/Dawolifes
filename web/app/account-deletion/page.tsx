import type { Metadata } from 'next'
import { Trash2, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Delete Account — DawoLife',
  description: 'How DawoLife users can request deletion of their account and associated data.',
}

const CONTACT_EMAIL = 'info@dawolife.jebugeneraltrading.com'

export default function AccountDeletionPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
          <Trash2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Delete Your Account</h1>
          <p className="text-sm text-slate-500">DawoLife — Last updated: September 5, 2026</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="space-y-6 text-sm leading-relaxed text-slate-600">
          <p>
            DawoLife is Ethiopia's digital marketplace for buying, selling, and renting properties and
            vehicles. If you no longer wish to use your DawoLife account, you can request that your
            account and the data associated with it be permanently deleted.
          </p>

          <section>
            <h2 className="mb-2 text-lg font-bold text-slate-900">How to request account deletion</h2>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Send an email to <a href={`mailto:${CONTACT_EMAIL}`} className="text-orange-600 underline">{CONTACT_EMAIL}</a> with the subject <span className="font-medium">"Account Deletion Request"</span>.</li>
              <li>Include the email address your account is registered with. For security, replies or confirmation may ask you to verify that you own the account.</li>
              <li>Our team will process your request and confirm by email, usually within 7 business days.</li>
            </ol>
            <p className="mt-3">
              If you are signed in to the app, you can also reach out through the <span className="font-medium">About → Contact</span> section and mention that you want your account deleted.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-slate-900">What is deleted</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Your account profile and login credentials.</li>
              <li>Your personal information (name, email, phone number, verification documents and selfies).</li>
              <li>Your listings, saved items, messages, notifications, and payment-related records.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-slate-900">What is kept and why</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Records we are legally required to keep (for example, tax and transaction records required under applicable law).</li>
              <li>Anonymized or aggregated data that cannot identify you may be retained for analysis.</li>
              <li>Outstanding financial obligations (e.g., unpaid commissions) must be settled before deletion is finalized.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-slate-900">Retention period</h2>
            <p>
              Deletion requests are generally completed within 30 days of confirmation. Data that must be
              retained for legal or financial reasons is kept only as long as required by law, then deleted
              or anonymized. Push-notification device tokens are removed when your account is deleted.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-slate-900">Questions?</h2>
            <p>
              Contact us at <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-1 text-orange-600 underline"><Mail className="h-3 w-3" />{CONTACT_EMAIL}</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}