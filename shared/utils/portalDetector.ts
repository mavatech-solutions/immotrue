import type { Portal } from '../types/index.ts'

// Real domains of the 8 supported DACH portals. Used in Mobile + Web + Admin.
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
    id: 'immonet',
    name: 'Immonet',
    domain: 'immonet.de',
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
    id: 'wohnungsboerse',
    name: 'Wohnungsbörse',
    domain: 'wohnungsboerse.net',
    flag: '🇩🇪',
    countries: ['DE'],
    isPrivateFriendly: true,
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
