import { supabaseClient } from '../supabaseClient';
import type { Dataset, DatasetPreview, DatasetUploadResponse, DatasetFormData } from '../../types/datasets';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Helper function to get file type
function getFileType(fileName: string): 'csv' | 'xlsx' | 'json' {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'csv':
      return 'csv';
    case 'xlsx':
    case 'xls':
      return 'xlsx';
    case 'json':
      return 'json';
    default:
      throw new Error('Unsupported file type. Please upload CSV, XLSX, or JSON files.');
  }
}

// Helper function to preview file contents
async function previewFile(file: File): Promise<DatasetPreview> {
  const fileType = getFileType(file.name);
  
  switch (fileType) {
    case 'csv':
      return new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          preview: 5,
          complete: (results: Papa.ParseResult<Record<string, string>>) => {
            resolve({
              headers: results.meta.fields || [],
              rows: results.data,
              totalRows: results.data.length
            });
          },
          error: (error: Papa.ParseError) => reject(error)
        });
      });
      
    case 'xlsx':
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const headers = data[0] as string[];
      const rows = data.slice(1, 6).map((row: any) => {
        const record: Record<string, string> = {};
        headers.forEach((header, index) => {
          record[header] = row[index]?.toString() || '';
        });
        return record;
      });
      return {
        headers,
        rows,
        totalRows: data.length - 1 // Subtract header row
      };
      
    case 'json':
      const content = await file.text();
      const json = JSON.parse(content);
      const jsonArray = Array.isArray(json) ? json : [json];
      const firstRow = jsonArray[0] || {};
      return {
        headers: Object.keys(firstRow),
        rows: jsonArray.slice(0, 5).map(row => 
          Object.fromEntries(
            Object.entries(row).map(([k, v]) => [k, v?.toString() || ''])
          )
        ),
        totalRows: jsonArray.length
      };
      
    default:
      throw new Error('Unsupported file type');
  }
}

export async function uploadDataset(formData: DatasetFormData): Promise<DatasetUploadResponse> {
  if (!formData.file) {
    throw new Error('No file provided');
  }

  const file = formData.file;
  const fileType = getFileType(file.name);
  const preview = await previewFile(file);
  
  // Generate a unique filename
  const fileName = `${Date.now()}_${file.name}`;
  
  // Upload file to storage
  const { data: storageData, error: storageError } = await supabaseClient.storage
    .from('datasets')
    .upload(fileName, file);

  if (storageError) throw storageError;

  const fileUrl = supabaseClient.storage
    .from('datasets')
    .getPublicUrl(fileName)
    .data.publicUrl;

  // Create dataset record
  const { data, error } = await supabaseClient
    .from('datasets')
    .insert([{
      name: formData.name,
      description: formData.description,
      file_name: fileName,
      file_size: file.size,
      file_type: fileType,
      row_count: preview.totalRows,
      columns: preview.headers,
      status: 'ready',
      file_url: fileUrl
    }])
    .select()
    .single();

  if (error) throw error;

  return {
    dataset: data,
    preview
  };
}

export async function getDatasets(): Promise<Dataset[]> {
  const { data, error } = await supabaseClient
    .from('datasets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getDataset(id: string): Promise<Dataset> {
  const { data, error } = await supabaseClient
    .from('datasets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateDataset(id: string, updates: Partial<Dataset>): Promise<void> {
  const { error } = await supabaseClient
    .from('datasets')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteDataset(id: string): Promise<void> {
  // First get the dataset to get the file name
  const { data: dataset, error: fetchError } = await supabaseClient
    .from('datasets')
    .select('file_name')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  // Delete the file from storage
  const { error: storageError } = await supabaseClient.storage
    .from('datasets')
    .remove([dataset.file_name]);

  if (storageError) throw storageError;

  // Delete the dataset record
  const { error } = await supabaseClient
    .from('datasets')
    .delete()
    .eq('id', id);

  if (error) throw error;
}