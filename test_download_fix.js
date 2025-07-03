// Test script to verify the download fix
// Run this in the browser console on the jobs page

async function testDownloadFix(jobId) {
    console.log('Testing download fix for job:', jobId);
    
    try {
        // Import the functions
        const { diagnoseJobResults, getCompleteJobResults, getJobResults, getJobResultsPaginated } = await import('./src/lib/jobs/api.js');
        
        console.log('1. Running diagnostics...');
        await diagnoseJobResults(jobId);
        
        console.log('2. Testing standard getJobResults...');
        const standardResults = await getJobResults(jobId);
        console.log('Standard results count:', standardResults.length);
        
        console.log('3. Testing paginated getJobResultsPaginated...');
        const paginatedResults = await getJobResultsPaginated(jobId);
        console.log('Paginated results count:', paginatedResults.length);
        
        console.log('4. Testing complete getCompleteJobResults...');
        const completeResults = await getCompleteJobResults(jobId);
        console.log('Complete results count:', completeResults.length);
        
        console.log('5. Comparison:');
        console.log({
            standard: standardResults.length,
            paginated: paginatedResults.length,
            complete: completeResults.length,
            allMatch: standardResults.length === paginatedResults.length && paginatedResults.length === completeResults.length
        });
        
        return {
            standard: standardResults.length,
            paginated: paginatedResults.length,
            complete: completeResults.length
        };
        
    } catch (error) {
        console.error('Test failed:', error);
        return null;
    }
}

// Usage: testDownloadFix('your-job-id-here')
console.log('Test function loaded. Call testDownloadFix("your-job-id") to test.');