export interface GlossaryEntry {
  id: string;
  term: string;
  translation: string;
  note?: string;
  language?: string;
  context?: string;
  last_used?: string;
  created_at?: string;
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
} 