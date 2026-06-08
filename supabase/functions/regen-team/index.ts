// Edge Function: regen-team
// Admin-gated trigger for the "Publish to website" button. Verifies the caller is
// an active admin (via their JWT + the profiles table under RLS), then calls
// GitHub's repository_dispatch to run the regen-team workflow.
//
// The GitHub PAT lives ONLY in this function's secrets (server-side) — never in
// the browser or the repo. Deploy + configure:
//   supabase functions deploy regen-team
//   supabase secrets set GITHUB_DISPATCH_PAT=github_pat_xxx GITHUB_REPO=owner/repo
// (SUPABASE_URL and SUPABASE_ANON_KEY are injected automatically.)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    // who is calling?
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json(401, { error: 'unauthorized' });

    // are they an active admin? (RLS-protected profiles row)
    const { data: profile } = await supabase
      .from('profiles').select('role, active').eq('id', user.id).maybeSingle();
    if (!profile || profile.role !== 'admin' || profile.active !== true) {
      return json(403, { error: 'forbidden' });
    }

    const pat = Deno.env.get('GITHUB_DISPATCH_PAT');
    const repo = Deno.env.get('GITHUB_REPO'); // "owner/repo", e.g. lalex07/Clinic
    if (!pat || !repo) {
      return json(503, { error: 'GITHUB_DISPATCH_PAT / GITHUB_REPO not configured' });
    }

    const r = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pat}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'dafeng-admin-regen',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event_type: 'doctors-changed' }),
    });
    if (!r.ok) {
      return json(502, { error: `github dispatch failed: ${r.status} ${await r.text()}` });
    }
    return json(200, { ok: true });
  } catch (e) {
    return json(500, { error: String(e) });
  }
});
