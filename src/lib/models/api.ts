import { supabaseClient } from '../supabaseClient';
import type { ApiKey, ApiKeyFormData, Model } from '../../types/models';
import type { SupabaseClient } from '@supabase/supabase-js';

// Helper function to get current user ID
async function getCurrentUserId(client: SupabaseClient): Promise<string> {
	const { data: { user } } = await client.auth.getUser();
	return user?.id || '00000000-0000-0000-0000-000000000000';
}

// Models API
export async function getModels({ client = supabaseClient }: { client?: SupabaseClient } = {}): Promise<Model[]> {
	const { data, error } = await client.from('models').select('*').eq('is_active', true).order('provider, name');
	if (error) throw error;
	return data ?? [];
}

export async function getModelsByProvider(
	provider: string,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<Model[]> {
	const { data, error } = await client
		.from('models')
		.select('*')
		.eq('provider', provider)
		.eq('is_active', true)
		.order('name');
	if (error) throw error;
	return data ?? [];
}

export async function createModel(
	model: Omit<Model, 'id' | 'created_at' | 'updated_at'>,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<Model> {
	const { data, error } = await client.from('models').insert([model]).select().single();
	if (error) throw error;
	return data;
}

export async function updateModel(
	id: string,
	model: Partial<Model>,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<Model> {
	const { data, error } = await client.from('models').update(model).eq('id', id).select().single();
	if (error) throw error;
	return data;
}

export async function deleteModel(
	id: string,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<void> {
	const { error } = await client.from('models').delete().eq('id', id);
	if (error) throw error;
}

export async function getModel(
	id: string,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<Model> {
	const { data, error } = await client.from('models').select('*').eq('id', id).single();
	if (error) throw error;
	return data;
}

// API Keys API
export async function getApiKeys({ client = supabaseClient }: { client?: SupabaseClient } = {}): Promise<ApiKey[]> {
	// Get all API keys for all users (global read)
	const { data, error } = await client
		.from('api_keys')
		.select('*')
		.order('provider, created_at');
	if (error) throw error;
	return data ?? [];
}

export async function createApiKey(
	apiKey: ApiKeyFormData,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<ApiKey> {
	// Get current user ID (authenticated or anonymous)
	const userId = await getCurrentUserId(client);
	
	const apiKeyWithUser = {
		...apiKey,
		user_id: userId
	};
	
	const { data, error } = await client.from('api_keys').insert([apiKeyWithUser]).select().single();
	
	if (error) {
		throw error;
	}

	// Automatically link all models for this provider to the new key
	if (data && data.id && data.provider) {
		const { error: updateError } = await client.from('models')
			.update({ api_key_id: data.id })
			.eq('provider', data.provider);
		if (updateError) {
			console.error('Failed to auto-link models to new API key:', updateError);
		}
	}
	
	return data;
}

export async function updateApiKey(
	id: string,
	apiKey: Partial<ApiKey>,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<ApiKey> {
	const { data, error } = await client.from('api_keys').update(apiKey).eq('id', id).select().single();
	if (error) throw error;
	return data;
}

export async function deleteApiKey(
	id: string,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<void> {
	const { error } = await client.from('api_keys').delete().eq('id', id);
	if (error) throw error;
}

export async function getApiKeyByProvider(
	provider: string,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<ApiKey | null> {
	const { data, error } = await client
		.from('api_keys')
		.select('*')
		.eq('provider', provider)
		.single();
	if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
	return data;
}

export async function getApiKey(
	id: string,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<ApiKey | null> {
	const { data, error } = await client.from('api_keys').select('*').eq('id', id).single();
	if (error) throw error;
	return data;
} 