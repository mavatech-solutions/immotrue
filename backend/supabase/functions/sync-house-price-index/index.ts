import { createClient } from 'jsr:@supabase/supabase-js@2'
import { unzipSync, strFromU8 } from 'npm:fflate@0.8.2'

const GENESIS_TABLE = '61262-0002' // Häuserpreisindex: Deutschland, Quartale
const HOUSE_PRICE_INDEX_CODE = 'PRE026' // general index (vs. new-build-only / existing-only variants)

interface IndexPoint {
  year: number
  quarter: number
  value: number
}

Deno.serve(async () => {
  try {
    const points = await fetchHousePriceIndex()
    const latest = points[points.length - 1]

    const oneYearAgo = points.find((p) => p.year === latest.year - 1 && p.quarter === latest.quarter)
    const fiveYearsAgo = points.find((p) => p.year === latest.year - 5 && p.quarter === latest.quarter)

    const priceGrowthLastYear = oneYearAgo ? growthPercent(oneYearAgo.value, latest.value) : null
    const priceGrowth5Years = fiveYearsAgo ? growthPercent(fiveYearsAgo.value, latest.value) : null

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const { error } = await supabase.from('national_market_trends').insert({
      house_price_index: latest.value,
      reference_quarter: `${latest.year}-Q${latest.quarter}`,
      price_growth_last_year: priceGrowthLastYear,
      price_growth_5_years: priceGrowth5Years,
    })
    if (error) throw error

    await supabase.from('sync_logs').insert({
      job_type: 'sync-house-price-index',
      status: 'success',
      rows_processed: 1,
    })

    return new Response(
      JSON.stringify({ referenceQuarter: `${latest.year}-Q${latest.quarter}`, priceGrowthLastYear, priceGrowth5Years }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('sync-house-price-index error:', error)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    await supabase.from('sync_logs').insert({
      job_type: 'sync-house-price-index',
      status: 'error',
      error_message: error instanceof Error ? error.message : String(error),
    })

    return new Response(JSON.stringify({ error: 'sync_failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function fetchHousePriceIndex(): Promise<IndexPoint[]> {
  const token = Deno.env.get('DESTATIS_API_TOKEN')
  if (!token) throw new Error('DESTATIS_API_TOKEN secret is not set')

  const res = await fetch('https://www-genesis.destatis.de/genesisWS/rest/2020/data/tablefile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      username: token,
      password: '',
    },
    body: new URLSearchParams({
      name: GENESIS_TABLE,
      area: 'all',
      format: 'ffcsv',
      language: 'de',
    }),
  })

  if (!res.ok) throw new Error(`GENESIS API responded with HTTP ${res.status}`)

  const zipped = new Uint8Array(await res.arrayBuffer())
  const unzipped = unzipSync(zipped)
  const filename = Object.keys(unzipped)[0]
  if (!filename) throw new Error('GENESIS API response contained no file')

  const csv = strFromU8(unzipped[filename])
  const points: IndexPoint[] = []

  for (const line of csv.split('\n')) {
    const fields = line.split(';')
    if (fields.length < 16) continue
    if (fields[15] !== HOUSE_PRICE_INDEX_CODE) continue

    const year = Number(fields[4])
    const quarterMatch = fields[7]?.match(/QUART(\d)/)
    const value = Number(fields[13]?.replace(',', '.'))

    if (!quarterMatch || !Number.isFinite(year) || !Number.isFinite(value)) continue // skips "..." (not yet published)

    points.push({ year, quarter: Number(quarterMatch[1]), value })
  }

  points.sort((a, b) => a.year - b.year || a.quarter - b.quarter)
  if (points.length === 0) throw new Error('No parsable Häuserpreisindex data points found')

  return points
}

function growthPercent(from: number, to: number): number {
  return Math.round(((to - from) / from) * 1000) / 10
}
