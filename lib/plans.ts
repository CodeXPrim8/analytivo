export type PlanId = 'free' | 'pro' | 'business'

export const PLAN_NAMES: Record<PlanId, string> = {
  free: 'Free',
  pro: 'Pro',
  business: 'Business',
}

export type PlanCapabilities = {
  /** Links that may be created per calendar month; null means unlimited. */
  linksPerMonth: number | null
  /** People with workspace access, counting the owner. */
  teamSeats: number
  campaigns: boolean
  aiInsights: boolean
  /** CSV export plus emailing and scheduling reports. */
  reportDelivery: boolean
}

/** The single source of truth for what each plan may do. */
export const PLAN_CAPABILITIES: Record<PlanId, PlanCapabilities> = {
  free: {
    linksPerMonth: 25,
    teamSeats: 1,
    campaigns: false,
    aiInsights: false,
    reportDelivery: false,
  },
  pro: {
    linksPerMonth: null,
    teamSeats: 5,
    campaigns: true,
    aiInsights: true,
    reportDelivery: true,
  },
  business: {
    linksPerMonth: null,
    teamSeats: 25,
    campaigns: true,
    aiInsights: true,
    reportDelivery: true,
  },
}

export function normalizePlan(value?: string | null): PlanId {
  return value === 'pro' || value === 'business' ? value : 'free'
}

export function capabilitiesFor(plan?: string | null): PlanCapabilities {
  return PLAN_CAPABILITIES[normalizePlan(plan)]
}

export type GatedFeature = 'campaigns' | 'aiInsights' | 'reportDelivery'

const FEATURE_LABELS: Record<GatedFeature, string> = {
  campaigns: 'Campaigns',
  aiInsights: 'AI insights',
  reportDelivery: 'Report exports and email delivery',
}

/** Cheapest plan that includes the feature, for accurate upgrade copy. */
export function lowestPlanWith(feature: GatedFeature): PlanId {
  const order: PlanId[] = ['free', 'pro', 'business']
  return order.find((plan) => PLAN_CAPABILITIES[plan][feature]) || 'business'
}

export function featureLabel(feature: GatedFeature) {
  return FEATURE_LABELS[feature]
}

export function upgradeMessage(feature: GatedFeature, isOwner: boolean) {
  const required = PLAN_NAMES[lowestPlanWith(feature)]
  const action = isOwner
    ? 'Upgrade from the Billing page to unlock it.'
    : 'Ask the workspace owner to upgrade.'
  return `${FEATURE_LABELS[feature]} require the ${required} plan. ${action}`
}

export const PUBLIC_PLANS = [
  {
    id: 'free',
    name: 'Free',
    description: 'For getting started with trackable video links',
    price: 0,
    currency: 'USD',
    billingCycle: 'monthly' as const,
    features: [
      '25 links per month',
      'Basic click analytics',
      '1 team seat',
      'QR code generation',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For creators and marketers who need deeper insight',
    price: 19,
    currency: 'USD',
    billingCycle: 'monthly' as const,
    features: [
      'Unlimited links',
      'Campaigns + UTM tracking',
      'AI insights',
      '5 team seats',
      'Exportable reports',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    description: 'For teams and agencies managing multiple campaigns',
    price: 49,
    currency: 'USD',
    billingCycle: 'monthly' as const,
    features: [
      'Everything in Pro',
      'Priority support',
      'Custom branding',
      '25 team seats',
      'Advanced permissions',
    ],
  },
]
