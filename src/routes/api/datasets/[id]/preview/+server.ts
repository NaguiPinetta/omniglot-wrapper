import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createServerSupabaseClient } from '$lib/server/supabase';
import { getDatasetPreview } from '$lib/datasets/api';

export const GET: RequestHandler = async (event) => {
	try {
		const { id: datasetId } = event.params;
		
		// Ensure we have a session before proceeding
		if (!event.locals.session) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}
		
		const client = await createServerSupabaseClient(event);
		
		// Add timeout to prevent hanging requests
		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => reject(new Error('Request timeout')), 10000);
		});
		
		const previewPromise = getDatasetPreview(datasetId, { client });
		
		const preview = await Promise.race([previewPromise, timeoutPromise]);
		
		return json({
			headers: preview.headers,
			rows: preview.rows,
			rowCount: Math.min(preview.rows.length, 5),
			totalRows: preview.totalRows
		});
	} catch (error) {
		console.error('Dataset preview error:', error);
		const errorMessage = error instanceof Error ? error.message : 'Failed to get dataset preview';
		return json({ error: errorMessage }, { status: 500 });
	}
}; 