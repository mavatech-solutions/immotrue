import type { PropertyData } from '../../../../../shared/types/index.ts'
import { runApifyActor } from '../../../../../shared/utils/apify.ts'
import { ListingOfflineError } from '../errors.ts'

// Direct scraping of homegate.ch is unreliable — its search pages sometimes
// pass DataDome, but detail pages (what a pasted listing URL needs)
// consistently returned 403 in real testing, even with a valid session
// cookie carried over from a successful search request. Using
// ducto/homegate-property-scraper instead (~$1.80/1000 results, no rental
// fee) — field names verified against the actor's real documented output
// sample. Note the input field is literally "searchUrls" despite the UI
// label reading "Start URLs" — confirmed from the actor's own input
// schema, not guessed from naming convention.
export async function scrapeHomegateViaApify(url: string, signal: AbortSignal): Promise<PropertyData> {
  const items = await runApifyActor(
    'ducto/homegate-property-scraper',
    { searchUrls: [url], offerType: 'BUY', proxyConfiguration: { useApifyProxy: true, apifyProxyCountry: 'CH' } },
    signal,
  )
  if (items.length === 0) throw new ListingOfflineError()
  const [item] = items

  const characteristics = item.characteristics as Record<string, unknown> | undefined
  const address = item.address as Record<string, unknown> | undefined
  const agency = item.agency as Record<string, unknown> | undefined

  const price = numberOrNull(item.price)
  const size = numberOrNull(characteristics?.livingSpaceSqm)

  return {
    title: stringOrEmpty(item.title),
    price: price ?? 0,
    pricePerSqm: price && size ? Math.round(price / size) : null,
    size,
    rooms: numberOrNull(characteristics?.numberOfRooms),
    address: stringOrNull(address?.street),
    district: null, // not present in this actor's output shape
    city: stringOrEmpty(address?.locality),
    state: stringOrNull(address?.region),
    zipCode: stringOrNull(address?.postalCode),
    energyClass: null, // not present in this actor's output shape
    yearBuilt: numberOrNull(characteristics?.yearBuilt),
    condition: null,
    floor: numberOrNull(characteristics?.floor),
    totalFloors: null,
    hasParking: boolOrNull(characteristics?.hasParking),
    hasBalcony: boolOrNull(characteristics?.hasBalcony),
    hasGarden: null,
    heatingType: null,
    daysOnMarket: daysSince(stringOrNull(item.publishedAt)),
    isPrivateSeller: agency ? false : null,
    description: stringOrEmpty(item.description),
    portal: 'homegate',
    originalUrl: url,
  }
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = Number(value.replace(/[^\d.-]/g, ''))
    return Number.isFinite(n) ? n : null
  }
  return null
}

function stringOrNull(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return null
}

function stringOrEmpty(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function boolOrNull(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}

function daysSince(dateText: string | null): number | null {
  if (!dateText) return null
  const date = new Date(dateText)
  if (Number.isNaN(date.getTime())) return null
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)))
}
