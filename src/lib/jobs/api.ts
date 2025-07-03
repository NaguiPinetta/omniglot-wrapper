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
import pLimit from 'p-limit';
import { createApiLogger } from '../utils/logger';
import { fetchWithTimeout } from '$lib/utils/fetchWithTimeout';

const logger = createApiLogger('JobsAPI');

// Helper function to mark jobs as failed with clear error messages
export async function markJobFailed(
	jobId: string, 
	errorMessage: string, 
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<void> {
	logger.error(`Marking job ${jobId} as failed: ${errorMessage}`);
	try {
		await client
			.from('jobs')
			.update({
				status: 'failed',
				error: errorMessage,
				completed_at: new Date().toISOString(),
			})
			.eq('id', jobId);
	} catch (updateError) {
		logger.error(`Failed to update job ${jobId} status to failed:`, updateError);
	}
}

// Helper function to get current user ID
async function getCurrentUserId(client: SupabaseClient): Promise<string> {
	logger.debug('Getting current user ID...');
	
	// Try to get user from session first
	const { data: { session }, error: sessionError } = await client.auth.getSession();
	logger.debug('Session check', { hasSession: !!session, user: session?.user?.email, error: sessionError });
	
	if (session?.user?.id) {
		logger.debug('Found user ID from session', { userId: session.user.id });
		return session.user.id;
	}
	
	// Fallback: try to get user directly
	const { data: { user }, error: userError } = await client.auth.getUser();
	logger.debug('User check', { user: user?.email, error: userError });
	
	if (user?.id) {
		logger.debug('Found user ID from getUser', { userId: user.id });
		return user.id;
	}
	
	logger.error('Authentication failed - no user found');
	throw new Error('User not authenticated. Please log in again.');
}

// --- Database CRUD Functions ---

export async function getJobs({ client = supabaseClient }: { client?: SupabaseClient } = {}): Promise<Job[]> {
	logger.debug('=== JOBS API DEBUG START ===');
	logger.debug('Client type:', client === supabaseClient ? 'supabaseClient' : 'server client');
	
	// Check current user/session
	const { data: { user }, error: userError } = await client.auth.getUser();
	logger.debug('Current user:', user?.email || 'No user');
	logger.debug('User error:', userError);
	
	const { data: { session }, error: sessionError } = await client.auth.getSession();
	logger.debug('Current session:', !!session);
	logger.debug('Session error:', sessionError);
	
	// Try to get jobs
	const { data, error } = await client
		.from('jobs')
		.select('*')
		.order('created_at', { ascending: false });
	
	logger.debug('Jobs query result - data:', data);
	logger.debug('Jobs query result - error:', error);
	logger.debug('Jobs count:', data?.length || 0);
	
	if (error) {
		logger.debug('=== JOBS API DEBUG END (ERROR) ===');
		throw error;
	}
	
	logger.debug('=== JOBS API DEBUG END ===');
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
	logger.debug('createJob called with:', jobData);
	
	try {
		// Get dataset to determine total_items
		const dataset = await getDataset(jobData.dataset_id, { client });
		logger.debug('Dataset retrieved:', dataset);
		
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
		// Store glossary usage mode if provided (make optional for backward compatibility)
		if (jobData.glossary_usage_mode) {
			(job as any).glossary_usage_mode = jobData.glossary_usage_mode;
		}

		logger.debug('Job object to insert:', job);
		const { data, error } = await client.from('jobs').insert([job]).select().single();
		logger.debug('Insert result - data:', data);
		logger.debug('Insert result - error:', error);
		
		if (error) {
			logger.error('Database insertion failed:', {
				message: error.message,
				details: error.details,
				hint: error.hint,
				code: error.code
			});
			throw new Error(`Failed to create job: ${error.message} (${error.code})`);
		}
		
		return data;
	} catch (error) {
		logger.error('createJob error:', error);
		throw error;
	}
}

export async function updateJob(
	id: string,
	updates: Partial<Job>,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<Job> {
	logger.debug('updateJob called with:', { id, updates });
	const { data, error } = await client.from('jobs').update(updates).eq('id', id).select().single();
	logger.debug('updateJob result:', { data, error });
	if (error) {
		logger.error('updateJob error details:', error);
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
	// Remove the arbitrary range limit and fetch all results
	const { data, error } = await client.from('translations')
		.select('*')
		.eq('job_id', jobId)
		.order('created_at', { ascending: true });
	if (error) throw error;
	return data ?? [];
}

// New function for paginated fetching of large job results
export async function getJobResultsPaginated(
	jobId: string,
	{ client = supabaseClient, pageSize = 1000 }: { client?: SupabaseClient, pageSize?: number } = {}
): Promise<JobResult[]> {
	const paginatedLogger = logger.scope('PaginatedResults');
	
	paginatedLogger.debug(`Fetching paginated results for job ${jobId} with page size ${pageSize}`);
	
	// Get total count first - don't filter by status to get all translations
	const { count: totalCount, error: countError } = await client
		.from('translations')
		.select('*', { count: 'exact', head: true })
		.eq('job_id', jobId);

	if (countError) {
		paginatedLogger.error('Failed to count translations:', countError);
		throw countError;
	}

	if (!totalCount || totalCount === 0) {
		paginatedLogger.debug('No translations found for job', jobId);
		return [];
	}

	paginatedLogger.debug(`Found ${totalCount} translations for job ${jobId}`);

	// If total count is small, fetch all at once
	if (totalCount <= pageSize) {
		const { data, error } = await client
			.from('translations')
			.select('*')
			.eq('job_id', jobId)
			.order('created_at', { ascending: true });
		
		if (error) throw error;
		return data ?? [];
	}

	// For large datasets, fetch in chunks
	const allResults: JobResult[] = [];
	const totalPages = Math.ceil(totalCount / pageSize);
	
	paginatedLogger.debug(`Fetching ${totalPages} pages of results for job ${jobId}`);

	for (let page = 0; page < totalPages; page++) {
		const offset = page * pageSize;
		const limit = Math.min(pageSize, totalCount - offset);
		
		paginatedLogger.debug(`Fetching page ${page + 1}/${totalPages} (offset: ${offset}, limit: ${limit})`);
		
		const { data, error } = await client
			.from('translations')
			.select('*')
			.eq('job_id', jobId)
			.order('created_at', { ascending: true })
			.range(offset, offset + limit - 1);

		if (error) {
			paginatedLogger.error(`Failed to fetch page ${page + 1}:`, error);
			throw error;
		}

		if (data && data.length > 0) {
			allResults.push(...data);
			paginatedLogger.debug(`Added ${data.length} results from page ${page + 1}. Total so far: ${allResults.length}`);
		}
	}

	paginatedLogger.debug(`Completed paginated fetch for job ${jobId}: ${allResults.length} total results`);
	return allResults;
}

// Helper function to get complete job results for download
export async function getCompleteJobResults(
	jobId: string,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<JobResult[]> {
	const downloadLogger = logger.scope('CompleteResults');
	
	try {
		// First, try to get job info to check size
		const { data: job, error: jobError } = await client
			.from('jobs')
			.select('processed_items, total_items')
			.eq('id', jobId)
			.single();

		if (jobError) {
			downloadLogger.warn('Could not fetch job info, using paginated fetch:', jobError);
			return await getJobResultsPaginated(jobId, { client, pageSize: 1000 });
		}

		const processedItems = job.processed_items || 0;
		downloadLogger.debug(`Job ${jobId} has ${processedItems} processed items`);

		// Always use paginated fetch for jobs with more than 100 items to ensure we get all results
		if (processedItems > 100) {
			downloadLogger.debug(`Using paginated fetch for job ${jobId} with ${processedItems} items`);
			return await getJobResultsPaginated(jobId, { client, pageSize: 1000 });
		} else {
			downloadLogger.debug(`Using standard fetch for small job ${jobId}`);
			return await getJobResults(jobId, { client });
		}
	} catch (error) {
		downloadLogger.error(`Error in getCompleteJobResults for job ${jobId}:`, error);
		// Fallback to paginated fetch
		downloadLogger.debug('Falling back to paginated fetch');
		return await getJobResultsPaginated(jobId, { client, pageSize: 1000 });
	}
}

// Diagnostic function to help debug translation issues
export async function diagnoseJobResults(
	jobId: string,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<void> {
	const diagLogger = logger.scope('JobDiagnostics');
	
	try {
		// Get job info
		const { data: job, error: jobError } = await client
			.from('jobs')
			.select('*')
			.eq('id', jobId)
			.single();

		if (jobError) {
			diagLogger.error('Failed to fetch job:', jobError);
			return;
		}

		// Get translation counts by status
		const { data: statusCounts, error: statusError } = await client
			.from('translations')
			.select('status')
			.eq('job_id', jobId);

		if (statusError) {
			diagLogger.error('Failed to fetch translation statuses:', statusError);
			return;
		}

		const statusBreakdown = statusCounts?.reduce((acc, t) => {
			acc[t.status] = (acc[t.status] || 0) + 1;
			return acc;
		}, {} as Record<string, number>) || {};

		// Get total count
		const { count: totalCount } = await client
			.from('translations')
			.select('*', { count: 'exact', head: true })
			.eq('job_id', jobId);

		diagLogger.info(`Job ${jobId} diagnostics:`, {
			jobStatus: job.status,
			processedItems: job.processed_items,
			failedItems: job.failed_items,
			totalItems: job.total_items,
			actualTranslationsCount: totalCount,
			statusBreakdown,
			discrepancy: job.processed_items - (totalCount || 0)
		});

		// Sample a few translations to check their content
		const { data: sampleTranslations } = await client
			.from('translations')
			.select('id, row_id, status, source_text, target_text, created_at')
			.eq('job_id', jobId)
			.limit(5);

		diagLogger.debug('Sample translations:', sampleTranslations);

	} catch (error) {
		diagLogger.error('Diagnostic failed:', error);
	}
}

// --- Job Execution Logic ---

export async function startJob(
	id: string,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<Job> {
	logger.debug('startJob called with id:', id);
	const job = await getJob(id, { client });
	logger.debug('Retrieved job:', job);
	
	if (job.status !== 'pending' && job.status !== 'queued') {
		const error = `Job is not in pending or queued status. Current status: ${job.status}`;
		logger.error(error);
		throw new Error(error);
	}

	logger.debug('Updating job status to running...');
	const updatedJob = await updateJob(id, {
		status: 'running',
		started_at: new Date().toISOString()
	}, { client });
	logger.debug('Job status updated:', updatedJob);

	// Start processing in background
	logger.debug('Starting background processing...');
	processJobInBackground(id, { client })
		.then(() => logger.debug(`Background processing completed for job ${id}`))
		.catch(error => logger.error(`Background processing failed for job ${id}:`, error));

	return updatedJob;
}

export async function cancelJob(
	id: string,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<Job> {
	const updatedJob = await updateJob(id, {
		status: 'cancelled',
		completed_at: new Date().toISOString()
	}, { client });
	return updatedJob;
}

async function processJobInBackground(
	jobId: string,
	{ client = supabaseClient, debug = false }: { client?: SupabaseClient, debug?: boolean } = {}
) {
	logger.debug(`Starting background processing for job ${jobId}`);
	try {
		// Defensive check: Get job with validation
		let job;
		try {
			job = await getJob(jobId, { client });
			logger.debug('Job retrieved for processing:', job);
		} catch (error) {
			logger.error(`Failed to retrieve job ${jobId}:`, error);
			throw new Error(`Job ${jobId} not found or access denied`);
		}
		
		// Defensive check: Get dataset with validation
		let dataset;
		try {
			dataset = await getDataset(job.dataset_id, { client });
			logger.debug('Dataset retrieved:', dataset);
		} catch (error) {
			logger.error(`Failed to retrieve dataset ${job.dataset_id}:`, error);
			await markJobFailed(jobId, `Dataset ${job.dataset_id} not found or access denied`, { client });
			return;
		}
		
		// Defensive check: Get agent with validation
		const { getAgent } = await import('../agents/api');
		let agent;
		try {
			agent = await getAgent(job.agent_id, { client });
			logger.debug('Agent retrieved:', agent);
		} catch (error) {
			logger.error(`Failed to retrieve agent ${job.agent_id}:`, error);
			await markJobFailed(jobId, `Agent ${job.agent_id} not found or access denied`, { client });
			return;
		}
		
		// Defensive check: Get model with validation
		let model;
		try {
			model = await getModel(agent.model_id, { client });
			logger.debug('Model retrieved:', model);
		} catch (error) {
			logger.error(`Failed to retrieve model ${agent.model_id}:`, error);
			await markJobFailed(jobId, `Model ${agent.model_id} not found or access denied`, { client });
			return;
		}

		// Get the API key by model.api_key_id
		let apiKey = undefined;
		if (model.api_key_id) {
			const apiKeyObj = await getApiKey(model.api_key_id, { client });
			apiKey = apiKeyObj?.key_value;
		}

		// Get glossary entries if glossary_id is specified and usage mode is not 'ignore'
		let glossaryEntries: any[] = [];
		if (job.glossary_id && job.glossary_usage_mode !== 'ignore') {
			logger.debug('Fetching glossary entries for module:', job.glossary_id);
			logger.debug('Target language for filtering:', job.target_language);
			
			const { data: entries, error } = await client
				.from('glossary')
				.select('term, translation, language, context, note, type, description')
				.eq('module_id', job.glossary_id);
			
			if (error) {
				logger.error('Error fetching glossary entries:', error);
			} else {
				const allEntries = entries || [];
				// Filter glossary entries to match target language
				glossaryEntries = allEntries.filter(entry => 
					!entry.language || 
					entry.language === job.target_language || 
					entry.language === 'all' ||
					entry.language === '*'
				);
				
				logger.debug(`Loaded ${allEntries.length} total entries, filtered to ${glossaryEntries.length} entries matching target language '${job.target_language}'`);
				if (glossaryEntries.length > 0) {
					logger.debug('Filtered glossary entries:', glossaryEntries.map(e => `${e.term} → ${e.translation}`));
				}
			}
		}

		// Process the dataset and perform translations
		logger.debug('Starting actual translation processing...');
		
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
			logger.debug('[DEBUG] Parsed XML rows:', rows);
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

		// Create concurrency limiter (max 5 concurrent requests)
		const limit = pLimit(5);
		
		// Helper function for exponential backoff retry
		async function retryWithBackoff<T>(
			fn: () => Promise<T>,
			maxRetries: number = 3,
			baseDelay: number = 1000
		): Promise<T> {
			for (let attempt = 0; attempt <= maxRetries; attempt++) {
				try {
					return await fn();
				} catch (error: any) {
					const isRateLimit = error.message?.includes('rate limit') || 
									   error.message?.includes('429') ||
									   error.message?.includes('Too Many Requests');
					
					if (attempt === maxRetries || !isRateLimit) {
						throw error;
					}
					
					// Exponential backoff with jitter
					const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
					logger.debug(`Rate limit hit, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
					await new Promise(resolve => setTimeout(resolve, delay));
				}
			}
			throw new Error('Max retries exceeded');
		}

		// Process translations with concurrency
		const translateRow = async (row: any, index: number) => {
			// Check if job was cancelled
			const currentJob = await getJob(jobId, { client });
			if (currentJob.status === 'cancelled') {
				throw new Error('Job was cancelled');
			}

			// Handle XML vs CSV differently for source text extraction
			let sourceText: string;
			let rowId: string;
			let sourceLang: string;
			
			if (isXmlDataset) {
				// For XML, use 'value' column as source text and 'key' as row ID
				sourceText = row.value || '';
				rowId = row.key || `xml_entry_${index + 1}`;
				sourceLang = job.source_language || 'en';
			} else {
				// For CSV, use column mapping
				sourceText = columnMapping.source_text_column ? (row[columnMapping.source_text_column] || '') : '';
				rowId = columnMapping.row_id_column ? row[columnMapping.row_id_column] : `row_${index + 1}`;
				sourceLang = columnMapping.source_language_column ? row[columnMapping.source_language_column] : (job.source_language || 'en');
			}

			if (!sourceText || sourceText.trim() === '') {
				return {
					type: 'skip',
					skipInfo: {
						row_id: rowId,
						row_number: index + 1,
						reason: 'Empty source text',
						data: row
					}
				};
			}

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

			// Translation with retry logic
			const targetText = await retryWithBackoff(async () => {
				const response = await fetchWithTimeout('/api/chat', {
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
				}, 30000); // 30s timeout

				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(`Translation API error: ${response.status} - ${errorText}`);
				}

				const result = await response.json();
				return result.choices?.[0]?.message?.content || '';
			});

			// Estimate tokens and cost (simplified)
			const estimatedTokens = Math.ceil((sourceText.length + targetText.length) / 4);

			return {
				type: 'success',
				result: {
					job_id: jobId,
					row_id: rowId,
					source_text: sourceText,
					target_text: targetText,
					source_language: sourceLang,
					target_language: targetLang,
					status: 'completed',
					confidence: 0.95,
					created_at: new Date().toISOString()
				},
				tokens: estimatedTokens,
				cost: estimatedTokens * 0.0001
			};
		};

		// Process rows in batches with concurrency
		const BATCH_SIZE = 10;
		let currentBatch = 0;
		
		for (let batchStart = 0; batchStart < totalRows; batchStart += BATCH_SIZE) {
			const batchEnd = Math.min(batchStart + BATCH_SIZE, totalRows);
			const batch = allRows.slice(batchStart, batchEnd);
			currentBatch++;
			
			logger.debug(`Processing batch ${currentBatch} (rows ${batchStart + 1}-${batchEnd})`);
			logger.debug(`Starting batch ${currentBatch} processing...`);

			try {
				// Process batch with concurrency
				const batchPromises = batch.map((row, batchIndex) => 
					limit(() => translateRow(row, batchStart + batchIndex))
				);

				const batchResults = await Promise.allSettled(batchPromises);
				
				// Separate successful translations and skipped rows
				const batchTranslations: any[] = [];
				const batchSkipped: any[] = [];
				let batchTokens = 0;
				let batchCost = 0;

				batchResults.forEach((result, batchIndex) => {
					if (result.status === 'fulfilled') {
						if (result.value.type === 'success') {
							batchTranslations.push(result.value.result);
							batchTokens += result.value.tokens || 0;
							batchCost += result.value.cost || 0;
						} else if (result.value.type === 'skip') {
							batchSkipped.push(result.value.skipInfo);
						}
					} else {
						// Handle rejected promises
						const rowIndex = batchStart + batchIndex;
						logger.error(`Translation failed for row ${rowIndex + 1}:`, result.reason);
						batchSkipped.push({
							row_id: `row_${rowIndex + 1}`,
							row_number: rowIndex + 1,
							reason: `Translation failed: ${result.reason}`,
							data: batch[batchIndex]
						});
					}
				});

				// Defensive database insert for successful translations
				if (batchTranslations.length > 0) {
					logger.debug(`Attempting to insert ${batchTranslations.length} translations for job ${jobId}`);
					const { data: insertedData, error: insertError } = await client
						.from('translations')
						.insert(batchTranslations)
						.select('id, row_id');

					if (insertError) {
						logger.error('Batch database insert failed:', insertError);
						logger.error('Failed batch details:', {
							jobId,
							batchSize: batchTranslations.length,
							batchStart,
							batchEnd,
							sampleTranslations: batchTranslations.slice(0, 3).map(t => ({
								row_id: t.row_id,
								source_text: t.source_text?.substring(0, 100) + '...',
								target_text: t.target_text?.substring(0, 100) + '...'
							}))
						});
						
						// Mark all translations in this batch as failed
						batchTranslations.forEach((translation, index) => {
							batchSkipped.push({
								row_id: translation.row_id,
								row_number: batchStart + index + 1,
								reason: `Database insert failed: ${insertError.message}`,
								data: {
									source_text: translation.source_text?.substring(0, 200),
									target_text: translation.target_text?.substring(0, 200),
									...batch[index]
								}
							});
						});
					} else {
						// Only increment processed_items if insert succeeded
						const actualInsertedCount = insertedData?.length || batchTranslations.length;
						completedRows.push(...batchTranslations);
						processedCount += actualInsertedCount;
						
						logger.debug(`Successfully inserted ${actualInsertedCount} translations for job ${jobId}`);
						
						// Verify all translations were inserted
						if (actualInsertedCount !== batchTranslations.length) {
							logger.warn(`Insert count mismatch for job ${jobId}: expected ${batchTranslations.length}, got ${actualInsertedCount}`);
						}
					}
				}

				// Add skipped rows
				skippedRows.push(...batchSkipped);
				
				// Update totals
				totalTokens += batchTokens;
				totalCost += batchCost;

				// Update progress after each batch
				const progress = Math.round(batchEnd / totalRows * 100);
				await updateJob(jobId, {
					progress: progress,
					processed_items: processedCount,
					failed_items: skippedRows.length,
					total_tokens: totalTokens,
					total_cost: totalCost
				}, { client });
				
				logger.debug(`Batch ${currentBatch} completed: ${batchTranslations.length} translated, ${batchSkipped.length} skipped`);
				logger.debug(`Overall Progress: ${progress}% (${processedCount}/${totalRows} completed, ${skippedRows.length} skipped)`);

			} catch (batchError) {
				logger.error(`Error processing batch ${currentBatch}:`, batchError);
				
				// Mark entire batch as skipped if there's a batch-level error
				batch.forEach((row, batchIndex) => {
					skippedRows.push({
						row_id: `row_${batchStart + batchIndex + 1}`,
						row_number: batchStart + batchIndex + 1,
						reason: `Batch processing error: ${batchError}`,
						data: row
					});
				});
			}
		}

		// Post-job logging: Compare actual inserted rows with processed_items count
		logger.debug(`Performing post-job verification for job ${jobId}`);
		try {
			const { data: actualTranslations, error: countError } = await client
				.from('translations')
				.select('id', { count: 'exact' })
				.eq('job_id', jobId);
			
			if (countError) {
				logger.error(`Failed to count actual translations for job ${jobId}:`, countError);
			} else {
				const actualInsertedCount = actualTranslations?.length || 0;
				logger.info(`Post-job verification for job ${jobId}:`, {
					processed_items_count: processedCount,
					actual_inserted_count: actualInsertedCount,
					failed_items_count: skippedRows.length,
					total_rows: totalRows,
					discrepancy: processedCount - actualInsertedCount
				});
				
				if (processedCount !== actualInsertedCount) {
					logger.warn(`DISCREPANCY DETECTED for job ${jobId}: processed_items (${processedCount}) != actual_inserted_count (${actualInsertedCount}). Difference: ${processedCount - actualInsertedCount}`);
				}
			}
		} catch (verificationError) {
			logger.error(`Post-job verification failed for job ${jobId}:`, verificationError);
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
			skipped_rows: skippedRows.length > 0 ? skippedRows : undefined
		}, { client });
		
		logger.debug(`Job ${jobId} completed successfully: ${processedCount} processed, ${skippedRows.length} skipped`);
		
	} catch (error: any) {
		logger.error(`Critical error processing job ${jobId}:`, error);
		// Mark job as failed using the helper function
		await markJobFailed(jobId, `Job processing failed: ${error.message}`, { client });
	}
} 
export async function clearJobResults(
	jobId: string,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<void> {
	logger.debug(`Clearing existing results for job ${jobId}`);
	try {
		const { error } = await client
			.from('translations')
			.delete()
			.eq('job_id', jobId);
		
		if (error) {
			logger.error(`Failed to clear results for job ${jobId}:`, error);
			throw error;
		}
		
		logger.debug(`Successfully cleared results for job ${jobId}`);
	} catch (error) {
		logger.error(`Error clearing job results for ${jobId}:`, error);
		throw error;
	}
}
