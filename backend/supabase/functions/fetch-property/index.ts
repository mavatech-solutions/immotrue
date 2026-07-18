import { detectPortal, isValidUrl } from '../../../../shared/utils/portalDetector.ts'
import type { PropertyData } from '../../../../shared/types/index.ts'
import { ListingOfflineError, UnsupportedPortalError } from './errors.ts'
import { scrapeKleinanzeigen } from './portals/kleinanzeigen.ts'
import { scrapeOhneMakler } from './portals/ohneMakler.ts'
import { scrapeWillhaben } from './portals/willhaben.ts'
import { scrapeImmoscout24ViaApify, scrapeImmoweltViaApify } from './portals/apify.ts'
import { scrapeImmoscout24ChViaApify } from './portals/immoscout24ch.ts'
// homegate.ts (ducto/homegate-property-scraper) is written and verified
// field-by-field against the actor's docs, but the Apify API call itself
// returns HTTP 403 — the actor needs a one-time manual activation on
// apify.com (visit the actor page, click "Try for free") before
// programmatic calls work. Not wired into SCRAPERS below until that's
// done, so a pasted homegate.ch URL correctly falls through to
// "unsupported_portal" instead of a broken request.

// The Swiss Apify actors (memo23 .ch, ducto homegate) recommend residential
// proxies for reliability, which run noticeably slower than the simple
// free scrapers or the existing German Apify actors this timeout was
// originally tuned for — 15s wasn't enough headroom, confirmed by a real
// timeout on a live test call.
const TIMEOUT_MS = 75_000

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
  immoscout24ch: scrapeImmoscout24ChViaApify,
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
