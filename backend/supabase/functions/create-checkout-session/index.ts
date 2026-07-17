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

// Real prices — kept in sync with PricingSection.astro. Defined inline via
// price_data rather than pre-created Stripe Price IDs, so this works
// without needing anything set up in the Stripe dashboard first.
const PLANS: Record<'monthly' | 'yearly', { amountCents: number; interval: 'month' | 'year'; label: string }> = {
  monthly: { amountCents: 699, interval: 'month', label: 'ImmoTrue Premium (monatlich)' },
  yearly: { amountCents: 4999, interval: 'year', label: 'ImmoTrue Premium (jährlich)' },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  try {
    // The user_id for this checkout always comes from the caller's own
    // verified JWT, never from the request body — this creates a paid
    // subscription, so a client-supplied user_id would let anyone grant
    // Premium to (or bill against) someone else's account.
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

    const body = await req.json()
    const plan: unknown = body.plan
    if (plan !== 'monthly' && plan !== 'yearly') {
      return jsonResponse({ error: 'invalid_input', message: 'plan muss "monthly" oder "yearly" sein.' }, 400)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, is_premium')
      .eq('id', user.id)
      .single()

    if (profile?.is_premium) {
      return jsonResponse({ error: 'already_premium', message: 'Du bist bereits Premium.' }, 409)
    }

    let customerId = profile?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email ?? user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const config = PLANS[plan]
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: config.label },
            unit_amount: config.amountCents,
            recurring: { interval: config.interval },
          },
          quantity: 1,
        },
      ],
      success_url: `${SITE_URL}/upgrade/success`,
      cancel_url: `${SITE_URL}/upgrade`,
      metadata: { supabase_user_id: user.id },
      // Matches the "7 Tage kostenlos testen" badge on PricingSection.astro.
      subscription_data: { trial_period_days: 7, metadata: { supabase_user_id: user.id } },
    })

    return jsonResponse({ url: session.url }, 200)
  } catch (error) {
    console.error('create-checkout-session error:', error)
    return jsonResponse({ error: 'checkout_failed', message: 'Checkout konnte nicht gestartet werden.' }, 500)
  }
})

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
