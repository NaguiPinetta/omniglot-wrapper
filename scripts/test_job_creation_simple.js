// Simple test to check if job creation works after auth fix
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jdmgicxupcropwrzzpl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

async function testJobCreation() {
  console.log('🧪 Testing job creation after auth fix...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Get user UUID
  const { data: users } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', 'jdpinetta@gmail.com');
    
  if (!users || users.length === 0) {
    console.error('❌ User not found');
    return;
  }
  
  const userId = users[0].id;
  console.log('✅ Found user:', users[0].email, 'UUID:', userId);
  
  // Get a dataset and agent for testing
  const { data: datasets } = await supabase
    .from('datasets')
    .select('id, name')
    .eq('user_id', userId)
    .limit(1);
    
  const { data: agents } = await supabase
    .from('agents')
    .select('id, custom_name')
    .eq('user_id', userId)
    .limit(1);
    
  if (!datasets || datasets.length === 0) {
    console.error('❌ No datasets found for user');
    return;
  }
  
  if (!agents || agents.length === 0) {
    console.error('❌ No agents found for user');
    return;
  }
  
  console.log('✅ Found dataset:', datasets[0].name);
  console.log('✅ Found agent:', agents[0].custom_name);
  
  // Try to create a test job
  const testJob = {
    name: 'Test Job - Auth Fix',
    description: 'Testing job creation after authentication fix',
    agent_id: agents[0].id,
    dataset_id: datasets[0].id,
    user_id: userId,
    status: 'pending',
    target_language: 'es',
    progress: 0,
    total_items: 1,
    processed_items: 0,
    failed_items: 0
  };
  
  console.log('🚀 Creating test job...');
  const { data: newJob, error } = await supabase
    .from('jobs')
    .insert([testJob])
    .select()
    .single();
    
  if (error) {
    console.error('❌ Job creation failed:', error);
    return;
  }
  
  console.log('✅ Job created successfully!');
  console.log('Job ID:', newJob.id);
  console.log('Job Name:', newJob.name);
  
  // Clean up - delete the test job
  console.log('🧹 Cleaning up test job...');
  await supabase
    .from('jobs')
    .delete()
    .eq('id', newJob.id);
  
  console.log('✅ Test completed successfully!');
}

testJobCreation().catch(console.error); 