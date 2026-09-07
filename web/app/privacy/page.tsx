import type { Metadata } from 'next'
import { Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy — DawoLife',
  description: 'DawoLife Privacy Policy — how we collect, use, disclose, store, protect, and delete information when you use DawoLife.',
}

const CONTACT_EMAIL = 'info@dawolife.jebugeneraltrading.com'
const CONTACT_PHONES = ['+251 947 896 869', '+251 948 436 869']
const WEBSITE = 'https://dawolife.jebugeneraltrading.com'

function H2({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mb-3 mt-8 text-lg font-bold text-slate-900 first:mt-0">{children}</h2>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-sm leading-relaxed text-slate-600">{children}</p>
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul className="mb-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-600">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

function Ol({ items }: { items: string[] }) {
  return (
    <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-slate-600">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ol>
  )
}

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">DawoLife Privacy Policy</h1>
          <p className="text-sm text-slate-500">Last Updated: September 6, 2026</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <P>
          Jebu General Trading PLC ("Jebu General Trading PLC," "we," "us," or "our") operates the DawoLife mobile
          application and related online services ("DawoLife" or the "Service").
        </P>
        <P>
          DawoLife is a marketplace platform that allows users to discover, list, advertise, and communicate about
          real estate and vehicles.
        </P>
        <P>
          This Privacy Policy explains how we collect, use, disclose, store, protect, and delete information when you
          use DawoLife.
        </P>
        <P>By using DawoLife, you acknowledge that you have read and understood this Privacy Policy.</P>

        <H2>1. Information We Collect</H2>
        <P>Depending on how you use DawoLife, we may collect the following categories of information.</P>

        <H2>1.1 Account Information</H2>
        <P>When you create an account, we may collect:</P>
        <Ul items={[
          'Full name',
          'Email address',
          'Phone number',
          'Password or authentication information',
          'User role, such as buyer, agent, or administrator',
          'Profile information',
          'Account verification information',
        ]} />
        <P>
          Passwords are not intended to be stored in plain text. Authentication credentials are protected using
          appropriate security measures.
        </P>

        <H2>1.2 Property and Vehicle Listing Information</H2>
        <P>If you create a listing, we may collect and store information such as:</P>
        <Ul items={[
          'Property title and description',
          'Property type',
          'Property location',
          'Property price',
          'Property specifications',
          'Land, house, or apartment information',
          'Vehicle make and model',
          'Vehicle year',
          'Vehicle mileage',
          'Vehicle specifications and features',
          'Vehicle price',
          'Listing status',
          'Images and other media you upload',
          'Location information associated with a listing',
        ]} />
        <P>Information that you voluntarily publish as part of a listing may be visible to other DawoLife users.</P>

        <H2>1.3 Photos and Media</H2>
        <P>
          If you upload photographs or other media to a listing or profile, we collect and store those files to
          provide the relevant DawoLife functionality.
        </P>
        <P>We may use third-party cloud storage services to store uploaded media.</P>

        <H2>1.4 Location Information</H2>
        <P>DawoLife may use location information when necessary to provide location-related functionality, including:</P>
        <Ul items={[
          'Displaying property or vehicle locations',
          'Showing listings on maps',
          'Helping users understand the geographical location of a listing',
          'Providing location-based features',
        ]} />
        <P>We only request device location permissions when the relevant functionality requires them.</P>
        <P>You can manage location permissions through your Android device settings.</P>

        <H2>1.5 Messages and Communications</H2>
        <P>If DawoLife provides messaging functionality, we may collect and process:</P>
        <Ul items={[
          'Messages sent through DawoLife',
          'Information about the sender and recipient',
          'Message timestamps',
          'Conversation information',
        ]} />
        <P>Messaging information is used to allow users to communicate regarding listings and DawoLife services.</P>

        <H2>1.6 Email Verification and OTP Information</H2>
        <P>DawoLife may use email verification or one-time passwords (OTP) to verify accounts and protect account security.</P>
        <P>We may process:</P>
        <Ul items={[
          'Email address',
          'Verification codes',
          'Verification status',
          'Code creation and expiration information',
        ]} />
        <P>OTP codes are used for authentication and verification and are not intended to be used for purposes unrelated to account security.</P>

        <H2>1.7 Push Notification Information</H2>
        <P>DawoLife may use Firebase Cloud Messaging or similar notification technology to send notifications.</P>
        <P>Depending on your device and settings, we may process information such as:</P>
        <Ul items={[
          'Push notification token',
          'Device/application information necessary to deliver notifications',
          'Notification preferences',
        ]} />
        <P>
          Notifications may be used for messages, account activity, listing activity, verification, announcements, and
          other relevant service updates.
        </P>

        <H2>1.8 Payment Information</H2>
        <P>DawoLife may support payment services such as Chapa and TeleBirr.</P>
        <P>When you make a payment, payment information may be processed by the applicable payment provider.</P>
        <P>
          We do not intend to store complete payment card credentials or other sensitive payment credentials on DawoLife
          servers when those credentials are handled directly by the applicable payment provider.
        </P>
        <P>Payment providers may collect and process information according to their own privacy policies and terms.</P>

        <H2>1.9 Technical and Device Information</H2>
        <P>When you use DawoLife, technical information may be processed to operate, secure, and improve the Service.</P>
        <P>This may include:</P>
        <Ul items={[
          'Device type',
          'Operating system',
          'Application version',
          'IP address',
          'Network information',
          'Device identifiers or installation identifiers where applicable',
          'Error and crash information',
          'Security and authentication information',
          'Usage information necessary to operate the Service',
        ]} />
        <P>
          We do not use this information for purposes unrelated to the operation, security, or improvement of DawoLife
          unless otherwise disclosed or legally permitted.
        </P>

        <H2>2. How We Use Your Information</H2>
        <P>We may use information we collect to:</P>
        <Ol items={[
          'Create and manage your DawoLife account.',
          'Authenticate and verify your identity or account.',
          'Allow you to create, edit, publish, and manage listings.',
          'Display property and vehicle listings to other users.',
          'Display listing locations on maps.',
          'Allow users to communicate with one another.',
          'Process or facilitate payments through supported payment providers.',
          'Send verification emails and OTP codes.',
          'Send push notifications.',
          'Provide customer support.',
          'Detect, investigate, and prevent fraud, abuse, spam, and unauthorized activity.',
          'Protect the security and integrity of DawoLife.',
          'Monitor and troubleshoot technical problems.',
          'Improve the functionality, performance, and reliability of DawoLife.',
          'Comply with applicable laws and legal obligations.',
          'Enforce our Terms of Service and other applicable policies.',
          'Respond to legitimate requests from authorities where legally required.',
        ]} />

        <H2>3. Information You Choose to Make Public</H2>
        <P>Some information is intentionally displayed publicly when you use DawoLife.</P>
        <P>For example, when you publish a property or vehicle listing, other users may be able to see:</P>
        <Ul items={[
          'Listing title',
          'Description',
          'Price',
          'Listing photographs',
          'Property or vehicle information',
          'Approximate or displayed location',
          'Listing date or status',
          'Public seller/agent information that you choose to provide',
        ]} />
        <P>Do not publish personal information in a listing that you do not want other users to see.</P>

        <H2>4. User-to-User Communication</H2>
        <P>DawoLife may allow users to communicate with buyers, sellers, agents, or other users.</P>
        <P>Information you voluntarily provide through these communications may be accessible to the people with whom you communicate.</P>
        <P>
          Users should not share passwords, authentication codes, financial credentials, or other highly sensitive
          information through ordinary DawoLife messages.
        </P>
        <P>
          We may process communications when necessary to provide the messaging service, maintain security, investigate
          abuse, respond to reports, or comply with legal requirements.
        </P>

        <H2>5. User-Generated Content</H2>
        <P>DawoLife allows users to submit content such as:</P>
        <Ul items={[
          'Property listings',
          'Vehicle listings',
          'Photographs',
          'Descriptions',
          'Messages',
          'Profile information',
        ]} />
        <P>You are responsible for ensuring that content you submit is accurate and that you have the right to publish it.</P>
        <P>We may remove or restrict content that violates applicable laws, our Terms of Service, or our platform rules.</P>

        <H2>6. Third-Party Service Providers</H2>
        <P>DawoLife may use third-party service providers to operate certain parts of the Service.</P>
        <P>Depending on the features enabled in the application, these providers may include:</P>
        <P><span className="font-semibold text-slate-700">Cloudinary</span> — Cloudinary may be used to store and deliver images or other media uploaded to DawoLife.</P>
        <P><span className="font-semibold text-slate-700">Firebase</span> — Firebase services may be used for functions such as push notifications, application services, diagnostics, or other functionality depending on the version of the application.</P>
        <P><span className="font-semibold text-slate-700">Chapa</span> — Chapa may process payments when users use supported Chapa payment functionality.</P>
        <P><span className="font-semibold text-slate-700">TeleBirr</span> — TeleBirr may process payments when users use supported TeleBirr payment functionality.</P>
        <P><span className="font-semibold text-slate-700">Map Services</span> — DawoLife may use mapping services or mapping technologies to display locations and maps.</P>
        <P>These third parties may process information according to their own privacy policies and terms.</P>
        <P>
          We expect service providers that process information on our behalf to use that information only as necessary
          to provide their contracted services or as otherwise permitted by law.
        </P>

        <H2>7. Sharing of Information</H2>
        <P>We may share information in the following circumstances:</P>

        <H2>7.1 With Other Users</H2>
        <P>Information that you intentionally publish through a listing, profile, or other public DawoLife feature may be visible to other users.</P>

        <H2>7.2 With Service Providers</H2>
        <P>We may share information with service providers that help us operate DawoLife, including providers for:</P>
        <Ul items={[
          'Cloud storage',
          'Image hosting',
          'Email delivery',
          'Authentication',
          'Push notifications',
          'Payment processing',
          'Hosting',
          'Database services',
          'Security',
          'Analytics or diagnostics, where applicable',
        ]} />

        <H2>7.3 Legal Requirements</H2>
        <P>We may disclose information when we reasonably believe disclosure is necessary to:</P>
        <Ul items={[
          'Comply with applicable law',
          'Respond to a valid legal process',
          'Protect the rights or property of JebuGeneralTradingPlc or DawoLife',
          'Protect users or the public',
          'Investigate fraud, abuse, or security incidents',
        ]} />

        <H2>7.4 Business Transfers</H2>
        <P>
          If JebuGeneralTradingPlc undergoes a merger, acquisition, restructuring, sale of assets, or similar
          transaction, information may be transferred as part of that transaction, subject to applicable law.
        </P>
        <P>We do not sell users' personal information as a standalone product.</P>

        <H2>8. Data Security</H2>
        <P>We use reasonable technical and organizational measures designed to protect information against unauthorized access, alteration, disclosure, or destruction.</P>
        <P>Security measures may include:</P>
        <Ul items={[
          'Encrypted connections such as HTTPS/TLS',
          'Authentication controls',
          'Password hashing',
          'Access controls',
          'Server-side security controls',
          'Database security measures',
          'Rate limiting and abuse prevention',
          'Security monitoring and error handling',
        ]} />
        <P>However, no method of electronic storage or transmission over the internet can be guaranteed to be completely secure.</P>
        <P>You are responsible for keeping your account credentials confidential and should notify us if you believe your account has been compromised.</P>

        <H2>9. Data Retention</H2>
        <P>We retain information for as long as reasonably necessary to:</P>
        <Ul items={[
          'Provide DawoLife services',
          'Maintain your account',
          'Provide customer support',
          'Maintain transaction and service records',
          'Prevent fraud and abuse',
          'Resolve disputes',
          'Maintain security',
          'Comply with legal obligations',
        ]} />
        <P>When information is no longer reasonably required for these purposes, we may delete or anonymize it, subject to applicable legal requirements.</P>
        <P>
          Some information may need to be retained for a limited period after account deletion where required for legal,
          security, fraud-prevention, accounting, or dispute-resolution purposes.
        </P>

        <H2>10. Account Deletion</H2>
        <P>If you create a DawoLife account, you can request deletion of your account and associated personal data.</P>
        <P>DawoLife will provide an account deletion mechanism within the application where applicable and/or through an accessible account deletion request process.</P>
        <P>
          When an account deletion request is completed, we will delete or anonymize associated personal information
          that we are not legally required or otherwise permitted to retain.
        </P>
        <P>
          Certain information may be retained for a limited period where necessary to comply with legal obligations,
          resolve disputes, prevent fraud or abuse, or maintain security.
        </P>
        <P>
          For Google Play compliance, account deletion must not simply deactivate or freeze an account; eligible
          associated user data must also be deleted.
        </P>
        <P>To request account deletion, contact:</P>
        <P><a href={`mailto:${CONTACT_EMAIL}`} className="text-orange-600 underline">{CONTACT_EMAIL}</a></P>

        <H2>11. Children's Privacy</H2>
        <P>DawoLife is not specifically directed toward children.</P>
        <P>We do not knowingly collect personal information from children where such collection is prohibited by applicable law.</P>
        <P>If you believe that a child has provided personal information to us improperly, please contact us so that we can investigate and take appropriate action.</P>

        <H2>12. Cookies and Similar Technologies</H2>
        <P>DawoLife's websites and online services may use cookies or similar technologies where necessary for:</P>
        <Ul items={[
          'Authentication',
          'Security',
          'Session management',
          'Website functionality',
          'Preferences',
          'Performance',
          'Diagnostics',
          'Analytics, where applicable',
        ]} />
        <P>You may be able to manage cookies through your web browser settings.</P>

        <H2>13. Your Choices and Rights</H2>
        <P>Depending on applicable law, you may have rights regarding your personal information, including the right to:</P>
        <Ul items={[
          'Access information we hold about you',
          'Request correction of inaccurate information',
          'Request deletion of your account and personal information',
          'Request information about how your data is processed',
          'Withdraw certain permissions through your device settings',
          'Object to or restrict certain processing where applicable',
        ]} />
        <P>To exercise applicable rights, contact us using the privacy contact information below.</P>
        <P>We may need to verify your identity before completing certain requests to protect your account and personal information.</P>

        <H2>14. Permissions</H2>
        <P>Depending on the features you use, DawoLife may request Android permissions such as:</P>
        <P><span className="font-semibold text-slate-700">Location</span> — Used for map and location-related functionality.</P>
        <P><span className="font-semibold text-slate-700">Camera</span> — If enabled, used to allow you to capture photographs for listings or other features.</P>
        <P><span className="font-semibold text-slate-700">Photos/Media</span> — Used to allow you to select photographs or media for listings or profiles.</P>
        <P><span className="font-semibold text-slate-700">Notifications</span> — Used to send push notifications about relevant DawoLife activity.</P>
        <P>You can manage many permissions through your Android device settings. Disabling certain permissions may prevent related features from working correctly.</P>

        <H2>15. Data Transfers</H2>
        <P>DawoLife may use service providers or infrastructure located in countries other than the country where you live.</P>
        <P>Where information is transferred internationally, we take reasonable measures intended to protect the information in accordance with applicable laws.</P>

        <H2>16. Third-Party Links and Services</H2>
        <P>DawoLife may contain links to third-party websites, services, or payment providers.</P>
        <P>We are not responsible for the privacy practices of independent third parties.</P>
        <P>We encourage you to review the privacy policies of third-party services before providing them with personal information.</P>

        <H2>17. Changes to This Privacy Policy</H2>
        <P>We may update this Privacy Policy from time to time.</P>
        <P>When we make changes, we may update the "Last Updated" date at the top of this Privacy Policy.</P>
        <P>If changes are material, we may provide additional notice through DawoLife or another appropriate communication method.</P>
        <P>Your continued use of DawoLife after an updated Privacy Policy becomes effective means that you acknowledge the updated policy, subject to applicable law.</P>

        <H2>18. Contact Us</H2>
        <P>If you have questions, concerns, privacy requests, or requests regarding your personal information, please contact us.</P>
        <P><span className="font-semibold text-slate-700">Company:</span> Jebu General Trading PLC</P>
        <P><span className="font-semibold text-slate-700">Application:</span> DawoLife</P>
        <P>
          <span className="font-semibold text-slate-700">Privacy Contact:</span>{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-orange-600 underline">{CONTACT_EMAIL}</a>
        </P>
        <P>
          <span className="font-semibold text-slate-700">Website:</span>{' '}
          <a href={WEBSITE} className="text-orange-600 underline">{WEBSITE}</a>
        </P>
        <P>
          <span className="font-semibold text-slate-700">Phone:</span>{' '}
          {CONTACT_PHONES.map((p, i) => (
            <a key={p} href={`tel:${p.replace(/\s/g, '')}`} className="text-orange-600 underline">
              {p}{i < CONTACT_PHONES.length - 1 ? ' · ' : ''}
            </a>
          ))}
        </P>
        <P>
          For account deletion requests, please include enough information for us to identify the relevant account, but
          do not send your password or authentication codes.
        </P>

        <H2>19. Effective Date</H2>
        <P>This Privacy Policy is effective as of: <span className="font-semibold text-slate-700">September 6, 2026</span></P>
        <P><span className="font-semibold text-slate-700">Jebu General Trading PLC</span> — DawoLife</P>
      </div>
    </div>
  )
}