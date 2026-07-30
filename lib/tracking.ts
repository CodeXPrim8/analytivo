import { UAParser } from 'ua-parser-js'
import { createHash } from 'crypto'

export function parseUserAgent(ua?: string | null) {
  const parser = new UAParser(ua || '')
  const result = parser.getResult()
  const deviceType = result.device.type || 'desktop'
  return {
    device: deviceType === 'mobile' || deviceType === 'tablet' ? deviceType : 'desktop',
    browser: result.browser.name || 'Unknown',
    os: result.os.name || 'Unknown',
  }
}

export function visitorIdFrom(ip: string, ua: string) {
  return createHash('sha256').update(`${ip}|${ua}`).digest('hex').slice(0, 32)
}

export function referrerSource(referrer?: string | null) {
  if (!referrer) return 'direct'
  try {
    const host = new URL(referrer).hostname.toLowerCase()
    if (host.includes('whatsapp')) return 'whatsapp'
    if (host.includes('facebook') || host.includes('fb.')) return 'facebook'
    if (host.includes('instagram')) return 'instagram'
    if (host.includes('tiktok')) return 'tiktok'
    if (host.includes('twitter') || host.includes('x.com')) return 'twitter'
    if (host.includes('youtube')) return 'youtube'
    if (host.includes('linkedin')) return 'linkedin'
    if (host.includes('google')) return 'google'
    return host.replace(/^www\./, '')
  } catch {
    return 'direct'
  }
}
