import { DOMParser, type Element } from 'jsr:@b-fuze/deno-dom'
import type { Alert } from '../../../../../shared/types/index.ts'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const TYPE_KEYWORDS: Record<string, string[]> = {
  wohnung: ['wohnung kaufen'],
  haus: ['haus kaufen'],
  beides: ['wohnung kaufen', 'haus kaufen'],
}

// Kleinanzeigen has no bot protection, so we hit its free-text search
// entrypoint directly instead of paying for an Apify actor. That entrypoint
// (verified against a real request) canonicalizes location/price/type into
// its category-path URL for us, so no city->category-code mapping is needed.
// Room count isn't reliably filterable server-side (its "zimmer_d-min" form
// field doesn't affect the query string search), so it's applied
// client-side below, best-effort, from the listing slug text.
export async function searchKleinanzeigen(alert: Alert, signal: AbortSignal): Promise<string[]> {
  if (!alert.city) return []

  const keywords = TYPE_KEYWORDS[alert.property_type ?? 'beides'] ?? TYPE_KEYWORDS.beides
  const urls = new Set<string>()

  for (const keyword of keywords) {
    const searchUrl = new URL('https://www.kleinanzeigen.de/s-suchanfrage.html')
    searchUrl.searchParams.set('keywords', keyword)
    searchUrl.searchParams.set('locationStr', alert.city)
    searchUrl.searchParams.set('radius', String(alert.radius_km ?? 10))
    if (alert.max_price) searchUrl.searchParams.set('maxPrice', String(alert.max_price))

    const res = await fetch(searchUrl, { headers: { 'User-Agent': USER_AGENT }, signal })
    if (!res.ok) continue

    const html = await res.text()
    const doc = new DOMParser().parseFromString(html, 'text/html')
    if (!doc) continue

    const container = doc.querySelector('#srchrslt-adtable')
    const anchors = Array.from((container ?? doc).querySelectorAll('a[href*="/s-anzeige/"]')) as Element[]

    for (const anchor of anchors) {
      const href = anchor.getAttribute('href')
      if (!href) continue
      if (alert.min_rooms && !matchesMinRooms(href, alert.min_rooms)) continue
      urls.add(new URL(href, 'https://www.kleinanzeigen.de').toString())
    }
  }

  return [...urls]
}

// Slugs look like ".../2-zimmer-wohnung-mit-balkon-.../123-196-456" — if we
// can find an explicit "N-zimmer" count, honor it; otherwise let it through
// rather than risk dropping a genuine match over an unparseable slug.
function matchesMinRooms(href: string, minRooms: number): boolean {
  const match = href.match(/(\d+)[-_]?zimmer/i)
  if (!match) return true
  return Number(match[1]) >= minRooms
}
