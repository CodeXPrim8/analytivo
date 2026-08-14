'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Users, Briefcase, Church } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { containerVariants, itemVariants, fadeInUp } from '@/lib/animations'

const solutions = [
  {
    icon: Users,
    title: 'For Content Creators',
    description: 'Maximize your reach and monetization across all platforms',
    benefits: [
      'Track views across TikTok, YouTube, Instagram',
      'Understand your audience deeply',
      'Identify top-performing content',
      'Optimize posting schedules',
      'Manage multiple channels centrally',
    ],
    useCase: 'YouTubers, TikTokers, Streamers, Podcasters',
    color: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    icon: Briefcase,
    title: 'For Businesses',
    description: 'Drive conversions and measure ROI from video marketing',
    benefits: [
      'Track video marketing ROI',
      'Measure conversion rates',
      'Manage customer journeys',
      'A/B test campaigns',
      'Generate detailed reports',
    ],
    useCase: 'E-commerce, SaaS, Services, B2B Companies',
    color: 'from-purple-500/20 to-pink-500/20',
  },
  {
    icon: Briefcase,
    title: 'For Agencies',
    description: 'Manage multiple client campaigns with advanced tools',
    benefits: [
      'White-label solutions',
      'Multi-client dashboard',
      'Team collaboration tools',
      'Advanced reporting',
      'Custom branding',
    ],
    useCase: 'Marketing Agencies, Digital Firms, Consultants',
    color: 'from-orange-500/20 to-red-500/20',
  },
  {
    icon: Church,
    title: 'For Organizations',
    description: 'Engage your community with measurable video impact',
    benefits: [
      'Track community engagement',
      'Measure message reach',
      'Understand audience growth',
      'Optimize outreach timing',
      'Share impact reports',
    ],
    useCase: 'Churches, Non-profits, Educational Institutions',
    color: 'from-green-500/20 to-emerald-500/20',
  },
]

export default function SolutionsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="px-4 md:px-8 py-20 md:py-32 border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="mb-6">
            <span className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium inline-block">
              Tailored Solutions
            </span>
          </motion.div>
          <motion.h1
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-bold mb-6 text-balance"
          >
            Solutions Built for Your Needs
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground text-balance"
          >
            Whether you&apos;re a creator, business, agency, or organization, Analytivo adapts to your unique goals.
          </motion.p>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="px-4 md:px-8 py-20 md:py-32">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-8"
          >
            {solutions.map((solution, index) => {
              const Icon = solution.icon
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className={`rounded-xl border border-border bg-gradient-to-br ${solution.color} p-8 hover:border-primary/50 transition-all duration-300 group`}
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-6 group-hover:bg-primary/30 transition-colors">
                    <Icon size={24} className="text-primary" />
                  </div>

                  <h3 className="text-2xl font-bold mb-2">{solution.title}</h3>
                  <p className="text-muted-foreground mb-6">{solution.description}</p>

                  <div className="mb-8 pb-8 border-b border-border/50">
                    <p className="text-sm font-medium text-primary mb-3">Key Benefits</p>
                    <ul className="space-y-2">
                      {solution.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                          <span className="text-foreground/80">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{solution.useCase}</p>
                    <ArrowRight size={18} className="text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 md:px-8 py-20 md:py-32 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            Your Solution Awaits
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button size="lg" className="font-semibold" asChild>
              <Link href="/signup">Get Started Today</Link>
            </Button>
            <Button size="lg" variant="outline" className="font-semibold" asChild>
              <Link href="/contact-sales">Talk to Sales</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
