import { supabaseClient } from '../supabaseClient';
import type { Job, JobFormData, JobResult } from '../../types/jobs';
import type { SupabaseClient } from '@supabase/supabase-js';
import { executeAgent } from '../agents/api';
import { getDataset } from '../datasets/api';

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
	job: Omit<Job, 'id' | 'created_at'>,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<Job> {
	const { data, error } = await client.from('jobs').insert([job]).select().single();
	if (error) throw error;
	return data;
}

export async function updateJob(
	id: string,
	updates: Partial<Job>,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<Job> {
	const { data, error } = await client.from('jobs').update(updates).eq('id', id).select().single();
	if (error) throw error;
	return data;
}

export async function deleteJob(
	id: string,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<void> {
	// Related job_results are deleted via cascading delete in Supabase
	const { error } = await client.from('jobs').delete().eq('id', id);
	if (error) throw error;
}

export async function getJobResults(
	jobId: string,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<JobResult[]> {
	const { data, error } = await client.from('job_results').select('*').eq('job_id', jobId).order('created_at', { ascending: true });
	if (error) throw error;
	return data ?? [];
}

// --- Job Execution Logic ---

export async function startJob(
	id: string,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<Job> {
	const job = await getJob(id, { client });
	if (job.status !== 'pending') {
		throw new Error('Job is not in pending status');
	}

	const updatedJob = await updateJob(id, {
		status: 'running',
		started_at: new Date().toISOString()
	}, { client });

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
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
) {
	try {
		let job = await getJob(jobId, { client });
		const dataset = await getDataset(job.dataset_id, { client });
		
		// This is a placeholder for getting the actual dataset content.
		// In a real app, you'd fetch the file from storage and parse it.
		const mockDatasetContent = Array.from({ length: dataset.row_count }, (_, i) => ({
			source_text: `Sample row ${i + 1} for ${dataset.name}`
		}));

		await updateJob(jobId, { total_items: mockDatasetContent.length }, { client });

		for (let i = 0; i < mockDatasetContent.length; i++) {
			// Re-fetch job to check for cancellation
			job = await getJob(jobId, { client });
			if (job.status === 'cancelled') break;

			try {
				const item = mockDatasetContent[i];
				// In a real app, you would map a specific column here.
				const sourceText = item.source_text;
				const response = await executeAgent(job.agent_id, sourceText, { client });
				
				await client.from('job_results').insert([{
					job_id: jobId,
					source_text: sourceText,
					translated_text: response.content,
					// Other result fields would be populated here
				}]);

				await updateJob(jobId, { processed_items: i + 1, progress: Math.round(((i + 1) / mockDatasetContent.length) * 100) }, { client });

			} catch (error) {
				console.error(`Failed to process item ${i + 1}:`, error);
				await updateJob(jobId, { failed_items: (job.failed_items || 0) + 1 }, { client });
			}

			// Simulate processing time
			await new Promise(resolve => setTimeout(resolve, 50));
		}

		// Final job status update
		job = await getJob(jobId, { client }); // Re-fetch final state
		if (job.status !== 'cancelled') {
			await updateJob(jobId, {
				status: 'completed',
				completed_at: new Date().toISOString(),
				progress: 100
			}, { client });
		}

	} catch (error) {
		console.error('Job processing failed:', error);
		await updateJob(jobId, {
			status: 'failed',
			error_message: error instanceof Error ? error.message : 'Unknown error',
			completed_at: new Date().toISOString()
		}, { client });
	}
} 