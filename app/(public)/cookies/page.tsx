'use client'

import { PublicContentPage } from '@/components/PublicContentPage'

export default function CookiesPage() {
  return (
    <PublicContentPage
      title="Cookie Policy"
      subtitle="How we use cookies and similar technologies."
      paragraphs={[
        'Analytivo uses cookies and similar technologies to keep you signed in, remember workspace preferences, and understand how the product is used so we can improve it.',
        'Essential cookies are required for authentication and security. Analytics cookies help us measure performance of the marketing site and dashboard experience. You can control cookies through your browser settings; disabling essential cookies may prevent login from working.',
        'Third-party services we rely on (such as hosting and payment providers) may set their own cookies subject to their policies.',
        'Questions about cookies can be sent to brandcrea8digital@yahoo.com.',
      ]}
      cta={{ label: 'Privacy policy', href: '/privacy' }}
    />
  )
}
