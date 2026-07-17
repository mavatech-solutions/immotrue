import { createClient } from 'jsr:@supabase/supabase-js@2'
import { GRUNDERWERBSTEUER_DE } from '../../../../shared/utils/calculatePurchaseCosts.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MODEL = 'claude-opus-4-8'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// This is a manually-invoked content-ops tool, not something the app calls
// on its own — it only ever produces a draft (the caller is expected to
// save the returned markdown with `draft: true` and have a human review it
// before publishing). Fully autonomous, unreviewed AI blog posting risks
// both factual errors in a legal/tax-adjacent niche and Google's "scaled
// content abuse" penalty for unreviewed mass AI content.
type Topic = 'purchase-costs' | 'market-trend' | 'guide'

interface RequestBody {
  topic: Topic
  guideTopic?: string
}

const BLOG_DRAFT_TOOL = {
  name: 'provide_blog_draft',
  description: 'Liefert einen SEO-optimierten Blog-Artikel-Entwurf als strukturierte Daten.',
  strict: true,
  input_schema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Artikel-Titel' },
      description: { type: 'string', description: 'Meta-Beschreibung, 140-160 Zeichen' },
      seoTitle: { type: 'string', description: 'SEO-Titel, max 60 Zeichen' },
      seoDescription: { type: 'string', description: 'SEO-Meta-Description, max 160 Zeichen' },
      category: { type: 'string', enum: ['guide', 'market', 'legal', 'tips'] },
      tags: { type: 'array', items: { type: 'string' } },
      contentMarkdown: {
        type: 'string',
        description: 'Vollständiger Artikeltext in Markdown mit ## Zwischenüberschriften, 600-900 Wörter',
      },
    },
    required: ['title', 'description', 'seoTitle', 'seoDescription', 'category', 'tags', 'contentMarkdown'],
    additionalProperties: false,
  },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  try {
    const body: RequestBody = await req.json()
    if (!body.topic) return jsonResponse({ error: 'invalid_input', message: 'topic is required.' }, 400)

    const { systemPrompt, userPrompt } = await buildPrompt(body)
    const draft = await generateDraft(systemPrompt, userPrompt)

    return jsonResponse(draft, 200)
  } catch (error) {
    console.error('generate-blog-draft error:', error)
    return jsonResponse({ error: 'generation_failed', message: 'Entwurf konnte nicht erstellt werden.' }, 500)
  }
})

async function buildPrompt(body: RequestBody): Promise<{ systemPrompt: string; userPrompt: string }> {
  const basePrompt = `Du schreibst redaktionelle Ratgeber-Artikel für den ImmoTrue-Blog (KI-Immobilienanalyse für Deutschland, Österreich, Schweiz).
Schreibe auf Deutsch, sachlich, für Immobilienkäufer:innen ohne Vorwissen.
WICHTIG: Verwende ausschließlich die unten bereitgestellten echten Daten für alle Zahlen und Statistiken.
Erfinde KEINE zusätzlichen Zahlen, Prozentsätze, Studien oder Quellenangaben, die dir nicht explizit gegeben wurden.
Wenn du zu einem Aspekt keine echten Daten hast, formuliere allgemein statt eine Zahl zu erfinden.
Dies ist ein ENTWURF, der von einem Menschen geprüft wird, bevor er veröffentlicht wird.`

  if (body.topic === 'purchase-costs') {
    const table = Object.entries(GRUNDERWERBSTEUER_DE)
      .sort(([, a], [, b]) => a - b)
      .map(([state, rate]) => `${state}: ${rate}%`)
      .join('\n')

    return {
      systemPrompt: basePrompt,
      userPrompt: `Schreibe einen Artikel über die Grunderwerbsteuer beim Immobilienkauf in Deutschland, Kategorie "market".

Echte, verifizierte Grunderwerbsteuersätze je Bundesland (Stand: aktuell):
${table}

Erkläre zusätzlich kurz (ohne neue Zahlen zu erfinden), dass die Grunderwerbsteuer nur ein Teil der Kaufnebenkosten ist (Notar, Grundbuch, ggf. Maklerprovision kommen dazu).`,
    }
  }

  if (body.topic === 'market-trend') {
    const { data: trend } = await supabase
      .from('national_market_trends')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (!trend) throw new Error('No national_market_trends data available')

    return {
      systemPrompt: basePrompt,
      userPrompt: `Schreibe einen Artikel über die aktuelle Preisentwicklung am deutschen Immobilienmarkt, Kategorie "market".

Echte Daten (Destatis Häuserpreisindex, ${trend.reference_quarter}):
- Häuserpreisindex: ${trend.house_price_index}
- Preiswachstum letztes Jahr: ${trend.price_growth_last_year}%
${trend.price_growth_5_years != null ? `- Preiswachstum letzte 5 Jahre: ${trend.price_growth_5_years}%` : '- Keine 5-Jahres-Daten verfügbar, dazu nichts erfinden.'}

Ordne diese Zahlen für Laien ein (was bedeutet ein Häuserpreisindex, was heißt das Wachstum für Käufer).`,
    }
  }

  // 'guide': evergreen educational content, no live data needed — the
  // article shouldn't cite any statistics at all here.
  return {
    systemPrompt: basePrompt,
    userPrompt: `Schreibe einen praxisnahen Ratgeber-Artikel zum Thema "${body.guideTopic ?? 'Checkliste vor dem Immobilienkauf'}", Kategorie "guide".
Rein prozess-/handlungsorientiert, keine Marktzahlen oder Statistiken verwenden.`,
  }
}

async function generateDraft(systemPrompt: string, userPrompt: string) {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY secret is not set')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      tools: [BLOG_DRAFT_TOOL],
      tool_choice: { type: 'tool', name: 'provide_blog_draft' },
      messages: [{ role: 'user', content: userPrompt }],
    }),
    signal: AbortSignal.timeout(60_000),
  })

  if (!res.ok) throw new Error(`Anthropic API responded with HTTP ${res.status}`)

  const message = await res.json()
  if (message.stop_reason === 'refusal') throw new Error('Claude hat die Artikel-Erstellung abgelehnt.')

  const toolUse = message.content?.find((block: { type: string }) => block.type === 'tool_use')
  if (!toolUse) throw new Error('No tool_use block in response')

  return toolUse.input
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
