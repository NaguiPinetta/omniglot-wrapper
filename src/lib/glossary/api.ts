import type { GlossaryEntry } from '../../types/glossary';

export async function getGlossaryEntries(fetchFn: typeof fetch = fetch): Promise<GlossaryEntry[]> {
	const response = await fetchFn('/glossary');
	if (!response.ok) {
		throw new Error(`Failed to fetch glossary entries: ${response.status} ${response.statusText}`);
	}
	return response.json();
}

export async function getModules(fetchFn: typeof fetch = fetch): Promise<{ id: string; name: string; description?: string }[]> {
	const response = await fetchFn('/api/modules');
	if (!response.ok) {
		throw new Error(`Failed to fetch modules: ${response.status} ${response.statusText}`);
	}
	return response.json();
}

export async function createGlossaryEntry(
	entry: Omit<GlossaryEntry, 'id' | 'created_at' | 'module_name'>,
	fetchFn: typeof fetch = fetch
): Promise<GlossaryEntry> {
	const response = await fetchFn('/glossary', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(entry),
	});
	
	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to create glossary entry: ${response.status} ${response.statusText} - ${errorText}`);
	}
	
	return response.json();
}

export async function updateGlossaryEntry(
	id: string,
	entry: Partial<Omit<GlossaryEntry, 'id' | 'created_at' | 'module_name'>>,
	fetchFn: typeof fetch = fetch
): Promise<GlossaryEntry> {
	const response = await fetchFn('/glossary', {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ id, ...entry }),
	});
	
	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to update glossary entry: ${response.status} ${response.statusText} - ${errorText}`);
	}
	
	return response.json();
}

export async function deleteGlossaryEntry(id: string, fetchFn: typeof fetch = fetch): Promise<void> {
	const response = await fetchFn('/glossary', {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ id }),
	});
	
	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to delete glossary entry: ${response.status} ${response.statusText} - ${errorText}`);
	}
}

export async function updateLastUsed(id: string, fetchFn: typeof fetch = fetch): Promise<void> {
	const response = await fetchFn('/glossary', {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ id, action: 'updateLastUsed' }),
	});
	
	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to update last used: ${response.status} ${response.statusText} - ${errorText}`);
	}
} 