// Core Types for Omniglot Translation System

export interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  prompt: string;
  parameters: AgentParameters;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentParameters {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

// Basic Agent Configuration Type
export interface AgentConfig {
  id: string;
  name: string;
  model: string;
  prompt: string;
  datasetId?: string;
  glossaryId?: string;
  createdAt: string;
}

export interface Glossary {
  id: string;
  name: string;
  description: string;
  sourceLanguage: string;
  targetLanguage: string;
  terms: GlossaryTerm[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GlossaryTerm {
  id: string;
  sourceTerm: string;
  targetTerm: string;
  context?: string;
  domain?: string;
  priority: 'high' | 'medium' | 'low';
}

// Basic Glossary Entry Type
export interface GlossaryEntry {
  id: string;
  term: string;
  translation: string;
  note?: string;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  fileName: string;
  fileSize: number;
  fileType: 'csv' | 'xlsx' | 'json';
  rowCount: number;
  columns: string[];
  status: 'uploading' | 'processing' | 'ready' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

// Basic Dataset File Type
export interface DatasetFile {
  id: string;
  name: string;
  path: string;
  rowCount: number;
  uploadedAt: string;
}

export interface Job {
  id: string;
  name: string;
  description: string;
  agentId: string;
  datasetId: string;
  glossaryId?: string;
  status: JobStatus;
  progress: number;
  totalItems: number;
  processedItems: number;
  failedItems: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type JobStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused';

// Basic Translation Job Type
export interface TranslationJob {
  id: string;
  agentId: string;
  datasetId: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  progress: number;
  createdAt: string;
}

export interface Translation {
  id: string;
  jobId: string;
  sourceText: string;
  targetText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence?: number;
  glossaryMatches: GlossaryMatch[];
  status: 'pending' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GlossaryMatch {
  termId: string;
  sourceTerm: string;
  targetTerm: string;
  matchedText: string;
  position: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// File Upload Types
export interface FileUpload {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
}

// Configuration Types
export interface AppConfig {
  maxFileSize: number;
  allowedFileTypes: string[];
  defaultSourceLanguage: string;
  defaultTargetLanguage: string;
  maxBatchSize: number;
  supportedLanguages: Language[];
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

// Event Types
export interface JobProgressEvent {
  jobId: string;
  progress: number;
  processedItems: number;
  totalItems: number;
  status: JobStatus;
}

export interface TranslationEvent {
  jobId: string;
  translationId: string;
  status: 'completed' | 'failed';
  error?: string;
} 