'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Instagram } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useContactModal } from '@/components/ContactModal'
import { fadeInUp } from '@/lib/animations'

export default function ContactSalesPage() {
  const { openContact } = useContactModal()
  const [formData, setFormData] = useState({ name: '', email: '', company: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.message) return
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          subject: 'Sales inquiry',
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(data.error || 'Could not send your message.')
        return
      }
      setSubmitted(true)
      setFormData({ name: '', email: '', company: '', message: '' })
      setTimeout(() => setSubmitted(false), 4000)
    } catch {
      setError('Could not send your message. Check your connection and try again.')
    } finally {
      setSending(false)
    }
  }
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
            Talk to Our Sales Team
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground text-balance"
          >
            Looking for enterprise features or custom solutions? We&apos;re here to help.
          </motion.p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="px-4 md:px-8 py-20 md:py-32">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-xl border border-border bg-card/50 p-8"
          >
            <h2 className="text-2xl font-bold mb-6">Send us a message</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {submitted && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                  Thank you! Our sales team will be in touch soon.
                </div>
              )}
              {error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Company</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Your Company"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  rows={4}
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  placeholder="Tell us about your needs..."
                />
              </div>

              <Button type="submit" className="w-full font-semibold" disabled={sending}>
                {sending ? 'Sending…' : 'Send Message'}
              </Button>
            </form>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-2xl font-bold mb-8">Get in Touch</h2>
              <p className="text-muted-foreground mb-8">
                Our sales team is ready to discuss your needs and find the perfect plan for your business.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Email</p>
                  <button
                    type="button"
                    onClick={openContact}
                    className="text-muted-foreground hover:text-foreground text-left"
                  >
                    brandcrea8digital@yahoo.com
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Phone size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Phone</p>
                  <a href="tel:+2349099999190" className="text-muted-foreground hover:text-foreground">
                    +234-9099999190
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Address</p>
                  <p className="text-muted-foreground">Ikeja, Lagos Nigeria.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Instagram size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Instagram</p>
                  <a
                    href="https://www.instagram.com/analytivo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    @analytivo
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">Response time</p>
              <p className="text-foreground font-medium">Usually within 24 hours</p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
