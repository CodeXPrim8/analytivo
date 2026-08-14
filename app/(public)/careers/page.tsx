'use client'

import { PublicContentPage } from '@/components/PublicContentPage'

export default function CareersPage() {
  return (
    <PublicContentPage
      title="Careers"
      subtitle="Join Brandcrea8 and help build tools that make video marketing clearer."
      paragraphs={[
        'Analytivo is a product of Brandcrea8, a digital product agency. We are always interested in people who care about product craft, analytics, and customer experience.',
        'We do not have open roles listed right now. Send your introduction and CV to brandcrea8digital@yahoo.com and we will keep you in mind for future openings.',
      ]}
      cta={{ label: 'Contact us', href: '/contact-sales' }}
    />
  )
}
