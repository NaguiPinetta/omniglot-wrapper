import { supabaseClient } from '../supabaseClient';
import type { Dataset, DatasetPreview, DatasetUploadResponse, DatasetFormData } from '../../types/datasets';
import type { SupabaseClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// --- Database CRUD Functions ---

export async function getDatasets({
	client = supabaseClient
}: { client?: SupabaseClient } = {}): Promise<Dataset[]> {
	const { data, error } = await client.from('datasets').select('*').order('created_at', { ascending: false });
	if (error) throw error;
	return data ?? [];
}

export async function getDataset(
	id: string,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<Dataset> {
	const { data, error } = await client.from('datasets').select('*').eq('id', id).single();
	if (error) throw error;
	return data;
}

export async function createDataset(
	dataset: Omit<Dataset, 'id' | 'created_at'>,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<Dataset> {
	const { data, error } = await client.from('datasets').insert([dataset]).select().single();
	if (error) throw error;
	return data;
}

export async function updateDataset(
	id: string,
	updates: Partial<Dataset>,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<Dataset> {
	const { data, error } = await client.from('datasets').update(updates).eq('id', id).select().single();
	if (error) throw error;
	return data;
}

export async function deleteDataset(
	id: string,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<void> {
	// First, get the dataset to retrieve the file name for storage deletion
	const dataset = await getDataset(id, { client });
	if (dataset && dataset.file_name) {
		// Delete the file from storage
		const { error: storageError } = await client.storage.from('datasets').remove([dataset.file_name]);
		// Log error but don't throw, so we can still delete the DB record
		if (storageError) {
			console.error('Failed to delete from storage:', storageError);
		}
	}

	// Delete the dataset record from the database
	const { error } = await client.from('datasets').delete().eq('id', id);
	if (error) throw error;
}


// --- File Handling and Upload Logic ---

function getFileType(fileName: string): 'csv' | 'xlsx' | 'json' {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'csv': return 'csv';
    case 'xlsx': case 'xls': return 'xlsx';
    case 'json': return 'json';
    default: throw new Error('Unsupported file type.');
  }
}

export async function previewFile(file: File): Promise<DatasetPreview> {
  const fileType = getFileType(file.name);
  
  switch (fileType) {
    case 'csv':
      return new Promise((resolve, reject) => {
        const config = {
          header: true,
          preview: 5,
          complete: (results: Papa.ParseResult<Record<string, any>>) => {
            resolve({
              headers: results.meta.fields || [],
              rows: results.data.map(row => 
                Object.entries(row).reduce((acc, [key, value]) => {
                  acc[key] = String(value ?? '');
                  return acc;
                }, {} as Record<string, string>)
              ),
              totalRows: results.data.length
            });
          },
          error: (error: Papa.ParseError) => reject(error)
        };
        Papa.parse(file as any, config);
      });
      
    case 'xlsx':
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const headers = data[0] as string[];
      const rows = data.slice(1, 6).map((row: any[]) => 
        headers.reduce((obj, header, index) => {
            obj[header] = row[index]?.toString() ?? '';
            return obj;
        }, {} as Record<string, string>)
      );
      // Note: This row count might not be perfectly accurate for very large files.
      // A more robust solution might involve a backend process.
      const realRowCount = XLSX.utils.sheet_to_json(worksheet).length;
      return { headers, rows, totalRows: realRowCount };
      
    case 'json':
      const content = await file.text();
      const json = JSON.parse(content);
      const jsonArray = Array.isArray(json) ? json : [json];
      const firstRow = jsonArray[0] || {};
      return {
        headers: Object.keys(firstRow),
        rows: jsonArray.slice(0, 5).map(row => 
          Object.fromEntries(
            Object.entries(row).map(([k, v]) => [k, String(v ?? '')])
          )
        ),
        totalRows: jsonArray.length
      };
      
    default:
      throw new Error('Unsupported file type');
  }
}

export async function uploadAndCreateDataset(formData: DatasetFormData): Promise<DatasetUploadResponse> {
  if (!formData.file) throw new Error('No file provided');

  const file = formData.file;
  const fileType = getFileType(file.name);
  const preview = await previewFile(file);
  
  const fileName = `${Date.now()}_${file.name}`;
  
  const { data: storageData, error: storageError } = await supabaseClient.storage
    .from('datasets')
    .upload(fileName, file);
  if (storageError) throw storageError;

  const { data: { publicUrl } } = supabaseClient.storage.from('datasets').getPublicUrl(fileName);

  const newDataset: Partial<Dataset> = {
    name: formData.name,
    description: formData.description,
    file_name: fileName,
    file_size: file.size,
    file_type: fileType,
    row_count: preview.totalRows,
    columns: preview.headers,
    status: 'ready',
    file_url: publicUrl
  };

  const createdDataset = await createDataset(newDataset as Omit<Dataset, 'id' | 'created_at'>, { client: supabaseClient });

  return {
    dataset: createdDataset,
    preview
  };
}