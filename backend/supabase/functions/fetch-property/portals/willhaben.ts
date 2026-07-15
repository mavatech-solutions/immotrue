import type { PropertyData } from '../../../../../shared/types/index.ts'
import { parseGermanNumber } from '../../../../../shared/utils/parseGermanNumber.ts'
import { ListingOfflineError } from '../errors.ts'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

type WillhabenAttributes = Record<string, string>

interface WillhabenAddress {
  postCode: string | null
  district: string | null
  municipality: string | null
  province: string | null
}

interface WillhabenAdvert {
  attributes: WillhabenAttributes
  title: string | null
  firstPublishedDate: string | null
  address: WillhabenAddress | null
  hasOrganisation: boolean
}

// willhaben mixes number formats within the same attribute list: some
// values are German/Austrian-formatted ("124,64"), others are plain
// machine-formatted floats ("10991.656"). A comma is the reliable signal
// for "this one needs German parsing"; otherwise parse it directly.
function parseWillhabenNumber(value: string | undefined): number | null {
  if (value === undefined) return null
  if (value.includes(',')) return parseGermanNumber(value)
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

// willhaben.at (Next.js) embeds the full listing as clean JSON in a
// __NEXT_DATA__ script tag, so there is no HTML to parse at all.
export async function scrapeWillhaben(url: string, signal: AbortSignal): Promise<PropertyData> {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal })

  if (res.status === 404) throw new ListingOfflineError()
  if (!res.ok) throw new Error(`willhaben.at returned HTTP ${res.status}`)

  const html = await res.text()
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s)
  if (!match) throw new Error('willhaben.at: __NEXT_DATA__ not found (page layout may have changed)')

  const nextData = JSON.parse(match[1])
  const advert = findAdvert(nextData)
  if (!advert) throw new ListingOfflineError()

  const { attributes, address } = advert
  const price = parseWillhabenNumber(attributes['PRICE'])
  const size = parseWillhabenNumber(attributes['ESTATE_SIZE/LIVING_AREA'])
  const pricePerSqm = parseWillhabenNumber(attributes['PRICE/SQUARE_METER'])

  return {
    title: advert.title ?? '',
    price: price ?? 0,
    pricePerSqm: pricePerSqm ?? (price && size ? Math.round(price / size) : null),
    size,
    rooms: parseWillhabenNumber(attributes['NUMBER_OF_ROOMS']),
    address: attributes['LOCATION'] ?? null,
    district: address?.district ?? attributes['DISTRICT'] ?? null,
    city: address?.municipality ?? attributes['STATE'] ?? '',
    state: address?.province ?? attributes['STATE'] ?? null,
    zipCode: address?.postCode ?? attributes['POSTCODE'] ?? null,
    energyClass: attributes['ENERGY_FGEE_CLASS'] ?? null,
    yearBuilt: null,
    condition: attributes['PROPERTY_TYPE'] ?? null,
    floor: parseWillhabenNumber(attributes['FLOOR']),
    totalFloors: null,
    hasParking: null,
    hasBalcony: null,
    hasGarden: null,
    heatingType: null,
    daysOnMarket: daysSinceIsoDate(advert.firstPublishedDate),
    isPrivateSeller: !advert.hasOrganisation,
    description: '',
    portal: 'willhaben',
    originalUrl: url,
  }
}

// Walks the __NEXT_DATA__ tree looking for the object shaped like
// { description, firstPublishedDate, attributes: { attribute: [...] },
//   advertAddressDetails, organisationDetails }, regardless of exact
// nesting path (willhaben's props structure isn't documented and may
// shift). The title (in `description`), address, and org info live as
// siblings of `attributes`, not inside the attribute list itself.
function findAdvert(node: unknown, depth = 0): WillhabenAdvert | null {
  if (depth > 12 || node === null || typeof node !== 'object') return null

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findAdvert(item, depth + 1)
      if (found) return found
    }
    return null
  }

  const obj = node as Record<string, unknown>
  const attributesObj = obj.attributes as Record<string, unknown> | undefined

  if (attributesObj && Array.isArray(attributesObj.attribute)) {
    const flat: WillhabenAttributes = {}
    for (const entry of attributesObj.attribute as Array<{ name?: string; values?: unknown[] }>) {
      if (entry?.name && Array.isArray(entry.values) && entry.values.length > 0) {
        flat[entry.name] = String(entry.values[0])
      }
    }
    if (Object.keys(flat).length > 0) {
      const addressDetails = obj.advertAddressDetails as Record<string, unknown> | undefined
      return {
        attributes: flat,
        title: typeof obj.description === 'string' ? obj.description : null,
        firstPublishedDate: typeof obj.firstPublishedDate === 'string' ? obj.firstPublishedDate : null,
        address: addressDetails
          ? {
              postCode: typeof addressDetails.postCode === 'string' ? addressDetails.postCode : null,
              district: typeof addressDetails.district === 'string' ? addressDetails.district : null,
              municipality:
                typeof addressDetails.municipality === 'string' ? addressDetails.municipality : null,
              province: typeof addressDetails.province === 'string' ? addressDetails.province : null,
            }
          : null,
        hasOrganisation: obj.organisationDetails != null,
      }
    }
  }

  for (const value of Object.values(obj)) {
    const found = findAdvert(value, depth + 1)
    if (found) return found
  }

  return null
}

function daysSinceIsoDate(isoDate: string | null): number | null {
  if (!isoDate) return null
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return null
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)))
}
