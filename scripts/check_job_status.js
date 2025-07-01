// Quick job status checker - run in browser console

fetch('/api/jobs')
  .then(r => r.json())
  .then(jobs => {
    const runningJobs = jobs.filter(j => j.status === 'running');
    
    runningJobs.forEach(job => {
      const elapsed = (new Date() - new Date(job.started_at)) / 1000 / 60; // minutes
      const rate = job.processed_items / elapsed;
      
      console.log(`Job: ${job.name || job.id}`);
      console.log(`Progress: ${job.processed_items}/${job.total_items}`);
      console.log(`Rate: ${rate.toFixed(2)} rows/minute`);
      console.log(`Estimated completion: ${((job.total_items - job.processed_items) / rate).toFixed(1)} minutes`);
      console.log('---');
    });
  });
