'use client'

import { PublicContentPage } from '@/components/PublicContentPage'

export default function PartnersPage() {
  return (
    <PublicContentPage
      title="Partners"
      subtitle="Grow with Analytivo — agencies, platforms, and creators welcome."
      paragraphs={[
        'We partner with agencies, creators, and technology platforms that want better attribution for video campaigns.',
        'If you would like to explore a partnership, integration, or reseller opportunity, tell us about your team and audience. We will respond with next steps.',
      ]}
      cta={{ label: 'Talk to sales', href: '/contact-sales' }}
    />
  )
}
