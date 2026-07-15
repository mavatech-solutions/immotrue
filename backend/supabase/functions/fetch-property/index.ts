import { detectPortal, isValidUrl } from '../../../../shared/utils/portalDetector.ts'
import type { PropertyData } from '../../../../shared/types/index.ts'
import { ListingOfflineError, UnsupportedPortalError } from './errors.ts'
import { scrapeKleinanzeigen } from './portals/kleinanzeigen.ts'
import { scrapeOhneMakler } from './portals/ohneMakler.ts'
import { scrapeWillhaben } from './portals/willhaben.ts'
import { scrapeImmoscout24ViaApify, scrapeImmoweltViaApify } from './portals/apify.ts'

const TIMEOUT_MS = 15_000

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Scraper = (url: string, signal: AbortSignal) => Promise<PropertyData>

const SCRAPERS: Record<string, Scraper> = {
  kleinanzeigen: scrapeKleinanzeigen,
  ohnemakler: scrapeOhneMakler,
  willhaben: scrapeWillhaben,
  immoscout: scrapeImmoscout24ViaApify,
  immowelt: scrapeImmoweltViaApify,
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  try {
    const { url } = await req.json()

    if (typeof url !== 'string' || !isValidUrl(url)) {
      return jsonResponse({ error: 'invalid_url', message: 'Keine gültige URL angegeben.' }, 400)
    }

    const portal = detectPortal(url)
    if (!portal) {
      return jsonResponse(
        { error: 'unknown_portal', message: 'Dieses Portal wird nicht erkannt.' },
        400,
      )
    }

    const scraper = SCRAPERS[portal.id]
    if (!scraper) {
      return jsonResponse(
        { error: 'unsupported_portal', message: `${portal.name} wird noch nicht unterstützt.` },
        501,
      )
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const property = await scraper(url, controller.signal)
      return jsonResponse(property, 200)
    } finally {
      clearTimeout(timeout)
    }
  } catch (error) {
    if (error instanceof ListingOfflineError) {
      return jsonResponse({ error: 'listing_offline', message: error.message }, 404)
    }
    if (error instanceof UnsupportedPortalError) {
      return jsonResponse({ error: 'unsupported_portal', message: error.message }, 501)
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      return jsonResponse({ error: 'timeout', message: 'Zeitüberschreitung beim Abruf.' }, 504)
    }

    console.error('fetch-property error:', error)
    return jsonResponse({ error: 'internal_error', message: 'Unerwarteter Fehler.' }, 500)
  }
})

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
