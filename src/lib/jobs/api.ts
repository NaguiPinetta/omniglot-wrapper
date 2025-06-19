import { supabaseClient } from '../supabaseClient';
import type { Job, JobFormData, JobResult, JobProgress } from '../../types/jobs';
import { executeAgent } from '../agents/api';
import { getDataset } from '../datasets/api';

export async function getJobs(): Promise<Job[]> {
  const { data, error } = await supabaseClient
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getJob(id: string): Promise<Job> {
  const { data, error } = await supabaseClient
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createJob(formData: JobFormData): Promise<Job> {
  const { data, error } = await supabaseClient
    .from('jobs')
    .insert([{
      ...formData,
      status: 'pending',
      progress: 0,
      total_items: 0,
      processed_items: 0,
      failed_items: 0
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateJob(id: string, updates: Partial<Job>): Promise<Job> {
  const { data, error } = await supabaseClient
    .from('jobs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteJob(id: string): Promise<void> {
  const { error } = await supabaseClient
    .from('jobs')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function startJob(id: string): Promise<Job> {
  // Get the job details
  const job = await getJob(id);
  
  if (job.status !== 'pending') {
    throw new Error('Job is not in pending status');
  }

  // Update job status to running
  const updatedJob = await updateJob(id, {
    status: 'running',
    started_at: new Date().toISOString()
  });

  // Start the translation process in the background
  processJobInBackground(id);

  return updatedJob;
}

export async function cancelJob(id: string): Promise<Job> {
  return await updateJob(id, {
    status: 'cancelled',
    completed_at: new Date().toISOString()
  });
}

export async function getJobResults(jobId: string): Promise<JobResult[]> {
  const { data, error } = await supabaseClient
    .from('job_results')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

async function processJobInBackground(jobId: string) {
  try {
    const job = await getJob(jobId);
    const dataset = await getDataset(job.dataset_id);
    
    // Simulate processing dataset rows
    const totalRows = dataset.row_count;
    let processed = 0;
    let failed = 0;

    // Update job with total items
    await updateJob(jobId, { total_items: totalRows });

    // Process each row (simulated)
    for (let i = 0; i < totalRows; i++) {
      // Check if job was cancelled
      const currentJob = await getJob(jobId);
      if (currentJob.status === 'cancelled') {
        break;
      }

      try {
        // Simulate translation
        const sourceText = `Sample text ${i + 1}`;
        const response = await executeAgent(job.agent_id, sourceText);
        
        // Save result
        await supabaseClient
          .from('job_results')
          .insert([{
            job_id: jobId,
            source_text: sourceText,
            translated_text: response.content,
            confidence: 0.95,
            processing_time: 1.2
          }]);

        processed++;
      } catch (error) {
        failed++;
        console.error(`Failed to process item ${i + 1}:`, error);
      }

      // Update progress every 10 items
      if (i % 10 === 0 || i === totalRows - 1) {
        const progress = Math.round((processed / totalRows) * 100);
        await updateJob(jobId, {
          processed_items: processed,
          failed_items: failed,
          progress
        });
      }

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Mark job as completed
    await updateJob(jobId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      progress: 100
    });

  } catch (error) {
    console.error('Job processing failed:', error);
    await updateJob(jobId, {
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      completed_at: new Date().toISOString()
    });
  }
} 