import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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

    const omiseKey = Deno.env.get('OMISE_SECRET_KEY')!
    const res = await fetch(`https://api.omise.co/charges/${charge_id}`, {
      headers: { 'Authorization': `Basic ${btoa(omiseKey + ':')}` },
    })
    const charge = await res.json()

    if (!res.ok) return json({ error: charge.message ?? 'omise_error' }, 502)

    if (charge.status === 'successful') {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      )
      await supabase
        .from('documents')
        .update({ status: 'paid', paid_date: new Date().toISOString().split('T')[0] })
        .eq('id', document_id)
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
