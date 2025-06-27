import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { createServerSupabaseClient } from '$lib/server/supabase';

const ModuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
});

export async function GET({ fetch }) {
  const supabase = createServerSupabaseClient(fetch);
  const { data, error } = await supabase.from('modules').select('*').order('name');
  if (error) return json({ error: error.message }, { status: 500 });
  return json({ modules: data });
}

export async function POST({ request, fetch }) {
  // Log Supabase env
  console.log('Supabase URL:', process.env.PUBLIC_SUPABASE_URL);
  console.log('Supabase Key:', process.env.PUBLIC_SUPABASE_ANON_KEY?.slice(0, 8));

  const supabase = createServerSupabaseClient(fetch);
  const body = await request.json();
  const parse = ModuleSchema.safeParse(body);
  if (!parse.success) {
    console.log('Validation failed:', parse.error.flatten());
    return json({ error: 'Invalid input', details: parse.error.flatten() }, { status: 400 });
  }
  const { name, description } = parse.data;
  console.log('Attempting to insert module:', { name, description });
  const { data, error } = await supabase
    .from('modules')
    .insert({ name, description })
    .select()
    .single();
  console.log('Insert result:', { data, error });
  if (error) {
    return json({ error: error.message }, { status: 500 });
  }
  return json({ module: data });
} 