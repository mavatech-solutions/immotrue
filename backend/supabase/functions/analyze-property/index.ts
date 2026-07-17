import type {
  AIAnalysis,
  LocationData,
  MarketData,
  PropertyData,
  PurchaseCosts,
} from '../../../../shared/types/index.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MODEL = 'claude-haiku-4-5'
const MAX_ATTEMPTS = 3 // 1 initial + 2 retries, per Schritt 12

const SYSTEM_PROMPT = `Du bist ein erfahrener Immobilienanalyst für DACH.
Analysiere sachlich und präzise auf Deutsch.
Nenne konkrete Zahlen. Erkläre für Laien.
Erkläre versteckte Kosten, die Käufer übersehen.
Gib eine klare Empfehlung mit Begründung.`

function riskCategorySchema(description: string) {
  return {
    type: 'object',
    description,
    properties: {
      value: { type: 'integer', description: '0-100, höher = mehr Risiko' },
      reason: { type: 'string', description: '1-2 Sätze, warum genau dieser Wert für dieses Objekt zutrifft' },
    },
    required: ['value', 'reason'],
    additionalProperties: false,
  }
}

// Structured output via forced, strict tool use — the API validates the
// schema server-side, so this is more reliable than the plan's original
// "respond only in valid JSON" prompting approach (no markdown-wrapping or
// malformed-JSON risk to retry around).
const ANALYSIS_TOOL = {
  name: 'provide_property_analysis',
  description: 'Liefert die vollständige KI-Analyse einer Immobilie als strukturierte Daten.',
  strict: true,
  input_schema: {
    type: 'object',
    properties: {
      summary: { type: 'string', description: 'Kurzfassung in 3-4 Sätzen' },
      fullReport: { type: 'string', description: 'Ausführlicher Bericht, ca. 500 Wörter' },
      recommendation: { type: 'string', enum: ['buy', 'wait', 'skip'] },
      recommendationReason: { type: 'string', description: 'Begründung in 2 Sätzen' },
      negotiationTip: { type: 'string', description: 'Konkreter Verhandlungstipp' },
      suggestedOfferPrice: { type: 'integer' },
      riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
      risks: { type: 'array', items: { type: 'string' } },
      riskBreakdown: {
        type: 'object',
        description:
          '5 Risiko-Kategorien, je mit einem 0-100-Wert (höher = mehr Risiko) und einer kurzen Begründung, basierend auf den tatsächlich verfügbaren Daten und der Objektbeschreibung.',
        properties: {
          baujahrRisiko: riskCategorySchema('Baujahr und typische Baujahres-Mängel'),
          energieeffizienz: riskCategorySchema('Basierend auf Energieklasse, falls bekannt'),
          sanierungsbedarf: riskCategorySchema('Geschätzter Sanierungsbedarf aus Baujahr, Zustand, Beschreibung'),
          lageRisiko: riskCategorySchema('Lage-Nachteile, invers zum Lage-Score'),
          rechtliches: riskCategorySchema(
            'Rechtliche Risiken wie Denkmalschutz, Erbbaurecht, Wohnrecht, laufende Rechtsstreitigkeiten — nur falls in der Beschreibung erwähnt, sonst niedriger Standardwert',
          ),
        },
        required: ['baujahrRisiko', 'energieeffizienz', 'sanierungsbedarf', 'lageRisiko', 'rechtliches'],
        additionalProperties: false,
      },
      hiddenCosts: { type: 'array', items: { type: 'string' } },
      forecast10y: { type: 'string', description: 'Prognosetext für 10 Jahre' },
      forecastValue10y: { type: 'integer' },
      investmentVerdict: { type: 'string', enum: ['good', 'medium', 'bad'] },
      pros: { type: 'array', items: { type: 'string' } },
      cons: { type: 'array', items: { type: 'string' } },
    },
    required: [
      'summary',
      'fullReport',
      'recommendation',
      'recommendationReason',
      'negotiationTip',
      'suggestedOfferPrice',
      'riskLevel',
      'risks',
      'riskBreakdown',
      'hiddenCosts',
      'forecast10y',
      'forecastValue10y',
      'investmentVerdict',
      'pros',
      'cons',
    ],
    additionalProperties: false,
  },
}

interface AnalyzeRequest {
  property: PropertyData
  market: MarketData
  location: LocationData
  costs: PurchaseCosts
  priceVerdict: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  try {
    const body: AnalyzeRequest = await req.json()
    if (!body.property || !body.market || !body.location || !body.costs || !body.priceVerdict) {
      return jsonResponse(
        { error: 'invalid_input', message: 'property, market, location, costs, priceVerdict are required.' },
        400,
      )
    }

    const analysis = await runAnalysis(body)
    return jsonResponse(analysis, 200)
  } catch (error) {
    console.error('analyze-property error:', error)

    if (error instanceof RefusedError) {
      return jsonResponse({ error: 'refused', message: error.message }, 422)
    }

    // No fabricated fallback report — a real KI analysis is the whole point
    // of this feature, so on total failure we surface the error rather than
    // return a fake "Analyse nicht möglich, aber hier ist ein Bericht".
    return jsonResponse({ error: 'analysis_failed', message: 'KI-Analyse fehlgeschlagen.' }, 502)
  }
})

class RefusedError extends Error {}

async function runAnalysis(input: AnalyzeRequest): Promise<AIAnalysis> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY secret is not set')

  const userPrompt = JSON.stringify(input)

  let lastError: unknown
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
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
          system: SYSTEM_PROMPT,
          tools: [ANALYSIS_TOOL],
          tool_choice: { type: 'tool', name: 'provide_property_analysis' },
          messages: [{ role: 'user', content: userPrompt }],
        }),
        signal: AbortSignal.timeout(30_000),
      })

      if (!res.ok) throw new Error(`Anthropic API responded with HTTP ${res.status}`)

      const message = await res.json()

      if (message.stop_reason === 'refusal') {
        throw new RefusedError('Claude hat die Analyse aus Sicherheitsgründen abgelehnt.')
      }

      const toolUse = message.content?.find((block: { type: string }) => block.type === 'tool_use')
      if (!toolUse) throw new Error('No tool_use block in response')

      return toolUse.input as AIAnalysis
    } catch (error) {
      if (error instanceof RefusedError) throw error // retrying won't change a policy decision
      lastError = error
      if (attempt < MAX_ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
    }
  }

  throw lastError
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
