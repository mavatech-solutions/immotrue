import { createClient } from 'jsr:@supabase/supabase-js@2'
import type { Alert } from '../../../../shared/types/index.ts'
import { searchImmoscout } from './portals/immoscoutSearch.ts'
import { searchImmowelt } from './portals/immoweltSearch.ts'
import { searchKleinanzeigen } from './portals/kleinanzeigenSearch.ts'
import { searchOhneMakler } from './portals/ohneMaklerSearch.ts'
import { searchWillhaben } from './portals/willhabenSearch.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Alerts are processed a few at a time rather than all-at-once — mainly so
// one slow/hanging portal request can't stall the whole run, matching the
// same caution as check-price-changes.
const BATCH_SIZE = 5
const PORTAL_TIMEOUT_MS = 20_000

type PortalSearch = (alert: Alert, signal: AbortSignal) => Promise<string[]>

// homegate has no scraper yet (fetch-property doesn't support it either) —
// an alert with homegate selected simply skips that portal.
const PORTAL_SEARCHES: Record<string, PortalSearch> = {
  immoscout: searchImmoscout,
  immowelt: searchImmowelt,
  kleinanzeigen: searchKleinanzeigen,
  ohnemakler: searchOhneMakler,
  willhaben: searchWillhaben,
}

Deno.serve(async () => {
  const startedAt = Date.now()

  try {
    const { data: alerts, error } = await supabase.from('alerts').select('*').eq('active', true)
    if (error) throw error

    let checked = 0
    let newMatches = 0

    for (let i = 0; i < (alerts ?? []).length; i += BATCH_SIZE) {
      const batch = alerts!.slice(i, i + BATCH_SIZE)
      const results = await Promise.allSettled(batch.map(processAlert))
      for (const result of results) {
        checked++
        if (result.status === 'fulfilled') newMatches += result.value
        else console.error('check-alerts item failed:', result.reason)
      }
    }

    await supabase.from('sync_logs').insert({
      job_type: 'check-alerts',
      status: 'success',
      rows_processed: checked,
      duration_ms: Date.now() - startedAt,
    })

    return new Response(JSON.stringify({ checked, newMatches }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('check-alerts error:', error)
    await supabase.from('sync_logs').insert({
      job_type: 'check-alerts',
      status: 'error',
      error_message: error instanceof Error ? error.message : String(error),
      duration_ms: Date.now() - startedAt,
    })
    return new Response(JSON.stringify({ error: 'job_failed' }), { status: 500 })
  }
})

// Returns how many genuinely new listings were recorded for this alert.
async function processAlert(alert: Alert): Promise<number> {
  const portalIds = alert.portals ?? []

  const perPortalResults = await Promise.allSettled(
    portalIds.map((portalId) => {
      const search = PORTAL_SEARCHES[portalId]
      if (!search) return Promise.resolve([] as string[])

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), PORTAL_TIMEOUT_MS)
      return search(alert, controller.signal).finally(() => clearTimeout(timeout))
    }),
  )

  const foundUrls = new Set<string>()
  for (const result of perPortalResults) {
    if (result.status === 'fulfilled') for (const url of result.value) foundUrls.add(url)
    else console.error(`check-alerts: portal search failed for alert ${alert.id}:`, result.reason)
  }

  if (foundUrls.size === 0) return 0

  const { data: existing } = await supabase
    .from('alerted_listings')
    .select('listing_url')
    .eq('alert_id', alert.id)
    .in('listing_url', [...foundUrls])

  const alreadySeen = new Set((existing ?? []).map((row) => row.listing_url))
  const newUrls = [...foundUrls].filter((url) => !alreadySeen.has(url))
  if (newUrls.length === 0) return 0

  const { error } = await supabase
    .from('alerted_listings')
    .insert(newUrls.map((listing_url) => ({ alert_id: alert.id, listing_url })))
  if (error) {
    console.error(`check-alerts: failed to insert matches for alert ${alert.id}:`, error)
    return 0
  }

  return newUrls.length
}
