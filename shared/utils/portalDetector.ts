import type { Portal } from '../types/index.ts'

// Real domains of the 7 supported DACH portals. Used in Mobile + Web + Admin.
// Immonet.de is deliberately absent: AVIV Group discontinued it as a
// separate brand in early 2026 and merged it fully into Immowelt (same
// backend, same bot protection, immonet.de links now redirect there).
// Wohnungsboerse.net is deliberately absent too: it now 301-redirects to
// immobilienscout24.de (confirmed 2026-07-16) — absorbed the same way,
// no longer an independent brand. Other real Swiss portals
// (immostreet.ch, flatfox.ch, newhome.ch, comparis.ch) are deliberately
// absent too — immostreet.ch's listings are just referral links back to
// homegate.ch (no independent inventory), flatfox.ch/newhome.ch have no
// cost-effective scraping path found yet, comparis.ch only re-displays
// other portals' listings.
const PORTALS: Portal[] = [
  {
    id: 'immoscout',
    name: 'ImmoScout24',
    domain: 'immobilienscout24.de',
    flag: '🇩🇪',
    countries: ['DE', 'AT'],
    isPrivateFriendly: true,
  },
  {
    id: 'immowelt',
    name: 'Immowelt',
    domain: 'immowelt.de',
    flag: '🇩🇪',
    countries: ['DE'],
    isPrivateFriendly: false,
  },
  {
    id: 'kleinanzeigen',
    name: 'Kleinanzeigen',
    domain: 'kleinanzeigen.de',
    flag: '🇩🇪',
    countries: ['DE'],
    isPrivateFriendly: true,
  },
  {
    id: 'ohnemakler',
    name: 'ohne-makler.net',
    domain: 'ohne-makler.net',
    flag: '🇩🇪',
    countries: ['DE'],
    isPrivateFriendly: true,
    savingsHint: 'Meist 3-5% günstiger als Makler',
  },
  {
    id: 'willhaben',
    name: 'willhaben',
    domain: 'willhaben.at',
    flag: '🇦🇹',
    countries: ['AT'],
    isPrivateFriendly: true,
  },
  {
    id: 'homegate',
    name: 'Homegate',
    domain: 'homegate.ch',
    flag: '🇨🇭',
    countries: ['CH'],
    isPrivateFriendly: false,
  },
  {
    id: 'immoscout24ch',
    name: 'ImmoScout24',
    domain: 'immoscout24.ch',
    flag: '🇨🇭',
    countries: ['CH'],
    isPrivateFriendly: false,
  },
]

function extractHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function detectPortal(url: string): Portal | null {
  const hostname = extractHostname(url)
  if (!hostname) return null

  return (
    PORTALS.find(
      (portal) => hostname === portal.domain || hostname.endsWith(`.${portal.domain}`)
    ) ?? null
  )
}

export function getAllPortals(): Portal[] {
  return PORTALS
}

export function getPortalById(id: string): Portal | undefined {
  return PORTALS.find((portal) => portal.id === id)
}
