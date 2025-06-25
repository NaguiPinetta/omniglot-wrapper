import { writable } from 'svelte/store';
import type { Agent, AgentStore } from '../types/agents';
import { getAgents, createAgent, updateAgent, deleteAgent } from '../lib/agents/api';

// Store for the currently selected agent
export const selectedAgent = writable<Agent | null>(null);

// Store for glossary toggle state
export const glossaryEnabled = writable<boolean>(false);

// Store for all available agents
export const agents = writable<Agent[]>([]);

const initialState: AgentStore = {
    agents: [],
    loading: false,
    error: null
};

function createAgentStore() {
	const { subscribe, set, update } = writable<AgentStore>(initialState);

  return {
    subscribe,
    set,
    
    async loadAgents() {
      update(state => ({ ...state, loading: true, error: null }));
      try {
        const agents = await getAgents();
				update(state => ({ ...state, agents, loading: false }));
      } catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to load agents';
				update(state => ({ ...state, loading: false, error: errorMessage }));
      }
    },

		async addAgent(agentData: Omit<Agent, 'id' | 'created_at'>) {
			console.log('addAgent called with:', agentData);
			update(state => ({ ...state, loading: true, error: null }));
			try {
				const newAgent = await createAgent(agentData);
				console.log('createAgent returned:', newAgent);
      update(state => ({
        ...state,
					agents: [newAgent, ...state.agents],
					loading: false
      }));
			} catch (error) {
				console.error('addAgent error:', error);
				const errorMessage = error instanceof Error ? error.message : 'Failed to create agent';
				update(state => ({ ...state, loading: false, error: errorMessage }));
			}
		},

		async updateAgent(id: string, agentData: Partial<Agent>) {
			update(state => ({ ...state, loading: true, error: null }));
			try {
				const updatedAgent = await updateAgent(id, agentData);
      update(state => ({
        ...state,
					agents: state.agents.map(a => a.id === id ? updatedAgent : a),
					loading: false
      }));
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to update agent';
				update(state => ({ ...state, loading: false, error: errorMessage }));
			}
		},

		async deleteAgent(id: string) {
			update(state => ({ ...state, loading: true, error: null }));
			try {
				await deleteAgent(id);
      update(state => ({
        ...state,
					agents: state.agents.filter(a => a.id !== id),
					loading: false
      }));
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to delete agent';
				update(state => ({ ...state, loading: false, error: errorMessage }));
			}
		},

		// Commented out since is_active field doesn't exist in database
		// async toggleAgentStatus(id: string, isActive: boolean) {
		// 	update(state => ({ ...state, loading: true, error: null }));
		// 	try {
		// 		await toggleAgentStatus(id, isActive);
		// 		update(state => ({
		// 			...state,
		// 			agents: state.agents.map(a =>
		// 				a.id === id ? { ...a, is_active: isActive } : a
		// 			),
		// 			loading: false
		// 		}));
		// 	} catch (error) {
		// 		const errorMessage = error instanceof Error ? error.message : 'Failed to toggle agent status';
		// 		update(state => ({ ...state, loading: false, error: errorMessage }));
		// 	}
		// },

		clearError() {
			update(state => ({ ...state, error: null }));
		},

		setAgents(agents: Agent[]) {
			update(state => ({ ...state, agents, error: null }));
		},

		setError(error: string) {
			update(state => ({ ...state, error }));
    }
  };
}

export const agentStore = createAgentStore();

// Actions for agent management
export const agentActions = {
  setSelectedAgent: (agent: Agent | null) => {
    selectedAgent.set(agent);
  },

  toggleGlossary: () => {
    glossaryEnabled.update(enabled => !enabled);
  },

  setGlossaryEnabled: (enabled: boolean) => {
    glossaryEnabled.set(enabled);
  },

  setAgents: (agentList: Agent[]) => {
    agents.set(agentList);
  },

  createAgent: async (agent: Omit<Agent, 'id' | 'created_at'>) => {
    await agentStore.addAgent(agent);
  },

  updateAgent: async (id: string, agent: Partial<Agent>) => {
    await agentStore.updateAgent(id, agent);
  },

  deleteAgent: async (id: string) => {
    await agentStore.deleteAgent(id);
  },

  reset: () => {
    agentStore.clearError();
  }
}; 