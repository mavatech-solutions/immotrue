import { DOMParser, type Element, type HTMLDocument } from 'jsr:@b-fuze/deno-dom'
import type { PropertyData } from '../../../../../shared/types/index.ts'
import { parseGermanNumber } from '../../../../../shared/utils/parseGermanNumber.ts'
import { ListingOfflineError } from '../errors.ts'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

// Kleinanzeigen serves plain server-rendered HTML with no bot protection,
// so we parse it directly instead of paying for an Apify actor.
export async function scrapeKleinanzeigen(url: string, signal: AbortSignal): Promise<PropertyData> {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal })

  if (res.status === 404) throw new ListingOfflineError()
  if (!res.ok) throw new Error(`Kleinanzeigen returned HTTP ${res.status}`)

  const html = await res.text()
  const doc = new DOMParser().parseFromString(html, 'text/html')
  if (!doc) throw new Error('Failed to parse Kleinanzeigen HTML')

  const title = doc.querySelector('title')?.textContent?.trim() ?? ''
  const price = parseGermanNumber(doc.querySelector('#viewad-price')?.textContent)

  const locality = doc.querySelector('#viewad-locality')?.textContent?.trim() ?? ''
  const zipMatch = locality.match(/^(\d{5})\s+(.+)$/)
  const zipCode = zipMatch?.[1] ?? null
  const city = zipMatch?.[2]?.split('-')[0]?.trim() ?? null
  const district = zipMatch?.[2]?.includes('-') ? zipMatch[2].split('-').slice(1).join('-').trim() : null

  const details = extractDetailList(doc)
  const size = parseGermanNumber(details['Wohnfläche'])
  const rooms = parseGermanNumber(details['Zimmer'])
  const floor = parseGermanNumber(details['Etage'])
  const yearBuilt = parseGermanNumber(details['Baujahr'])

  // Kleinanzeigen embeds a tracking payload with the seller type; a
  // "gewerblich" (commercial) flag there is the most reliable signal we found.
  const isPrivateSeller = !html.includes('"Verkaeufer":"gewerblich"')

  const publishedText = doc.querySelector('#viewad-extra-info span')?.textContent?.trim() ?? ''
  const daysOnMarket = daysSinceGermanDate(publishedText)

  return {
    title,
    price: price ?? 0,
    pricePerSqm: price && size ? Math.round(price / size) : null,
    size,
    rooms,
    address: locality || null,
    district,
    city: city ?? '',
    state: null,
    zipCode,
    energyClass: null,
    yearBuilt,
    condition: null,
    floor,
    totalFloors: null,
    hasParking: null,
    hasBalcony: null,
    hasGarden: null,
    heatingType: null,
    daysOnMarket,
    isPrivateSeller,
    description: '',
    portal: 'kleinanzeigen',
    originalUrl: url,
  }
}

// Extracts label -> value pairs from Kleinanzeigen's detail list, e.g.
// <li class="addetailslist--detail">Wohnfläche<span class="addetailslist--detail--value">118 m²</span></li>
function extractDetailList(doc: HTMLDocument): Record<string, string> {
  const details: Record<string, string> = {}

  for (const el of Array.from(doc.querySelectorAll('.addetailslist--detail')) as Element[]) {
    const valueEl = el.querySelector('.addetailslist--detail--value')
    if (!valueEl) continue

    const label = el.textContent?.replace(valueEl.textContent ?? '', '').trim()
    const value = valueEl.textContent?.trim()
    if (label && value) details[label] = value
  }

  return details
}

function daysSinceGermanDate(text: string): number | null {
  const match = text.match(/(\d{2})\.(\d{2})\.(\d{4})/)
  if (!match) return null

  const [, day, month, year] = match
  const published = new Date(Number(year), Number(month) - 1, Number(day))
  const diffMs = Date.now() - published.getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}
