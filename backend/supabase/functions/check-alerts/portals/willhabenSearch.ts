import type { Alert } from '../../../../../shared/types/index.ts'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const TYPE_PATHS: Record<string, string[]> = {
  wohnung: ['eigentumswohnung/eigentumswohnung-angebote'],
  haus: ['haus-kaufen/haus-angebote'],
  beides: ['eigentumswohnung/eigentumswohnung-angebote', 'haus-kaufen/haus-angebote'],
}

interface WillhabenAttribute {
  name: string
  values: string[]
}

interface WillhabenListing {
  attributes: { attribute: WillhabenAttribute[] }
}

// willhaben.at's search filters (PRICE_FROM/NO_OF_ROOMS etc.) didn't
// actually narrow results when tested against real requests, so instead we
// fetch the nationwide category page and filter ourselves using the
// structured data willhaben already embeds in the page as Next.js props
// (each listing's PRICE/NUMBER_OF_ROOMS/LOCATION/DISTRICT/STATE
// attributes) — more reliable than guessing at query params, and no CSS
// selectors to keep in sync with their markup.
export async function searchWillhaben(alert: Alert, signal: AbortSignal): Promise<string[]> {
  const typePaths = TYPE_PATHS[alert.property_type ?? 'beides'] ?? TYPE_PATHS.beides
  const urls = new Set<string>()

  for (const typePath of typePaths) {
    const res = await fetch(`https://www.willhaben.at/iad/immobilien/${typePath}`, {
      headers: { 'User-Agent': USER_AGENT },
      signal,
    })
    if (!res.ok) continue

    const html = await res.text()
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (!match) continue

    const listings = extractListings(match[1])
    for (const listing of listings) {
      const seoUrl = attr(listing, 'SEO_URL')
      if (!seoUrl || !matchesCriteria(listing, alert)) continue
      urls.add(`https://www.willhaben.at/iad/${seoUrl}`)
    }
  }

  return [...urls]
}

function extractListings(nextDataJson: string): WillhabenListing[] {
  try {
    const data = JSON.parse(nextDataJson)
    return data?.props?.pageProps?.searchResult?.advertSummaryList?.advertSummary ?? []
  } catch {
    return []
  }
}

function attr(listing: WillhabenListing, name: string): string | null {
  return listing.attributes?.attribute?.find((a) => a.name === name)?.values?.[0] ?? null
}

function matchesCriteria(listing: WillhabenListing, alert: Alert): boolean {
  if (alert.city) {
    const location = [attr(listing, 'LOCATION'), attr(listing, 'DISTRICT'), attr(listing, 'STATE')]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    if (!location.includes(alert.city.toLowerCase())) return false
  }

  if (alert.max_price) {
    const price = Number(attr(listing, 'PRICE'))
    if (Number.isFinite(price) && price > alert.max_price) return false
  }

  if (alert.min_rooms) {
    const rooms = Number(attr(listing, 'NUMBER_OF_ROOMS'))
    if (Number.isFinite(rooms) && rooms < alert.min_rooms) return false
  }

  return true
}
