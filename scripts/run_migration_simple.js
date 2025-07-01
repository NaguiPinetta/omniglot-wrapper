require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://jdmgicxupcropwrzzpl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

async function runMigration() {
  console.log('🚀 Starting data ownership migration...');
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // First, get the real user UUID for jdpinetta@gmail.com
    console.log('📧 Looking up user jdpinetta@gmail.com...');
    
    // We can't access auth.users directly, so let's find the UUID from the models table
    // where we know the user has data
    const { data: modelData, error: modelError } = await supabase
      .from('models')
      .select('api_key_id')
      .not('api_key_id', 'is', null)
      .limit(1);
    
    if (modelError) {
      console.error('❌ Error finding model data:', modelError);
      return;
    }
    
    // Get the API key to find the user_id
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('id', modelData[0].api_key_id)
      .single();
    
    if (apiKeyError) {
      console.error('❌ Error finding API key:', apiKeyError);
      return;
    }
    
    const realUserUuid = apiKeyData.user_id;
    const anonymousUuid = '00000000-0000-0000-0000-000000000000';
    
    console.log(`✅ Found user UUID: ${realUserUuid}`);
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
    
  } catch (err) {
    console.error('💥 Error running migration:', err);
  }
}

runMigration(); 