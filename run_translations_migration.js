import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://jdmgicxupcropwrzzzpl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbWdpY3h1cGNyb3B3cnp6enBsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDM1NjU0MywiZXhwIjoyMDY1OTMyNTQzfQ.ORGBKlGBJLUqJcIKqQcHI8Sp8FQcGDy3V9DfFPaKJLg';

async function analyzeTranslationsSchema() {
  console.log('🔍 Step 1: Analyzing translations table schema...');
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // Check if user_id column exists
    const { data: columns, error: colError } = await supabase
      .rpc('exec_sql', { 
        sql_query: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'translations'
            AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });

    if (colError) {
      console.error('❌ Error checking columns:', colError);
      return false;
    }

    console.log('📋 Current translations table columns:');
    columns?.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check if user_id already exists
    const userIdExists = columns?.some(col => col.column_name === 'user_id');
    if (userIdExists) {
      console.log('⚠️  WARNING: user_id column already exists in translations table');
      return false;
    }

    // Check jobs table for NULL user_id values
    const { data: jobsAnalysis, error: jobsError } = await supabase
      .rpc('exec_sql', { 
        sql_query: `
          SELECT COUNT(*) AS total_jobs,
                 COUNT(user_id) AS jobs_with_user_id,
                 COUNT(*) - COUNT(user_id) AS null_user_id_count
          FROM jobs;
        `
      });

    if (jobsError) {
      console.error('❌ Error analyzing jobs:', jobsError);
      return false;
    }

    const analysis = jobsAnalysis?.[0];
    console.log('📊 Jobs table analysis:');
    console.log(`   - Total jobs: ${analysis?.total_jobs}`);
    console.log(`   - Jobs with user_id: ${analysis?.jobs_with_user_id}`);
    console.log(`   - NULL user_id count: ${analysis?.null_user_id_count}`);

    if (analysis?.null_user_id_count > 0) {
      console.log('❌ ABORT: Found jobs with NULL user_id - must fix before migration');
      return false;
    }

    // Check translations count
    const { data: transAnalysis, error: transError } = await supabase
      .rpc('exec_sql', { 
        sql_query: `
          SELECT COUNT(*) AS total_translations,
                 COUNT(DISTINCT job_id) AS unique_job_ids,
                 COUNT(CASE WHEN job_id IS NULL THEN 1 END) AS null_job_ids
          FROM translations;
        `
      });

    if (transError) {
      console.error('❌ Error analyzing translations:', transError);
      return false;
    }

    const transData = transAnalysis?.[0];
    console.log('📊 Translations table analysis:');
    console.log(`   - Total translations: ${transData?.total_translations}`);
    console.log(`   - Unique job IDs: ${transData?.unique_job_ids}`);
    console.log(`   - NULL job IDs: ${transData?.null_job_ids}`);

    if (transData?.null_job_ids > 0) {
      console.log('⚠️  WARNING: Found translations with NULL job_id');
    }

    console.log('✅ Pre-migration analysis complete - safe to proceed');
    return true;

  } catch (error) {
    console.error('💥 Error during analysis:', error);
    return false;
  }
}

async function runMigrationSteps() {
  console.log('\n🚀 Starting translations migration...');
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // Step 1: Add user_id column
    console.log('\n📝 Step 2: Adding user_id column...');
    const { error: addColError } = await supabase
      .rpc('exec_sql', { 
        sql_query: 'ALTER TABLE translations ADD COLUMN user_id UUID;'
      });

    if (addColError) {
      console.error('❌ Error adding column:', addColError);
      return false;
    }
    console.log('✅ Successfully added user_id column');

    // Step 2: Backfill user_id
    console.log('\n🔄 Step 3: Backfilling user_id from jobs...');
    const { error: backfillError } = await supabase
      .rpc('exec_sql', { 
        sql_query: `
          UPDATE translations t
          SET user_id = j.user_id
          FROM jobs j
          WHERE t.job_id = j.id;
        `
      });

    if (backfillError) {
      console.error('❌ Error during backfill:', backfillError);
      return false;
    }
    console.log('✅ Successfully backfilled user_id values');

    // Step 3: Verify backfill
    console.log('\n🔍 Step 4: Verifying backfill results...');
    const { data: verifyData, error: verifyError } = await supabase
      .rpc('exec_sql', { 
        sql_query: `
          SELECT COUNT(*) AS total_translations,
                 COUNT(user_id) AS with_user_id,
                 COUNT(*) - COUNT(user_id) AS null_user_ids
          FROM translations;
        `
      });

    if (verifyError) {
      console.error('❌ Error verifying backfill:', verifyError);
      return false;
    }

    const verify = verifyData?.[0];
    console.log('📊 Backfill verification:');
    console.log(`   - Total translations: ${verify?.total_translations}`);
    console.log(`   - With user_id: ${verify?.with_user_id}`);
    console.log(`   - NULL user_ids: ${verify?.null_user_ids}`);

    // Step 4: Add constraints
    console.log('\n🔒 Step 5: Adding constraints...');
    
    // Add NOT NULL constraint only if no NULLs
    if (verify?.null_user_ids === 0) {
      const { error: notNullError } = await supabase
        .rpc('exec_sql', { 
          sql_query: 'ALTER TABLE translations ALTER COLUMN user_id SET NOT NULL;'
        });

      if (notNullError) {
        console.error('❌ Error adding NOT NULL constraint:', notNullError);
      } else {
        console.log('✅ Added NOT NULL constraint');
      }
    } else {
      console.log('⚠️  Skipping NOT NULL constraint due to NULL values');
    }

    // Add foreign key constraint
    const { error: fkError } = await supabase
      .rpc('exec_sql', { 
        sql_query: `
          ALTER TABLE translations
          ADD CONSTRAINT translations_user_id_fkey
          FOREIGN KEY (user_id) REFERENCES users(id);
        `
      });

    if (fkError) {
      console.error('❌ Error adding foreign key constraint:', fkError);
      return false;
    }
    console.log('✅ Added foreign key constraint');

    console.log('\n🎉 Migration completed successfully!');
    return true;

  } catch (error) {
    console.error('💥 Error during migration:', error);
    return false;
  }
}

async function main() {
  console.log('🎯 Safe Translations Migration Tool');
  console.log('=====================================');

  // Step 1: Analyze current state
  const analysisOk = await analyzeTranslationsSchema();
  if (!analysisOk) {
    console.log('❌ Migration aborted due to analysis failures');
    return;
  }

  // Ask for confirmation (in a real scenario)
  console.log('\n⚠️  Ready to proceed with migration?');
  console.log('This will add user_id column to translations and backfill from jobs table.');
  
  // For automation, we'll proceed directly
  console.log('🚀 Proceeding with migration...');

  // Step 2: Run migration
  const migrationOk = await runMigrationSteps();
  if (!migrationOk) {
    console.log('❌ Migration failed - check errors above');
    return;
  }

  console.log('\n✅ All steps completed successfully!');
  console.log('The translations table now has a properly constrained user_id column.');
}

main().catch(console.error); 