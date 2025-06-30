import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  // Just pass through to the client-side component
  // The client will handle the auth token processing
  console.log('Auth callback server - URL:', url.toString());
  
  return {
    url: url.toString()
  };
}; 