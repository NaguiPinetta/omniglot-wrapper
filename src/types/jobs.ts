export interface Job {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  source_language: string;
  target_language: string;
  agent_id: string;
  dataset_id: string;
  progress: number;
  total_items: number;
  processed_items: number;
  failed_items: number;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

export interface JobFormData {
  name: string;
  description: string;
  source_language: string;
  target_language: string;
  agent_id: string;
  dataset_id: string;
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
  translated_text: string;
  confidence: number;
  processing_time: number;
  created_at: string;
}

export interface JobProgress {
  total: number;
  processed: number;
  failed: number;
  progress: number;
} 