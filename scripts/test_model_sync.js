#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testModelSync() {
    console.log('🧪 Testing OpenAI Models Sync...\n');

    try {
        // 1. Check if we have an OpenAI API key
        console.log('1. Checking for OpenAI API key...');
        const { data: apiKeys, error: apiKeyError } = await supabase
            .from('api_keys')
            .select('*')
            .eq('provider', 'openai')
            .eq('is_active', true)
            .limit(1);

        if (apiKeyError) {
            console.error('❌ Error fetching API keys:', apiKeyError);
            return;
        }

        if (!apiKeys || apiKeys.length === 0) {
            console.log('⚠️  No active OpenAI API key found. Please add one first.');
            return;
        }

        console.log('✅ Found OpenAI API key');

        // 2. Count existing models
        console.log('\n2. Checking existing models...');
        const { data: existingModels, error: modelsError } = await supabase
            .from('models')
            .select('name, provider')
            .eq('provider', 'openai');

        if (modelsError) {
            console.error('❌ Error fetching models:', modelsError);
            return;
        }

        console.log(`✅ Found ${existingModels?.length || 0} existing OpenAI models`);
        if (existingModels && existingModels.length > 0) {
            console.log('   Existing models:', existingModels.map(m => m.name).join(', '));
        }

        // 3. Test the sync endpoint
        console.log('\n3. Testing sync endpoint...');
        const response = await fetch('http://localhost:5173/api/models/sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Sync request failed:', response.status, errorText);
            return;
        }

        const result = await response.json();
        console.log('✅ Sync completed successfully!');
        console.log('   Results:', result.message);
        console.log('   Details:', result.results);

        // 4. Verify models were added
        console.log('\n4. Verifying updated models...');
        const { data: updatedModels, error: updatedError } = await supabase
            .from('models')
            .select('name, provider, context_length')
            .eq('provider', 'openai')
            .order('name');

        if (updatedError) {
            console.error('❌ Error fetching updated models:', updatedError);
            return;
        }

        console.log(`✅ Total OpenAI models now: ${updatedModels?.length || 0}`);
        if (updatedModels && updatedModels.length > 0) {
            console.log('\n   Available models:');
            updatedModels.forEach(model => {
                console.log(`   - ${model.name} (${model.context_length || 'N/A'} tokens)`);
            });
        }

        console.log('\n🎉 Model sync test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testModelSync().catch(console.error);
 