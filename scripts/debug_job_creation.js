const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://jdmgicxupcropwrzzzpl.supabase.co';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_8Vg6HLtWDECH-oMUGJ_SfA_LPhwpDyK';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugJobCreation() {
    console.log('🔍 Debugging job creation issue...');
    
    try {
        // 1. Check if we can access the jobs table
        console.log('\n1. Testing jobs table access...');
        const { data: jobs, error: jobsError } = await supabase.from('jobs').select('*').limit(1);
        console.log('Jobs query result:', { jobs: jobs?.length, error: jobsError });
        
        // 2. Check if we can access datasets
        console.log('\n2. Testing datasets table access...');
        const { data: datasets, error: datasetsError } = await supabase.from('datasets').select('*').limit(1);
        console.log('Datasets query result:', { datasets: datasets?.length, error: datasetsError });
        
        // 3. Check jobs table schema
        console.log('\n3. Checking jobs table schema...');
        const { data: schema, error: schemaError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable, column_default')
            .eq('table_name', 'jobs');
        
        if (schemaError) {
            console.log('Schema query error:', schemaError);
        } else {
            console.log('Jobs table columns:');
            schema.forEach(col => {
                console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
            });
            
            // Check if glossary_usage_mode exists
            const hasGlossaryMode = schema.some(col => col.column_name === 'glossary_usage_mode');
            console.log(`\n📊 glossary_usage_mode column exists: ${hasGlossaryMode}`);
        }
        
        // 4. Try a minimal job creation
        console.log('\n4. Testing minimal job creation...');
        
        // First get a dataset
        const { data: testDataset } = await supabase.from('datasets').select('*').limit(1).single();
        if (!testDataset) {
            console.log('❌ No datasets available for testing');
            return;
        }
        
        // Get an agent
        const { data: testAgent } = await supabase.from('agents').select('*').limit(1).single();
        if (!testAgent) {
            console.log('❌ No agents available for testing');
            return;
        }
        
        const minimalJob = {
            name: 'DEBUG TEST JOB',
            description: 'Test job for debugging',
            agent_id: testAgent.id,
            dataset_id: testDataset.id,
            status: 'pending',
            progress: 0,
            total_items: 1,
            processed_items: 0,
            failed_items: 0,
            user_id: '00000000-0000-0000-0000-000000000000',
            target_language: 'es'
        };
        
        console.log('Attempting to create minimal job:', minimalJob);
        
        const { data: newJob, error: createError } = await supabase
            .from('jobs')
            .insert([minimalJob])
            .select()
            .single();
        
        if (createError) {
            console.log('❌ Job creation failed:', createError);
        } else {
            console.log('✅ Job created successfully:', newJob.id);
            
            // Clean up test job
            await supabase.from('jobs').delete().eq('id', newJob.id);
            console.log('🧹 Test job cleaned up');
        }
        
    } catch (error) {
        console.error('💥 Debug script error:', error);
    }
}

debugJobCreation(); 