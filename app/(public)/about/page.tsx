'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { fadeInUp } from '@/lib/animations'

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <section className="px-4 md:px-8 py-20 md:py-32 border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="text-5xl md:text-6xl font-bold mb-6 text-balance"
          >
            About Us
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground text-balance"
          >
            Built by Brandcrea8 for creators and businesses who want clarity from every click.
          </motion.p>
        </div>
      </section>

      <section className="px-4 md:px-8 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto space-y-8 text-lg text-muted-foreground leading-relaxed"
        >
          <p>
            Analytivo is a product of Brandcrea8, a digital product agency. Our vision is to be
            your trusted business partner, delivering innovative business solutions that drive
            growth, boost profitability, and elevate customer experiences.
          </p>
          <p>
            We&apos;re committed to simplifying the complex, empowering you to succeed with
            intuitive, accessible, and results-driven solutions that transform your business.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto mt-16 text-center"
        >
          <Button asChild>
            <Link href="/contact-sales">Get in touch</Link>
          </Button>
        </motion.div>
      </section>
    </div>
  )
}
