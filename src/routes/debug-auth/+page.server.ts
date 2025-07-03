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
				userError: userError ? (userError.message ?? String(userError)) : null,
				userProfile,
				profileError: profileError ? (profileError.message ?? String(profileError)) : null,
				jobsCount,
				jobsError: jobsError ? (jobsError.message ?? String(jobsError)) : null,
				agentsCount,
				agentsError: agentsError ? (agentsError.message ?? String(agentsError)) : null,
				datasetsCount,
				datasetsError: datasetsError ? (datasetsError.message ?? String(datasetsError)) : null,
				allJobsSample,
				allJobsError: allJobsError ? (allJobsError.message ?? String(allJobsError)) : null,
				allAgentsSample,
				allAgentsError: allAgentsError ? (allAgentsError.message ?? String(allAgentsError)) : null,
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
