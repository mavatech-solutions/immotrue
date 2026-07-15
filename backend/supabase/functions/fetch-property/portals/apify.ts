import type { PropertyData } from '../../../../../shared/types/index.ts'
import { ListingOfflineError } from '../errors.ts'

async function runApifyActor(
  actorId: string,
  input: Record<string, unknown>,
  signal: AbortSignal,
): Promise<Record<string, unknown>[]> {
  const token = Deno.env.get('APIFY_TOKEN')
  if (!token) throw new Error('APIFY_TOKEN secret is not set')

  // Slashes in "owner/actor-name" become tildes in the URL path.
  const encodedActorId = actorId.replace('/', '~')
  const res = await fetch(
    `https://api.apify.com/v2/actors/${encodedActorId}/run-sync-get-dataset-items`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
      signal,
    },
  )

  if (!res.ok) throw new Error(`Apify actor ${actorId} responded with HTTP ${res.status}`)

  const items = await res.json()
  if (!Array.isArray(items) || items.length === 0) throw new ListingOfflineError()

  return items
}

export async function scrapeImmoscout24ViaApify(url: string, signal: AbortSignal): Promise<PropertyData> {
  const [item] = await runApifyActor('clearpath/immoscout24-detail-listing-scraper', { urls: [url] }, signal)

  const price = numberOrNull(item.purchase_price)
  const size = numberOrNull(item.size)
  const attributes = item.attributes as Record<string, unknown> | undefined
  const condition = stringOrNull(item.condition)

  return {
    title: stringOrEmpty(item.title ?? item.address_line_1),
    price: price ?? 0,
    pricePerSqm: price && size ? Math.round(price / size) : null,
    size,
    rooms: numberOrNull(item.rooms),
    address: stringOrNull(item.address_line_1),
    district: stringOrNull(item.city_district),
    city: stringOrEmpty(item.city),
    state: stringOrNull(item.state),
    zipCode: stringOrNull(item.zip_code), // note: comes back as a number from this actor
    energyClass: stringOrNull(attributes?.obj_energyEfficiencyClass),
    yearBuilt: numberOrNull(item.year_constructed),
    condition: condition === 'no_information' ? null : condition,
    floor: numberOrNull(item.floor),
    totalFloors: numberOrNull(item.number_of_floors),
    hasParking: null,
    hasBalcony: boolOrNull(item.balcony_terrace),
    hasGarden: boolOrNull(item.garden),
    heatingType: stringOrNull(item.heating_type),
    daysOnMarket: daysSince(stringOrNull(item.online_since)),
    isPrivateSeller: boolOrNull(item.private_offer),
    description: '',
    portal: 'immoscout',
    originalUrl: url,
  }
}

export async function scrapeImmoweltViaApify(url: string, signal: AbortSignal): Promise<PropertyData> {
  const [item] = await runApifyActor('blackfalcondata/immowelt-scraper', { startUrls: [url] }, signal)

  const price = numberOrNull(item.price)
  const size = numberOrNull(item.livingAreaSqm)
  const broker = item.broker as Record<string, unknown> | undefined
  const energy = item.energy as Record<string, unknown> | undefined
  const energyClassMatch =
    typeof energy?.class === 'string' ? energy.class.match(/_CLASS_([A-Z+]+)$/) : null

  return {
    title: stringOrEmpty(item.title),
    price: price ?? 0,
    pricePerSqm: numberOrNull(item.pricePerSqm) ?? (price && size ? Math.round(price / size) : null),
    size,
    rooms: numberOrNull(item.roomsMin ?? item.roomsMax),
    address: null,
    district: stringOrNull(item.district),
    city: stringOrEmpty(item.city),
    state: null,
    zipCode: stringOrNull(item.postalCode),
    energyClass: energyClassMatch?.[1] ?? null,
    yearBuilt: numberOrNull(item.constructionYear),
    condition: null,
    floor: null,
    totalFloors: null,
    hasParking: null,
    hasBalcony: null,
    hasGarden: null,
    heatingType: null,
    daysOnMarket: daysSince(stringOrNull(item.updatedAt)),
    // Presence of a broker means an agency/partner is involved — the
    // sellerType values (e.g. "PARTNER") are never a reliable "private" signal.
    isPrivateSeller: broker ? false : null,
    description: '',
    portal: 'immowelt',
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
