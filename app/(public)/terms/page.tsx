'use client'

import { PublicContentPage } from '@/components/PublicContentPage'

export default function TermsPage() {
  return (
    <PublicContentPage
      title="Terms of Service"
      subtitle="The rules for using Analytivo."
      paragraphs={[
        'By creating an account or using Analytivo, you agree to these terms. Analytivo is provided by Brandcrea8 as a video-link analytics service for creators and businesses.',
        'You are responsible for the content you share through links you create, for keeping your login credentials secure, and for complying with applicable laws and platform policies where you distribute those links.',
        'Plans, usage limits, and paid features are described on our pricing and billing pages. Fees for paid plans are charged through our payment processor according to the plan you select. We may suspend or terminate accounts that abuse the service or violate these terms.',
        'The service is provided as available. To the extent permitted by law, Brandcrea8 is not liable for indirect or consequential damages arising from use of Analytivo. For questions, contact brandcrea8digital@yahoo.com.',
      ]}
      cta={{ label: 'View pricing', href: '/pricing' }}
    />
  )
}
