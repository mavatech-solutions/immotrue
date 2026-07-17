import Stripe from 'npm:stripe@^22'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SITE_URL = Deno.env.get('PUBLIC_SITE_URL') ?? 'https://immotrue.de'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'unauthorized', message: 'Nicht eingeloggt.' }, 401)

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser()
    if (authError || !user) return jsonResponse({ error: 'unauthorized', message: 'Nicht eingeloggt.' }, 401)

    const { data: profile } = await supabase.from('profiles').select('stripe_customer_id').eq('id', user.id).single()
    if (!profile?.stripe_customer_id) {
      return jsonResponse({ error: 'no_subscription', message: 'Kein Abo gefunden.' }, 404)
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${SITE_URL}/dashboard`,
    })

    return jsonResponse({ url: session.url }, 200)
  } catch (error) {
    console.error('create-portal-session error:', error)
    return jsonResponse({ error: 'portal_failed', message: 'Abo-Verwaltung konnte nicht geöffnet werden.' }, 500)
  }
})

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
