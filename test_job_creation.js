// Simple test script to debug job creation
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testJobCreation() {
  console.log('Testing job creation...');
  
  // First, get available agents and datasets
  const { data: agents, error: agentsError } = await supabase.from('agents').select('*').limit(1);
  if (agentsError) {
    console.error('Error fetching agents:', agentsError);
    return;
  }
  
  const { data: datasets, error: datasetsError } = await supabase.from('datasets').select('*').limit(1);
  if (datasetsError) {
    console.error('Error fetching datasets:', datasetsError);
    return;
  }
  
  if (!agents || agents.length === 0) {
    console.error('No agents found');
    return;
  }
  
  if (!datasets || datasets.length === 0) {
    console.error('No datasets found');
    return;
  }
  
  console.log('Found agents:', agents);
  console.log('Found datasets:', datasets);
  
  // Test with minimal job data
  const minimalJob = {
    name: 'Test Job',
    description: 'Test Description',
    agent_id: agents[0].id,
    dataset_id: datasets[0].id,
    status: 'pending',
    progress: 0,
    total_items: datasets[0].row_count || 0,
    processed_items: 0,
    failed_items: 0,
    user_id: 'anonymous'
  };
  
  console.log('Attempting to insert minimal job:', minimalJob);
  
  const { data, error } = await supabase.from('jobs').insert([minimalJob]).select().single();
  
  if (error) {
    console.error('Job creation failed:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
  } else {
    console.log('Job created successfully:', data);
  }
}

testJobCreation().catch(console.error); 