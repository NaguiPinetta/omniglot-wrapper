import { getGlossary } from '$lib/glossary/api';
import type { GlossaryEntry } from '../../types/glossary';

export const load = async () => {
  try {
    const entries = await getGlossary();
    return {
      entries,
      error: null
    };
  } catch (e) {
    console.error('Error loading glossary:', e);
    return {
      entries: [],
      error: e instanceof Error ? e.message : 'Failed to load glossary entries'
    };
  }
}; 