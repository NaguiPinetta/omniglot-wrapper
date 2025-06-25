export interface Dataset {
  id: string;
  name: string;
  description: string;
  file_name: string;
  file_size: number;
  file_type: 'csv' | 'xlsx' | 'json' | 'xml';
  row_count: number;
  columns: string[];
  status: 'uploading' | 'processing' | 'ready' | 'error';
  file_url?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  file_content?: string;
}

export interface DatasetPreview {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

export interface DatasetUploadResponse {
  dataset: Dataset;
  preview: DatasetPreview;
}

export interface DatasetStore {
  datasets: Dataset[];
  loading: boolean;
  error: string | null;
}

export interface DatasetFormData {
  name: string;
  description: string;
  file?: File;
} 