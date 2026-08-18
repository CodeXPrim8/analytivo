'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Instagram } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'
import { useContactModal } from '@/components/ContactModal'
import { containerVariants, itemVariants } from '@/lib/animations'

const Footer = () => {
  const { openContact } = useContactModal()
  const columns = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '/features' },
        { label: 'Pricing', href: '/pricing' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'API Reference', href: '/developers' },
        { label: 'Blog', href: '/blog' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/about' },
        { label: 'Contact Sales', href: '/contact-sales' },
        { label: 'Careers', href: '/careers' },
        { label: 'Partners', href: '/partners' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms', href: '/terms' },
        { label: 'Cookie Policy', href: '/cookies' },
        { label: 'Compliance', href: '/compliance' },
      ],
    },
  ]

  return (
    <footer className="border-t border-border bg-background/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
        {/* Main Footer Content */}
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
            {/* Brand Section */}
            <motion.div variants={itemVariants} className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-3 font-bold text-lg mb-4 hover:opacity-80 transition-opacity">
                <BrandLogo size={48} />
                <span>Analytivo</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                Video link analytics for creators and businesses. Real-time insights, powered by AI.
              </p>
            </motion.div>

            {/* Link Columns */}
            {columns.map((column, index) => (
              <motion.div key={index} variants={itemVariants}>
                <h4 className="font-semibold text-foreground mb-4">{column.title}</h4>
                <ul className="space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom Section */}
        <div className="border-t border-border/50 pt-8 md:pt-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Copyright */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-sm text-muted-foreground text-center md:text-left"
            >
              © 2026 Analytivo. All rights reserved.
            </motion.p>

            {/* Social Links */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex items-center gap-4"
            >
              <motion.div variants={itemVariants}>
                <button
                  type="button"
                  onClick={openContact}
                  className="w-10 h-10 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted transition-all"
                  aria-label="Send us an email"
                >
                  <Mail size={18} />
                </button>
              </motion.div>
              <motion.div variants={itemVariants}>
                <a
                  href="https://www.instagram.com/analytivo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted transition-all"
                  aria-label="Analytivo on Instagram"
                >
                  <Instagram size={18} />
                </a>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
