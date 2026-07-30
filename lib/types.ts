// User & Authentication
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  workspaceName: string
  createdAt: Date
}

export interface Session {
  user: User
  token: string
}

// Link Analytics
export interface Link {
  id: string
  title: string
  shortUrl: string
  originalUrl: string
  clickCount: number
  uniqueClicks: number
  createdAt: Date
  updatedAt: Date
  campaignId?: string
  qrCodeId?: string
  source: string
}

// Campaign
export interface Campaign {
  id: string
  name: string
  description?: string
  links: Link[]
  totalClicks: number
  uniqueVisitors: number
  startDate: Date
  endDate?: Date
  status: 'active' | 'paused' | 'completed'
  conversionRate: number
}

// Analytics Data
export interface AnalyticsData {
  date: string
  clicks: number
  uniqueVisitors: number
  conversionRate: number
  device?: string
  source?: string
  location?: string
}

export interface ClickTrend {
  date: string
  clicks: number
}

export interface TrafficSource {
  source: string
  clicks: number
  percentage: number
}

export interface DeviceBreakdown {
  device: string
  clicks: number
  percentage: number
}

// QR Code
export interface QRCode {
  id: string
  linkId: string
  data: string
  customization?: {
    shape?: 'square' | 'rounded'
    frameColor?: string
    logoUrl?: string
  }
  scans: number
  createdAt: Date
}

// Dashboard Overview
export interface DashboardOverview {
  totalClicks: number
  uniqueVisitors: number
  returningVisitors: number
  conversionRate: number
  topLink?: Link
  recentLinks: Link[]
  clickTrends: ClickTrend[]
  trafficSources: TrafficSource[]
  deviceBreakdown: DeviceBreakdown[]
}

// AI Insight
export interface AIInsight {
  id: string
  title: string
  description: string
  confidence: number
  actionItems: string[]
  createdAt: Date
}

// Report
export interface Report {
  id: string
  name: string
  description?: string
  type: 'performance' | 'audience' | 'conversion' | 'custom'
  dateRange: {
    start: Date
    end: Date
  }
  recipients: string[]
  schedule?: 'once' | 'daily' | 'weekly' | 'monthly'
  createdAt: Date
  lastGenerated?: Date
}

// Team Member
export interface TeamMember {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'editor' | 'viewer'
  joinedAt: Date
}

// Billing
export interface BillingPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  billingCycle: 'monthly' | 'yearly'
  features: string[]
  limits: {
    linksPerMonth: number
    campaignsPerMonth: number
    teamMembers: number
    advancedAnalytics: boolean
    customBranding: boolean
    apiAccess: boolean
  }
}

export interface BillingInfo {
  currentPlan: BillingPlan
  nextBillingDate: Date
  paymentMethod: {
    last4: string
    expiry: string
    cardBrand: string
  }
  usage: {
    linksCreated: number
    campaignsCreated: number
  }
}
