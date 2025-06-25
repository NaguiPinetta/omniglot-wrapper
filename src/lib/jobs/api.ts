import { supabaseClient } from '../supabaseClient';
import type { Job, JobFormData, JobResult } from '../../types/jobs';
import type { SupabaseClient } from '@supabase/supabase-js';
import { executeAgent } from '../agents/api';
import { getDataset } from '../datasets/api';
import Papa from 'papaparse';
import { getModel, getApiKey } from '../models/api';
import type { Dataset } from '../../types/datasets';
import type { ColumnMapping } from '../../types/jobs';

// --- Database CRUD Functions ---

export async function getJobs({
	client = supabaseClient
}: { client?: SupabaseClient } = {}): Promise<Job[]> {
	const { data, error } = await client.from('jobs').select('*').order('created_at', { ascending: false });
	if (error) throw error;
	return data ?? [];
}

export async function getJob(
	id: string,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<Job> {
	const { data, error } = await client.from('jobs').select('*').eq('id', id).single();
	if (error) throw error;
	return data;
}

export async function createJob(
	jobData: JobFormData,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<Job> {
	console.log('createJob called with:', jobData);
	
	try {
		// Get dataset to determine total_items
		const dataset = await getDataset(jobData.dataset_id, { client });
		console.log('Dataset retrieved:', dataset);
		
		// Create a minimal job object first to test database insertion
		const job = {
			name: jobData.name,
			description: jobData.description,
			agent_id: jobData.agent_id,
			dataset_id: jobData.dataset_id,
			glossary_id: jobData.glossary_id || null,
			status: 'pending' as const,
			progress: 0,
			total_items: dataset.row_count,
			processed_items: 0,
			failed_items: 0,
			started_at: null,
			completed_at: null,
			error: null,
			user_id: 'anonymous', // For now, using anonymous user
			target_language: jobData.target_language
		};

		// Only add language fields if they exist in the database
		if (jobData.source_language) {
			(job as any).source_language = jobData.source_language;
		}
		if (jobData.translation_instructions) {
			(job as any).translation_instructions = jobData.translation_instructions;
		}
		// Store column mapping if provided
		if (jobData.column_mapping) {
			(job as any).column_mapping = jobData.column_mapping;
		}

		console.log('Job object to insert:', job);
		const { data, error } = await client.from('jobs').insert([job]).select().single();
		console.log('Insert result - data:', data);
		console.log('Insert result - error:', error);
		
		if (error) {
			console.error('Database insertion failed:', {
				message: error.message,
				details: error.details,
				hint: error.hint,
				code: error.code
			});
			throw new Error(`Failed to create job: ${error.message} (${error.code})`);
		}
		
		return data;
	} catch (error) {
		console.error('createJob error:', error);
		throw error;
	}
}

export async function updateJob(
	id: string,
	updates: Partial<Job>,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<Job> {
	console.log('updateJob called with:', { id, updates });
	const { data, error } = await client.from('jobs').update(updates).eq('id', id).select().single();
	console.log('updateJob result:', { data, error });
	if (error) {
		console.error('updateJob error details:', error);
		throw error;
	}
	return data;
}

export async function deleteJob(
	id: string,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<void> {
	// Related translations are deleted via cascading delete in Supabase
	const { error } = await client.from('jobs').delete().eq('id', id);
	if (error) throw error;
}

export async function getJobResults(
	jobId: string,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<JobResult[]> {
	const { data, error } = await client.from('translations').select('*').eq('job_id', jobId).order('created_at', { ascending: true });
	if (error) throw error;
	return data ?? [];
}

// --- Job Execution Logic ---

export async function startJob(
	id: string,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<Job> {
	console.log('startJob called with id:', id);
	const job = await getJob(id, { client });
	console.log('Retrieved job:', job);
	
	if (job.status !== 'pending' && job.status !== 'queued') {
		const error = `Job is not in pending or queued status. Current status: ${job.status}`;
		console.error(error);
		throw new Error(error);
	}

	console.log('Updating job status to running...');
	const updatedJob = await updateJob(id, {
		status: 'running',
		started_at: new Date().toISOString()
	}, { client });

	console.log('Job successfully updated to running, starting background processing...');
	// Process job in the background (fire and forget)
	processJobInBackground(id, { client });

	return updatedJob;
}

export async function cancelJob(
	id: string,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<Job> {
	return await updateJob(id, {
		status: 'cancelled',
		completed_at: new Date().toISOString()
	}, { client });
}

async function processJobInBackground(
	jobId: string,
	{ client = supabaseClient, debug = false }: { client?: SupabaseClient, debug?: boolean } = {}
) {
	console.log(`Starting background processing for job ${jobId}`);
	try {
		let job = await getJob(jobId, { client });
		console.log('Job retrieved for processing:', job);

		const dataset = await getDataset(job.dataset_id, { client });
		console.log('Dataset retrieved:', dataset);

		// Get the agent and its prompt
		const { getAgent } = await import('../agents/api');
		const agent = await getAgent(job.agent_id, { client });
		console.log('Agent retrieved:', agent);

		// Get the model by agent.model_id
		const model = await getModel(agent.model_id, { client });
		console.log('Model retrieved:', model);

		// Get the API key by model.api_key_id
		let apiKey = undefined;
		if (model.api_key_id) {
			const apiKeyObj = await getApiKey(model.api_key_id, { client });
			apiKey = apiKeyObj?.key_value;
		}

		// Parse rows from file_content if not present
		let allRows: Record<string, string>[] = [];
		if ('rows' in dataset && Array.isArray((dataset as any).rows)) {
			allRows = (dataset as any).rows;
		} else if (dataset.file_content) {
			// Parse CSV content
			const parsed = Papa.parse(dataset.file_content, { header: true });
			allRows = (parsed.data as Record<string, string>[]).filter(row =>
				Object.values(row).some(value => value !== null && value !== undefined && String(value).trim() !== '')
			);
		}
		const totalRows = allRows.length;
		let processedCount = 0;
		let skippedRows: any[] = [];
		let completedRows: any[] = [];
		let totalTokens = 0;
		let totalCost = 0;

		const columnMapping: ColumnMapping = job.column_mapping || { source_text_column: '' };
		const targetLang = job.target_language;
		if (!targetLang) throw new Error('No target language selected for this job.');

		for (let i = 0; i < totalRows; i++) {
			job = await getJob(jobId, { client });
			if (job.status === 'cancelled') {
				console.log('Job was cancelled, stopping processing');
				break;
			}
			try {
				const row = allRows[i];
				const sourceText = columnMapping.source_text_column ? row[columnMapping.source_text_column] : undefined;
				const rowId = columnMapping.row_id_column ? row[columnMapping.row_id_column] : `row_${i + 1}`;
				const sourceLang = columnMapping.source_language_column ? row[columnMapping.source_language_column] : (job.source_language || 'en');
				if (!sourceText || sourceText.trim() === '') {
					const skipInfo = {
						row_id: rowId,
						row_number: i + 1,
						reason: 'Empty source text',
						data: row
					};
					console.log('Skipping row:', skipInfo);
					skippedRows.push(skipInfo);
					continue;
				}
				let targetText = '';
				try {
					const messages = [
						{ role: 'system', content: agent.prompt },
						{ role: 'user', content: `Translate from ${sourceLang} to ${targetLang}:
${sourceText}` }
					];
					const response = await fetch('/api/chat', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ model: model.name, messages, api_key: apiKey })
					});
					const data = await response.json();
					targetText = data.choices?.[0]?.message?.content || data.content || '';

					// Track token usage
					const tokens = data.usage?.total_tokens || 0;
					totalTokens += tokens;
					// Calculate cost if model has cost per token
					const inputCost = model.input_cost_per_token || 0;
					const outputCost = model.output_cost_per_token || 0;
					const cost = tokens * (inputCost + outputCost);
					totalCost += cost;
				} catch (error) {
					const skipInfo = {
						row_id: rowId,
						row_number: i + 1,
						reason: error instanceof Error ? error.message : 'Unknown error',
						data: row,
						target_language: targetLang
					};
					console.log('Skipping row:', skipInfo);
					skippedRows.push(skipInfo);
					targetText = '';
				}
				// Append translation to the row
				row[`translated_${targetLang}`] = targetText;
				completedRows.push({ ...row, row_id: rowId });

				// Insert translation result into the translations table
				await client.from('translations').insert([
					{
						job_id: jobId,
						source_text: sourceText,
						target_text: targetText,
						source_language: sourceLang,
						target_language: targetLang,
						confidence: 1,
						status: 'completed',
						error: null,
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString(),
						row_id: rowId
					}
				]);
				processedCount++;
			} catch (error) {
				const rowId = columnMapping.row_id_column ? allRows[i][columnMapping.row_id_column] : `row_${i + 1}`;
				const skipInfo = {
					row_id: rowId,
					row_number: i + 1,
					reason: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
					data: allRows[i]
				};
				console.log('Skipping row:', skipInfo);
				skippedRows.push(skipInfo);
				await updateJob(jobId, { failed_items: (job.failed_items || 0) + 1 }, { client });
			}
		}

		// Save the full CSV with all new columns (implementation depends on your CSV export logic)
		// ... existing code to save/export ...

		// Update job status and counts
		await updateJob(jobId, {
			status: 'completed',
			completed_at: new Date().toISOString(),
			processed_items: processedCount,
			failed_items: skippedRows.length,
			progress: Math.round((processedCount / totalRows) * 100),
			total_tokens: totalTokens,
			total_cost: totalCost
		}, { client });
		console.log(`Job ${jobId} marked as completed. Processed: ${processedCount}, Skipped: ${skippedRows.length}`);
	} catch (error) {
		console.error('Job processing failed:', error);
		await updateJob(jobId, {
			status: 'failed',
			error: error instanceof Error ? error.message : 'Unknown error',
			completed_at: new Date().toISOString()
		}, { client });
	}
} 