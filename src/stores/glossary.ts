import { writable } from 'svelte/store';
import type { GlossaryEntry } from '../lib/supabaseClient';

// Store for glossary entries
export const glossaryEntries = writable<GlossaryEntry[]>([]);

// Store for selected glossary entries (for active translation)
export const selectedGlossaryEntries = writable<GlossaryEntry[]>([]);

// Actions for glossary management
export const glossaryActions = {
  setGlossaryEntries: (entries: GlossaryEntry[]) => {
    glossaryEntries.set(entries);
  },

  addGlossaryEntry: (entry: GlossaryEntry) => {
    glossaryEntries.update(currentEntries => [...currentEntries, entry]);
  },

  updateGlossaryEntry: (id: string, updates: Partial<GlossaryEntry>) => {
    glossaryEntries.update(currentEntries => 
      currentEntries.map(entry => 
        entry.id === id ? { ...entry, ...updates } : entry
      )
    );
  },

  deleteGlossaryEntry: (id: string) => {
    glossaryEntries.update(currentEntries => 
      currentEntries.filter(entry => entry.id !== id)
    );
  },

  setSelectedEntries: (entries: GlossaryEntry[]) => {
    selectedGlossaryEntries.set(entries);
  },

  clearSelectedEntries: () => {
    selectedGlossaryEntries.set([]);
  },

  // Load mock glossary data
  loadMockData: () => {
    const mockEntries: GlossaryEntry[] = [
      {
        id: '1',
        term: 'user interface',
        translation: 'interfaz de usuario',
        note: 'UI context',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        term: 'database',
        translation: 'base de datos',
        note: 'Data storage context',
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        term: 'application',
        translation: 'aplicación',
        note: 'Software context',
        created_at: new Date().toISOString()
      },
      {
        id: '4',
        term: 'save',
        translation: 'guardar',
        note: 'Action context',
        created_at: new Date().toISOString()
      },
      {
        id: '5',
        term: 'cancel',
        translation: 'cancelar',
        note: 'Action context',
        created_at: new Date().toISOString()
      }
    ];
    glossaryEntries.set(mockEntries);
  }
}; 