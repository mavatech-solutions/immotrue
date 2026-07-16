// Portal metadata — one entry per supported real-estate portal
export interface Portal {
  id: string
  name: string
  domain: string
  flag: string
  countries: string[]
  isPrivateFriendly: boolean
  savingsHint?: string
}

// Raw data scraped from a portal listing (via Apify or our own scrapers),
// before we analyze it. Field completeness varies a lot by portal/scraper,
// so everything except the essentials is nullable rather than defaulted
// to a guess (e.g. hasBalcony: false would falsely claim "no balcony" for
// a portal that simply doesn't expose that field).
export interface PropertyData {
  title: string
  price: number
  pricePerSqm: number | null
  size: number | null
  rooms: number | null
  address: string | null
  district: string | null
  city: string
  state: string | null
  zipCode: string | null
  energyClass: string | null
  yearBuilt: number | null
  condition: string | null
  floor: number | null
  totalFloors: number | null
  hasParking: boolean | null
  hasBalcony: boolean | null
  hasGarden: boolean | null
  heatingType: string | null
  daysOnMarket: number | null
  isPrivateSeller: boolean | null
  description: string
  portal: string
  originalUrl: string
}

export interface MarketData {
  avgPricePerSqm: number
  priceGrowthLastYear: number
  priceGrowth5Years: number
  forecast10Years: number
  rentalAvgPerSqm: number
}

// POI/score fields are nullable: the Overpass API backing them is public
// and known to be intermittently overloaded (verified during development),
// so a failed lookup degrades to "unknown" rather than failing the whole
// property analysis — coordinates (from the more reliable Nominatim) still
// come through.
export interface LocationData {
  score: number | null
  poisSchools: number | null
  poisTransit: number | null
  poisShopping: number | null
  poisHealth: number | null
  poisParks: number | null
  poisRestaurants: number | null
  isMainStreet: boolean | null
  coordinates: { lat: number; lng: number }
}

export interface PurchaseCosts {
  transferTax: number
  notary: number
  registration: number
  agentFee: number
  total: number
  totalPercent: number
}

export type PriceVerdict = 'cheap' | 'fair' | 'expensive' | 'overpriced'
export type Recommendation = 'buy' | 'wait' | 'skip'
export type RiskLevel = 'low' | 'medium' | 'high'
export type InvestmentVerdict = 'good' | 'medium' | 'bad'
export type AnalysisStatus = 'interesting' | 'favorite' | 'viewed' | 'rejected'
export type NotificationFrequency = 'immediate' | 'daily'

// 0-100 per category, higher = more risk. Genuinely assessed by the AI
// (not derived after the fact from other fields) so all five categories
// are consistent — including "rechtliches", which has no dedicated
// stored field of its own to derive from (things like Denkmalschutz,
// Erbbaurecht etc. only ever show up in the free-text description the
// AI already reads, never as a structured column).
export interface RiskBreakdown {
  baujahrRisiko: number
  energieeffizienz: number
  sanierungsbedarf: number
  lageRisiko: number
  rechtliches: number
}

// Output of the Claude analysis Edge Function
export interface AIAnalysis {
  summary: string
  fullReport: string
  recommendation: Recommendation
  recommendationReason: string
  negotiationTip: string
  suggestedOfferPrice: number
  riskLevel: RiskLevel
  risks: string[]
  riskBreakdown: RiskBreakdown
  hiddenCosts: string[]
  forecast10y: string
  forecastValue10y: number
  investmentVerdict: InvestmentVerdict
  pros: string[]
  cons: string[]
}

// Mirrors the `analyses` table row shape exactly (snake_case, as returned
// by the Supabase client) — NOT PropertyData/AIAnalysis's camelCase, since
// this is what the apps actually read off the database.
export interface SavedAnalysis {
  id: string
  user_id: string

  original_url: string
  portal: string | null

  price: number | null
  price_per_sqm: number | null
  size_sqm: number | null
  rooms: number | null
  address: string | null
  district: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  year_built: number | null
  energy_class: string | null
  floor: number | null
  days_on_market: number | null
  is_private_seller: boolean | null

  original_price: number | null
  current_price: number | null
  price_change_percent: number | null
  last_price_check: string | null

  price_verdict: PriceVerdict | null
  price_deviation: number | null
  suggested_offer_price: number | null
  ai_summary: string | null
  ai_full_report: string | null
  ai_recommendation: string | null
  ai_negotiation_tip: string | null
  ai_risks: string[] | null
  risk_breakdown: RiskBreakdown | null
  ai_pros: string[] | null
  ai_cons: string[] | null
  ai_forecast_10y: string | null
  ai_forecast_value_10y: number | null

  gross_yield: number | null
  location_score: number | null
  location_details: LocationData | null
  purchase_costs_total: number | null
  purchase_costs_breakdown: PurchaseCosts | null
  estimated_rent: number | null
  negotiation_potential: string | null

  status: AnalysisStatus
  user_notes: string | null
  viewed_date: string | null
  viewing_rating: number | null
  viewing_pros: string[] | null
  viewing_cons: string[] | null

  analyzed_at: string
  last_updated_at: string
}

// Mirrors the `alerts` table row shape
export interface Alert {
  id: string
  user_id: string
  name: string | null
  city: string | null
  radius_km: number | null
  max_price: number | null
  min_rooms: number | null
  property_type: string | null
  portals: string[] | null
  notification_frequency: NotificationFrequency | null
  active: boolean
  created_at: string
}
