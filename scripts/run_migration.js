require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://jdmgicxupcropwrzzpl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

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