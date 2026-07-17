// Deploy with: supabase functions deploy stripe-webhook --no-verify-jwt
// Stripe calls this directly with its own Stripe-Signature header, not a
// Supabase JWT — a plain `deploy` without the flag re-enables the
// platform's JWT check and every real webhook call gets rejected with 401
// before this file's signature verification even runs.
import Stripe from 'npm:stripe@^22'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)
const cryptoProvider = Stripe.createSubtleCryptoProvider()

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

Deno.serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  if (!signature) return new Response('Missing Stripe-Signature header', { status: 400 })

  // Signature verification needs the exact raw bytes Stripe signed — never
  // req.json() here, that would re-serialize the body and break the check.
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET, undefined, cryptoProvider)
  } catch (error) {
    console.error('stripe-webhook: signature verification failed:', error)
    return new Response('Invalid signature', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id
        if (userId && session.subscription) {
          await supabase
            .from('profiles')
            .update({ is_premium: true, stripe_subscription_id: String(session.subscription) })
            .eq('id', userId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const isActive = subscription.status === 'active' || subscription.status === 'trialing'
        await supabase
          .from('profiles')
          .update({
            is_premium: isActive,
            premium_until: new Date(subscription.current_period_end * 1000).toISOString(),
            stripe_subscription_id: subscription.id,
          })
          .eq('stripe_customer_id', String(subscription.customer))
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await supabase
          .from('profiles')
          .update({ is_premium: false })
          .eq('stripe_customer_id', String(subscription.customer))
        break
      }

      default:
        break // other event types aren't relevant to premium status
    }

    return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('stripe-webhook: handler error:', error)
    return new Response(JSON.stringify({ error: 'webhook_handler_failed' }), { status: 500 })
  }
})
