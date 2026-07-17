import { runApifyActor } from '../../../../../shared/utils/apify.ts'
import type { Alert } from '../../../../../shared/types/index.ts'

const TYPE_MAP: Record<string, string> = {
  wohnung: 'apartment',
  haus: 'house',
  beides: 'apartment_and_house',
}

export async function searchImmowelt(alert: Alert, signal: AbortSignal): Promise<string[]> {
  if (!alert.city) return []

  // incrementalMode + a per-alert stateKey: the actor compares against its
  // own previous-run state for that key and only emits new/changed
  // listings, so repeat polling is billed at a fraction of a full re-scrape.
  const items = await runApifyActor(
    'blackfalcondata/immowelt-scraper',
    {
      city: alert.city,
      radiusKm: alert.radius_km ?? 10,
      distributionType: 'buy',
      estateType: TYPE_MAP[alert.property_type ?? 'beides'] ?? 'apartment_and_house',
      priceMax: alert.max_price ?? undefined,
      roomsMin: alert.min_rooms ?? undefined,
      incrementalMode: true,
      stateKey: `alert-${alert.id}`,
      maxResults: 50,
    },
    signal,
  )

  return items
    .map((item) => (typeof item.url === 'string' ? item.url : typeof item.portalUrl === 'string' ? item.portalUrl : null))
    .filter((url): url is string => !!url)
}
