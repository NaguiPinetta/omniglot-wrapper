// Supabase configuration for Omniglot

export const supabaseConfig = {
  url: process.env.SUPABASE_URL || '',
  anonKey: process.env.SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};

// Database table names
export const TABLES = {
  USERS: 'users',
  AGENTS: 'agents',
  GLOSSARIES: 'glossaries',
  GLOSSARY_TERMS: 'glossary_terms',
  DATASETS: 'datasets',
  JOBS: 'jobs',
  TRANSLATIONS: 'translations',
  GLOSSARY_MATCHES: 'glossary_matches',
} as const;

// Storage bucket names
export const STORAGE_BUCKETS = {
  DATASETS: 'datasets',
  GLOSSARIES: 'glossaries',
  EXPORTS: 'exports',
} as const;

// Row Level Security (RLS) policies
export const RLS_POLICIES = {
  // Users can only see their own data
  USERS_OWN_DATA: 'users_own_data',
  // Users can see all agents (public)
  AGENTS_PUBLIC: 'agents_public',
  // Users can only see their own glossaries
  GLOSSARIES_OWN_DATA: 'glossaries_own_data',
  // Users can only see their own datasets
  DATASETS_OWN_DATA: 'datasets_own_data',
  // Users can only see their own jobs
  JOBS_OWN_DATA: 'jobs_own_data',
  // Users can only see their own translations
  TRANSLATIONS_OWN_DATA: 'translations_own_data',
} as const;

// Database schema types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'user';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role?: 'admin' | 'user';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'admin' | 'user';
          created_at?: string;
          updated_at?: string;
        };
      };
      agents: {
        Row: {
          id: string;
          name: string;
          description: string;
          model: string;
          prompt: string;
          parameters: any;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          model: string;
          prompt: string;
          parameters: any;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          model?: string;
          prompt?: string;
          parameters?: any;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      glossaries: {
        Row: {
          id: string;
          name: string;
          description: string;
          source_language: string;
          target_language: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          source_language: string;
          target_language: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          source_language?: string;
          target_language?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      glossary_terms: {
        Row: {
          id: string;
          glossary_id: string;
          source_term: string;
          target_term: string;
          context: string | null;
          domain: string | null;
          priority: 'high' | 'medium' | 'low';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          glossary_id: string;
          source_term: string;
          target_term: string;
          context?: string | null;
          domain?: string | null;
          priority?: 'high' | 'medium' | 'low';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          glossary_id?: string;
          source_term?: string;
          target_term?: string;
          context?: string | null;
          domain?: string | null;
          priority?: 'high' | 'medium' | 'low';
          created_at?: string;
          updated_at?: string;
        };
      };
      datasets: {
        Row: {
          id: string;
          name: string;
          description: string;
          file_name: string;
          file_size: number;
          file_type: 'csv' | 'xlsx' | 'json';
          row_count: number;
          columns: string[];
          status: 'uploading' | 'processing' | 'ready' | 'error';
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          file_name: string;
          file_size: number;
          file_type: 'csv' | 'xlsx' | 'json';
          row_count: number;
          columns: string[];
          status?: 'uploading' | 'processing' | 'ready' | 'error';
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          file_name?: string;
          file_size?: number;
          file_type?: 'csv' | 'xlsx' | 'json';
          row_count?: number;
          columns?: string[];
          status?: 'uploading' | 'processing' | 'ready' | 'error';
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          name: string;
          description: string;
          agent_id: string;
          dataset_id: string;
          glossary_id: string | null;
          status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
          progress: number;
          total_items: number;
          processed_items: number;
          failed_items: number;
          started_at: string | null;
          completed_at: string | null;
          error: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          agent_id: string;
          dataset_id: string;
          glossary_id?: string | null;
          status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
          progress?: number;
          total_items: number;
          processed_items?: number;
          failed_items?: number;
          started_at?: string | null;
          completed_at?: string | null;
          error?: string | null;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          agent_id?: string;
          dataset_id?: string;
          glossary_id?: string | null;
          status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
          progress?: number;
          total_items?: number;
          processed_items?: number;
          failed_items?: number;
          started_at?: string | null;
          completed_at?: string | null;
          error?: string | null;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      translations: {
        Row: {
          id: string;
          job_id: string;
          source_text: string;
          target_text: string;
          source_language: string;
          target_language: string;
          confidence: number | null;
          status: 'pending' | 'completed' | 'failed';
          error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          source_text: string;
          target_text: string;
          source_language: string;
          target_language: string;
          confidence?: number | null;
          status?: 'pending' | 'completed' | 'failed';
          error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          source_text?: string;
          target_text?: string;
          source_language?: string;
          target_language?: string;
          confidence?: number | null;
          status?: 'pending' | 'completed' | 'failed';
          error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
} 