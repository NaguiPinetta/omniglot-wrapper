import type { PageServerLoad } from './$types';
import { createServerSupabaseClient } from '$lib/server/supabase';

export const load: PageServerLoad = async (event) => {
	const supabase = await createServerSupabaseClient(event);
	
	try {
		// Get current user from session
		const { data: { user }, error: userError } = await supabase.auth.getUser();
		console.log('Current user:', user);
		
		// Check if user exists in public.users table
		const { data: userProfile, error: profileError } = await supabase
			.from('users')
			.select('*')
			.eq('email', user?.email)
			.single();
		
		// Count jobs for this user
		const { data: jobsData, error: jobsError, count: jobsCount } = await supabase
			.from('jobs')
			.select('*', { count: 'exact' })
			.eq('user_id', user?.id);
		
		// Count agents for this user
		const { data: agentsData, error: agentsError, count: agentsCount } = await supabase
			.from('agents')
			.select('*', { count: 'exact' })
			.eq('user_id', user?.id);
		
		// Count datasets for this user
		const { data: datasetsData, error: datasetsError, count: datasetsCount } = await supabase
			.from('datasets')
			.select('*', { count: 'exact' })
			.eq('user_id', user?.id);
		
		// Try to get a sample of jobs without user filter to see if data exists
		const { data: allJobsSample, error: allJobsError } = await supabase
			.from('jobs')
			.select('id, user_id, name')
			.limit(5);
		
		// Try to get a sample of agents without user filter
		const { data: allAgentsSample, error: allAgentsError } = await supabase
			.from('agents')
			.select('id, user_id, name')
			.limit(5);
		
		return {
			debug: {
				currentUser: user,
				userError,
				userProfile,
				profileError,
				jobsCount,
				jobsError,
				agentsCount,
				agentsError,
				datasetsCount,
				datasetsError,
				allJobsSample,
				allJobsError,
				allAgentsSample,
				allAgentsError,
				sessionUserId: user?.id,
				userEmail: user?.email
			}
		};
	} catch (error) {
		console.error('Debug page error:', error);
		return {
			debug: {
				error: error instanceof Error ? error.message : 'Unknown error'
			}
		};
	}
};
