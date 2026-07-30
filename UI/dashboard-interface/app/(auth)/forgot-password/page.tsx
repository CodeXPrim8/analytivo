'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Reset password</h1>
        <p className="text-muted-foreground">
          Password reset email delivery needs an SMTP provider. Until then, create a new account or
          contact support.
        </p>
      </div>
      {submitted ? (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
          Received request for <strong>{email}</strong>. Connect email delivery to complete this flow.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-2 rounded-lg border border-border bg-background"
          />
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
      )}
      <p className="mt-6 text-sm text-muted-foreground text-center">
        <Link href="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </motion.div>
  )
}
