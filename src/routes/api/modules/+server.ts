import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { supabaseClient } from '$lib/supabaseClient';

const ModuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
});

export async function GET() {
  console.log('=== MODULES GET DEBUG START ===');
  try {
    const { data, error } = await supabaseClient.from('modules').select('*').order('name');
    if (error) {
      console.log('Modules GET error:', error);
      return json({ error: error.message }, { status: 500 });
    }
    console.log('Modules GET success:', data?.length || 0, 'modules');
    console.log('=== MODULES GET DEBUG END ===');
    return json({ modules: data });
  } catch (error) {
    console.log('Modules GET exception:', error);
    console.log('=== MODULES GET DEBUG END ===');
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST({ request }) {
  console.log('=== MODULES POST DEBUG START ===');
  
  try {
    const body = await request.json();
    console.log('Received module data:', body);
    
    const parse = ModuleSchema.safeParse(body);
    if (!parse.success) {
      console.log('Validation failed:', parse.error.flatten());
      return json({ error: 'Invalid input', details: parse.error.flatten() }, { status: 400 });
    }
    
    const { name, description } = parse.data;
    console.log('Attempting to insert module:', { name, description });
    
    const { data, error } = await supabaseClient
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
    return json({ module: data });
  } catch (error) {
    console.log('POST exception:', error);
    console.log('=== MODULES POST DEBUG END ===');
    return json({ error: 'Internal server error' }, { status: 500 });
  }
} 