import { writable } from 'svelte/store';
import type { Agent, AgentStore } from '../types/agents';
import { getAgents } from '../lib/agents/api';

// Store for the currently selected agent
export const selectedAgent = writable<Agent | null>(null);

// Store for glossary toggle state
export const glossaryEnabled = writable<boolean>(false);

// Store for all available agents
export const agents = writable<Agent[]>([]);

function createAgentStore() {
  const { subscribe, set, update } = writable<AgentStore>({
    agents: [],
    loading: false,
    error: null
  });

  return {
    subscribe,
    
    // Load all agents
    async loadAgents() {
      update(state => ({ ...state, loading: true, error: null }));
      try {
        const agents = await getAgents();
        update(state => ({ ...state, agents }));
      } catch (error) {
        update(state => ({ ...state, error: error instanceof Error ? error.message : 'Failed to load agents' }));
      } finally {
        update(state => ({ ...state, loading: false }));
      }
    },

    // Add a new agent
    addAgent(agent: Agent) {
      update(state => ({
        ...state,
        agents: [agent, ...state.agents]
      }));
    },

    // Update an existing agent
    updateAgent(updatedAgent: Agent) {
      update(state => ({
        ...state,
        agents: state.agents.map(a => 
          a.id === updatedAgent.id ? updatedAgent : a
        )
      }));
    },

    // Remove an agent
    removeAgent(id: string) {
      update(state => ({
        ...state,
        agents: state.agents.filter(a => a.id !== id)
      }));
    },

    // Toggle agent status
    toggleAgentStatus(id: string, isActive: boolean) {
      update(state => ({
        ...state,
        agents: state.agents.map(a => 
          a.id === id ? { ...a, is_active: isActive } : a
        )
      }));
    },

    // Reset the store
    reset() {
      set({
        agents: [],
        loading: false,
        error: null
      });
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

  addAgent: (agent: Agent) => {
    agentStore.addAgent(agent);
  },

  updateAgent: (updatedAgent: Agent) => {
    agentStore.updateAgent(updatedAgent);
  },

  deleteAgent: (id: string) => {
    agentStore.removeAgent(id);
  },

  toggleAgentStatus: (id: string, isActive: boolean) => {
    agentStore.toggleAgentStatus(id, isActive);
  },

  reset: () => {
    agentStore.reset();
  }
}; 