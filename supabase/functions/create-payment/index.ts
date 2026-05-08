import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  token: string
  document_id: string
  amount: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const body: RequestBody = await req.json()
    const { token, document_id, amount } = body

    if (!token || !document_id || !amount) {
      return json({ error: 'missing_fields' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verify portal token
    const { data: pt } = await supabase
      .from('portal_tokens')
      .select('customer_id, user_id, expires_at')
      .eq('token', token)
      .single()

    if (!pt) return json({ error: 'invalid_token' }, 401)
    if (pt.expires_at && new Date(pt.expires_at) < new Date()) {
      return json({ error: 'token_expired' }, 401)
    }

    // Verify document belongs to this customer and is payable
    const { data: doc } = await supabase
      .from('documents')
      .select('id, total_amount, content')
      .eq('id', document_id)
      .eq('customer_id', pt.customer_id)
      .eq('user_id', pt.user_id)
      .in('status', ['sent', 'overdue'])
      .single()

    if (!doc) return json({ error: 'document_not_found' }, 404)

    const amountSatang = Math.round(amount * 100)
    if (amountSatang < 2000) return json({ error: 'amount_too_low' }, 400)

    const docNumber = (doc.content as Record<string, unknown> | null)
      ? ((doc.content as { docMeta?: { number?: string } }).docMeta?.number ?? document_id)
      : document_id

    // Create Omise PromptPay charge
    const omiseKey = Deno.env.get('OMISE_SECRET_KEY')!
    const omiseRes = await fetch('https://api.omise.co/charges', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(omiseKey + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountSatang,
        currency: 'THB',
        source: { type: 'promptpay' },
        description: `BillBlock ${docNumber}`,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        metadata: { document_id, portal_token: token },
      }),
    })

    const charge = await omiseRes.json()

    if (!omiseRes.ok) {
      console.error('Omise error:', charge)
      return json({ error: charge.message ?? 'omise_error' }, 502)
    }

    // Persist charge ID on the document
    await supabase
      .from('documents')
      .update({ omise_charge_id: charge.id })
      .eq('id', document_id)

    return json({
      charge_id: charge.id,
      qr_uri: charge.source?.scannable_code?.image?.download_uri ?? null,
      expires_at: charge.expires_at,
      amount: charge.amount / 100,
    })
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
