import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const BATCH_SIZE = 20
// Caps how many analyses one run touches. If there are ever more stale
// analyses than this, the ones checked longest ago are prioritized (see the
// query order below) so everything still gets covered over a few days
// rather than one run timing out — the plan's "bei 500+ Analysen: aufteilen
// in mehrere Runs".
const MAX_ANALYSES_PER_RUN = 500
const CHANGE_THRESHOLD_PERCENT = 3

// Preisalarm ist laut Plan ein Premium-Feature — der Cron prüft daher nur
// (a) Premium-Nutzer und (b) Analysen, bei denen der Alarm nicht abgewählt
// wurde. Zusätzlich werden die beiden Apify-Portale (kostenpflichtig pro
// Abruf) nur alle 3 Tage geprüft statt täglich wie die frei gescrapten
// Portale — das reduziert die teuren Apify-Calls auf ein Drittel, ohne
// Preisänderungen wochenlang zu verpassen.
const PAID_PORTALS = ['immoscout', 'immowelt']
const PAID_RECHECK_HOURS = 72
const FREE_RECHECK_HOURS = 20 // knapp unter 24h, toleriert Cron-Jitter

interface AnalysisRow {
  id: string
  user_id: string | null
  original_url: string
  current_price: number | null
  portal: string
  last_price_check: string | null
}

Deno.serve(async () => {
  const startedAt = Date.now()

  try {
    const analyses = await fetchEligibleAnalyses()

    let checked = 0
    let changed = 0

    for (let i = 0; i < (analyses ?? []).length; i += BATCH_SIZE) {
      const batch = analyses!.slice(i, i + BATCH_SIZE)
      const results = await Promise.allSettled(batch.map(processAnalysis))
      for (const result of results) {
        checked++
        if (result.status === 'fulfilled' && result.value) changed++
        if (result.status === 'rejected') console.error('check-price-changes item failed:', result.reason)
      }
    }

    await supabase.from('sync_logs').insert({
      job_type: 'check-price-changes',
      status: 'success',
      rows_processed: checked,
      duration_ms: Date.now() - startedAt,
    })

    return new Response(JSON.stringify({ checked, changed }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('check-price-changes error:', error)
    await supabase.from('sync_logs').insert({
      job_type: 'check-price-changes',
      status: 'error',
      error_message: error instanceof Error ? error.message : String(error),
      duration_ms: Date.now() - startedAt,
    })
    return new Response(JSON.stringify({ error: 'job_failed' }), { status: 500 })
  }
})

// Two queries (paid-portal / free-portal) rather than one combined filter —
// each tier has its own recheck-frequency threshold, and expressing that as
// a single PostgREST filter string would be far less readable than just
// running it twice and merging.
async function fetchEligibleAnalyses(): Promise<AnalysisRow[]> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const paidThreshold = new Date(Date.now() - PAID_RECHECK_HOURS * 60 * 60 * 1000).toISOString()
  const freeThreshold = new Date(Date.now() - FREE_RECHECK_HOURS * 60 * 60 * 1000).toISOString()

  const baseQuery = () =>
    supabase
      .from('analyses')
      .select('id, user_id, original_url, current_price, portal, last_price_check, profiles!inner(is_premium)')
      .eq('profiles.is_premium', true)
      .eq('price_alert_enabled', true)
      .neq('status', 'rejected')
      .gt('analyzed_at', ninetyDaysAgo)
      .order('last_price_check', { ascending: true, nullsFirst: true })
      .limit(MAX_ANALYSES_PER_RUN)

  const [paidResult, freeResult] = await Promise.all([
    baseQuery().in('portal', PAID_PORTALS).or(`last_price_check.is.null,last_price_check.lt.${paidThreshold}`),
    baseQuery()
      .not('portal', 'in', `(${PAID_PORTALS.join(',')})`)
      .or(`last_price_check.is.null,last_price_check.lt.${freeThreshold}`),
  ])

  if (paidResult.error) throw paidResult.error
  if (freeResult.error) throw freeResult.error

  return [...(paidResult.data ?? []), ...(freeResult.data ?? [])].slice(0, MAX_ANALYSES_PER_RUN) as unknown as AnalysisRow[]
}

// Returns true if a >=3% change was detected and recorded, false otherwise
// (including "listing offline" and other per-item errors — those are
// skipped, not fatal, per the plan: "Errors ignorieren, nächstes Objekt").
async function processAnalysis(analysis: AnalysisRow): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/fetch-property`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
    body: JSON.stringify({ url: analysis.original_url }),
  })

  if (!res.ok) return false // offline listing, unsupported portal, scrape failure, etc.

  const property = await res.json()
  const newPrice = property.price as number | undefined
  if (!newPrice || !analysis.current_price) return false

  const changePercent = Math.round(((newPrice - analysis.current_price) / analysis.current_price) * 1000) / 10
  if (Math.abs(changePercent) < CHANGE_THRESHOLD_PERCENT) {
    await supabase.from('analyses').update({ last_price_check: new Date().toISOString() }).eq('id', analysis.id)
    return false
  }

  await supabase
    .from('analyses')
    .update({
      current_price: newPrice,
      price_change_percent: changePercent,
      last_price_check: new Date().toISOString(),
    })
    .eq('id', analysis.id)

  await supabase.from('price_changes').insert({
    analysis_id: analysis.id,
    old_price: analysis.current_price,
    new_price: newPrice,
    change_percent: changePercent,
  })

  if (newPrice < analysis.current_price && analysis.user_id) {
    await notifyPriceDrop(analysis.user_id, analysis.id, analysis.current_price - newPrice)
  }

  return true
}

async function notifyPriceDrop(userId: string, analysisId: string, dropAmount: number): Promise<void> {
  const { data: profile } = await supabase.from('profiles').select('push_token').eq('id', userId).single()
  if (!profile?.push_token) return // no mobile app registered yet (Phase 3) — nothing to push to

  const expoAccessToken = Deno.env.get('EXPO_ACCESS_TOKEN')

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(expoAccessToken ? { Authorization: `Bearer ${expoAccessToken}` } : {}),
      },
      body: JSON.stringify({
        to: profile.push_token,
        title: '📉 Preis reduziert!',
        body: `Diese Wohnung ist jetzt €${dropAmount.toLocaleString('de-DE')} günstiger`,
        data: { analysis_id: analysisId },
      }),
    })
  } catch (error) {
    console.error('Push notification failed (non-fatal):', error) // best-effort, never blocks the job
  }
}
