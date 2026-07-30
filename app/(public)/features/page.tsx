'use client'

import { motion } from 'framer-motion'
import { BarChart3, Sparkles, QrCode, Share2, Zap, Lock, Users, TrendingUp, Clock, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { containerVariants, itemVariants, fadeInUp } from '@/lib/animations'

const features = [
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description: 'Track every click instantly with comprehensive real-time analytics dashboards.',
    details: [
      'Live click counters',
      'Visitor demographics',
      'Geographic insights',
      'Device tracking',
      'Source attribution',
    ],
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Insights',
    description: 'Get actionable insights powered by advanced AI analysis of your content performance.',
    details: [
      'Performance predictions',
      'Trend analysis',
      'Audience recommendations',
      'Optimization suggestions',
      'Anomaly detection',
    ],
  },
  {
    icon: QrCode,
    title: 'QR Code Generation',
    description: 'Generate and customize unlimited QR codes for your video links.',
    details: [
      'Custom designs',
      'Logo embedding',
      'Color customization',
      'Bulk generation',
      'Scan analytics',
    ],
  },
  {
    icon: Share2,
    title: 'Campaign Management',
    description: 'Organize and track multiple campaigns across all your channels.',
    details: [
      'Campaign grouping',
      'Multi-channel tracking',
      'Performance comparison',
      'Team collaboration',
      'Export reports',
    ],
  },
  {
    icon: Zap,
    title: 'High Performance',
    description: 'Lightning-fast link creation and analytics with 99.99% uptime guarantee.',
    details: [
      'Sub-second link creation',
      '99.99% uptime SLA',
      'Global CDN',
      'Instant redirection',
      'Optimized for scale',
    ],
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    description: 'Bank-level security with encryption, compliance, and advanced access controls.',
    details: [
      'End-to-end encryption',
      'SOC 2 Type II',
      'GDPR compliant',
      'Role-based access',
      'Audit logs',
    ],
  },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="px-4 md:px-8 py-20 md:py-32 border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="mb-6">
            <span className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium inline-block">
              Powerful Capabilities
            </span>
          </motion.div>
          <motion.h1
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-bold mb-6 text-balance"
          >
            Everything You Need to Succeed
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground text-balance"
          >
            Comprehensive tools for tracking, analyzing, and optimizing your video marketing performance.
          </motion.p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 md:px-8 py-20 md:py-32">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-8 lg:gap-12"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="rounded-xl border border-border bg-card/50 p-8 hover:border-primary/50 hover:bg-card/80 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                    <Icon size={24} className="text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground mb-6">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.details.map((detail, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 md:px-8 py-20 md:py-32 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            Ready to Elevate Your Video Marketing?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-muted-foreground mb-8"
          >
            Start tracking your links and understanding your audience with Analytivo today.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button size="lg" className="font-semibold">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="font-semibold">
              Schedule Demo
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
