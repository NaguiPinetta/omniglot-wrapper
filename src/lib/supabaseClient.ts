import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';

export const supabaseClient = createClient(
	env.PUBLIC_SUPABASE_URL!,
	env.PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
	{
		auth: {
			autoRefreshToken: true,
			persistSession: true,
			detectSessionInUrl: true
		}
	}
);

// Types based on your schema
export type Agent = {
  id: string;
  name: string;
  model: string;
  prompt: string;
  created_at: string;
};

export type Dataset = {
  id: string;
  name: string;
  row_count: number;
  file_url: string;
  uploaded_at: string;
};

export type Job = {
  id: string;
  agent_id: string;
  dataset_id: string;
  status: string;
  progress: number;
  result_url: string;
  created_at: string;
};

export type GlossaryEntry = {
  id: string;
  term: string;
  translation: string;
  note?: string;
  created_at: string;
}; 