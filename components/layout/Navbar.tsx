'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Menu, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/BrandLogo'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const menuItems = [
    { label: 'Features', href: '/features' },
    {
      label: 'Solutions',
      href: '/solutions',
      submenu: [
        { label: 'For Creators', href: '/solutions#creators' },
        { label: 'For Businesses', href: '/solutions#businesses' },
        { label: 'For Agencies', href: '/solutions#agencies' },
      ],
    },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Resources', href: '/resources' },
    { label: 'Developers', href: '/developers' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 font-bold text-xl hover:opacity-80 transition-opacity">
            <BrandLogo size={52} priority />
            <span>Analytivo</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {menuItems.map((item) => (
              <div key={item.label} className="relative group">
                <Link
                  href={item.href}
                  className="flex items-center gap-1 text-foreground/80 hover:text-foreground transition-colors py-2"
                >
                  {item.label}
                  {item.submenu && <ChevronDown size={16} className="group-hover:rotate-180 transition-transform" />}
                </Link>

                {/* Dropdown */}
                {item.submenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 pt-2 w-48 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
                  >
                    <div className="rounded-lg bg-card border border-border shadow-lg overflow-hidden">
                      {item.submenu.map((subitem) => (
                        <Link
                          key={subitem.label}
                          href={subitem.href}
                          className="block px-4 py-3 text-sm text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
                        >
                          {subitem.label}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Start Free</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mt-4 pb-4 border-t border-border/50 pt-4"
          >
            {menuItems.map((item) => (
              <div key={item.label}>
                <button
                  onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                  className="w-full flex items-center justify-between text-foreground/80 hover:text-foreground py-3 px-2 transition-colors"
                >
                  <Link href={item.href}>{item.label}</Link>
                  {item.submenu && (
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>

                {/* Mobile Dropdown */}
                {item.submenu && openDropdown === item.label && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pl-4">
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.label}
                        href={subitem.href}
                        className="block py-2 px-2 text-sm text-foreground/70 hover:text-foreground transition-colors"
                      >
                        {subitem.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </div>
            ))}

            <div className="mt-4 flex flex-col gap-2 pt-4 border-t border-border/50">
              <Button variant="ghost" className="w-full justify-center" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button className="w-full justify-center" asChild>
                <Link href="/signup">Start Free</Link>
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
