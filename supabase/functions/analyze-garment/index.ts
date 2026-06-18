import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CATEGORIES = ['outerwear', 'knitwear', 'denim', 'tops', 'dresses', 'skirts', 'pants', 'shoes', 'bags', 'accessories']

function buildPrompt(locale: string): string {
  const es = locale === 'es'
  const nameExamples = es
    ? `'Blazer Negro de Lana', 'Vestido Midi Floral', 'Tenis Blancos'`
    : `'Black Wool Blazer', 'Floral Midi Dress', 'White Sneakers'`
  const languageLine = es
    ? 'Write the "name" and "color" field values in Spanish.'
    : 'Write the "name" and "color" field values in English.'

  return `You are analyzing a clothing item photo for a wardrobe tracking app.
Return ONLY a valid JSON object — no explanation, no markdown, just JSON.
${languageLine}

{
  "name": "short descriptive name (e.g. ${nameExamples})",
  "brand": "brand name if clearly visible on label, tag, or logo — otherwise null",
  "category": one of exactly: "outerwear"|"knitwear"|"denim"|"tops"|"dresses"|"skirts"|"pants"|"shoes"|"bags"|"accessories" — pick the closest match, never null (always in English, regardless of the language above),
  "color": "primary color in one or two words"
}`
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

    const { imageBase64, mimeType = 'image/jpeg', locale = 'en' } = await req.json()
    if (!imageBase64) return json({ result: null })

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
            { type: 'text', text: buildPrompt(locale) },
          ],
        }],
      }),
    })

    if (!res.ok) return json({ result: null })

    const data = await res.json()
    const text: string = data.content?.[0]?.text ?? ''
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return json({
      result: {
        name: parsed.name ?? '',
        brand: parsed.brand ?? null,
        category: CATEGORIES.includes(parsed.category) ? parsed.category : null,
        color: parsed.color ?? null,
      },
    })
  } catch {
    return json({ result: null })
  }
})
