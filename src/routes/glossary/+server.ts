import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createServerSupabaseClient } from '$lib/server/supabase';
import { z } from 'zod';

// Zod schema for glossary entry validation
const GlossaryEntrySchema = z.object({
  term: z.string().min(1, 'Term is required'),
  translation: z.string().min(1, 'Translation is required'),
  language: z.string().min(1, 'Language is required'),
  context: z.string().optional(),
  note: z.string().optional(),
  module_id: z.string().optional(),
  type: z.string().optional(),
  description: z.string().optional(),
  exceptions: z.any().optional() // JSONB field, can be object or string
});

// GET - Fetch all glossary entries
export const GET: RequestHandler = async (event) => {
  console.log('=== GLOSSARY GET DEBUG START ===');
  
  try {
    const supabase = await createServerSupabaseClient(event);
    // Join with modules to get module name
    const { data, error } = await supabase
      .from('glossary')
      .select('*, modules(name)')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('Database error:', error);
      throw error;
    }
    
    // Map module name for display
    const entries = (data ?? []).map((entry: any) => ({
      ...entry,
      module_name: entry.modules?.name || null
    }));
    
    console.log('Fetched entries:', entries.length);
    console.log('=== GLOSSARY GET DEBUG END ===');
    
    return json(entries);
  } catch (error) {
    console.log('GET error:', error);
    console.log('=== GLOSSARY GET DEBUG END ===');
    return json({ error: 'Failed to fetch glossary entries' }, { status: 500 });
  }
};

// POST - Create new glossary entry
export const POST: RequestHandler = async (event) => {
  console.log('=== GLOSSARY SAVE DEBUG START ===');
  
  try {
    const supabase = await createServerSupabaseClient(event);
    const rawData = await event.request.json();
    console.log('Received data:', JSON.stringify(rawData, null, 2));
    
    // Clean the data - convert empty strings to undefined for optional fields
    const cleanedData = {
      term: rawData.term,
      translation: rawData.translation,
      language: rawData.language,
      context: rawData.context || undefined,
      note: rawData.note || undefined,
      module_id: rawData.module_id === '' ? undefined : rawData.module_id,
      type: rawData.type || undefined,
      description: rawData.description || undefined,
      exceptions: rawData.exceptions || undefined
    };
    
    // Parse exceptions if it's a string
    if (cleanedData.exceptions && typeof cleanedData.exceptions === 'string') {
      try {
        cleanedData.exceptions = JSON.parse(cleanedData.exceptions);
        console.log('Parsed exceptions:', cleanedData.exceptions);
      } catch (e) {
        console.log('Failed to parse exceptions, keeping as string:', e);
      }
    }
    
    console.log('Cleaned data:', JSON.stringify(cleanedData, null, 2));
    
    console.log('Is editing:', rawData.isEditing);
    console.log('Current edit ID:', rawData.currentEditId);
    
    // Validate with Zod
    const validationResult = GlossaryEntrySchema.safeParse(cleanedData);
    console.log('Zod validation result:', validationResult);
    
    if (!validationResult.success) {
      console.log('Validation failed:', validationResult.error.issues);
      return json({ error: 'Validation failed', details: validationResult.error.issues }, { status: 400 });
    }
    
    const validatedEntry = validationResult.data;
    console.log('Validated entry:', JSON.stringify(validatedEntry, null, 2));
    
    console.log('Adding new entry...');
    const { data, error } = await supabase
      .from('glossary')
      .insert([validatedEntry])
      .select('*, modules(name)')
      .single();
    
    console.log('Database insert result:', { data, error });
    
    if (error) {
      console.log('Database error:', error);
      return json({ error: 'Database error', details: error }, { status: 500 });
    }
    
    const result = { ...data, module_name: data.modules?.name || null };
    console.log('Final result:', result);
    console.log('=== GLOSSARY SAVE DEBUG END ===');
    
    return json(result);
  } catch (error) {
    console.log('POST error:', error);
    console.log('=== GLOSSARY SAVE DEBUG END ===');
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

// PUT - Update existing glossary entry
export const PUT: RequestHandler = async (event) => {
  console.log('=== GLOSSARY UPDATE DEBUG START ===');
  
  try {
    const supabase = await createServerSupabaseClient(event);
    const rawData = await event.request.json();
    console.log('Received update data:', JSON.stringify(rawData, null, 2));
    
    const { id, ...updateData } = rawData;
    
    if (!id) {
      return json({ error: 'ID is required for update' }, { status: 400 });
    }
    
    // Clean the data - convert empty strings to undefined for optional fields
    const cleanedData = {
      term: updateData.term,
      translation: updateData.translation,
      language: updateData.language,
      context: updateData.context || undefined,
      note: updateData.note || undefined,
      module_id: updateData.module_id === '' ? undefined : updateData.module_id,
      type: updateData.type || undefined,
      description: updateData.description || undefined,
      exceptions: updateData.exceptions || undefined
    };
    
    // Parse exceptions if it's a string
    if (cleanedData.exceptions && typeof cleanedData.exceptions === 'string') {
      try {
        cleanedData.exceptions = JSON.parse(cleanedData.exceptions);
      } catch (e) {
        console.log('Failed to parse exceptions during update:', e);
      }
    }
    
    // Validate with Zod
    const validationResult = GlossaryEntrySchema.safeParse(cleanedData);
    
    if (!validationResult.success) {
      console.log('Validation failed:', validationResult.error.issues);
      return json({ error: 'Validation failed', details: validationResult.error.issues }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('glossary')
      .update(validationResult.data)
      .eq('id', id)
      .select('*, modules(name)')
      .single();
    
    if (error) {
      console.log('Database error:', error);
      return json({ error: 'Database error', details: error }, { status: 500 });
    }
    
    const result = { ...data, module_name: data.modules?.name || null };
    console.log('Update result:', result);
    console.log('=== GLOSSARY UPDATE DEBUG END ===');
    
    return json(result);
  } catch (error) {
    console.log('PUT error:', error);
    console.log('=== GLOSSARY UPDATE DEBUG END ===');
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

// DELETE - Delete glossary entry
export const DELETE: RequestHandler = async (event) => {
  console.log('=== GLOSSARY DELETE DEBUG START ===');
  
  try {
    const supabase = await createServerSupabaseClient(event);
    const url = new URL(event.request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return json({ error: 'ID is required' }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('glossary')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.log('Database error:', error);
      return json({ error: 'Database error', details: error }, { status: 500 });
    }
    
    console.log('Delete successful for ID:', id);
    console.log('=== GLOSSARY DELETE DEBUG END ===');
    
    return json({ success: true });
  } catch (error) {
    console.log('DELETE error:', error);
    console.log('=== GLOSSARY DELETE DEBUG END ===');
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

// PATCH - Bulk operations
export const PATCH: RequestHandler = async (event) => {
  console.log('=== GLOSSARY BULK DEBUG START ===');
  
  try {
    const supabase = await createServerSupabaseClient(event);
    const { action, ids } = await event.request.json();
    
    if (!action || !ids || !Array.isArray(ids)) {
      return json({ error: 'Action and IDs array are required' }, { status: 400 });
    }
    
    if (action === 'delete') {
      const { error } = await supabase
        .from('glossary')
        .delete()
        .in('id', ids);
      
      if (error) {
        console.log('Bulk delete error:', error);
        return json({ error: 'Database error', details: error }, { status: 500 });
      }
      
      console.log('Bulk delete successful for IDs:', ids);
      console.log('=== GLOSSARY BULK DEBUG END ===');
      
      return json({ success: true, deletedCount: ids.length });
    }
    
    return json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    console.log('PATCH error:', error);
    console.log('=== GLOSSARY BULK DEBUG END ===');
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}; 