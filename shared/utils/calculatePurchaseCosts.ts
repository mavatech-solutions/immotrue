import type { PurchaseCosts } from '../types/index.ts'

// Grunderwerbsteuer per Bundesland, verified live (finanz-tools.de +
// rechenbar.de cross-checked, incl. the 2024 Thüringen cut and the 2025-07
// Bremen increase). Austria uses a flat federal rate instead of per-state.
// Exported so other real-data-only consumers (e.g. generate-blog-draft)
// can cite the same verified table instead of duplicating it.
export const GRUNDERWERBSTEUER_DE: Record<string, number> = {
  Bayern: 3.5,
  'Baden-Württemberg': 5.0,
  Niedersachsen: 5.0,
  'Rheinland-Pfalz': 5.0,
  'Sachsen-Anhalt': 5.0,
  Thüringen: 5.0,
  Bremen: 5.5,
  Hamburg: 5.5,
  Sachsen: 5.5,
  Berlin: 6.0,
  Hessen: 6.0,
  'Mecklenburg-Vorpommern': 6.0,
  Brandenburg: 6.5,
  'Nordrhein-Westfalen': 6.5,
  Saarland: 6.5,
  'Schleswig-Holstein': 6.5,
}

const DE_FALLBACK_RATE = 5.7 // used only if the state string doesn't match the table above

export function calculatePurchaseCosts(
  price: number,
  state: string | null,
  country: 'DE' | 'AT',
  isPrivateSeller: boolean | null,
): PurchaseCosts {
  if (country === 'AT') {
    // Grunderwerbsteuer 3.5% (flat, federal) + Grundbucheintragung 1.1% +
    // Notar ~2% (representative estimate, varies by notary/complexity).
    const transferTax = Math.round(price * 0.035)
    const notary = Math.round(price * 0.02)
    const registration = Math.round(price * 0.011)
    const agentFee = isPrivateSeller === false ? Math.round(price * 0.036) : 0
    return buildResult(price, transferTax, notary, registration, agentFee)
  }

  const rate = state ? (GRUNDERWERBSTEUER_DE[state] ?? DE_FALLBACK_RATE) : DE_FALLBACK_RATE
  const transferTax = Math.round(price * (rate / 100))
  const notary = Math.round(price * 0.015)
  const registration = Math.round(price * 0.005)
  // Post-2020 Bestellerprinzip: buyer typically pays their negotiated share
  // of the agent commission (~3.57% incl. VAT is a common split), 0 for
  // private-seller listings.
  const agentFee = isPrivateSeller === false ? Math.round(price * 0.0357) : 0
  return buildResult(price, transferTax, notary, registration, agentFee)
}

function buildResult(
  price: number,
  transferTax: number,
  notary: number,
  registration: number,
  agentFee: number,
): PurchaseCosts {
  const total = transferTax + notary + registration + agentFee
  return {
    transferTax,
    notary,
    registration,
    agentFee,
    total,
    totalPercent: Math.round((total / price) * 1000) / 10,
  }
}
