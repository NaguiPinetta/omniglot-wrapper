export interface ColumnMapping {
  source_text_column: string;
  source_language_column?: string;
  row_id_column?: string;
}

export interface Job {
  id: string;
  name: string;
  description: string;
  agent_id: string;
  dataset_id: string;
  glossary_id: string | null;
  glossary_usage_mode: 'enforce' | 'prefer' | 'ignore';
  source_language: string;
  translation_instructions?: string;
  column_mapping?: ColumnMapping;
  target_language: string;
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
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
  skipped_rows?: SkippedRow[];
  total_tokens?: number;
  total_cost?: number;
  completed_rows?: any[];
}

export interface JobFormData {
  name: string;
  description: string;
  agent_id: string;
  dataset_id: string;
  glossary_id?: string | null;
  glossary_usage_mode: 'enforce' | 'prefer' | 'ignore';
  source_language: string;
  translation_instructions?: string;
  column_mapping?: ColumnMapping;
  target_language: string;
}

export interface JobStore {
  jobs: Job[];
  loading: boolean;
  error: string | null;
}

export interface JobResult {
  id: string;
  job_id: string;
  source_text: string;
  target_text: string;
  source_language: string;
  target_language: string;
  confidence: number;
  status: string;
  row_id?: string;
  created_at: string;
}

export interface JobProgress {
  total: number;
  processed: number;
  failed: number;
  progress: number;
}

export interface SkippedRow {
  row_id?: string;
  row_number: number;
  reason: string;
  data?: any;
} 