export interface ApiKey {
	id: string;
	provider: string;
	key_value: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface ApiKeyFormData {
	provider: string;
	key_value: string;
}

export type ModelAccessType = 'api_key' | 'gateway' | 'free' | 'demo';

export type Model = {
	id: string;
	name: string;
	provider: string;
	description?: string;
	context_length?: number;
	input_cost_per_token?: number;
	output_cost_per_token?: number;
	is_active: boolean;
	api_key_id: string;
	
	// Access control fields
	access_type: ModelAccessType;
	gateway_endpoint?: string;
	free_tier_limit?: number;
	requires_auth: boolean;
	
	created_at: string;
	updated_at?: string;
};

export interface ModelStore {
	models: Model[];
	apiKeys: ApiKey[];
	loading: boolean;
	error: string | null;
} 