import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jdmgicxupcropwrzzzpl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbWdpY3h1cGNyb3B3cnp6enBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNTY1NDMsImV4cCI6MjA2NTkzMjU0M30.6xs04TVcJarQrYvaioSewZD-rp_X05Elm4Ecp4yyDMg';

async function runMigration() {
  console.log('🚀 Starting data ownership migration...');
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // From the schema view, we know the real user UUID is: f2efaddd-845d-45ff-a787-2dd171d4518b
    // (visible in the models table api_key_id column)
    const realUserUuid = 'f2efaddd-845d-45ff-a787-2dd171d4518b';
    const anonymousUuid = '00000000-0000-0000-0000-000000000000';
    
    console.log(`✅ Using user UUID: ${realUserUuid}`);
    console.log(`🔄 Migrating from anonymous UUID: ${anonymousUuid}`);
    
    // Update agents
    console.log('\n📋 Updating agents...');
    const { data: agentsUpdate, error: agentsError } = await supabase
      .from('agents')
      .update({ user_id: realUserUuid })
      .eq('user_id', anonymousUuid)
      .select('id');
    
    if (agentsError) {
      console.error('❌ Error updating agents:', agentsError);
    } else {
      console.log(`✅ Updated ${agentsUpdate?.length || 0} agents`);
    }
    
    // Update jobs
    console.log('\n💼 Updating jobs...');
    const { data: jobsUpdate, error: jobsError } = await supabase
      .from('jobs')
      .update({ user_id: realUserUuid })
      .eq('user_id', anonymousUuid)
      .select('id');
    
    if (jobsError) {
      console.error('❌ Error updating jobs:', jobsError);
    } else {
      console.log(`✅ Updated ${jobsUpdate?.length || 0} jobs`);
    }
    
    // Update datasets
    console.log('\n📊 Updating datasets...');
    const { data: datasetsUpdate, error: datasetsError } = await supabase
      .from('datasets')
      .update({ user_id: realUserUuid })
      .eq('user_id', anonymousUuid)
      .select('id');
    
    if (datasetsError) {
      console.error('❌ Error updating datasets:', datasetsError);
    } else {
      console.log(`✅ Updated ${datasetsUpdate?.length || 0} datasets`);
    }
    
    // Update glossary
    console.log('\n📚 Updating glossary...');
    const { data: glossaryUpdate, error: glossaryError } = await supabase
      .from('glossary')
      .update({ user_id: realUserUuid })
      .eq('user_id', anonymousUuid)
      .select('id');
    
    if (glossaryError) {
      console.error('❌ Error updating glossary:', glossaryError);
    } else {
      console.log(`✅ Updated ${glossaryUpdate?.length || 0} glossary entries`);
    }
    
    // Update translations
    console.log('\n🌐 Updating translations...');
    const { data: translationsUpdate, error: translationsError } = await supabase
      .from('translations')
      .update({ user_id: realUserUuid })
      .eq('user_id', anonymousUuid)
      .select('id');
    
    if (translationsError) {
      console.error('❌ Error updating translations:', translationsError);
    } else {
      console.log(`✅ Updated ${translationsUpdate?.length || 0} translations`);
    }
    
    console.log('\n🎉 Migration completed successfully!');
    
    // Final verification
    console.log('\n🔍 Verifying migration results...');
    
    const { count: agentsCount } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', realUserUuid);
    
    const { count: jobsCount } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', realUserUuid);
    
    const { count: datasetsCount } = await supabase
      .from('datasets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', realUserUuid);
    
    console.log(`✅ Final counts for user ${realUserUuid}:`);
    console.log(`   - Agents: ${agentsCount}`);
    console.log(`   - Jobs: ${jobsCount}`);
    console.log(`   - Datasets: ${datasetsCount}`);
    
    // Check if any data still has anonymous UUID
    const { count: remainingAgents } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', anonymousUuid);
      
    const { count: remainingJobs } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', anonymousUuid);
    
    console.log(`\n🔍 Remaining anonymous data:`);
    console.log(`   - Agents: ${remainingAgents}`);
    console.log(`   - Jobs: ${remainingJobs}`);
    
  } catch (err) {
    console.error('💥 Error running migration:', err);
  }
}

runMigration(); 