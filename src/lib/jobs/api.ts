import { supabase as supabaseClient } from '../auth/client';
import type { Job, JobFormData, JobResult } from '../../types/jobs';
import type { SupabaseClient } from '@supabase/supabase-js';
import { executeAgent } from '../agents/api';
import { getDataset } from '../datasets/api';
import Papa from 'papaparse';
import { XMLParser } from 'fast-xml-parser';
import { getModel, getApiKey } from '../models/api';
import type { Dataset } from '../../types/datasets';
import type { ColumnMapping } from '../../types/jobs';

// Helper function to get current user ID
async function getCurrentUserId(client: SupabaseClient): Promise<string> {
	console.log('Getting current user ID...');
	
	// Try to get user from session first
	const { data: { session }, error: sessionError } = await client.auth.getSession();
	console.log('Session check:', { session: !!session, user: session?.user?.email, error: sessionError });
	
	if (session?.user?.id) {
		console.log('Found user ID from session:', session.user.id);
		return session.user.id;
	}
	
	// Fallback: try to get user directly
	const { data: { user }, error: userError } = await client.auth.getUser();
	console.log('User check:', { user: user?.email, error: userError });
	
	if (user?.id) {
		console.log('Found user ID from getUser:', user.id);
		return user.id;
	}
	
	console.error('Authentication failed - no user found');
	throw new Error('User not authenticated. Please log in again.');
}

// --- Database CRUD Functions ---

export async function getJobs({ client = supabaseClient }: { client?: SupabaseClient } = {}): Promise<Job[]> {
	console.log('=== JOBS API DEBUG START ===');
	console.log('Client type:', client === supabaseClient ? 'supabaseClient' : 'server client');
	
	// Check current user/session
	const { data: { user }, error: userError } = await client.auth.getUser();
	console.log('Current user:', user?.email || 'No user');
	console.log('User error:', userError);
	
	const { data: { session }, error: sessionError } = await client.auth.getSession();
	console.log('Current session:', !!session);
	console.log('Session error:', sessionError);
	
	// Try to get jobs
	const { data, error } = await client
		.from('jobs')
		.select('*')
		.order('created_at', { ascending: false });
	
	console.log('Jobs query result - data:', data);
	console.log('Jobs query result - error:', error);
	console.log('Jobs count:', data?.length || 0);
	
	if (error) {
		console.log('=== JOBS API DEBUG END (ERROR) ===');
		throw error;
	}
	
	console.log('=== JOBS API DEBUG END ===');
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
			user_id: await getCurrentUserId(client),
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
	// Process job in the background (fire and forget) with error handling
	processJobInBackground(id, { client }).catch(error => {
		console.error(`Background processing failed for job ${id}:`, error);
		// Mark job as failed if background processing fails
		updateJob(id, {
			status: 'failed',
			completed_at: new Date().toISOString(),
			error: error instanceof Error ? error.message : 'Background processing failed'
		}, { client }).catch(updateError => {
			console.error(`Failed to update job ${id} status after background processing failure:`, updateError);
		});
	});

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

		// Get glossary entries if glossary_id is specified and usage mode is not 'ignore'
		let glossaryEntries: any[] = [];
		if (job.glossary_id && job.glossary_usage_mode !== 'ignore') {
			console.log('Fetching glossary entries for module:', job.glossary_id);
			console.log('Target language for filtering:', job.target_language);
			
			const { data: entries, error } = await client
				.from('glossary')
				.select('term, translation, language, context, note, type, description')
				.eq('module_id', job.glossary_id);
			
			if (error) {
				console.error('Error fetching glossary entries:', error);
			} else {
				const allEntries = entries || [];
				// Filter glossary entries to match target language
				glossaryEntries = allEntries.filter(entry => 
					!entry.language || 
					entry.language === job.target_language || 
					entry.language === 'all' ||
					entry.language === '*'
				);
				
				console.log(`Loaded ${allEntries.length} total entries, filtered to ${glossaryEntries.length} entries matching target language '${job.target_language}'`);
				if (glossaryEntries.length > 0) {
					console.log('Filtered glossary entries:', glossaryEntries.map(e => `${e.term} → ${e.translation}`));
				}
			}
		}

		// Process the dataset and perform translations
		console.log('Starting actual translation processing...');
		
		// Determine file type and parse content accordingly
		let allRows: Record<string, string>[] = [];
		let isXmlDataset = false;
		
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
			// Parse CSV content
			const Papa = await import('papaparse');
			const parsed = Papa.parse(dataset.file_content, { header: true });
			const originalRows = (parsed.data as Record<string, string>[]).filter(row =>
				Object.values(row).some(value => value !== null && value !== undefined && String(value).trim() !== '')
			);
			allRows = originalRows;
		}

		const totalRows = allRows.length;
		let processedCount = 0;
		let skippedRows: any[] = [];
		let completedRows: any[] = [];
		let totalTokens = 0;
		let totalCost = 0;

		const columnMapping = job.column_mapping || { source_text_column: '' };
		const targetLang = job.target_language;
		if (!targetLang) throw new Error('No target language selected for this job.');

		// Update job with total items
		await updateJob(jobId, {
			total_items: totalRows,
			progress: 0
		}, { client });

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
					// Build system prompt with glossary if available
					let systemPrompt = agent.prompt;
					if (glossaryEntries.length > 0) {
						const glossaryText = glossaryEntries
							.map(entry => `${entry.term} → ${entry.translation}${entry.context ? ` (${entry.context})` : ''}`)
							.join('\n');
						systemPrompt += `\n\nGlossary terms to use:\n${glossaryText}`;
					}

					// Prepare messages for translation
					const messages = [
						{
							role: 'system',
							content: systemPrompt
						},
						{
							role: 'user',
							content: `Translate the following text from ${sourceLang} to ${targetLang}:\n\n${sourceText}`
						}
					];

					// Make API call to translation service
					const response = await fetch('/api/chat', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							model: model.name,
							messages: messages,
							api_key: apiKey,
							glossary: glossaryEntries
						})
					});

					if (!response.ok) {
						throw new Error(`Translation API error: ${response.status}`);
					}

					const result = await response.json();
					targetText = result.choices?.[0]?.message?.content || '';
					
					// Estimate tokens and cost (simplified)
					const estimatedTokens = Math.ceil((sourceText.length + targetText.length) / 4);
					totalTokens += estimatedTokens;
					totalCost += estimatedTokens * 0.0001; // Rough estimate

				} catch (translationError) {
					console.error(`Translation failed for row ${i + 1}:`, translationError);
					const skipInfo = {
						row_id: rowId,
						row_number: i + 1,
						reason: `Translation failed: ${translationError.message}`,
						data: row
					};
					skippedRows.push(skipInfo);
					continue;
				}

				// Save translation result
				const translationResult = {
					job_id: jobId,
					row_id: rowId,
					source_text: sourceText,
					target_text: targetText,
					source_language: sourceLang,
					target_language: targetLang,
					status: 'completed',
					confidence: 0.95, // Default confidence
					created_at: new Date().toISOString()
				};

				const { error: insertError } = await client
					.from('translations')
					.insert([translationResult]);

				if (insertError) {
					console.error('Failed to save translation:', insertError);
					const skipInfo = {
						row_id: rowId,
						row_number: i + 1,
						reason: `Database save failed: ${insertError.message}`,
						data: row
					};
					skippedRows.push(skipInfo);
					continue;
				}

				completedRows.push(translationResult);
				processedCount++;

				// Update progress every 10 rows or on last row
				if (processedCount % 10 === 0 || i === totalRows - 1) {
					const progress = Math.round((i + 1) / totalRows * 100);
					await updateJob(jobId, {
						progress: progress,
						processed_items: processedCount,
						failed_items: skippedRows.length,
						total_tokens: totalTokens,
						total_cost: totalCost
					}, { client });
					console.log(`Progress: ${progress}% (${processedCount}/${totalRows} completed, ${skippedRows.length} skipped)`);
				}

			} catch (rowError) {
				console.error(`Error processing row ${i + 1}:`, rowError);
				const skipInfo = {
					row_id: `row_${i + 1}`,
					row_number: i + 1,
					reason: `Processing error: ${rowError.message}`,
					data: allRows[i]
				};
				skippedRows.push(skipInfo);
			}
		}

		// Final job completion
		await updateJob(jobId, {
			status: 'completed',
			progress: 100,
			completed_at: new Date().toISOString(),
			processed_items: processedCount,
			failed_items: skippedRows.length,
			total_tokens: totalTokens,
			total_cost: totalCost,
			skipped_rows: skippedRows.length > 0 ? skippedRows : null
		}, { client });
		
		console.log(`Job ${jobId} completed successfully: ${processedCount} processed, ${skippedRows.length} skipped`);
		
	} catch (error) {
		console.error(`Error processing job ${jobId}:`, error);
		// Mark job as failed
		try {
			await updateJob(jobId, {
				status: 'failed',
				completed_at: new Date().toISOString(),
				error: error instanceof Error ? error.message : 'Unknown error during processing'
			}, { client });
			console.log(`Job ${jobId} marked as failed due to error`);
		} catch (updateError) {
			console.error(`Failed to update job ${jobId} status to failed:`, updateError);
		}
	}
} 