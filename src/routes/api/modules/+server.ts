import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { createServerSupabaseClient } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

const ModuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
});

export const GET: RequestHandler = async (event) => {
  console.log('=== MODULES GET DEBUG START ===');
  try {
    const supabase = await createServerSupabaseClient(event);
    const { data, error } = await supabase.from('modules').select('*').order('name');
    if (error) {
      console.log('Modules GET error:', error);
      return json({ error: error.message }, { status: 500 });
    }
    console.log('Modules GET success:', data?.length || 0, 'modules');
    console.log('=== MODULES GET DEBUG END ===');
    return json(data);
  } catch (error) {
    console.log('Modules GET exception:', error);
    console.log('=== MODULES GET DEBUG END ===');
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST: RequestHandler = async (event) => {
  console.log('=== MODULES POST DEBUG START ===');
  
  try {
    const supabase = await createServerSupabaseClient(event);
    const body = await event.request.json();
    console.log('Received module data:', body);
    
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
      console.log('Database error:', error);
      return json({ error: error.message }, { status: 500 });
    }
    
    console.log('Module created successfully:', data);
    console.log('=== MODULES POST DEBUG END ===');
    return json(data);
  } catch (error) {
    console.log('POST exception:', error);
    console.log('=== MODULES POST DEBUG END ===');
    return json({ error: 'Internal server error' }, { status: 500 });
  }
} 