import { createClient } from 'jsr:@supabase/supabase-js@2'
import type { MarketData } from '../../../../shared/types/index.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  try {
    const { city, zipCode, state, country } = await req.json()

    if (typeof city !== 'string' || city.length === 0) {
      return jsonResponse({ error: 'invalid_input', message: 'city is required.' }, 400)
    }

    const resolvedCountry = country === 'AT' || country === 'CH' ? country : 'DE'
    const marketPrice = await findMarketPrice(city, zipCode ?? null, state ?? null, resolvedCountry)
    const trend = await findLatestTrend(resolvedCountry)

    const priceGrowthLastYear = trend?.price_growth_last_year ?? null
    const priceGrowth5Years = trend?.price_growth_5_years ?? null

    const data: MarketData = {
      avgPricePerSqm: marketPrice?.avg_price_per_sqm ?? 0,
      priceGrowthLastYear: priceGrowthLastYear ?? 0,
      priceGrowth5Years: priceGrowth5Years ?? 0,
      forecast10Years: computeForecast10Years(priceGrowthLastYear, priceGrowth5Years),
      rentalAvgPerSqm: marketPrice?.rental_avg_per_sqm ?? 0,
    }

    return jsonResponse(data, 200)
  } catch (error) {
    console.error('fetch-market error:', error)
    return jsonResponse({ error: 'internal_error', message: 'Unerwarteter Fehler.' }, 500)
  }
})

interface MarketPriceRow {
  avg_price_per_sqm: number | null
  rental_avg_per_sqm: number | null
}

// Falls back city -> Bundesland-blind city match -> national baseline, so
// there is always *some* comparison value, even for towns with zero
// ImmoTrue analyses yet (the 'Deutschland' row seeded in Schritt 8).
// That national baseline only exists for Germany — market_prices has no
// Austrian/Swiss equivalent seeded yet, so AT/CH properties stop at the
// city-match tier and return null (honest "no data") rather than silently
// showing a German EUR/m² price as if it were a local comparison.
async function findMarketPrice(
  city: string,
  zipCode: string | null,
  _state: string | null,
  country: 'DE' | 'AT' | 'CH',
): Promise<MarketPriceRow | null> {
  if (zipCode) {
    const zipPrefix = zipCode.slice(0, 3)
    const { data } = await supabase
      .from('market_prices')
      .select('avg_price_per_sqm, rental_avg_per_sqm')
      .eq('city', city)
      .eq('zip_prefix', zipPrefix)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data) return data
  }

  const { data: byCity } = await supabase
    .from('market_prices')
    .select('avg_price_per_sqm, rental_avg_per_sqm')
    .eq('city', city)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (byCity) return byCity

  if (country !== 'DE') return null

  const { data: national } = await supabase
    .from('market_prices')
    .select('avg_price_per_sqm, rental_avg_per_sqm')
    .eq('city', 'Deutschland')
    .maybeSingle()

  return national
}

interface TrendRow {
  price_growth_last_year: number | null
  price_growth_5_years: number | null
}

async function findLatestTrend(country: 'DE' | 'AT' | 'CH'): Promise<TrendRow | null> {
  const { data } = await supabase
    .from('national_market_trends')
    .select('price_growth_last_year, price_growth_5_years')
    .eq('country', country)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Austria has no trend sync yet (only DE and CH are wired up) — degrade
  // to the German rate rather than returning no trend at all, same
  // reasoning fetch-market already applies elsewhere for missing data.
  if (!data && country === 'AT') {
    const { data: fallback } = await supabase
      .from('national_market_trends')
      .select('price_growth_last_year, price_growth_5_years')
      .eq('country', 'DE')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return fallback
  }

  return data
}

// Destatis only has ~1 year of history on the current index base (see
// Schritt 10 notes), so priceGrowth5Years is unavailable for now. Rather
// than return no forecast at all, we compound the real 1-year rate out to
// 10 years — less smoothed than a proper 5-year base would be, but a real
// number instead of a gap.
function computeForecast10Years(
  priceGrowthLastYear: number | null,
  priceGrowth5Years: number | null,
): number {
  if (priceGrowth5Years !== null) {
    const annualRate = Math.pow(1 + priceGrowth5Years / 100, 1 / 5) - 1
    return Math.round((Math.pow(1 + annualRate, 10) - 1) * 1000) / 10
  }

  if (priceGrowthLastYear !== null) {
    return Math.round((Math.pow(1 + priceGrowthLastYear / 100, 10) - 1) * 1000) / 10
  }

  return 0
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
