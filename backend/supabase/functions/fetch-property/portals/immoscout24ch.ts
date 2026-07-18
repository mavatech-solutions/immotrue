import type { PropertyData } from '../../../../../shared/types/index.ts'
import { runApifyActor } from '../../../../../shared/utils/apify.ts'
import { ListingOfflineError } from '../errors.ts'

// Field names verified against a REAL live listing fetched through this
// actor (memo23/immobilienscout24-scraper) — the actor's own documentation
// page shows a different, flatter sample shape that turned out not to
// match live output at all. The actor exposes a stable top-level
// `normalized` object (self-described, consistent even for a 404'd
// listing where every field is null) — that's what this maps from, not
// the much messier raw `listing.*` shape underneath it. Paid:
// ~$1.14-1.75/1000 results, no monthly rental.
export async function scrapeImmoscout24ChViaApify(url: string, signal: AbortSignal): Promise<PropertyData> {
  const items = await runApifyActor('memo23/immobilienscout24-scraper', { startUrls: [url] }, signal)

  // A single detail startUrl still comes back with extra related-listing
  // rows in the same dataset (confirmed live: 11 items for 1 requested
  // URL) — match on the requested listing's own ID rather than assuming
  // index 0 is the right one.
  const requestedId = url.match(/\/(\d+)\/?(?:[?#].*)?$/)?.[1]
  const item =
    items.find((i) => String((i as { id?: unknown }).id) === requestedId) ??
    items.find((i) => (i.normalized as Record<string, unknown> | undefined)?.title)

  const n = item?.normalized as Record<string, unknown> | undefined
  // The actor still returns a row for a delisted/expired listing (status
  // "not_found") — every `normalized` field is null in that case rather
  // than the item being absent, so a missing title is the real signal.
  if (!item || !n?.title) throw new ListingOfflineError()
  const price = n.price as Record<string, unknown> | undefined
  const area = n.area as Record<string, unknown> | undefined
  const rooms = n.rooms as Record<string, unknown> | undefined
  const floor = n.floor as Record<string, unknown> | undefined
  const construction = n.construction as Record<string, unknown> | undefined
  const address = n.address as Record<string, unknown> | undefined

  // `normalized` doesn't carry amenity flags (parking/balcony/elevator) —
  // those only exist on the raw, less-stable `listing.characteristics`.
  const listing = item.listing as Record<string, unknown> | undefined
  const characteristics = listing?.characteristics as Record<string, unknown> | undefined

  const priceAmount = numberOrNull(price?.amount)
  const size = numberOrNull(area?.livingSpace)
  const street = stringOrNull(address?.street)
  const houseNumber = stringOrNull(address?.houseNumber)

  return {
    title: stringOrEmpty(n.title),
    price: priceAmount ?? 0,
    pricePerSqm: priceAmount && size ? Math.round(priceAmount / size) : null,
    size,
    rooms: numberOrNull(rooms?.total),
    address: street ? [street, houseNumber].filter(Boolean).join(' ') : null,
    district: null, // not present in this actor's output
    city: stringOrEmpty(address?.city),
    state: stringOrNull(address?.region),
    zipCode: stringOrNull(address?.zip),
    energyClass: null, // not present in this actor's output
    yearBuilt: numberOrNull(construction?.yearBuilt),
    condition: stringOrNull(construction?.condition),
    floor: numberOrNull(floor?.current),
    totalFloors: numberOrNull(floor?.total),
    hasParking: boolOrNull(characteristics?.hasParking),
    hasBalcony: boolOrNull(characteristics?.hasBalcony),
    hasGarden: boolOrNull(characteristics?.hasGarden),
    heatingType: null, // not present in this actor's output
    daysOnMarket: daysSince(stringOrNull(n.publishedAt)),
    // No reliable private-vs-agency signal in the verified output —
    // `contact` was entirely null even on a real listing, so this stays
    // unknown rather than guessing from an ambiguous internal bundle code.
    isPrivateSeller: null,
    description: stringOrEmpty(n.description),
    portal: 'immoscout24ch',
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
