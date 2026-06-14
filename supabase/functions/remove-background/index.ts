import { createClient } from 'jsr:@supabase/supabase-js@2'
import { encodeBase64 } from 'jsr:@std/encoding/base64'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MONTHLY_FALLBACK_LIMIT = 15

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing authorization' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData.user) return json({ error: 'Unauthorized' }, 401)

    const { imageBase64 } = await req.json()
    if (!imageBase64) return json({ result: null })

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count } = await serviceClient
      .from('bg_removal_fallback_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userData.user.id)
      .gte('created_at', since)

    if ((count ?? 0) >= MONTHLY_FALLBACK_LIMIT) return json({ result: null, limited: true })

    const prediction = await fetch('https://api.replicate.com/v1/models/851-labs/background-remover/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Token ${Deno.env.get('REPLICATE_API_TOKEN')!}`,
        'Content-Type': 'application/json',
        Prefer: 'wait=30',
      },
      body: JSON.stringify({
        input: {
          image: `data:image/jpeg;base64,${imageBase64}`,
          background_type: 'rgba',
          format: 'png',
        },
      }),
    })

    if (!prediction.ok) return json({ result: null })

    const result = await prediction.json()
    if (result.status !== 'succeeded' || !result.output) return json({ result: null })

    const imageRes = await fetch(result.output)
    if (!imageRes.ok) return json({ result: null })

    const bytes = new Uint8Array(await imageRes.arrayBuffer())

    await serviceClient.from('bg_removal_fallback_log').insert({ user_id: userData.user.id })

    return json({ result: `data:image/png;base64,${encodeBase64(bytes)}` })
  } catch {
    return json({ result: null })
  }
})
