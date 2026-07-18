import { createClient } from 'jsr:@supabase/supabase-js@2'

// SNB's data portal (data.snb.ch) is a JS-rendered SPA — no accessible
// documentation page for what the D0/D1 dimension codes mean (verified:
// /description/, /metadata, /dimensions all just return the SPA shell,
// not real data, even to a browser-UA'd request). Picked from the raw
// values themselves: D0=EW (condominiums — "Eigentumswohnungen", the
// segment closest to what most ImmoTrue users analyze) and D1=TP (the
// unsuffixed variant, distinct from TP1/TP2/TP3, most likely the
// headline transaction-price series rather than a quality-tier
// sub-breakdown). This is a reasoned best-effort pick, not one verified
// against official SNB documentation — worth re-checking if SNB ever
// publishes a machine-readable legend.
const CUBE_ID = 'plimoinchq'
const PROPERTY_TYPE_CODE = 'EW'
const PRICE_SERIES_CODE = 'TP'

interface IndexPoint {
  year: number
  quarter: number
  value: number
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  try {
    const points = await fetchSwissPriceIndex()
    const latest = points[points.length - 1]

    const oneYearAgo = points.find((p) => p.year === latest.year - 1 && p.quarter === latest.quarter)
    const fiveYearsAgo = points.find((p) => p.year === latest.year - 5 && p.quarter === latest.quarter)

    const priceGrowthLastYear = oneYearAgo ? growthPercent(oneYearAgo.value, latest.value) : null
    const priceGrowth5Years = fiveYearsAgo ? growthPercent(fiveYearsAgo.value, latest.value) : null

    const { error } = await supabase.from('national_market_trends').insert({
      country: 'CH',
      house_price_index: latest.value,
      reference_quarter: `${latest.year}-Q${latest.quarter}`,
      price_growth_last_year: priceGrowthLastYear,
      price_growth_5_years: priceGrowth5Years,
    })
    if (error) throw error

    await supabase.from('sync_logs').insert({
      job_type: 'sync-swiss-price-index',
      status: 'success',
      rows_processed: 1,
    })

    return new Response(
      JSON.stringify({ referenceQuarter: `${latest.year}-Q${latest.quarter}`, priceGrowthLastYear, priceGrowth5Years }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('sync-swiss-price-index error:', error)

    await supabase.from('sync_logs').insert({
      job_type: 'sync-swiss-price-index',
      status: 'error',
      error_message: error instanceof Error ? error.message : String(error),
    })

    return new Response(JSON.stringify({ error: 'sync_failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function fetchSwissPriceIndex(): Promise<IndexPoint[]> {
  const res = await fetch(`https://data.snb.ch/api/cube/${CUBE_ID}/data/csv/de`)
  if (!res.ok) throw new Error(`SNB data portal responded with HTTP ${res.status}`)

  const csv = await res.text()
  const points: IndexPoint[] = []

  for (const line of csv.split('\n')) {
    // Quoted, semicolon-delimited: "1970-Q1";"EW";"TP";"37.97..."
    const fields = line.split(';').map((f) => f.trim().replace(/^"|"$/g, ''))
    if (fields.length < 4) continue

    const dateMatch = fields[0].match(/^(\d{4})-Q(\d)$/)
    if (!dateMatch) continue
    if (fields[1] !== PROPERTY_TYPE_CODE || fields[2] !== PRICE_SERIES_CODE) continue

    const value = Number(fields[3])
    if (!Number.isFinite(value)) continue // blank cells for periods not yet published

    points.push({ year: Number(dateMatch[1]), quarter: Number(dateMatch[2]), value })
  }

  points.sort((a, b) => a.year - b.year || a.quarter - b.quarter)
  if (points.length === 0) throw new Error('No parsable SNB real estate price index data points found')

  return points
}

function growthPercent(from: number, to: number): number {
  return Math.round(((to - from) / from) * 1000) / 10
}
