'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ChevronRight,
  Play,
  Zap,
  BarChart3,
  Sparkles,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { DashboardPreview } from '@/components/DashboardPreview'
import { containerVariants, itemVariants, fadeInUp } from '@/lib/animations'

const featureHighlights = [
  { icon: BarChart3, text: 'Real-time Analytics', color: '#7c3aed' },
  { icon: Sparkles, text: 'AI-Powered Insights', color: '#06b6d4' },
  { icon: Zap, text: 'Instant QR Codes', color: '#10b981' },
  { icon: Lock, text: 'Enterprise Security', color: '#f59e0b' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <Navbar />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative px-4 md:px-8 py-20 md:py-32">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-b from-purple-500/10 via-transparent to-transparent rounded-full blur-3xl" />
            <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent rounded-full blur-3xl" />
          </div>

          <div className="max-w-6xl mx-auto relative">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-block mb-6"
              >
                <span className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium">
                  ✨ Now with AI-Powered Insights
                </span>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-balance leading-tight"
              >
                Video Link Analytics
                <br />
                <span className="bg-gradient-to-r from-primary via-accent to-primary/80 bg-clip-text text-transparent">
                  Made Simple
                </span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.2 }}
                className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto text-balance"
              >
                Track every click, understand every viewer, and optimize every campaign. Analytivo delivers real-time
                analytics and AI insights that turn video content into measurable business results.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
              >
                <Button size="lg" className="gap-2 font-semibold" asChild>
                  <Link href="/signup">
                    Start Free Trial <ChevronRight size={16} />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="gap-2 font-semibold" asChild>
                  <Link href="/resources">
                    Watch Demo <Play size={16} />
                  </Link>
                </Button>
              </motion.div>

              {/* Feature Highlights */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
              >
                {featureHighlights.map((feature, index) => {
                  const Icon = feature.icon
                  return (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      className="rounded-lg bg-card border border-border/50 p-4"
                    >
                      <Icon size={24} className="mb-2 mx-auto" style={{ color: feature.color }} />
                      <p className="text-sm font-medium text-foreground text-balance">{feature.text}</p>
                    </motion.div>
                  )
                })}
              </motion.div>
            </motion.div>

            {/* Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
              className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl p-1 overflow-hidden shadow-[0_0_80px_-24px_rgba(124,58,237,0.55)]"
            >
              <DashboardPreview />
            </motion.div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="px-4 md:px-8 py-16 border-t border-border">
          <div className="max-w-6xl mx-auto">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center text-muted-foreground text-sm font-medium mb-8"
            >
              Trusted by creators and businesses on
            </motion.p>
            <div className="flex justify-center items-center gap-8 flex-wrap">
              {['YouTube', 'TikTok', 'Instagram', 'Twitter', 'LinkedIn'].map((platform, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-foreground/60 font-semibold"
                >
                  {platform}
                </motion.p>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
