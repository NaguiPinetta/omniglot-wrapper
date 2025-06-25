import { supabaseClient } from '../supabaseClient';
import type { Dataset, DatasetPreview, DatasetUploadResponse, DatasetFormData } from '../../types/datasets';
import type { SupabaseClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// --- Database CRUD Functions ---

export async function getDatasets({
	client = supabaseClient
}: { client?: SupabaseClient } = {}): Promise<Dataset[]> {
	const { data, error } = await client.from('datasets').select('*').order('uploaded_at', { ascending: false });
	if (error) throw error;
	
	// Map the database fields to match the expected Dataset interface
	return (data ?? []).map(row => ({
		id: row.id,
		name: row.name,
		description: '', // Not in database, use empty string
		file_name: row.file_url || '', // Use file_url as file_name
		file_size: 0, // Not in database, use 0
		file_type: 'csv' as const, // Default to csv since not in database
		row_count: row.row_count || 0,
		columns: [], // Not in database, use empty array
		status: 'ready' as const, // Default to ready since not in database
		user_id: 'anonymous', // Default user
		created_at: row.uploaded_at || new Date().toISOString(),
		updated_at: row.uploaded_at || new Date().toISOString(),
		file_url: row.file_url
	}));
}

export async function getDataset(
	id: string,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<Dataset> {
	const { data, error } = await client.from('datasets').select('*, file_content').eq('id', id).single();
	if (error) throw error;
	return {
		id: data.id,
		name: data.name,
		description: '', // Not in database, use empty string
		file_name: data.file_url || '',
		file_size: 0, // Not in database, use 0
		file_type: 'csv' as const, // Default to csv since not in database
		row_count: data.row_count || 0,
		columns: [], // Not in database, use empty array
		status: 'ready' as const, // Default to ready since not in database
		user_id: 'anonymous', // Default user
		created_at: data.uploaded_at || new Date().toISOString(),
		updated_at: data.uploaded_at || new Date().toISOString(),
		file_url: data.file_url,
		file_content: data.file_content
	};
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
          complete: (results: Papa.ParseResult<Record<string, any>>) => {
            const allRows = results.data.filter(row => 
              // Filter out empty rows
              Object.values(row).some(value => value !== null && value !== undefined && String(value).trim() !== '')
            );
            
            resolve({
              headers: results.meta.fields || [],
              rows: allRows.slice(0, 5).map(row => 
                Object.entries(row).reduce((acc, [key, value]) => {
                  acc[key] = String(value ?? '');
                  return acc;
                }, {} as Record<string, string>)
              ),
              totalRows: allRows.length
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

export async function uploadAndCreateDataset(
  formData: DatasetFormData,
  { client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<DatasetUploadResponse> {
  if (!formData.file) throw new Error('No file provided');

  const file = formData.file;
  const preview = await previewFile(file);
  
  // Store the actual CSV content as text for later access
  const fileContent = await file.text();
  
  // For now, we'll create a dataset record with the file content stored
  const { data, error } = await client.from('datasets').insert([{
    name: formData.name,
    row_count: preview.totalRows,
    file_url: `${file.name}`, // Store original filename
    file_content: fileContent, // Store the actual file content
    columns: preview.headers // Store column headers
  }]).select().single();
  
  if (error) throw error;

  // Map the response to match the expected Dataset interface
  const dataset: Dataset = {
    id: data.id,
    name: data.name,
    description: formData.description || '',
    file_name: file.name,
    file_size: file.size,
    file_type: getFileType(file.name),
    row_count: preview.totalRows,
    columns: preview.headers,
    status: 'ready',
    user_id: 'anonymous',
    created_at: data.uploaded_at || new Date().toISOString(),
    updated_at: data.uploaded_at || new Date().toISOString(),
    file_url: data.file_url,
    file_content: data.file_content
  };

  return {
    dataset,
    preview
  };
}

// --- CSV Content Access Functions ---

export async function getDatasetPreview(
  datasetId: string,
  { client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<DatasetPreview> {
  const { data, error } = await client
    .from('datasets')
    .select('file_content, columns')
    .eq('id', datasetId)
    .single();
  
  if (error) throw error;
  
  if (!data.file_content) {
    throw new Error('Dataset content not found. Please re-upload the dataset.');
  }
  
  // Parse the CSV content to get actual preview
  return new Promise((resolve, reject) => {
    const config = {
      header: true,
      complete: (results: Papa.ParseResult<Record<string, any>>) => {
        const allRows = results.data.filter(row => 
          // Filter out empty rows
          Object.values(row).some(value => value !== null && value !== undefined && String(value).trim() !== '')
        );
        
        resolve({
          headers: results.meta.fields || data.columns || [],
          rows: allRows.slice(0, 5).map(row => 
            Object.entries(row).reduce((acc, [key, value]) => {
              acc[key] = String(value ?? '');
              return acc;
            }, {} as Record<string, string>)
          ),
          totalRows: allRows.length
        });
      },
      error: (error: Papa.ParseError) => reject(error)
    };
    Papa.parse(data.file_content, config);
  });
}