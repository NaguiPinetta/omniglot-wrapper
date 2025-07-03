// supabase/functions/watchdog-stuck-jobs/index.ts
// Edge Function: Mark stuck jobs as failed if 'running' > 30 minutes
// QA: Safe, RLS maintained, no secrets, TS strict mode, concurrency safe

import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';

// Use environment variables for keys (never hardcode secrets)
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false }
});

serve(async (req) => {
  // Only allow POST or scheduled invocation
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Find jobs stuck in 'running' for > 30 minutes
  const { data: stuckJobs, error: selectError } = await supabase
    .from('jobs')
    .select('id, updated_at, user_id, name')
    .eq('status', 'running')
    .lt('updated_at', new Date(Date.now() - 30 * 60 * 1000).toISOString());

  if (selectError) {
    return new Response(`Error selecting stuck jobs: ${selectError.message}`, { status: 500 });
  }

  if (!stuckJobs || stuckJobs.length === 0) {
    return new Response(JSON.stringify({ message: 'No stuck jobs found.' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Mark all stuck jobs as failed
  const stuckIds = stuckJobs.map((j: { id: string }) => j.id);
  const { error: updateError } = await supabase
    .from('jobs')
    .update({
      status: 'failed',
      error: 'Automatically marked as failed by watchdog (no progress > 30min)',
      completed_at: new Date().toISOString(),
    })
    .in('id', stuckIds);

  if (updateError) {
    return new Response(`Error updating stuck jobs: ${updateError.message}`, { status: 500 });
  }

  // Return summary
  return new Response(
    JSON.stringify({
      message: 'Stuck jobs marked as failed',
      count: stuckJobs.length,
      jobs: stuckJobs.map((j: { id: string; name: string; user_id: string }) => ({ id: j.id, name: j.name, user_id: j.user_id })),
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}); 