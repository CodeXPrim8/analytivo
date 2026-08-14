'use client'

import { createContext, useCallback, useContext, useEffect, useId, useState } from 'react'
import { X, Mail, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ContactContextValue = {
  openContact: () => void
}

const ContactContext = createContext<ContactContextValue | null>(null)

export function useContactModal() {
  const ctx = useContext(ContactContext)
  if (!ctx) {
    throw new Error('useContactModal must be used within ContactProvider')
  }
  return ctx
}

export function ContactProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const openContact = useCallback(() => setOpen(true), [])

  return (
    <ContactContext.Provider value={{ openContact }}>
      {children}
      <ContactModal open={open} onClose={() => setOpen(false)} />
    </ContactContext.Provider>
  )
}

const emptyForm = {
  name: '',
  email: '',
  subject: '',
  message: '',
  website: '',
}

function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const titleId = useId()
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      setStatus('idle')
      setError('')
      setForm(emptyForm)
    }
  }, [open])

  if (!open) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setStatus('error')
        setError(data.error || 'Could not send your message.')
        return
      }
      setStatus('sent')
    } catch {
      setStatus('error')
      setError('Could not send your message. Check your connection and try again.')
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close contact form"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-border bg-card shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-5 pr-8">
          <div className="w-10 h-10 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground">
            <Mail size={18} />
          </div>
          <div>
            <h2 id={titleId} className="text-lg font-semibold">
              Send us a message
            </h2>
            <p className="text-xs text-muted-foreground">We typically reply within 24 hours.</p>
          </div>
        </div>

        {status === 'sent' ? (
          <div className="py-6 text-center">
            <p className="text-foreground font-semibold mb-2">Message sent</p>
            <p className="text-sm text-muted-foreground mb-6">
              Thanks — we&apos;ll get back to you at the email you provided.
            </p>
            <Button type="button" onClick={onClose} className="font-semibold">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="website"
              value={form.website}
              onChange={handleChange}
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />
            <div>
              <label htmlFor="contact-name" className="block text-sm font-medium mb-1.5">
                Name
              </label>
              <input
                id="contact-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                autoFocus
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium mb-1.5">
                Your email
              </label>
              <input
                id="contact-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="contact-subject" className="block text-sm font-medium mb-1.5">
                Subject <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                id="contact-subject"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="How can we help?"
              />
            </div>
            <div>
              <label htmlFor="contact-message" className="block text-sm font-medium mb-1.5">
                Message
              </label>
              <textarea
                id="contact-message"
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                placeholder="Write your message..."
              />
            </div>
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            <Button type="submit" className="w-full font-semibold gap-2" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : (
                <>
                  Send message <Send size={14} />
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
