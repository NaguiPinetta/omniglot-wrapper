import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { logger } from '$lib/utils/logger';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const POST: RequestHandler = async ({ request }) => {
	const syncLogger = logger.scope('ModelSync');
	syncLogger.info('Starting OpenAI models sync');

	try {
		// 1. Get OpenAI API key from database - handle both with and without is_active column
		let apiKeys;
		let apiKeyError;
		
		// Try with is_active filter first
		try {
			const result = await supabase
				.from('api_keys')
				.select('*')
				.eq('provider', 'openai')
				.eq('is_active', true)
				.limit(1);
			apiKeys = result.data;
			apiKeyError = result.error;
		} catch (error) {
			// If is_active column doesn't exist, fallback to query without it
			syncLogger.debug('is_active column not found, using fallback query');
			const result = await supabase
				.from('api_keys')
				.select('*')
				.eq('provider', 'openai')
				.limit(1);
			apiKeys = result.data;
			apiKeyError = result.error;
		}

		if (apiKeyError) {
			syncLogger.error('Failed to fetch OpenAI API key', apiKeyError);
			return json({ error: 'Failed to fetch API key' }, { status: 500 });
		}

		if (!apiKeys || apiKeys.length === 0) {
			syncLogger.warn('No OpenAI API key found');
			return json({ error: 'No OpenAI API key found. Please add an OpenAI API key first.' }, { status: 400 });
		}

		const openaiApiKey = apiKeys[0];
		syncLogger.debug('Found OpenAI API key', { keyId: openaiApiKey.id });

		// 2. Call OpenAI API to list models
		const response = await fetch('https://api.openai.com/v1/models', {
			headers: {
				'Authorization': `Bearer ${openaiApiKey.key_value}`,
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			const errorText = await response.text();
			syncLogger.error('OpenAI API request failed', { 
				status: response.status, 
				statusText: response.statusText,
				error: errorText
			});
			return json({ error: `OpenAI API error: ${response.status} ${response.statusText}` }, { status: response.status });
		}

		const modelsData = await response.json();
		syncLogger.debug('OpenAI API response received', { totalModels: modelsData.data?.length });

		// 3. Filter for chat completion models (GPT models)
		const chatModels = modelsData.data.filter((model: any) => 
			model.id.startsWith('gpt-') && 
			(model.id.includes('gpt-3.5') || model.id.includes('gpt-4'))
		);

		syncLogger.debug('Filtered chat models', { chatModelsCount: chatModels.length });

		// 4. Process each model
		const results = {
			added: 0,
			skipped: 0,
			errors: 0,
			models: [] as string[]
		};

		for (const model of chatModels) {
			try {
				// Check if model already exists
				const { data: existingModel, error: checkError } = await supabase
					.from('models')
					.select('id')
					.eq('name', model.id)
					.eq('provider', 'openai')
					.limit(1);

				if (checkError) {
					syncLogger.error('Error checking existing model', { modelId: model.id, error: checkError });
					results.errors++;
					continue;
				}

				if (existingModel && existingModel.length > 0) {
					syncLogger.debug('Model already exists, skipping', { modelId: model.id });
					results.skipped++;
					continue;
				}

				// Determine context length based on model name
				let contextLength: number | null = null;
				if (model.id.includes('gpt-3.5')) {
					contextLength = model.id.includes('16k') ? 16384 : 4096;
				} else if (model.id.includes('gpt-4')) {
					if (model.id.includes('gpt-4o') || model.id.includes('gpt-4-turbo')) {
						contextLength = 128000; // 128k tokens
					} else if (model.id.includes('32k')) {
						contextLength = 32768;
					} else {
						contextLength = 8192; // Standard GPT-4
					}
				}

				// Insert new model
				const { error: insertError } = await supabase
					.from('models')
					.insert({
						name: model.id,
						provider: 'openai',
						description: model.id,
						context_length: contextLength,
						input_cost_per_token: null,
						output_cost_per_token: null,
						is_active: true,
						free_tier_limit: null,
						access_type: 'api_key',
						api_key_id: openaiApiKey.id
					});

				if (insertError) {
					syncLogger.error('Error inserting model', { modelId: model.id, error: insertError });
					results.errors++;
				} else {
					syncLogger.debug('Model added successfully', { modelId: model.id, contextLength });
					results.added++;
					results.models.push(model.id);
				}

			} catch (error) {
				syncLogger.error('Unexpected error processing model', { modelId: model.id, error });
				results.errors++;
			}
		}

		syncLogger.info('Models sync completed', results);

		return json({
			success: true,
			message: `Sync completed: ${results.added} added, ${results.skipped} skipped, ${results.errors} errors`,
			results
		});

	} catch (error) {
		syncLogger.error('Models sync failed', error);
		return json({ error: 'Internal server error during models sync' }, { status: 500 });
	}
}; 