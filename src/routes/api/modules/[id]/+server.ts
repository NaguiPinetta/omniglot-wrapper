import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { createServerSupabaseClient } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

const ModuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
});

export const PUT: RequestHandler = async (event) => {
  const supabase = await createServerSupabaseClient(event);
  const { id } = event.params;
  const body = await event.request.json();
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
  return json(data);
}

export const DELETE: RequestHandler = async (event) => {
  const supabase = await createServerSupabaseClient(event);
  const { id } = event.params;
  const { error } = await supabase.from('modules').delete().eq('id', id);
  if (error) {
    return json({ error: error.message }, { status: 500 });
  }
  return json({ success: true });
} 