import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { charge_id, document_id, token } = await req.json()
    if (!charge_id || !document_id || !token) return json({ error: 'missing_fields' }, 400)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verify portal token owns this document before trusting charge_id
    const { data: pt } = await supabase
      .from('portal_tokens')
      .select('customer_id, user_id, expires_at')
      .eq('token', token)
      .single()

    if (!pt) return json({ error: 'invalid_token' }, 401)
    if (pt.expires_at && new Date(pt.expires_at) < new Date()) {
      return json({ error: 'token_expired' }, 401)
    }

    // Ensure the document belongs to this token's customer
    const { data: doc } = await supabase
      .from('documents')
      .select('id, omise_charge_id')
      .eq('id', document_id)
      .eq('customer_id', pt.customer_id)
      .eq('user_id', pt.user_id)
      .single()

    if (!doc) return json({ error: 'document_not_found' }, 404)

    // Ensure charge_id matches what was recorded at payment creation
    if (doc.omise_charge_id !== charge_id) return json({ error: 'charge_mismatch' }, 403)

    const omiseKey = Deno.env.get('OMISE_SECRET_KEY')!
    const res = await fetch(`https://api.omise.co/charges/${charge_id}`, {
      headers: { 'Authorization': `Basic ${btoa(omiseKey + ':')}` },
    })
    const charge = await res.json()

    if (!res.ok) return json({ error: charge.message ?? 'omise_error' }, 502)

    if (charge.status === 'successful') {
      const paidDate = new Date().toISOString().split('T')[0]
      await supabase
        .from('documents')
        .update({ status: 'paid', paid_date: paidDate })
        .eq('id', document_id)

      // ── Send payment confirmation email ──────────────────────────────
      // Fetch customer email + doc number for the email
      const { data: fullDoc } = await supabase
        .from('documents')
        .select('content, customers(email, name)')
        .eq('id', document_id)
        .single()

      type DocWithCustomer = {
        content: { docMeta?: { number?: string } } | null
        customers: { email?: string; name?: string } | null
      }
      const d = fullDoc as DocWithCustomer | null
      const customerEmail = d?.customers?.email
      const docNumber = d?.content?.docMeta?.number ?? document_id

      if (customerEmail) {
        // Fire-and-forget — don't block the payment response
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'payment',
            to: customerEmail,
            data: {
              docNumber,
              amount: charge.amount / 100,
              paidDate,
            },
          }),
        }).catch(console.error)
      }
    }

    return json({ status: charge.status })
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
