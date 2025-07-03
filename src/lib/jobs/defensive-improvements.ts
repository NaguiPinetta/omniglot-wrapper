// Defensive Job Processing Improvements
// These patterns should be applied to src/lib/jobs/api.ts

import { markJobFailed } from './api';
import type { SupabaseClient } from '@supabase/supabase-js';

// Example 1: Defensive Resource Lookup Pattern
export async function getResourceSafely<T>(
  resourceType: string,
  getId: () => Promise<T>,
  jobId: string,
  client: SupabaseClient
): Promise<T> {
  try {
    const resource = await getId();
    if (!resource) {
      throw new Error(`${resourceType} not found`);
    }
    return resource;
  } catch (error: any) {
    await markJobFailed(jobId, `Failed to retrieve ${resourceType}: ${error.message}`, { client });
    throw error;
  }
}

// Example 2: Enhanced Batch Processing with Granular Logging
export function addBatchLogging(batchNumber: number, batchStart: number, batchEnd: number) {
  console.log(`[BATCH ${batchNumber}] Starting batch (rows ${batchStart + 1}-${batchEnd})`);
  return {
    logRowStart: (index: number) => console.log(`[BATCH ${batchNumber}] Starting row ${index + 1}`),
    logRowComplete: (index: number) => console.log(`[BATCH ${batchNumber}] Completed row ${index + 1}`),
    logBatchComplete: (successful: number, skipped: number) => 
      console.log(`[BATCH ${batchNumber}] Completed: ${successful} successful, ${skipped} skipped`)
  };
}

// Example 3: Improved Error Handling for translateRow
export function wrapTranslateRowWithErrorHandling(translateRowFn: Function) {
  return async (row: any, index: number) => {
    try {
      console.log(`Starting translation for row ${index + 1}`);
      const result = await translateRowFn(row, index);
      console.log(`Completed translation for row ${index + 1}`);
      return result;
    } catch (error: any) {
      console.error(`Translation failed for row ${index + 1}:`, error.message);
      return {
        type: 'skip',
        skipInfo: {
          row_id: `row_${index + 1}`,
          row_number: index + 1,
          reason: `Translation error: ${error.message}`,
          data: row
        }
      };
    }
  };
}

// Example 4: Global Try/Catch Pattern for processJobInBackground
export function wrapJobProcessorWithErrorHandling(processorFn: Function) {
  return async (jobId: string, options: any) => {
    try {
      return await processorFn(jobId, options);
    } catch (error: any) {
      console.error(`Critical error processing job ${jobId}:`, error);
      await markJobFailed(jobId, `Job processing failed: ${error.message}`, options);
    }
  };
}

// Example 5: Watchdog Status Check
export async function checkJobIsStillRunning(jobId: string, client: SupabaseClient): Promise<boolean> {
  try {
    const { data: job } = await client
      .from('jobs')
      .select('status, updated_at')
      .eq('id', jobId)
      .single();
    
    if (!job) return false;
    if (job.status === 'cancelled' || job.status === 'failed') return false;
    
    // Check if job hasn't been updated in over 30 minutes
    const lastUpdate = new Date(job.updated_at);
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    if (lastUpdate < thirtyMinutesAgo) {
      console.warn(`Job ${jobId} appears stuck - last update: ${lastUpdate}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error checking job status for ${jobId}:`, error);
    return false;
  }
}

// Example 6: Resume Job Logic (Optional)
export async function resumeStuckJob(jobId: string, client: SupabaseClient) {
  // Get job details
  const { data: job } = await client.from('jobs').select('*').eq('id', jobId).single();
  if (!job) throw new Error('Job not found');
  
  // Get already processed translations
  const { data: existingTranslations } = await client
    .from('translations')
    .select('row_id')
    .eq('job_id', jobId);
  
  const processedRowIds = new Set(existingTranslations?.map(t => t.row_id) || []);
  
  // Resume processing only unprocessed rows
  console.log(`Resuming job ${jobId}, ${processedRowIds.size} rows already processed`);
  
  // Reset job to running status
  await client
    .from('jobs')
    .update({ status: 'running', error: null })
    .eq('id', jobId);
  
  // Continue processing (implementation would go here)
} 