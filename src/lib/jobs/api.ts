import { supabaseClient } from '../supabaseClient';
import type { Job, JobFormData, JobResult } from '../../types/jobs';
import type { SupabaseClient } from '@supabase/supabase-js';
import { executeAgent } from '../agents/api';
import { getDataset } from '../datasets/api';
import Papa from 'papaparse';
import { XMLParser } from 'fast-xml-parser';
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
	const { data, error } = await client.from('translations')
		.select('*')
		.eq('job_id', jobId)
		.order('created_at', { ascending: true })
		.range(0, 5999); // Fetch up to 6000 rows
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

		// Determine file type and parse content accordingly
		let allRows: Record<string, string>[] = [];
		let isXmlDataset = false;
		let originalRows: Record<string, string>[] = [];
		
		// Detect file type from dataset
		if (dataset.file_type === 'xml' || (dataset.file_name && dataset.file_name.toLowerCase().endsWith('.xml'))) {
			isXmlDataset = true;
		}

		if (isXmlDataset && dataset.file_content) {
			// Parse XML content
			const parser = new XMLParser({ ignoreAttributes: false });
			const xml = parser.parse(dataset.file_content);
			let rows: { key: string, value: string }[] = [];
			if (xml.wGlnWirelessResourceDocument && xml.wGlnWirelessResourceDocument.ResourceEntry) {
				const entries = Array.isArray(xml.wGlnWirelessResourceDocument.ResourceEntry)
					? xml.wGlnWirelessResourceDocument.ResourceEntry
					: [xml.wGlnWirelessResourceDocument.ResourceEntry];
				rows = entries.map((entry: any) => ({
					key: entry['@_ID'] || '',
					value: entry['@_Value'] || ''
				}));
			} else if (xml.root?.data) {
				// Fallback to previous logic
				const dataArray = Array.isArray(xml.root.data) ? xml.root.data : [xml.root.data].filter(Boolean);
				rows = (dataArray || []).map((entry: any) => ({
					key: entry['@_name'] || '',
					value: entry.value || ''
				}));
			}
			console.log('[DEBUG] Parsed XML rows:', rows);
			allRows = rows;
		} else if (dataset.file_content) {
			const parsed = Papa.parse(dataset.file_content, { header: true });
			originalRows = (parsed.data as Record<string, string>[]).filter(row =>
				Object.values(row).some(value => value !== null && value !== undefined && String(value).trim() !== '')
			);
			allRows = originalRows;
			// Store original headers and delimiter for export
			var originalHeaders = parsed.meta.fields || [];
			var originalDelimiter = parsed.meta.delimiter || ',';
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
				
				// Handle XML vs CSV differently for source text extraction
				let sourceText: string;
				let rowId: string;
				let sourceLang: string;
				
				if (isXmlDataset) {
					// For XML, use 'value' column as source text and 'key' as row ID
					sourceText = row.value || '';
					rowId = row.key || `xml_entry_${i + 1}`;
					sourceLang = job.source_language || 'en';
					console.log(`[DEBUG] XML row ${i}: rowId=${rowId}, sourceText='${sourceText}'`);
				} else {
					// For CSV, use column mapping
					sourceText = columnMapping.source_text_column ? (row[columnMapping.source_text_column] || '') : '';
					rowId = columnMapping.row_id_column ? row[columnMapping.row_id_column] : `row_${i + 1}`;
					sourceLang = columnMapping.source_language_column ? row[columnMapping.source_language_column] : (job.source_language || 'en');
				}

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
				if (isXmlDataset) {
					// For XML, add translated value
					row[`translated_${targetLang}`] = targetText;
				} else {
					// For CSV, retain all original columns and append 'Translated Text'
					let translatedText = targetText;
					if (!translatedText || translatedText.trim() === '') {
						translatedText = skippedRows.some(s => s.row_id === rowId) ? 'ERROR' : '';
					}
					completedRows.push({
						...originalRows[i],
						'Translated Text': translatedText
					});
				}
				
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
				
				// Update progress
				await updateJob(jobId, { 
					processed_items: processedCount, 
					progress: Math.round((processedCount / totalRows) * 100)
				}, { client });

			} catch (error) {
				const rowId = isXmlDataset ? 
					(allRows[i].key || `xml_entry_${i + 1}`) : 
					(columnMapping.row_id_column ? allRows[i][columnMapping.row_id_column] : `row_${i + 1}`);
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

		// After processing all rows, store completedRows for CSV jobs
		if (!isXmlDataset && dataset.file_content) {
			const parsed = Papa.parse(dataset.file_content, { header: true });
			const originalRows = parsed.data as Record<string, string>[];
			allRows = originalRows;
			for (let i = 0; i < originalRows.length; i++) {
				const row = originalRows[i];
				let sourceText = columnMapping.source_text_column ? (row[columnMapping.source_text_column] || '') : '';
				let rowId = columnMapping.row_id_column ? row[columnMapping.row_id_column] : `row_${i + 1}`;
				let sourceLang = columnMapping.source_language_column ? row[columnMapping.source_language_column] : (job.source_language || 'en');
				let translatedText = '';
				let skipReason = '';
				if (!sourceText || sourceText.trim() === '') {
					skipReason = 'Empty source text';
					skippedRows.push({ row_id: rowId, row_number: i + 1, reason: skipReason, data: row });
				} else {
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
						translatedText = data.choices?.[0]?.message?.content || data.content || '';
						// Track token usage, cost, etc. (existing logic)
					} catch (error) {
						skipReason = error instanceof Error ? error.message : 'Unknown error';
						skippedRows.push({ row_id: rowId, row_number: i + 1, reason: skipReason, data: row });
						translatedText = '';
					}
				}
				// Always push a row for every original row, preserving order
				completedRows.push({
					...row,
					'Translated Text': translatedText || (skipReason ? 'ERROR' : '')
				});
			}
			// Add logging for debugging completedRows saving
			try {
				console.log('About to save completedRows:', completedRows.length, completedRows[0]);
				await updateJob(jobId, { completed_rows: completedRows }, { client });
				console.log('Saved completedRows successfully');
			} catch (err) {
				console.error('Failed to save completedRows:', err);
			}
		}
	} catch (error) {
		console.error('Job processing failed:', error);
		await updateJob(jobId, {
			status: 'failed',
			error: error instanceof Error ? error.message : 'Unknown error',
			completed_at: new Date().toISOString()
		}, { client });
	}
} 