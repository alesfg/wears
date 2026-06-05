import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: userError } = await anonClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: `Auth error: ${userError?.message ?? 'no user'}` }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const uid = user.id

    // Delete in dependency order: child tables first, then parent tables
    const steps = [
      'wears',
      'fits_items',
      'fits_outfits',
      'items',
      'fits_profiles',
      'referral_uses',
      'referrals',
      'streaks',
      'check_ins',
      'relapses',
      'urge_events',
      'user_profiles',
    ]

    for (const table of steps) {
      const { error } = await adminClient.from(table).delete().eq('user_id', uid)
      if (error) {
        return new Response(JSON.stringify({ error: `${table} delete: ${error.message}` }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(uid)
    if (deleteError) {
      return new Response(JSON.stringify({ error: `deleteUser: ${deleteError.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: `exception: ${String(err)}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
