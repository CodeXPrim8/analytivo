'use client'

import { PublicContentPage } from '@/components/PublicContentPage'

export default function CompliancePage() {
  return (
    <PublicContentPage
      title="Compliance"
      subtitle="How we approach security and responsible data handling."
      paragraphs={[
        'Brandcrea8 operates Analytivo with a focus on protecting customer accounts and click analytics data. Access to production systems is limited, connections to the database use encrypted transport, and authentication sessions are managed through industry-standard practices.',
        'We process personal and analytics data to provide the service you signed up for. Where payment information is involved, card details are handled by Paystack and do not pass through our application servers.',
        'If you need a security or compliance questionnaire for enterprise procurement, or wish to report a vulnerability, email brandcrea8digital@yahoo.com. We take reports seriously and will respond as promptly as we can.',
      ]}
      cta={{ label: 'Contact sales', href: '/contact-sales' }}
    />
  )
}
