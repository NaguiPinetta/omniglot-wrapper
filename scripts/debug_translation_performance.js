// Translation Performance Diagnostic Script
// Run this in browser console on the Jobs page to analyze performance

console.log('=== TRANSLATION PERFORMANCE DIAGNOSTIC ===');

// 1. Check current job status and progress
async function analyzeJobPerformance() {
    try {
        // Get jobs data from the page
        const response = await fetch('/api/jobs');
        const jobs = await response.json();
        
        console.log('\n��� JOB ANALYSIS:');
        jobs.forEach(job => {
            if (job.status === 'running' || job.status === 'completed') {
                const startTime = new Date(job.started_at);
                const currentTime = new Date();
                const elapsedMs = currentTime - startTime;
                const elapsedMin = Math.round(elapsedMs / 60000);
                
                const rowsPerMinute = job.processed_items / elapsedMin || 0;
                const estimatedTimeRemaining = (job.total_items - job.processed_items) / rowsPerMinute;
                
                console.log(`\nJob: ${job.name || job.id}`);
                console.log(`Status: ${job.status}`);
                console.log(`Progress: ${job.processed_items}/${job.total_items} (${job.progress}%)`);
                console.log(`Elapsed: ${elapsedMin} minutes`);
                console.log(`Speed: ${rowsPerMinute.toFixed(1)} rows/minute`);
                console.log(`Estimated remaining: ${estimatedTimeRemaining.toFixed(1)} minutes`);
                console.log(`Failed items: ${job.failed_items || 0}`);
                
                // Performance flags
                if (rowsPerMinute < 1) console.warn('⚠️  VERY SLOW: < 1 row/minute');
                if (rowsPerMinute < 5) console.warn('⚠️  SLOW: < 5 rows/minute');
                if (job.failed_items > job.processed_items * 0.1) console.warn('⚠️  HIGH FAILURE RATE');
            }
        });
        
        // 2. Check API response times
        console.log('\n��� API PERFORMANCE TEST:');
        const testStart = performance.now();
        
        try {
            const testResponse = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: 'You are a translator.' },
                        { role: 'user', content: 'Translate "hello" to Spanish.' }
                    ]
                })
            });
            
            const testEnd = performance.now();
            const apiResponseTime = testEnd - testStart;
            
            console.log(`API Response Time: ${apiResponseTime.toFixed(0)}ms`);
            
            if (apiResponseTime > 5000) console.warn('⚠️  SLOW API: > 5 seconds');
            if (apiResponseTime > 10000) console.error('❌ VERY SLOW API: > 10 seconds');
            
        } catch (apiError) {
            console.error('❌ API TEST FAILED:', apiError);
        }
        
        // 3. Memory usage check
        console.log('\n��� BROWSER PERFORMANCE:');
        if (performance.memory) {
            const memUsed = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
            const memLimit = Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024);
            console.log(`Memory Usage: ${memUsed}MB / ${memLimit}MB`);
            
            if (memUsed > memLimit * 0.8) console.warn('⚠️  HIGH MEMORY USAGE');
        }
        
        // 4. Network analysis
        console.log('\n��� NETWORK ANALYSIS:');
        if (navigator.connection) {
            console.log(`Connection: ${navigator.connection.effectiveType}`);
            console.log(`Downlink: ${navigator.connection.downlink} Mbps`);
            console.log(`RTT: ${navigator.connection.rtt}ms`);
        }
        
        // 5. Recommendations
        console.log('\n��� PERFORMANCE RECOMMENDATIONS:');
        
        const runningJobs = jobs.filter(j => j.status === 'running');
        if (runningJobs.length > 0) {
            const slowJobs = runningJobs.filter(j => {
                const elapsedMin = (new Date() - new Date(j.started_at)) / 60000;
                return (j.processed_items / elapsedMin) < 5;
            });
            
            if (slowJobs.length > 0) {
                console.log('��� SLOW JOBS DETECTED:');
                console.log('- Consider using batch processing');
                console.log('- Check API rate limits');
                console.log('- Reduce glossary size if large');
                console.log('- Consider smaller dataset chunks');
            }
        }
        
        const stuckJobs = jobs.filter(j => j.status === 'running' && j.progress < 10 && 
            (new Date() - new Date(j.started_at)) > 300000); // 5 minutes
            
        if (stuckJobs.length > 0) {
            console.log('��� STUCK JOBS DETECTED:');
            console.log('- Job may have hit rate limits');
            console.log('- Check API key validity');
            console.log('- Consider restarting job');
        }
        
    } catch (error) {
        console.error('❌ Diagnostic failed:', error);
    }
}

// Run the analysis
analyzeJobPerformance();

// Export function for manual testing
window.debugTranslationPerformance = analyzeJobPerformance;
