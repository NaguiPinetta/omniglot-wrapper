const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://jdmgicxupcropwrzzzpl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbWdpY3h1cGNyb3B3cnp6enBsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDM1NjU0MywiZXhwIjoyMDY1OTMyNTQzfQ.ORGBKlGBJLUqJcIKqQcHI8Sp8FQcGDy3V9DfFPaKJLg';

async function runMigration() {
  console.log('Starting data ownership migration...');
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Read the SQL file
    const sql = fs.readFileSync('fix_data_ownership.sql', 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Migration failed:', error);
      return;
    }
    
    console.log('Migration completed successfully!');
    console.log('Result:', data);
    
    // Verify the migration by checking data counts
    console.log('\nVerifying migration results...');
    
    // Check agents
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, user_id')
      .not('user_id', 'eq', '00000000-0000-0000-0000-000000000000');
    
    if (!agentsError) {
      console.log(`✅ Agents migrated: ${agents.length}`);
    }
    
    // Check jobs  
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, user_id')
      .not('user_id', 'eq', '00000000-0000-0000-0000-000000000000');
    
    if (!jobsError) {
      console.log(`✅ Jobs migrated: ${jobs.length}`);
    }
    
    // Check datasets
    const { data: datasets, error: datasetsError } = await supabase
      .from('datasets')
      .select('id, user_id')
      .not('user_id', 'eq', '00000000-0000-0000-0000-000000000000');
    
    if (!datasetsError) {
      console.log(`✅ Datasets migrated: ${datasets.length}`);
    }
    
  } catch (err) {
    console.error('Error running migration:', err);
  }
}

runMigration(); 