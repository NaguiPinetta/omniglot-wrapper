import type { Handle } from '@sveltejs/kit';

// Server-side hooks
// Add any server-side middleware here as needed

export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event);
};
