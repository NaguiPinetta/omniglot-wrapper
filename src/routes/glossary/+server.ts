import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { createServerSupabaseClient } from '$lib/server/supabase';

const GlossarySchema = z.object({
  term: z.string().min(1),
  translation: z.string().min(1),
  note: z.string().optional(),
  language: z.string().optional(),
  context: z.string().optional(),
  module_id: z.string().uuid().optional().or(z.literal('')),
  type: z.string().optional(),
  description: z.string().optional(),
  exceptions: z.record(z.string()).optional()
});

export async function POST({ request, fetch }) {
  const body = await request.json();
  const parse = GlossarySchema.safeParse(body);
  if (!parse.success) {
    return json({ error: 'Invalid input', details: parse.error.flatten() }, { status: 400 });
  }
  const entry = parse.data;
  // Convert empty string module_id to null
  if (entry.module_id === '') entry.module_id = null;
  const supabase = createServerSupabaseClient(fetch);
  const { data, error } = await supabase.from('glossary').insert([entry]).select('*, modules(name)').single();
  if (error) {
    return json({ error: error.message }, { status: 500 });
  }
  return json({ entry: { ...data, module_name: data.modules?.name || null } });
} 