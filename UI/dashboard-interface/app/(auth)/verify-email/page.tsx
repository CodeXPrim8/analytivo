'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

export default function VerifyEmailPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Verify your email</h1>
        <p className="text-muted-foreground">
          Email verification can be enabled once an SMTP provider is connected. For now you can use
          the app immediately after signup.
        </p>
      </div>
      <Button asChild className="w-full">
        <Link href="/dashboard">Go to dashboard</Link>
      </Button>
    </motion.div>
  )
}
