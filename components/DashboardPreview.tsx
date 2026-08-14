'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { animate, motion, useInView, useMotionValue, useReducedMotion } from 'framer-motion'
import {
  BarChart3,
  Bell,
  CreditCard,
  FileText,
  HelpCircle,
  Link as LinkIcon,
  Percent,
  QrCode,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'

const CANVAS_W = 1280
const CANVAS_H = 720

const NAV_ITEMS = [
  { label: 'Overview', icon: BarChart3, view: 'overview' as const },
  { label: 'Links', icon: LinkIcon, view: 'links' as const },
  { label: 'Campaigns', icon: Zap, view: 'campaigns' as const },
  { label: 'Analytics', icon: BarChart3, view: 'analytics' as const },
  { label: 'QR Codes', icon: QrCode, view: 'qr' as const },
  { label: 'AI Insights', icon: Sparkles, view: 'insights' as const },
  { label: 'Reports', icon: FileText, view: 'reports' as const },
]

const BOTTOM_ITEMS = [
  { label: 'Team', icon: Users },
  { label: 'Settings', icon: Settings },
  { label: 'Billing', icon: CreditCard },
  { label: 'Help', icon: HelpCircle },
]

const TREND = [
  { date: 'Jul 30', clicks: 980 },
  { date: 'Jul 31', clicks: 1120 },
  { date: 'Aug 1', clicks: 1280 },
  { date: 'Aug 2', clicks: 1190 },
  { date: 'Aug 3', clicks: 1540 },
  { date: 'Aug 4', clicks: 1710 },
  { date: 'Aug 5', clicks: 1980 },
  { date: 'Aug 6', clicks: 1860 },
  { date: 'Aug 7', clicks: 2140 },
  { date: 'Aug 8', clicks: 2380 },
  { date: 'Aug 9', clicks: 2210 },
  { date: 'Aug 10', clicks: 2560 },
  { date: 'Aug 11', clicks: 2740 },
  { date: 'Aug 12', clicks: 2920 },
]

const TRAFFIC = [
  { label: 'YouTube', value: 10436, percentage: 42 },
  { label: 'TikTok', value: 6957, percentage: 28 },
  { label: 'Instagram', value: 4472, percentage: 18 },
  { label: 'Direct', value: 2982, percentage: 12 },
]

const DEVICES = [
  { label: 'Mobile', value: 14411, percentage: 58 },
  { label: 'Desktop', value: 7703, percentage: 31 },
  { label: 'Tablet', value: 2733, percentage: 11 },
]

const DEMO_LINKS = [
  { title: 'Summer Drop — YouTube', url: 'anltv.co/summer', clicks: 8421, unique: 3102 },
  { title: 'TikTok Launch Cut', url: 'anltv.co/tiktok-cut', clicks: 6188, unique: 2740 },
  { title: 'Podcast Episode 48', url: 'anltv.co/ep48', clicks: 3904, unique: 1511 },
  { title: 'Creator Collab QR', url: 'anltv.co/collab', clicks: 2334, unique: 980 },
]

const DEMO_CAMPAIGNS = [
  { name: 'Q3 Creator Push', status: 'Live', progress: 78, clicks: 14220 },
  { name: 'Product Hunt Wave', status: 'Live', progress: 54, clicks: 6810 },
  { name: 'Evergreen Shorts', status: 'Scheduled', progress: 22, clicks: 1940 },
]

const DEMO_INSIGHTS = [
  {
    title: 'YouTube is your highest-intent source',
    body: 'Viewers from YouTube return 2.4x more often than TikTok. Pin that link in the description.',
  },
  {
    title: 'Mobile traffic peaks at 7–9pm',
    body: 'Schedule new drops in the evening window to catch 58% of your audience on mobile.',
  },
]

const NOTIFICATIONS = [
  { title: 'Click spike on Summer Drop', body: '+240 clicks in the last hour', time: '2m' },
  { title: 'QR scan from Lagos', body: 'Creator Collab QR just converted', time: '14m' },
  { title: 'Weekly report is ready', body: 'Aug 6–12 performance summary', time: '1h' },
]

type View = (typeof NAV_ITEMS)[number]['view']

type TourStep = {
  x: number
  y: number
  move: number
  dwell: number
  click?: boolean
  hover?: string | null
  nav?: string
  view?: View
  toast?: string | null
  bell?: boolean
}

const TOUR: TourStep[] = [
  { x: 366, y: 198, move: 900, dwell: 280, hover: 'kpi-0' },
  { x: 366, y: 198, move: 0, dwell: 320, click: true, hover: 'kpi-0' },
  { x: 622, y: 198, move: 650, dwell: 240, hover: 'kpi-1' },
  { x: 878, y: 198, move: 550, dwell: 220, hover: 'kpi-2' },
  { x: 1196, y: 96, move: 800, dwell: 180, hover: 'create' },
  { x: 1196, y: 96, move: 0, dwell: 520, click: true, hover: 'create', toast: 'Short link created' },
  { x: 118, y: 146, move: 950, dwell: 160, hover: 'nav-Links', toast: null },
  { x: 118, y: 146, move: 0, dwell: 780, click: true, hover: 'nav-Links', nav: 'Links', view: 'links' },
  { x: 560, y: 228, move: 750, dwell: 200, hover: 'link-0' },
  { x: 560, y: 228, move: 0, dwell: 380, click: true, hover: 'link-0' },
  { x: 118, y: 186, move: 700, dwell: 140, hover: 'nav-Campaigns' },
  { x: 118, y: 186, move: 0, dwell: 820, click: true, hover: 'nav-Campaigns', nav: 'Campaigns', view: 'campaigns' },
  { x: 118, y: 266, move: 620, dwell: 140, hover: 'nav-QR Codes' },
  { x: 118, y: 266, move: 0, dwell: 820, click: true, hover: 'nav-QR Codes', nav: 'QR Codes', view: 'qr' },
  { x: 118, y: 306, move: 520, dwell: 140, hover: 'nav-AI Insights' },
  { x: 118, y: 306, move: 0, dwell: 900, click: true, hover: 'nav-AI Insights', nav: 'AI Insights', view: 'insights' },
  { x: 118, y: 106, move: 850, dwell: 140, hover: 'nav-Overview' },
  { x: 118, y: 106, move: 0, dwell: 640, click: true, hover: 'nav-Overview', nav: 'Overview', view: 'overview' },
  { x: 760, y: 372, move: 900, dwell: 420, hover: 'chart' },
  { x: 494, y: 548, move: 700, dwell: 320, hover: 'traffic-0' },
  { x: 1198, y: 28, move: 900, dwell: 160, hover: 'bell' },
  { x: 1198, y: 28, move: 0, dwell: 1100, click: true, hover: 'bell', bell: true },
  { x: 118, y: 106, move: 850, dwell: 380, hover: 'nav-Overview', bell: false },
]

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('aborted', 'AbortError'))
      return
    }
    const id = window.setTimeout(resolve, ms)
    const onAbort = () => {
      window.clearTimeout(id)
      reject(new DOMException('aborted', 'AbortError'))
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return d
}

function TrendChart({ reduced }: { reduced: boolean }) {
  const { line, area, ticksY, ticksX, last } = useMemo(() => {
    const width = 920
    const height = 168
    const padL = 36
    const padR = 8
    const padT = 10
    const padB = 24
    const max = Math.max(...TREND.map((d) => d.clicks))
    const niceMax = Math.ceil(max / 800) * 800
    const innerW = width - padL - padR
    const innerH = height - padT - padB

    const points = TREND.map((d, i) => ({
      x: padL + (i / (TREND.length - 1)) * innerW,
      y: padT + innerH - (d.clicks / niceMax) * innerH,
    }))

    const linePath = smoothPath(points)
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${padT + innerH} L ${points[0].x} ${padT + innerH} Z`

    return {
      line: linePath,
      area: areaPath,
      last: points[points.length - 1],
      ticksY: [0, 0.5, 1].map((t) => ({
        y: padT + innerH - t * innerH,
        label: Math.round(niceMax * t).toLocaleString(),
      })),
      ticksX: TREND.map((d, i) => ({
        x: padL + (i / (TREND.length - 1)) * innerW,
        label: i % 2 === 0 ? d.date : '',
      })),
    }
  }, [])

  return (
    <svg viewBox="0 0 920 168" className="w-full h-[168px]" aria-hidden>
      <defs>
        <linearGradient id="preview-line-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </linearGradient>
        <filter id="preview-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {ticksY.map((tick) => (
        <g key={tick.label}>
          <line
            x1="36"
            x2="912"
            y1={tick.y}
            y2={tick.y}
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="3 4"
          />
          <text x="0" y={tick.y + 3} fill="rgba(255,255,255,0.45)" fontSize="10">
            {tick.label}
          </text>
        </g>
      ))}

      {ticksX.map((tick, i) =>
        tick.label ? (
          <text
            key={i}
            x={tick.x}
            y="164"
            textAnchor="middle"
            fill="rgba(255,255,255,0.45)"
            fontSize="10"
          >
            {tick.label}
          </text>
        ) : null,
      )}

      <motion.path
        d={area}
        fill="url(#preview-line-fill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduced ? 0 : 1.2, duration: 0.7 }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke="#7c3aed"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#preview-glow)"
        initial={{ pathLength: reduced ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />
      <circle cx={last.x} cy={last.y} r="4.5" fill="#a78bfa" filter="url(#preview-glow)">
        {!reduced && (
          <animate attributeName="r" values="4.5;6.2;4.5" dur="2.2s" repeatCount="indefinite" />
        )}
      </circle>
      {!reduced && (
        <circle r="3.5" fill="#fff" filter="url(#preview-glow)">
          <animateMotion dur="5.5s" repeatCount="indefinite" rotate="auto" path={line} />
        </circle>
      )}
    </svg>
  )
}

function MiniQr({ delay }: { delay: number }) {
  const cells = [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1]
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.35 }}
      className="rounded-xl border border-[#1e293b] bg-[#121629]/70 p-4"
    >
      <div className="grid grid-cols-4 gap-1 w-20 h-20 mb-3">
        {cells.map((on, i) => (
          <div key={i} className={`rounded-[2px] ${on ? 'bg-white' : 'bg-transparent'}`} />
        ))}
      </div>
      <p className="text-[12px] font-semibold">anltv.co/qr-{delay + 1}</p>
      <p className="text-[11px] text-[#a1a5b0]">{1200 + delay * 430} scans</p>
    </motion.div>
  )
}

export function DashboardPreview() {
  const frameRef = useRef<HTMLDivElement>(null)
  const inView = useInView(frameRef, { amount: 0.3 })
  const reduced = useReducedMotion() ?? false
  const [scale, setScale] = useState(0.5)
  const [activeNav, setActiveNav] = useState('Overview')
  const [view, setView] = useState<View>('overview')
  const [hovered, setHovered] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [bellOpen, setBellOpen] = useState(false)
  const [clicking, setClicking] = useState(false)
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null)
  const [stats, setStats] = useState({
    clicks: 24847,
    uniques: 8412,
    returning: 3291,
    rate: 39.1,
  })

  const cursorX = useMotionValue(118)
  const cursorY = useMotionValue(106)

  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      setScale(entries[0].contentRect.width / CANVAS_W)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!inView || reduced) return
    const id = window.setInterval(() => {
      setStats((prev) => {
        const clicks = prev.clicks + 2 + Math.floor(Math.random() * 8)
        const uniques = prev.uniques + (Math.random() > 0.45 ? 1 : 0)
        const returning = prev.returning + (Math.random() > 0.7 ? 1 : 0)
        const rate = Math.min(49, +(returning / Math.max(uniques, 1)) * 100).toFixed(1)
        return { clicks, uniques, returning, rate: Number(rate) }
      })
    }, 1800)
    return () => window.clearInterval(id)
  }, [inView, reduced])

  useEffect(() => {
    if (!inView || reduced) return
    const ac = new AbortController()
    const { signal } = ac

    const run = async () => {
      cursorX.set(118)
      cursorY.set(106)
      while (!signal.aborted) {
        for (const step of TOUR) {
          if (signal.aborted) return
          if (step.move > 0) {
            await Promise.all([
              animate(cursorX, step.x, { duration: step.move / 1000, ease: [0.22, 1, 0.36, 1] }),
              animate(cursorY, step.y, { duration: step.move / 1000, ease: [0.22, 1, 0.36, 1] }),
            ])
          } else {
            cursorX.set(step.x)
            cursorY.set(step.y)
          }
          if (step.hover !== undefined) setHovered(step.hover)
          if (step.click) {
            setClicking(true)
            setRipple({ x: step.x, y: step.y, id: Date.now() })
            if (step.nav) setActiveNav(step.nav)
            if (step.view) setView(step.view)
            if (step.toast !== undefined) setToast(step.toast)
            if (step.bell !== undefined) setBellOpen(step.bell)
            await sleep(180, signal)
            setClicking(false)
          } else if (step.toast !== undefined) {
            setToast(step.toast)
          } else if (step.bell !== undefined) {
            setBellOpen(step.bell)
          }
          await sleep(step.dwell, signal)
        }
      }
    }

    run().catch(() => {})
    return () => ac.abort()
  }, [inView, reduced, cursorX, cursorY])

  const kpis = [
    { title: 'Total Clicks', value: stats.clicks.toLocaleString(), change: 18.4, color: '#7c3aed', icon: BarChart3, key: 'kpi-0' },
    { title: 'Unique Visitors', value: stats.uniques.toLocaleString(), change: 12.1, color: '#06b6d4', icon: Users, key: 'kpi-1' },
    { title: 'Returning Visitors', value: stats.returning.toLocaleString(), change: 9.6, color: '#10b981', icon: TrendingUp, key: 'kpi-2' },
    { title: 'Return Rate', value: `${stats.rate.toFixed(1)}%`, change: 4.2, color: '#f59e0b', icon: Percent, key: 'kpi-3' },
  ]

  return (
    <div
      ref={frameRef}
      role="img"
      aria-label="Animated preview of the Analytivo dashboard. A cursor clicks through overview, links, campaigns, and insights."
      className="relative w-full overflow-hidden rounded-xl bg-[#0a0e27]"
      style={{ paddingBottom: `${(CANVAS_H / CANVAS_W) * 100}%` }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left pointer-events-none select-none"
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          transform: `scale(${scale})`,
        }}
      >
        <div className="flex h-full bg-[#0a0e27] text-[#f5f7fa]">
          <aside className="w-[220px] shrink-0 border-r border-[#1e293b] bg-[#121629]/80 flex flex-col">
            <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#1e293b]">
              <BrandLogo size={32} />
              <span className="text-[15px] font-bold tracking-tight">Analytivo</span>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const active = activeNav === item.label
                const hot = hovered === `nav-${item.label}`
                return (
                  <div
                    key={item.label}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                      active
                        ? 'bg-[#7c3aed]/20 text-[#c4b5fd] shadow-[inset_0_0_0_1px_rgba(124,58,237,0.35)]'
                          : hot
                          ? 'bg-white/10 text-white'
                          : 'text-white/60'
                    }`}
                    style={hot && !active ? { transform: 'translateX(2px)' } : undefined}
                  >
                    <Icon size={16} />
                    {item.label}
                  </div>
                )
              })}
            </nav>

            <div className="border-t border-[#1e293b] px-3 py-3 space-y-1">
              {BOTTOM_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-white/60"
                  >
                    <Icon size={16} />
                    {item.label}
                  </div>
                )
              })}
            </div>
          </aside>

          <div className="flex-1 min-w-0 flex flex-col relative">
            <header className="h-14 shrink-0 border-b border-[#1e293b] bg-[#121629]/60 px-6 flex items-center justify-between">
              <p className="text-sm font-semibold">Xoral Studios</p>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
                <div
                  className={`relative p-1.5 rounded-lg transition-colors ${
                    hovered === 'bell' || bellOpen ? 'bg-white/10' : ''
                  }`}
                >
                  <Bell size={16} className="text-white/70" />
                  <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[#7c3aed]" />
                </div>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#06b6d4]" />
              </div>
            </header>

            {bellOpen && (
              <div className="absolute right-6 top-[58px] z-10 w-80 rounded-xl border border-[#1e293b] bg-[#121629] shadow-2xl overflow-hidden">
                <p className="px-4 py-2.5 text-[12px] font-semibold border-b border-[#1e293b]">Notifications</p>
                {NOTIFICATIONS.map((item) => (
                  <div key={item.title} className="px-4 py-3 border-b border-[#1e293b]/80 last:border-0">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[12px] font-semibold">{item.title}</p>
                      <span className="text-[10px] text-[#a1a5b0] shrink-0">{item.time}</span>
                    </div>
                    <p className="text-[11px] text-[#a1a5b0] mt-0.5">{item.body}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex-1 min-h-0 px-6 py-5 overflow-hidden">
              {view === 'overview' || view === 'analytics' ? (
                <>
                  <div className="mb-5 flex items-start justify-between">
                    <div>
                      <h2 className="text-[28px] font-bold leading-none mb-1.5">
                        {view === 'analytics' ? 'Analytics' : 'Dashboard'}
                      </h2>
                      <p className="text-[13px] text-[#a1a5b0]">Track your performance at a glance</p>
                    </div>
                    <div
                      className={`rounded-lg bg-[#7c3aed] px-4 py-2 text-[13px] font-semibold transition-transform ${
                        hovered === 'create' ? 'brightness-110 scale-[1.03]' : ''
                      } ${clicking && hovered === 'create' ? 'scale-95' : ''}`}
                    >
                      Create Link
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {kpis.map((kpi) => {
                      const Icon = kpi.icon
                      const hot = hovered === kpi.key
                      return (
                        <div
                          key={kpi.title}
                          className={`rounded-xl border p-4 transition-all duration-200 ${
                            hot
                              ? 'border-[#7c3aed]/60 bg-[#121629] shadow-[0_0_24px_-8px_rgba(124,58,237,0.7)] -translate-y-0.5'
                              : 'border-[#1e293b] bg-[#121629]/70'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <span className="text-[12px] font-medium text-[#a1a5b0]">{kpi.title}</span>
                            <div
                              className="h-8 w-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${kpi.color}22` }}
                            >
                              <Icon size={15} style={{ color: kpi.color }} />
                            </div>
                          </div>
                          <p className="text-[26px] font-bold leading-none mb-2 tabular-nums">{kpi.value}</p>
                          <p className="text-[11px] text-emerald-400">↑ {kpi.change}% vs prior 7 days</p>
                        </div>
                      )
                    })}
                  </div>

                  <div
                    className={`rounded-xl border p-4 mb-4 transition-all duration-200 ${
                      hovered === 'chart'
                        ? 'border-[#7c3aed]/50 bg-[#121629] shadow-[0_0_28px_-10px_rgba(124,58,237,0.6)]'
                        : 'border-[#1e293b] bg-[#121629]/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[14px] font-semibold">Click Trends (14 days)</h3>
                      {hovered === 'chart' && (
                        <span className="text-[11px] text-[#c4b5fd] font-medium">2,920 clicks · Aug 12</span>
                      )}
                    </div>
                    <TrendChart reduced={reduced} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { title: 'Traffic Sources', items: TRAFFIC, key: 'traffic' },
                      { title: 'Device Breakdown', items: DEVICES, key: 'device' },
                    ].map((panel) => (
                      <div
                        key={panel.title}
                        className={`rounded-xl border p-4 transition-all duration-200 ${
                          hovered === 'traffic-0' && panel.key === 'traffic'
                            ? 'border-[#7c3aed]/40 bg-[#121629]'
                            : 'border-[#1e293b] bg-[#121629]/70'
                        }`}
                      >
                        <h3 className="text-[14px] font-semibold mb-3">{panel.title}</h3>
                        <div className="space-y-2.5">
                          {panel.items.map((item, i) => (
                            <div
                              key={item.label}
                              className={`rounded-md px-1 -mx-1 ${
                                hovered === 'traffic-0' && panel.key === 'traffic' && i === 0
                                  ? 'bg-[#7c3aed]/10'
                                  : ''
                              }`}
                            >
                              <div className="flex items-center justify-between text-[12px] mb-1">
                                <span className="font-medium">{item.label}</span>
                                <span className="text-[#a1a5b0]">{item.value.toLocaleString()}</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${item.percentage}%`,
                                    background: 'linear-gradient(90deg, #7c3aed, #06b6d4)',
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              {view === 'links' && (
                <div>
                  <h2 className="text-[28px] font-bold leading-none mb-1.5">Links</h2>
                  <p className="text-[13px] text-[#a1a5b0] mb-5">Manage and track every short link</p>
                  <div className="rounded-xl border border-[#1e293b] bg-[#121629]/70 overflow-hidden">
                    <div className="grid grid-cols-[1.4fr_0.8fr_0.4fr_0.4fr] gap-3 px-4 py-2.5 text-[11px] text-[#a1a5b0] border-b border-[#1e293b]">
                      <span>Link</span>
                      <span>Short URL</span>
                      <span>Clicks</span>
                      <span>Unique</span>
                    </div>
                    {DEMO_LINKS.map((link, i) => (
                      <div
                        key={link.url}
                        className={`grid grid-cols-[1.4fr_0.8fr_0.4fr_0.4fr] gap-3 px-4 py-3 text-[13px] border-b border-[#1e293b]/70 last:border-0 transition-colors ${
                          hovered === 'link-0' && i === 0 ? 'bg-[#7c3aed]/15' : ''
                        }`}
                      >
                        <span className="font-semibold truncate">{link.title}</span>
                        <span className="text-[#67e8f9] truncate">{link.url}</span>
                        <span className="font-semibold tabular-nums">{link.clicks.toLocaleString()}</span>
                        <span className="tabular-nums text-[#a1a5b0]">{link.unique.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {view === 'campaigns' && (
                <div>
                  <h2 className="text-[28px] font-bold leading-none mb-1.5">Campaigns</h2>
                  <p className="text-[13px] text-[#a1a5b0] mb-5">Group links and measure each push</p>
                  <div className="space-y-3">
                    {DEMO_CAMPAIGNS.map((campaign, i) => (
                      <motion.div
                        key={campaign.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="rounded-xl border border-[#1e293b] bg-[#121629]/70 p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[14px] font-semibold">{campaign.name}</p>
                          <span className="text-[11px] font-semibold text-emerald-400">{campaign.status}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-2">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: 'linear-gradient(90deg, #7c3aed, #06b6d4)' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${campaign.progress}%` }}
                            transition={{ duration: 0.7, delay: 0.15 + i * 0.08 }}
                          />
                        </div>
                        <p className="text-[12px] text-[#a1a5b0]">
                          {campaign.clicks.toLocaleString()} clicks · {campaign.progress}% of goal
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {view === 'qr' && (
                <div>
                  <h2 className="text-[28px] font-bold leading-none mb-1.5">QR Codes</h2>
                  <p className="text-[13px] text-[#a1a5b0] mb-5">Print-ready codes with live scan counts</p>
                  <div className="grid grid-cols-3 gap-3">
                    <MiniQr delay={0} />
                    <MiniQr delay={1} />
                    <MiniQr delay={2} />
                  </div>
                </div>
              )}

              {view === 'insights' && (
                <div>
                  <h2 className="text-[28px] font-bold leading-none mb-1.5">AI Insights</h2>
                  <p className="text-[13px] text-[#a1a5b0] mb-5">What to do next, based on your traffic</p>
                  <div className="space-y-3">
                    {DEMO_INSIGHTS.map((insight, i) => (
                      <motion.div
                        key={insight.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.12 }}
                        className="rounded-xl border border-[#1e293b] bg-[#121629]/70 p-5"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-lg bg-[#7c3aed]/20 flex items-center justify-center shrink-0">
                            <Sparkles size={16} className="text-[#c4b5fd]" />
                          </div>
                          <div>
                            <p className="text-[14px] font-semibold mb-1">{insight.title}</p>
                            <p className="text-[12px] text-[#a1a5b0] leading-relaxed">{insight.body}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {view === 'reports' && (
                <div>
                  <h2 className="text-[28px] font-bold leading-none mb-1.5">Reports</h2>
                  <p className="text-[13px] text-[#a1a5b0] mb-5">Scheduled summaries for your team</p>
                  <div className="rounded-xl border border-[#1e293b] bg-[#121629]/70 p-4 text-[13px] text-[#a1a5b0]">
                    Weekly performance report · Last sent 2 hours ago
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 rounded-lg bg-[#7c3aed] px-4 py-2 text-[13px] font-semibold shadow-lg"
          >
            {toast}
          </motion.div>
        )}

        {ripple && (
          <motion.div
            key={ripple.id}
            className="absolute z-30 rounded-full border-2 border-white/80"
            style={{ left: ripple.x, top: ripple.y, width: 22, height: 22, marginLeft: -4, marginTop: -4 }}
            initial={{ scale: 0.35, opacity: 0.85 }}
            animate={{ scale: 2.6, opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />
        )}

        {!reduced && inView && (
          <motion.div className="absolute z-40" style={{ x: cursorX, y: cursorY }}>
            <motion.div
              animate={{ scale: clicking ? 0.78 : 1 }}
              transition={{ duration: 0.12 }}
              className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.55)]"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 3.5l14.5 9.2-6.4 1.4 2.7 6.5-2.9 1.2-2.7-6.4L5 21.5V3.5z"
                  fill="#f8fafc"
                  stroke="#0f172a"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
