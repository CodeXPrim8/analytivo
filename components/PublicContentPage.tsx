'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { fadeInUp } from '@/lib/animations'

export function PublicContentPage({
  title,
  subtitle,
  paragraphs,
  cta,
}: {
  title: string
  subtitle?: string
  paragraphs: string[]
  cta?: { label: string; href: string }
}) {
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
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground text-balance"
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      </section>

      <section className="px-4 md:px-8 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto space-y-6 text-lg text-muted-foreground leading-relaxed"
        >
          {paragraphs.map((text) => (
            <p key={text.slice(0, 48)}>{text}</p>
          ))}
        </motion.div>

        {cta && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto mt-12 text-center"
          >
            <Button asChild>
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          </motion.div>
        )}
      </section>
    </div>
  )
}
