import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseClient } from '../supabaseClient';

export interface UsageRecord {
  id: string;
  model_id: string;
  user_id: string;
  agent_id?: string;
  requests_count: number;
  tokens_used: number;
  usage_date: string;
  created_at: string;
  updated_at: string;
}

export interface UsageStats {
  model_id: string;
  model_name: string;
  daily_limit: number;
  used_today: number;
  remaining: number;
  can_use: boolean;
}

// Get current user ID (for now, use session-based ID)
function getUserId(): string {
  if (typeof window !== 'undefined') {
    let userId = localStorage.getItem('omniglot_user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('omniglot_user_id', userId);
    }
    return userId;
  }
  return 'server_user'; // Fallback for server-side
}

// Check if user can use a free/demo model
export async function checkUsageLimit(
  modelId: string,
  customSupabaseClient?: SupabaseClient
): Promise<boolean> {
  const supabase = customSupabaseClient || supabaseClient;
  const userId = getUserId();
  
  try {
    const { data, error } = await supabase.rpc('check_free_tier_limit', {
      p_model_id: modelId,
      p_user_id: userId
    });
    
    if (error) {
      console.error('Error checking usage limit:', error);
      return false;
    }
    
    return data === true;
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return false;
  }
}

// Increment usage count for a model
export async function incrementUsage(
  modelId: string,
  agentId?: string,
  tokensUsed: number = 0,
  customSupabaseClient?: SupabaseClient
): Promise<boolean> {
  const supabase = customSupabaseClient || supabaseClient;
  const userId = getUserId();
  
  try {
    const { data, error } = await supabase.rpc('increment_usage', {
      p_model_id: modelId,
      p_user_id: userId,
      p_agent_id: agentId,
      p_tokens_used: tokensUsed
    });
    
    if (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
    
    return data === true;
  } catch (error) {
    console.error('Error incrementing usage:', error);
    return false;
  }
}

// Get usage statistics for free/demo models
export async function getUsageStats(
  customSupabaseClient?: SupabaseClient
): Promise<UsageStats[]> {
  const supabase = customSupabaseClient || supabaseClient;
  const userId = getUserId();
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // Get free/demo models with their limits
    const { data: models, error: modelsError } = await supabase
      .from('models')
      .select('id, name, free_tier_limit, access_type')
      .in('access_type', ['free', 'demo'])
      .eq('is_active', true);
    
    if (modelsError) throw modelsError;
    
    // Get today's usage for these models
    const { data: usage, error: usageError } = await supabase
      .from('usage_tracking')
      .select('model_id, requests_count')
      .eq('user_id', userId)
      .eq('usage_date', today)
      .in('model_id', models?.map((m: any) => m.id) || []);
    
    if (usageError) throw usageError;
    
    // Combine data
    const stats: UsageStats[] = (models || []).map((model: any) => {
      const usageRecord = (usage || []).find((u: any) => u.model_id === model.id);
      const usedToday = usageRecord?.requests_count || 0;
      const dailyLimit = model.free_tier_limit || 0;
      
      return {
        model_id: model.id,
        model_name: model.name,
        daily_limit: dailyLimit,
        used_today: usedToday,
        remaining: Math.max(0, dailyLimit - usedToday),
        can_use: usedToday < dailyLimit
      };
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting usage stats:', error);
    return [];
  }
}

// Get detailed usage history
export async function getUsageHistory(
  modelId?: string,
  days: number = 7,
  customSupabaseClient?: SupabaseClient
): Promise<UsageRecord[]> {
  const supabase = customSupabaseClient || supabaseClient;
  const userId = getUserId();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  try {
    let query = supabase
      .from('usage_tracking')
      .select(`
        id,
        model_id,
        user_id,
        agent_id,
        requests_count,
        tokens_used,
        usage_date,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .gte('usage_date', startDate.toISOString().split('T')[0])
      .order('usage_date', { ascending: false });
    
    if (modelId) {
      query = query.eq('model_id', modelId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting usage history:', error);
    return [];
  }
} 