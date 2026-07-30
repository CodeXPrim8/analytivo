'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PUBLIC_PLANS } from '@/lib/plans'
import { containerVariants, itemVariants, fadeInUp } from '@/lib/animations'

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="px-4 md:px-8 py-20 md:py-32 border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="mb-6">
            <span className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium inline-block">
              Transparent Pricing
            </span>
          </motion.div>
          <motion.h1
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-bold mb-6 text-balance"
          >
            Plans for Every Stage
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground text-balance"
          >
            Start free, scale as you grow. No hidden fees, cancel anytime.
          </motion.p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 md:px-8 py-20 md:py-32">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {PUBLIC_PLANS.map((plan, index) => (
              <motion.div
                key={plan.id}
                variants={itemVariants}
                className={`rounded-xl border p-8 transition-all duration-300 ${
                  index === 1
                    ? 'border-primary bg-card ring-2 ring-primary/20 scale-105 md:scale-110'
                    : 'border-border bg-card/50 hover:bg-card/80 hover:border-border'
                }`}
              >
                {index === 1 && (
                  <div className="mb-4">
                    <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/50 text-xs font-bold text-primary">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>

                <Button
                  asChild
                  className="w-full mb-8 font-semibold"
                  variant={index === 1 ? 'default' : 'outline'}
                >
                  <Link href="/signup">Get Started</Link>
                </Button>

                <div className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check size={18} className="text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground/80">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 md:px-8 py-20 md:py-32 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold mb-12 text-center"
          >
            Frequently Asked Questions
          </motion.h2>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            {[
              {
                q: 'Can I switch plans anytime?',
                a: 'Yes! Upgrade or downgrade your plan anytime. Changes take effect immediately.',
              },
              {
                q: 'Do you offer refunds?',
                a: 'We offer a 30-day money-back guarantee on all plans. No questions asked.',
              },
              {
                q: 'Is there a setup fee?',
                a: 'No setup fees, no hidden charges. You only pay for the plan you choose.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards, PayPal, and wire transfers for Enterprise plans.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="border border-border rounded-lg p-6 bg-card/50 hover:bg-card/80 transition-colors"
              >
                <h4 className="font-semibold mb-2">{item.q}</h4>
                <p className="text-muted-foreground text-sm">{item.a}</p>
              </motion.div>
            ))}
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
            Ready to Get Started?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-muted-foreground mb-8"
          >
            Join creators and businesses already growing with Analytivo.
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
              Book Demo
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
