export async function fetchWithTimeout(resource: string, options: RequestInit = {}, timeout = 30000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const finalOptions = { ...options, signal: controller.signal };

  try {
    const response = await fetch(resource, finalOptions);
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw new Error(`Fetch request to ${resource} timed out or failed: ${error}`);
  }
} 