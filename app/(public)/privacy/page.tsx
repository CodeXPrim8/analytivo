'use client'

import { PublicContentPage } from '@/components/PublicContentPage'

export default function PrivacyPage() {
  return (
    <PublicContentPage
      title="Privacy Policy"
      subtitle="How Analytivo collects, uses, and protects your information."
      paragraphs={[
        'Analytivo is a product of Brandcrea8. We collect account details you provide (such as name, email, and workspace information), as well as analytics data generated when people click your trackable links — for example device type, approximate location, and traffic source.',
        'We use this information to operate the service, show you dashboards and insights, send product communications you request, and improve reliability and security. We do not sell your personal data.',
        'Payment processing is handled by Paystack. Email delivery (when configured) is handled by our email provider. Those processors receive only what is needed to complete their role.',
        'You can request access, correction, or deletion of your account data by contacting brandcrea8digital@yahoo.com. This policy may be updated as the product evolves; material changes will be reflected on this page.',
      ]}
      cta={{ label: 'Contact us', href: '/contact-sales' }}
    />
  )
}
