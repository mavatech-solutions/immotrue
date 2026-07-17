import { DOMParser, type Element } from 'jsr:@b-fuze/deno-dom'
import { parseGermanNumber } from '../../../../../shared/utils/parseGermanNumber.ts'
import type { Alert } from '../../../../../shared/types/index.ts'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const TYPE_PATHS: Record<string, string[]> = {
  wohnung: ['wohnung-kaufen'],
  haus: ['haus-kaufen'],
  beides: ['wohnung-kaufen', 'haus-kaufen'],
}

// ohne-makler.net's own filter form is an htmx/AJAX live-component (no
// plain query-string equivalent we could find), and its city pages need a
// state-name segment we don't have (e.g. /immobilien/bayern/muenchen/).
// So instead of replicating that, we fetch the nationwide category page
// (still free, no bot protection) and filter city/price/rooms ourselves
// from the text each listing card already shows.
export async function searchOhneMakler(alert: Alert, signal: AbortSignal): Promise<string[]> {
  const typePaths = TYPE_PATHS[alert.property_type ?? 'beides'] ?? TYPE_PATHS.beides
  const urls = new Set<string>()

  for (const typePath of typePaths) {
    const res = await fetch(`https://www.ohne-makler.net/immobilien/${typePath}/`, {
      headers: { 'User-Agent': USER_AGENT },
      signal,
    })
    if (!res.ok) continue

    const html = await res.text()
    const doc = new DOMParser().parseFromString(html, 'text/html')
    if (!doc) continue

    const anchors = Array.from(doc.querySelectorAll('a[href^="/immobilie/"]')) as Element[]

    for (const anchor of anchors) {
      const href = anchor.getAttribute('href')
      if (!href) continue

      const text = anchor.textContent ?? ''
      if (!matchesCriteria(text, alert)) continue

      urls.add(new URL(href, 'https://www.ohne-makler.net').toString())
    }
  }

  return [...urls]
}

function matchesCriteria(cardText: string, alert: Alert): boolean {
  if (alert.city && !cardText.toLowerCase().includes(alert.city.toLowerCase())) return false

  if (alert.max_price) {
    const price = parseGermanNumber(cardText.match(/[\d.]+\s*€/)?.[0])
    if (price != null && price > alert.max_price) return false
  }

  if (alert.min_rooms) {
    const roomsMatch = cardText.match(/(\d+)[-\s]?Zimmer/i)
    if (roomsMatch && Number(roomsMatch[1]) < alert.min_rooms) return false
  }

  return true
}
