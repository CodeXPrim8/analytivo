'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Code, FileJson, Zap, Book } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fadeInUp, containerVariants, itemVariants } from '@/lib/animations'

const docs = [
  {
    icon: Code,
    title: 'API Reference',
    description: 'Complete API documentation with examples and SDKs for all languages.',
  },
  {
    icon: FileJson,
    title: 'Webhooks',
    description: 'Real-time event notifications for link clicks and campaign updates.',
  },
  {
    icon: Zap,
    title: 'SDKs',
    description: 'Official SDKs for JavaScript, Python, Go, Ruby, and PHP.',
  },
  {
    icon: Book,
    title: 'Guides',
    description: 'Step-by-step guides and tutorials for common integrations.',
  },
]

export default function DevelopersPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="px-4 md:px-8 py-20 md:py-32 border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="mb-6">
            <span className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium inline-block">
              Developer First
            </span>
          </motion.div>
          <motion.h1
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-bold mb-6 text-balance"
          >
            Build with Analytivo
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground text-balance"
          >
            Powerful APIs and SDKs to integrate video link tracking into your applications.
          </motion.p>
        </div>
      </section>

      {/* Documentation */}
      <section id="docs" className="px-4 md:px-8 py-20 md:py-32">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-8 mb-16"
          >
            {docs.map((doc, index) => {
              const Icon = doc.icon
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="rounded-xl border border-border bg-card/50 p-8 hover:bg-card/80 transition-all duration-300 cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon size={24} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{doc.title}</h3>
                  <p className="text-muted-foreground text-sm">{doc.description}</p>
                </motion.div>
              )
            })}
          </motion.div>

          {/* Code Example */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-xl border border-border bg-card/50 p-8"
          >
            <h3 className="text-xl font-bold mb-4">Quick Start</h3>
            <pre className="bg-background rounded-lg p-4 overflow-x-auto text-sm text-foreground/80">
              <code>{`// Install SDK
npm install @analytivo/js

// Create a link
import { Analytivo } from '@analytivo/js'

const analytivo = new Analytivo({
  apiKey: 'your_api_key'
})

const link = await analytivo.links.create({
  originalUrl: 'https://youtube.com/watch?v=abc',
  title: 'My Video'
})

console.log(link.shortUrl) // analytivo.com/abc123`}</code>
            </pre>
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
            Ready to Build?
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button size="lg" className="font-semibold" asChild>
              <Link href="#docs">View Full Docs</Link>
            </Button>
            <Button size="lg" variant="outline" className="font-semibold" asChild>
              <Link href="/signup">Get API Key</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
