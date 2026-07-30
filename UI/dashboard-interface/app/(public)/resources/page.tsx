'use client'

import { motion } from 'framer-motion'
import { BookOpen, Download, Play, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fadeInUp, containerVariants, itemVariants } from '@/lib/animations'

const resources = [
  {
    icon: BookOpen,
    title: 'Blog',
    description: 'Latest insights on video marketing and content strategy.',
    link: '#',
  },
  {
    icon: Play,
    title: 'Video Tutorials',
    description: 'Step-by-step video guides to get started quickly.',
    link: '#',
  },
  {
    icon: Download,
    title: 'Whitepapers',
    description: 'In-depth reports on video marketing trends and best practices.',
    link: '#',
  },
  {
    icon: HelpCircle,
    title: 'Help Center',
    description: 'Common questions and troubleshooting guides.',
    link: '#',
  },
]

export default function ResourcesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="px-4 md:px-8 py-20 md:py-32 border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="text-5xl md:text-6xl font-bold mb-6 text-balance"
          >
            Resources & Learning
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground text-balance"
          >
            Everything you need to master video marketing and maximize your results.
          </motion.p>
        </div>
      </section>

      {/* Resources */}
      <section className="px-4 md:px-8 py-20 md:py-32">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-8"
          >
            {resources.map((resource, index) => {
              const Icon = resource.icon
              return (
                <motion.a
                  key={index}
                  href={resource.link}
                  variants={itemVariants}
                  className="rounded-xl border border-border bg-card/50 p-8 hover:bg-card/80 hover:border-primary/50 transition-all duration-300 group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon size={24} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{resource.title}</h3>
                  <p className="text-muted-foreground text-sm">{resource.description}</p>
                </motion.a>
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
            Still Have Questions?
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button size="lg" className="font-semibold">
              Contact Support
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
