export interface GlossaryEntry {
  id: string;
  term: string;
  translation: string;
  note?: string;
  language?: string;
  context?: string;
  last_used?: string;
  created_at?: string;
  module_id?: string;
  module_name?: string;
  type?: string;
  description?: string;
  exceptions?: Record<string, string>;
}

export interface GlossaryStore {
  entries: GlossaryEntry[];
  loading: boolean;
  error: string | null;
}

export interface GlossaryFormData {
  term: string;
  translation: string;
  note?: string;
  language?: string;
  context?: string;
  module_id?: string;
  type?: string;
  description?: string;
  exceptions?: Record<string, string>;
} 