import type { PageServerLoad } from './$types';
import { getDatasets } from '$lib/datasets/api';

export const load: PageServerLoad = async () => {
  try {
    const datasets = await getDatasets();
    return {
      datasets
    };
  } catch (error) {
    console.error('Error loading datasets:', error);
    return {
      datasets: [],
      error: error instanceof Error ? error.message : 'Failed to load datasets'
    };
  }
}; 