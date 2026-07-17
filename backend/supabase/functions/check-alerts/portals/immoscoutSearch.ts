import { runApifyActor } from '../../../../../shared/utils/apify.ts'
import { geocodeAddress } from '../../../../../shared/utils/geocode.ts'
import type { Alert } from '../../../../../shared/types/index.ts'

// ImmoScout24's "radius" search (as opposed to the region/city-slug search,
// which would need a German state-name mapping table) takes plain
// lat/lng + a radius in km — verified against a real generated search URL.
const TYPE_PATHS: Record<string, string[]> = {
  wohnung: ['wohnung-kaufen'],
  haus: ['haus-kaufen'],
  beides: ['wohnung-kaufen', 'haus-kaufen'],
}

export async function searchImmoscout(alert: Alert, signal: AbortSignal): Promise<string[]> {
  if (!alert.city) return []

  const coords = await geocodeAddress(alert.city)
  if (!coords) return []

  const typePaths = TYPE_PATHS[alert.property_type ?? 'beides'] ?? TYPE_PATHS.beides
  const radius = alert.radius_km ?? 10

  const startUrls = typePaths.map((typePath) => {
    const url = new URL(`https://www.immobilienscout24.de/Suche/radius/${typePath}`)
    url.searchParams.set('centerofsearchaddress', `${alert.city};;;;;;`)
    url.searchParams.set('geocoordinates', `${coords.lat};${coords.lng};${radius}`)
    if (alert.max_price) url.searchParams.set('price', `-${alert.max_price}`)
    if (alert.min_rooms) url.searchParams.set('numberofrooms', `${alert.min_rooms}.0-`)
    return url.toString()
  })

  // monitorMode: only new listings since the last run against this exact
  // set of search URLs are returned (and billed) — repeat polling stays cheap.
  // pageLimit caps the worst case (a pathologically broad alert) at
  // ~80-100 results/run (~20-25 per page) rather than the actor's own
  // 8,000-listing ceiling — this is a pure cost circuit breaker, real
  // alerts (city + price + room filtered) should never get close to it.
  const items = await runApifyActor(
    'clearpath/immoscout24-api-pro',
    { startUrls, monitorMode: true, pageLimit: 4 },
    signal,
  )

  return items.map((item) => (typeof item.url === 'string' ? item.url : null)).filter((url): url is string => !!url)
}
