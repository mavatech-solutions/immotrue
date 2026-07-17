// Shared by fetch-property (single-listing scrape) and check-alerts
// (search-result scrape) — the only difference between those two use cases
// is what an empty result array means, so that's left to the caller.
export async function runApifyActor(
  actorId: string,
  input: Record<string, unknown>,
  signal: AbortSignal,
): Promise<Record<string, unknown>[]> {
  const token = Deno.env.get('APIFY_TOKEN')
  if (!token) throw new Error('APIFY_TOKEN secret is not set')

  // Slashes in "owner/actor-name" become tildes in the URL path.
  const encodedActorId = actorId.replace('/', '~')
  const res = await fetch(
    `https://api.apify.com/v2/actors/${encodedActorId}/run-sync-get-dataset-items`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
      signal,
    },
  )

  if (!res.ok) throw new Error(`Apify actor ${actorId} responded with HTTP ${res.status}`)

  const items = await res.json()
  if (!Array.isArray(items)) throw new Error(`Apify actor ${actorId} returned an unexpected response shape`)
  return items
}
