import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createServerSupabaseClient } from '$lib/server/supabase';
import { logger } from '$lib/utils/logger';

export const GET: RequestHandler = async (event) => {
	const { params, url, request } = event;
	const jobId = params.id;
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '1000');
	const format = url.searchParams.get('format') || 'json';
	
	// Validate parameters
	if (!jobId) {
		return json({ error: 'Job ID is required' }, { status: 400 });
	}
	
	if (page < 1) {
		return json({ error: 'Page must be >= 1' }, { status: 400 });
	}
	
	if (limit < 1 || limit > 5000) {
		return json({ error: 'Limit must be between 1 and 5000' }, { status: 400 });
	}

	try {
		const downloadLogger = logger.scope('JobDownload');
		downloadLogger.debug('Paginated download request:', { jobId, page, limit, format });

		// Create supabase client
		const supabase = await createServerSupabaseClient(event);

		// Get job details first, including column_mapping and target_language
		const { data: job, error: jobError } = await supabase
			.from('jobs')
			.select('id, name, status, processed_items, failed_items, dataset_id, target_language, column_mapping')
			.eq('id', jobId)
			.single();

		if (jobError) {
			downloadLogger.error('Failed to fetch job:', jobError);
			return json({ error: 'Job not found' }, { status: 404 });
		}

		// Get dataset to determine file type
		const { data: dataset, error: datasetError } = await supabase
			.from('datasets')
			.select('file_type, file_name')
			.eq('id', job.dataset_id)
			.single();

		if (datasetError) {
			downloadLogger.error('Failed to fetch dataset:', datasetError);
			return json({ error: 'Dataset not found' }, { status: 404 });
		}

		// Calculate pagination
		const offset = (page - 1) * limit;
		
		// Get total count first
		const { count: totalCount, error: countError } = await supabase
			.from('translations')
			.select('*', { count: 'exact', head: true })
			.eq('job_id', jobId)
			.eq('status', 'completed');

		if (countError) {
			downloadLogger.error('Failed to count translations:', countError);
			return json({ error: 'Failed to count translations' }, { status: 500 });
		}

		// Get translations: paginated for JSON/XML, ALL for CSV
		let translations, translationsError;
		if (format === 'csv') {
			const result = await supabase
				.from('translations')
				.select('*')
				.eq('job_id', jobId)
				.eq('status', 'completed')
				.order('created_at', { ascending: true })
				.limit(10000); // adjust as needed for your max expected job size
			translations = result.data;
			translationsError = result.error;
		} else {
			const result = await supabase
				.from('translations')
				.select('*')
				.eq('job_id', jobId)
				.eq('status', 'completed')
				.order('created_at', { ascending: true })
				.range(offset, offset + limit - 1);
			translations = result.data;
			translationsError = result.error;
		}

		if (translationsError) {
			downloadLogger.error('Failed to fetch translations:', translationsError);
			return json({ error: 'Failed to fetch translations' }, { status: 500 });
		}

		const totalPages = Math.ceil((totalCount || 0) / limit);
		const hasMore = page < totalPages;

		downloadLogger.debug('Paginated results:', {
			jobId,
			page,
			limit,
			offset,
			totalCount,
			totalPages,
			resultCount: translations?.length || 0,
			hasMore
		});

		// Return JSON format for pagination metadata
		if (format === 'json') {
			return json({
				job: {
					id: job.id,
					name: job.name,
					status: job.status,
					processed_items: job.processed_items,
					failed_items: job.failed_items
				},
				dataset: {
					file_type: dataset.file_type,
					file_name: dataset.file_name
				},
				pagination: {
					page,
					limit,
					total_count: totalCount || 0,
					total_pages: totalPages,
					has_more: hasMore
				},
				translations: translations || []
			});
		}

		// Return CSV format for direct download
		if (format === 'csv') {
			const Papa = (await import('papaparse')).default;

			// Fetch the full dataset row content (CSV) for this dataset
			const { data: datasetFull, error: datasetFullError } = await supabase
				.from('datasets')
				.select('file_content, columns')
				.eq('id', job.dataset_id)
				.single();

			if (datasetFullError || !datasetFull?.file_content) {
				logger.error('CSV Download: Failed to fetch original dataset content', { datasetFullError });
				return json({ error: 'Failed to fetch original dataset content' }, { status: 500 });
			}

			// Parse the original CSV rows
			const parsed = Papa.parse(datasetFull.file_content, { header: true });
			const originalRows: Record<string, any>[] = parsed.data.filter((row: any) => Object.values(row).some(v => v !== null && v !== undefined && String(v).trim() !== ''));
			const originalHeaders: string[] = parsed.meta.fields || datasetFull.columns || [];

			// Determine join key from job.column_mapping
			const mapping = job.column_mapping || {};
			const sourceTextCol = mapping.source_text_column || originalHeaders[0];
			const rowIdCol = mapping.row_id_column && mapping.row_id_column.trim() !== '' ? mapping.row_id_column : null;
			const joinKeyCol = rowIdCol || sourceTextCol;

			// Build a map of translations by join key for fast lookup
			const translationMap = new Map<string, any>();
			for (const t of translations || []) {
				const key = rowIdCol ? t.row_id : t.source_text;
				if (key !== undefined && key !== null) {
					translationMap.set(String(key).trim(), t);
				}
			}

			// Determine the target language code for the new column
			const targetLang = job.target_language || 'translated';
			const outputHeaders = [...originalHeaders, targetLang];

			// Build the output rows
			const outputRows = originalRows.map((row) => {
				const joinKey = row[joinKeyCol] !== undefined && row[joinKeyCol] !== null
					? String(row[joinKeyCol]).trim()
					: undefined;
				const translation = joinKey ? translationMap.get(joinKey) : undefined;
				if (!translation && process.env.NODE_ENV === 'development') {
					logger.warn('CSV Download: No translation found for row', { joinKeyCol, joinKey, row });
				}
				return {
					...row,
					[targetLang]: translation ? translation.target_text : ''
				};
			});

			const csvContent = Papa.unparse(outputRows, {
				delimiter: ',',
				header: true,
				columns: outputHeaders
			});

			// Return CSV with proper headers
			return new Response(csvContent, {
				headers: {
					'Content-Type': 'text/csv',
					'Content-Disposition': `attachment; filename="${job.name || 'job'}_translations.csv"`
				}
			});
		}

		// Return XML format for XML datasets
		if (format === 'xml' && dataset.file_type === 'xml') {
			if (!translations || translations.length === 0) {
				return json({ error: 'No translations found' }, { status: 404 });
			}

			// Build XML content
			const xmlEntries = translations.map((result: any) => {
				const rowId = result.row_id || '';
				const targetText = result.target_text || '';
				return `    <ResourceEntry ID="${rowId}" Value="${targetText.replace(/"/g, '&quot;')}" />`;
			}).join('\n');

			const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<wGlnWirelessResourceDocument>
${xmlEntries}
</wGlnWirelessResourceDocument>`;

			return new Response(xmlContent, {
				headers: {
					'Content-Type': 'application/xml',
					'Content-Disposition': `attachment; filename="${job.name || 'job'}_translations_page_${page}.xml"`
				}
			});
		}

		return json({ error: 'Unsupported format' }, { status: 400 });

	} catch (error: any) {
		logger.error('Download API error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}; 