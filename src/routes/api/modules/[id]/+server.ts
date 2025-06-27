import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { createServerSupabaseClient } from '$lib/server/supabase';

const ModuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
});

export async function PUT({ request, params, fetch }) {
  const supabase = createServerSupabaseClient(fetch);
  const { id } = params;
  const body = await request.json();
  const parse = ModuleSchema.safeParse(body);
  if (!parse.success) {
    return json({ error: 'Invalid input', details: parse.error.flatten() }, { status: 400 });
  }
  const { name, description } = parse.data;
  const { data, error } = await supabase
    .from('modules')
    .update({ name, description })
    .eq('id', id)
    .select()
    .single();
  if (error) {
    return json({ error: error.message }, { status: 500 });
  }
  return json({ module: data });
}

export async function DELETE({ params, fetch }) {
  const supabase = createServerSupabaseClient(fetch);
  const { id } = params;
  const { error } = await supabase.from('modules').delete().eq('id', id);
  if (error) {
    return json({ error: error.message }, { status: 500 });
  }
  return json({ success: true });
} 