import { DOMParser, type Element, type HTMLDocument } from 'jsr:@b-fuze/deno-dom'
import type { PropertyData } from '../../../../../shared/types/index.ts'
import { parseGermanNumber } from '../../../../../shared/utils/parseGermanNumber.ts'
import { ListingOfflineError } from '../errors.ts'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

// ohne-makler.net is a traditional server-rendered site with no bot
// protection. It has no single structured data source (no JSON-LD for the
// listing itself, no embedded app state), so we combine a details table
// with a few page-specific selectors found by inspecting a real listing.
export async function scrapeOhneMakler(url: string, signal: AbortSignal): Promise<PropertyData> {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal })

  if (res.status === 404) throw new ListingOfflineError()
  if (!res.ok) throw new Error(`ohne-makler.net returned HTTP ${res.status}`)

  const html = await res.text()
  const doc = new DOMParser().parseFromString(html, 'text/html')
  if (!doc) throw new Error('Failed to parse ohne-makler.net HTML')

  const title =
    doc.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() ??
    doc.querySelector('h1')?.textContent?.trim() ??
    ''

  const table = extractTable(doc)
  const iconFacts = extractIconFacts(doc)
  const price = parseGermanNumber(table['Kaufpreis']) ?? parseGermanNumber(firstPriceInMainHeading(doc))
  const size = parseGermanNumber(table['Wohnfläche'] ?? iconFacts['Wohnfläche'])
  const rooms = parseGermanNumber(table['Zimmer'] ?? iconFacts['Zimmer'])
  const yearBuilt = parseGermanNumber(table['Baujahr'])

  // Zip + city aren't in a structured element; they reliably appear as
  // plain text like "80937 München" near the address/map section.
  const bodyText = doc.body?.textContent ?? ''
  const zipCityMatch = bodyText.match(/(\d{5})\s+([A-ZÄÖÜ][a-zäöüß]+(?:[ -][A-ZÄÖÜ][a-zäöüß]+)*)/)
  const zipCode = zipCityMatch?.[1] ?? null
  const city = zipCityMatch?.[2] ?? null

  // The state only shows up as a breadcrumb-style link. There are several
  // similar links at increasing specificity (city, district, state) — the
  // state-level one is the only one whose href has just a single path
  // segment after "wohnung-kaufen/" (city/district links have 2+), e.g.
  // .../wohnung-kaufen/bayern/">Wohnung in Bayern kaufen</a>  <- state
  // .../wohnung-kaufen/bayern/munchen/">Wohnung in München kaufen</a>  <- city
  const stateMatch = html.match(
    /href="\/immobilien\/(?:wohnung|haus)-kaufen\/[a-z-]+\/">(?:Wohnung|Haus) in ([^<]+) kaufen<\/a>/,
  )
  const state = stateMatch?.[1]?.trim() ?? null

  return {
    title,
    price: price ?? 0,
    pricePerSqm: price && size ? Math.round(price / size) : null,
    size,
    rooms,
    address: null,
    district: null,
    city: city ?? '',
    state,
    zipCode,
    energyClass: table['Energieklasse'] ?? null,
    yearBuilt,
    condition: table['Zustand'] ?? null,
    floor: parseGermanNumber(table['Etage']),
    totalFloors: null,
    hasParking: null,
    hasBalcony: null,
    hasGarden: null,
    heatingType: table['Heizungsart'] ?? null,
    daysOnMarket: null,
    isPrivateSeller: true, // ohne-makler.net's entire premise is private-only listings
    description: '',
    portal: 'ohnemakler',
    originalUrl: url,
  }
}

// Reads the site's "Objektdaten" table: rows shaped like
// <tr><td><div>Label</div></td><td><div>Value</div></td></tr>
function extractTable(doc: HTMLDocument): Record<string, string> {
  const table: Record<string, string> = {}

  for (const row of doc.querySelectorAll('tr')) {
    const cells = row.querySelectorAll('td')
    if (cells.length !== 2) continue

    const label = cells[0].textContent?.trim()
    const value = cells[1].textContent?.trim()
    if (label && value) table[label] = value
  }

  return table
}

function firstPriceInMainHeading(doc: HTMLDocument): string | null {
  return doc.querySelector('[class*="animation-underline"]')?.textContent?.trim() ?? null
}

// Reads the icon fact-cards at the top of the listing, shaped like:
// <div><div><i class="icon"></i><span>4</span></div><span class="... text-slate-500 ...">Zimmer</span></div>
// The value and label are siblings under a shared parent, with the value first.
function extractIconFacts(doc: HTMLDocument): Record<string, string> {
  const facts: Record<string, string> = {}

  for (const label of doc.querySelectorAll('[class*="text-slate-500"]') as unknown as Element[]) {
    const labelText = label.textContent?.trim()
    const parent = label.parentElement
    if (!labelText || !parent) continue

    const value = parent.textContent?.replace(labelText, '').trim()
    if (value) facts[labelText] = value
  }

  return facts
}
