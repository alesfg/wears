import { createClient } from 'jsr:@supabase/supabase-js@2'
import { encodeBase64 } from 'jsr:@std/encoding/base64'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    const { error: authError } = await supabase.auth.getUser()
    if (authError) return json({ error: 'Unauthorized' }, 401)

    const { imageBase64 } = await req.json()
    if (!imageBase64) return json({ result: null })

    const res = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': Deno.env.get('REMOVEBG_API_KEY')!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_file_b64: imageBase64, size: 'auto' }),
    })

    if (!res.ok) return json({ result: null })

    const bytes = new Uint8Array(await res.arrayBuffer())
    return json({ result: `data:image/png;base64,${encodeBase64(bytes)}` })
  } catch {
    return json({ result: null })
  }
})
