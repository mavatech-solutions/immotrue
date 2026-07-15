// Parses German-formatted numbers like "1.034.900 €", "118 m²", "3,5" into
// a plain JS number. Returns null if no number is found (rather than 0 —
// 0 would falsely claim a known value).
export function parseGermanNumber(text: string | null | undefined): number | null {
  if (!text) return null

  const match = text.match(/-?\d[\d.]*(?:,\d+)?/)
  if (!match) return null

  const normalized = match[0].replace(/\./g, '').replace(',', '.')
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}
