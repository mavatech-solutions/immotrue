import { createClient } from 'jsr:@supabase/supabase-js@2'
import type { LocationData, MarketData, PriceVerdict, PropertyData } from '../../../../shared/types/index.ts'
import { calculatePurchaseCosts } from '../../../../shared/utils/calculatePurchaseCosts.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FREE_MONTHLY_LIMIT = 3

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  try {
    const { url, user_id } = await req.json()
    if (typeof url !== 'string' || typeof user_id !== 'string' || !url || !user_id) {
      return jsonResponse({ error: 'invalid_input', message: 'url and user_id are required.' }, 400)
    }

    const rateLimitError = await checkAndUpdateRateLimit(user_id)
    if (rateLimitError) return rateLimitError

    const property = await callFunction<PropertyData>('fetch-property', { url })
    if ('error' in property) return jsonResponse(property.body, property.status)

    // Not every portal exposes a full street address (privacy-redacted
    // until contact) — fall back to district/city so geocoding still gets
    // *something*, at the cost of location-score precision for those cases.
    const addressQuery = property.data.address ?? property.data.district ?? property.data.city

    const [location, market] = await Promise.all([
      callFunction<LocationData>('analyze-location', { address: addressQuery, city: property.data.city }),
      callFunction<MarketData>('fetch-market', {
        city: property.data.city,
        zipCode: property.data.zipCode,
        state: property.data.state,
      }),
    ])
    if ('error' in location) return jsonResponse(location.body, location.status)
    if ('error' in market) return jsonResponse(market.body, market.status)

    const { verdict: priceVerdict, deviation: priceDeviation } = computePriceVerdict(
      property.data.pricePerSqm,
      market.data.avgPricePerSqm,
    )
    const country = property.data.portal === 'willhaben' ? 'AT' : 'DE'
    const costs = calculatePurchaseCosts(
      property.data.price,
      property.data.state,
      country,
      property.data.isPrivateSeller,
    )

    const estimatedRent =
      market.data.rentalAvgPerSqm && property.data.size
        ? Math.round(market.data.rentalAvgPerSqm * property.data.size)
        : null
    const grossYield =
      estimatedRent && property.data.price
        ? Math.round(((estimatedRent * 12) / property.data.price) * 1000) / 10
        : null

    const ai = await callFunction('analyze-property', {
      property: property.data,
      market: market.data,
      location: location.data,
      costs,
      priceVerdict,
    })
    if ('error' in ai) return jsonResponse(ai.body, ai.status)

    const { data: saved, error: insertError } = await supabase
      .from('analyses')
      .insert({
        user_id,
        original_url: url,
        portal: property.data.portal,
        price: property.data.price,
        price_per_sqm: property.data.pricePerSqm,
        size_sqm: property.data.size,
        rooms: property.data.rooms,
        address: property.data.address,
        district: property.data.district,
        city: property.data.city,
        state: property.data.state,
        zip_code: property.data.zipCode,
        year_built: property.data.yearBuilt,
        energy_class: property.data.energyClass,
        floor: property.data.floor,
        days_on_market: property.data.daysOnMarket,
        is_private_seller: property.data.isPrivateSeller,
        original_price: property.data.price,
        current_price: property.data.price,
        price_verdict: priceVerdict,
        price_deviation: priceDeviation,
        suggested_offer_price: (ai.data as { suggestedOfferPrice?: number }).suggestedOfferPrice,
        ai_summary: (ai.data as { summary?: string }).summary,
        ai_full_report: (ai.data as { fullReport?: string }).fullReport,
        ai_recommendation: (ai.data as { recommendation?: string }).recommendation,
        ai_negotiation_tip: (ai.data as { negotiationTip?: string }).negotiationTip,
        ai_risks: (ai.data as { risks?: unknown }).risks,
        ai_pros: (ai.data as { pros?: unknown }).pros,
        ai_cons: (ai.data as { cons?: unknown }).cons,
        ai_forecast_10y: (ai.data as { forecast10y?: string }).forecast10y,
        ai_forecast_value_10y: (ai.data as { forecastValue10y?: number }).forecastValue10y,
        gross_yield: grossYield,
        location_score: location.data.score,
        location_details: location.data,
        purchase_costs_total: costs.total,
        purchase_costs_breakdown: costs,
        estimated_rent: estimatedRent,
        last_price_check: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) throw insertError

    return jsonResponse(saved, 200)
  } catch (error) {
    console.error('full-analysis error:', error)
    return jsonResponse({ error: 'internal_error', message: 'Unerwarteter Fehler.' }, 500)
  }
})

async function checkAndUpdateRateLimit(userId: string): Promise<Response | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_premium, analyses_this_month, last_month_reset')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    return jsonResponse({ error: 'profile_not_found', message: 'Profil nicht gefunden.' }, 404)
  }

  const now = new Date()
  const lastReset = new Date(profile.last_month_reset)
  const isNewMonth = now.getUTCFullYear() !== lastReset.getUTCFullYear() || now.getUTCMonth() !== lastReset.getUTCMonth()

  let analysesThisMonth = profile.analyses_this_month
  if (isNewMonth) {
    analysesThisMonth = 0
    await supabase
      .from('profiles')
      .update({ analyses_this_month: 0, last_month_reset: now.toISOString() })
      .eq('id', userId)
  }

  if (!profile.is_premium && analysesThisMonth >= FREE_MONTHLY_LIMIT) {
    return jsonResponse(
      {
        error: 'rate_limit_exceeded',
        message: `Free-Limit von ${FREE_MONTHLY_LIMIT} Analysen pro Monat erreicht.`,
      },
      403,
    )
  }

  await supabase
    .from('profiles')
    .update({ analyses_this_month: analysesThisMonth + 1 })
    .eq('id', userId)

  return null
}

function computePriceVerdict(
  pricePerSqm: number | null,
  avgPricePerSqm: number,
): { verdict: PriceVerdict; deviation: number | null } {
  if (!pricePerSqm || !avgPricePerSqm) return { verdict: 'fair', deviation: null }

  const deviation = Math.round(((pricePerSqm - avgPricePerSqm) / avgPricePerSqm) * 1000) / 10
  if (deviation <= -10) return { verdict: 'cheap', deviation }
  if (deviation <= 5) return { verdict: 'fair', deviation }
  if (deviation <= 20) return { verdict: 'expensive', deviation }
  return { verdict: 'overpriced', deviation }
}

type FunctionResult<T> = { data: T } | { error: true; status: number; body: unknown }

async function callFunction<T>(name: string, body: unknown): Promise<FunctionResult<T>> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify(body),
  })

  const json = await res.json()
  if (!res.ok) return { error: true, status: res.status, body: json }
  return { data: json as T }
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
