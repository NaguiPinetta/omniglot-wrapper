import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDatasetPreview } from '../../../../../lib/datasets/api';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const datasetId = params.id;
    
    if (!datasetId) {
      throw error(400, 'Dataset ID is required');
    }

    console.log('=== DATASET PREVIEW API ENDPOINT ===');
    console.log('Dataset ID:', datasetId);

    const preview = await getDatasetPreview(datasetId);
    
    console.log('Preview result:', {
      headers: preview.headers,
      rowCount: preview.rows.length,
      totalRows: preview.totalRows
    });

    // Return the preview rows (not the full preview object)
    return json(preview.rows);
    
  } catch (err) {
    console.error('Dataset preview API error:', err);
    throw error(500, `Failed to get dataset preview: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}; 