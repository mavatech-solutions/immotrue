import type { LocationData } from '../../../../shared/types/index.ts'
import { geocodeAddress } from '../../../../shared/utils/geocode.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Overpass has no equivalent shared usage-policy requirement, but reusing
// the same descriptive UA here is good practice for a public API.
const USER_AGENT = 'ImmoTrue/0.1 (https://immotrue.app)'
const POI_RADIUS_M = 500
const NOISE_RADIUS_M = 50

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  try {
    const { address, city } = await req.json()
    if (typeof address !== 'string' || typeof city !== 'string' || !address || !city) {
      return jsonResponse({ error: 'invalid_input', message: 'address and city are required.' }, 400)
    }

    const coordinates = await geocodeAddress(`${address}, ${city}`)
    if (!coordinates) {
      return jsonResponse({ error: 'geocoding_failed', message: 'Adresse konnte nicht gefunden werden.' }, 404)
    }

    const pois = await queryPois(coordinates)

    const location: LocationData = pois
      ? {
          score: computeScore(pois),
          poisSchools: pois.schools,
          poisTransit: pois.transit,
          poisShopping: pois.shopping,
          poisHealth: pois.health,
          poisParks: pois.parks,
          poisRestaurants: pois.restaurants,
          isMainStreet: pois.noise > 0,
          coordinates,
        }
      : {
          score: null,
          poisSchools: null,
          poisTransit: null,
          poisShopping: null,
          poisHealth: null,
          poisParks: null,
          poisRestaurants: null,
          isMainStreet: null,
          coordinates,
        }

    return jsonResponse(location, 200)
  } catch (error) {
    console.error('analyze-location error:', error)
    return jsonResponse({ error: 'internal_error', message: 'Unerwarteter Fehler.' }, 500)
  }
})

interface PoiCounts {
  schools: number
  transit: number
  shopping: number
  health: number
  parks: number
  restaurants: number
  noise: number
}

// The public Overpass API is frequently overloaded (verified: ~50% of
// test requests timed out with "server too busy" during development).
// Retries help, but when both attempts fail we degrade to null POI data
// (handled by the caller) rather than fail the whole property analysis —
// coordinates from the more reliable Nominatim call still get through.
// Everything is combined into a single query to minimize how often we
// have to hit Overpass per analysis.
async function queryPois(coords: { lat: number; lng: number }): Promise<PoiCounts | null> {
  const query = buildOverpassQuery(coords)

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': USER_AGENT,
        },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(20_000),
      })

      if (!res.ok) throw new Error(`Overpass responded with HTTP ${res.status}`)

      const body = await res.json()
      const counts = (body.elements ?? []).map((el: { tags?: { total?: string } }) =>
        Number(el.tags?.total ?? 0),
      )

      const [schools, transit, shopping, health, parks, restaurants, kita, noise] = counts

      return {
        schools: (schools ?? 0) + (kita ?? 0), // Kitas count toward the same "family amenity" bucket as schools
        transit: transit ?? 0,
        shopping: shopping ?? 0,
        health: health ?? 0,
        parks: parks ?? 0,
        restaurants: restaurants ?? 0,
        noise: noise ?? 0,
      }
    } catch (error) {
      if (attempt === 2) {
        console.error('Overpass failed after retry, degrading to null POI data:', error)
        return null
      }
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }

  return null
}

function buildOverpassQuery(coords: { lat: number; lng: number }): string {
  const { lat, lng } = coords
  const around = (radius: number) => `(around:${radius},${lat},${lng})`

  return `
[out:json][timeout:25];
node["amenity"="school"]${around(POI_RADIUS_M)}->.schools;
node["railway"~"station|subway_entrance"]${around(POI_RADIUS_M)}->.transit;
node["shop"="supermarket"]${around(POI_RADIUS_M)}->.shopping;
node["amenity"~"doctors|pharmacy"]${around(POI_RADIUS_M)}->.health;
node["leisure"="park"]${around(POI_RADIUS_M)}->.parks;
node["amenity"="restaurant"]${around(POI_RADIUS_M)}->.restaurants;
node["amenity"="kindergarten"]${around(POI_RADIUS_M)}->.kita;
way["highway"~"primary|secondary"]${around(NOISE_RADIUS_M)}->.noise;
.schools out count;
.transit out count;
.shopping out count;
.health out count;
.parks out count;
.restaurants out count;
.kita out count;
.noise out count;
`.trim()
}

// Weights per Schritt 11: ÖPNV 30%, Einkaufen 25%, Schulen 20%, Gesundheit
// 15%, Parks 10%. Restaurants are informational only, not scored.
// The count->10 caps below are a first-pass heuristic (not a validated
// model) — e.g. 5+ transit stops within 500m already reads as "excellent"
// so further stops don't add more score. Worth revisiting once real
// analyses give us something to compare against.
function computeScore(pois: PoiCounts): number {
  const normalize = (count: number, capForMaxScore: number) => Math.min(count / capForMaxScore, 1) * 10

  const weighted =
    normalize(pois.transit, 5) * 0.3 +
    normalize(pois.shopping, 5) * 0.25 +
    normalize(pois.schools, 3) * 0.2 +
    normalize(pois.health, 3) * 0.15 +
    normalize(pois.parks, 2) * 0.1

  return Math.round(weighted * 10) / 10
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
