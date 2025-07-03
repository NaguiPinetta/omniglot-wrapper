import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseClient } from '$lib/server/supabase';
import { logger } from '$lib/utils/logger';

export const GET: RequestHandler = async ({ params, url, request }) => {
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

		// Get job details first
		const { data: job, error: jobError } = await supabaseClient
			.from('jobs')
			.select('id, name, status, processed_items, failed_items, dataset_id')
			.eq('id', jobId)
			.single();

		if (jobError) {
			downloadLogger.error('Failed to fetch job:', jobError);
			return json({ error: 'Job not found' }, { status: 404 });
		}

		// Get dataset to determine file type
		const { data: dataset, error: datasetError } = await supabaseClient
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
		const { count: totalCount, error: countError } = await supabaseClient
			.from('translations')
			.select('*', { count: 'exact', head: true })
			.eq('job_id', jobId)
			.eq('status', 'completed');

		if (countError) {
			downloadLogger.error('Failed to count translations:', countError);
			return json({ error: 'Failed to count translations' }, { status: 500 });
		}

		// Get paginated results
		const { data: translations, error: translationsError } = await supabaseClient
			.from('translations')
			.select('*')
			.eq('job_id', jobId)
			.eq('status', 'completed')
			.order('created_at', { ascending: true })
			.range(offset, offset + limit - 1);

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
			
			if (!translations || translations.length === 0) {
				return json({ error: 'No translations found' }, { status: 404 });
			}

			// Create CSV data with proper headers
			const csvData = translations.map(result => ({
				'Row ID': result.row_id || '',
				'Source Text': result.source_text || '',
				'Target Text': result.target_text || '',
				'Source Language': result.source_language || '',
				'Target Language': result.target_language || '',
				'Confidence': result.confidence ? (result.confidence * 100).toFixed(1) + '%' : '95.0%',
				'Status': result.status || 'completed',
				'Created At': result.created_at ? new Date(result.created_at).toLocaleString() : ''
			}));

			const csvContent = Papa.unparse(csvData, { 
				delimiter: ',',
				header: true
			});
			
			// Return CSV with proper headers
			return new Response(csvContent, {
				headers: {
					'Content-Type': 'text/csv',
					'Content-Disposition': `attachment; filename="${job.name || 'job'}_translations_page_${page}.csv"`
				}
			});
		}

		// Return XML format for XML datasets
		if (format === 'xml' && dataset.file_type === 'xml') {
			if (!translations || translations.length === 0) {
				return json({ error: 'No translations found' }, { status: 404 });
			}

			// Build XML content
			const xmlEntries = translations.map(result => {
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