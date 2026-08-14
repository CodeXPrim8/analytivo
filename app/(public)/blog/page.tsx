'use client'

import { PublicContentPage } from '@/components/PublicContentPage'

export default function BlogPage() {
  return (
    <PublicContentPage
      title="Blog"
      subtitle="Product updates, video marketing tips, and growth ideas from the Analytivo team."
      paragraphs={[
        'We are preparing guides and stories to help creators and businesses get more from every shared video link.',
        'In the meantime, explore our features, pricing, and developer resources — or reach out if you have a topic you would like us to cover.',
      ]}
      cta={{ label: 'Explore features', href: '/features' }}
    />
  )
}
