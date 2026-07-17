// Shared by analyze-location (geocode a listing's address) and check-alerts
// (geocode an alert's city for the ImmoScout24 radius search).

// Nominatim's usage policy requires a descriptive User-Agent identifying
// the application (not a browser UA) — https://operations.osmfoundation.org/policies/nominatim/
const USER_AGENT = 'ImmoTrue/0.1 (https://immotrue.de)'

export async function geocodeAddress(query: string): Promise<{ lat: number; lng: number } | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')

  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`Nominatim responded with HTTP ${res.status}`)

  const results = await res.json()
  if (!Array.isArray(results) || results.length === 0) return null

  return { lat: Number(results[0].lat), lng: Number(results[0].lon) }
}
