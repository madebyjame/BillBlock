/**
 * Omise Subscription Checkout Edge Function
 *
 * Env vars required:
 *   OMISE_SECRET_KEY   — Omise secret key (sk_live_... or sk_test_...)
 *   SUPABASE_URL       — auto-injected by Supabase
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected by Supabase
 *
 * Request body:
 *   { token: string; plan: 'pro' | 'business'; cycle: 'monthly' | 'annual'; user_id: string }
 *
 * Response:
 *   { success: boolean; subscription_id?: string; error?: string }
 */
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PRICES: Record<string, Record<string, number>> = {
  pro:      { monthly: 390, annual: 312 },   // annual = 390 * 0.8
  business: { monthly: 790, annual: 632 },
}

interface RequestBody {
  token: string        // Omise card token (tok_...)
  plan: 'pro' | 'business'
  cycle: 'monthly' | 'annual'
  user_id: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const omiseKey = Deno.env.get('OMISE_SECRET_KEY')
  if (!omiseKey) {
    return json({ error: 'omise_not_configured', message: 'OMISE_SECRET_KEY is not set' }, 503)
  }

  try {
    const body: RequestBody = await req.json()
    const { token, plan, cycle, user_id } = body

    if (!token || !plan || !cycle || !user_id) {
      return json({ error: 'missing_fields' }, 400)
    }

    const planPrices = PRICES[plan]
    if (!planPrices) return json({ error: 'invalid_plan' }, 400)

    const pricePerMonth = planPrices[cycle]
    const amountSatang  = cycle === 'annual'
      ? Math.round(pricePerMonth * 12 * 100)   // charge full year
      : Math.round(pricePerMonth * 100)         // monthly

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Look up user email for Omise customer creation
    const { data: authUser } = await supabase.auth.admin.getUserById(user_id)
    const email = authUser?.user?.email ?? `user-${user_id}@billblock.app`

    // Create or find Omise customer
    let omiseCustomerId: string | null = null
    const { data: profile } = await supabase
      .from('profiles')
      .select('omise_customer_id')
      .eq('id', user_id)
      .single()

    if (profile?.omise_customer_id) {
      omiseCustomerId = profile.omise_customer_id as string
    } else {
      // Create new Omise customer
      const custRes = await fetch('https://api.omise.co/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(omiseKey + ':')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, card: token }),
      })
      const cust = await custRes.json()
      if (!custRes.ok) return json({ error: cust.message ?? 'omise_customer_error' }, 502)
      omiseCustomerId = cust.id

      // Save omise customer ID
      await supabase
        .from('profiles')
        .update({ omise_customer_id: omiseCustomerId })
        .eq('id', user_id)
    }

    // Create a charge (simple one-time or recurring)
    const chargeRes = await fetch('https://api.omise.co/charges', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(omiseKey + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount:      amountSatang,
        currency:    'THB',
        customer:    omiseCustomerId,
        description: `BillBlock ${plan === 'pro' ? 'Pro' : 'Business'} — ${cycle === 'annual' ? 'รายปี' : 'รายเดือน'}`,
        metadata:    { user_id, plan, cycle },
        capture:     true,
      }),
    })
    const charge = await chargeRes.json()
    if (!chargeRes.ok) return json({ error: charge.message ?? 'charge_error' }, 502)
    if (charge.status !== 'successful') {
      return json({ error: 'charge_failed', detail: charge.failure_message }, 402)
    }

    // Calculate subscription dates
    const now           = new Date()
    const periodStart   = now.toISOString()
    const monthsToAdd   = cycle === 'annual' ? 12 : 1
    const periodEndDate = new Date(now)
    periodEndDate.setMonth(periodEndDate.getMonth() + monthsToAdd)
    const periodEnd = periodEndDate.toISOString()

    // Upsert subscription in DB
    await supabase.from('subscriptions').upsert(
      {
        user_id,
        plan,
        status:               'active',
        billing_cycle:        cycle,
        omise_charge_id:      charge.id,
        omise_customer_id:    omiseCustomerId,
        current_period_start: periodStart,
        current_period_end:   periodEnd,
      },
      { onConflict: 'user_id' },
    )

    return json({ success: true, charge_id: charge.id, period_end: periodEnd })
  } catch (err) {
    console.error(err)
    return json({ error: 'internal_error' }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
