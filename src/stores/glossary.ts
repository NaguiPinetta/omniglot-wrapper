import { writable } from 'svelte/store';
import type { GlossaryEntry, GlossaryStore } from '../types/glossary';
import { getGlossaryEntries, createGlossaryEntry, updateGlossaryEntry, deleteGlossaryEntry } from '../lib/glossary/api';

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

function createGlossaryStore() {
  const { subscribe, set, update } = writable<GlossaryStore>({
    entries: [],
    loading: false,
    error: null
  });

  return {
    subscribe,
    
    async loadEntries() {
      update(state => ({ ...state, loading: true, error: null }));
      try {
        const entries = await getGlossaryEntries();
        set({ entries, loading: false, error: null });
      } catch (error) {
        set({ entries: [], loading: false, error: error instanceof Error ? error.message : 'Failed to load glossary' });
      }
    },

    async addEntry(entry: Omit<GlossaryEntry, 'id' | 'created_at'>) {
      update(state => ({ ...state, loading: true }));
      try {
        await createGlossaryEntry(entry);
        await this.loadEntries();
      } catch (error) {
        update(state => ({ ...state, loading: false, error: error instanceof Error ? error.message : 'Failed to add entry' }));
      }
    },

    async updateEntry(id: string, entry: Partial<GlossaryEntry>) {
      update(state => ({ ...state, loading: true }));
      try {
        await updateGlossaryEntry(id, entry);
        await this.loadEntries();
      } catch (error) {
        update(state => ({ ...state, loading: false, error: error instanceof Error ? error.message : 'Failed to update entry' }));
      }
    },

    async deleteEntry(id: string) {
      update(state => ({ ...state, loading: true }));
      try {
        await deleteGlossaryEntry(id);
        await this.loadEntries();
      } catch (error) {
        update(state => ({ ...state, loading: false, error: error instanceof Error ? error.message : 'Failed to delete entry' }));
      }
    },
  };
}

export const glossaryStore = createGlossaryStore(); 