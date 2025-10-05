import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type AgentSpecialty =
  | 'nutrition'
  | 'physical_activity'
  | 'sleep'
  | 'stress_management'
  | 'social_connection'
  | 'substance_avoidance'
  | 'general';

export interface HealthAgent {
  id: string;
  name: string;
  specialty: AgentSpecialty;
  description: string;
  systemPrompt: string;
  isActive: boolean;
  expertise: string[];
  consultationCount: number;
  lastConsulted?: Date;
}

export interface AgentConsultation {
  id: string;
  agentId: string;
  agentName: string;
  specialty: AgentSpecialty;
  query: string;
  response: string;
  confidence: number;
  timestamp: Date;
  usedInResponse: boolean;
}

interface AgentState {
  agents: HealthAgent[];
  activeAgent: HealthAgent | null;
  consultationHistory: AgentConsultation[];
  isConsulting: boolean;
  error: string | null;

  // Actions
  initializeAgents: () => void;
  setActiveAgent: (agentId: string | null) => void;
  consultAgent: (agentId: string, query: string) => Promise<AgentConsultation>;
  addConsultation: (consultation: AgentConsultation) => void;
  getAgentsBySpecialty: (specialty: AgentSpecialty) => HealthAgent[];
  getRelevantAgents: (query: string) => Promise<HealthAgent[]>;
  clearConsultationHistory: () => void;
}

// Default 6 Lifestyle Medicine Pillar Agents
const defaultAgents: HealthAgent[] = [
  {
    id: 'nutrition-specialist',
    name: 'Dr. Sarah Chen',
    specialty: 'nutrition',
    description: 'Board-certified nutrition specialist focused on evidence-based dietary interventions',
    systemPrompt: `You are Dr. Sarah Chen, a Mayo Clinic nutrition specialist. You provide evidence-based nutritional guidance aligned with lifestyle medicine principles. Focus on whole foods, Mediterranean diet patterns, and sustainable dietary changes. Always consider the user's current health conditions, medications, and preferences. Cite specific Mayo Clinic protocols when relevant.`,
    isActive: true,
    expertise: ['Mediterranean diet', 'Diabetes management', 'Heart-healthy eating', 'Weight management', 'Anti-inflammatory foods'],
    consultationCount: 0,
  },
  {
    id: 'physical-activity-coach',
    name: 'Coach Marcus Thompson',
    specialty: 'physical_activity',
    description: 'Exercise physiologist specializing in personalized activity programs',
    systemPrompt: `You are Coach Marcus Thompson, a Mayo Clinic exercise physiologist. You design personalized, progressive activity programs that consider current fitness level, health limitations, and goals. Emphasize movement as medicine - focus on consistency over intensity, especially for beginners. Incorporate strength, cardio, flexibility, and balance training.`,
    isActive: true,
    expertise: ['Progressive training', 'Cardiac rehab', 'Senior fitness', 'Injury prevention', 'Movement as medicine'],
    consultationCount: 0,
  },
  {
    id: 'sleep-optimization-expert',
    name: 'Dr. Emily Patel',
    specialty: 'sleep',
    description: 'Sleep medicine physician focused on circadian rhythm optimization',
    systemPrompt: `You are Dr. Emily Patel, a Mayo Clinic sleep medicine specialist. You help optimize sleep quality through circadian rhythm alignment, sleep hygiene, and behavioral interventions. Address common sleep disorders (insomnia, sleep apnea) with evidence-based non-pharmacological approaches first. Consider how medications and health conditions affect sleep.`,
    isActive: true,
    expertise: ['Circadian rhythm', 'Insomnia CBT', 'Sleep apnea', 'Sleep hygiene', 'Chronotype optimization'],
    consultationCount: 0,
  },
  {
    id: 'stress-management-therapist',
    name: 'Dr. James Rodriguez',
    specialty: 'stress_management',
    description: 'Clinical psychologist specializing in stress reduction and resilience',
    systemPrompt: `You are Dr. James Rodriguez, a Mayo Clinic clinical psychologist. You teach evidence-based stress management techniques including mindfulness, cognitive behavioral therapy (CBT), and resilience building. Help users identify stress triggers, develop healthy coping mechanisms, and build emotional regulation skills. Recognize when professional mental health support may be needed.`,
    isActive: true,
    expertise: ['Mindfulness-based stress reduction', 'CBT techniques', 'Resilience training', 'Emotional regulation', 'Burnout prevention'],
    consultationCount: 0,
  },
  {
    id: 'social-connection-facilitator',
    name: 'Dr. Lisa Wang',
    specialty: 'social_connection',
    description: 'Social wellness specialist focused on meaningful relationship building',
    systemPrompt: `You are Dr. Lisa Wang, a Mayo Clinic social wellness specialist. You help users build and maintain meaningful social connections, recognizing social health as a key determinant of overall wellbeing. Address loneliness, social anxiety, and relationship quality. Provide strategies for community engagement, communication skills, and building support networks.`,
    isActive: true,
    expertise: ['Loneliness prevention', 'Communication skills', 'Community engagement', 'Support networks', 'Social anxiety'],
    consultationCount: 0,
  },
  {
    id: 'substance-avoidance-counselor',
    name: 'Dr. Michael Foster',
    specialty: 'substance_avoidance',
    description: 'Addiction medicine specialist focused on prevention and recovery',
    systemPrompt: `You are Dr. Michael Foster, a Mayo Clinic addiction medicine specialist. You provide compassionate, evidence-based guidance on substance use, harm reduction, and recovery. Address alcohol, tobacco, recreational drugs, and problematic medication use. Focus on prevention, early intervention, and sustainable recovery strategies. Recognize when intensive treatment programs may be needed.`,
    isActive: true,
    expertise: ['Smoking cessation', 'Alcohol moderation', 'Harm reduction', 'Relapse prevention', 'Recovery support'],
    consultationCount: 0,
  },
];

export const useAgentStore = create<AgentState>()(
  immer((set, get) => ({
    agents: [],
    activeAgent: null,
    consultationHistory: [],
    isConsulting: false,
    error: null,

    initializeAgents: () => {
      set({ agents: defaultAgents });
    },

    setActiveAgent: (agentId) => {
      const { agents } = get();
      const agent = agentId ? agents.find(a => a.id === agentId) || null : null;
      set({ activeAgent: agent });
    },

    consultAgent: async (agentId, query) => {
      const { agents } = get();
      const agent = agents.find(a => a.id === agentId);

      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      set({ isConsulting: true, error: null });

      try {
        // TODO: Integrate with actual LLM API (OpenAI/Anthropic)
        // For now, return mock consultation
        const consultation: AgentConsultation = {
          id: `consultation-${Date.now()}`,
          agentId: agent.id,
          agentName: agent.name,
          specialty: agent.specialty,
          query,
          response: `[${agent.name}]: I would recommend... (Mock response - integrate with LLM)`,
          confidence: 0.85,
          timestamp: new Date(),
          usedInResponse: false,
        };

        set((state) => {
          state.consultationHistory.push(consultation);
          const agentIndex = state.agents.findIndex(a => a.id === agentId);
          if (agentIndex !== -1) {
            state.agents[agentIndex].consultationCount += 1;
            state.agents[agentIndex].lastConsulted = new Date();
          }
          state.isConsulting = false;
        });

        return consultation;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Consultation failed',
          isConsulting: false
        });
        throw error;
      }
    },

    addConsultation: (consultation) => {
      set((state) => {
        state.consultationHistory.push(consultation);
      });
    },

    getAgentsBySpecialty: (specialty) => {
      const { agents } = get();
      return agents.filter(a => a.specialty === specialty && a.isActive);
    },

    getRelevantAgents: async (query) => {
      const { agents } = get();

      // Simple keyword matching for now
      // TODO: Implement semantic search with embeddings
      const keywords: Record<AgentSpecialty, string[]> = {
        nutrition: ['food', 'eat', 'diet', 'meal', 'nutrition', 'recipe', 'hungry', 'weight'],
        physical_activity: ['exercise', 'workout', 'walk', 'run', 'active', 'move', 'fitness', 'strength'],
        sleep: ['sleep', 'tired', 'insomnia', 'rest', 'bedtime', 'wake', 'fatigue'],
        stress_management: ['stress', 'anxious', 'worry', 'overwhelmed', 'calm', 'relax', 'mindfulness'],
        social_connection: ['lonely', 'friends', 'social', 'connect', 'relationship', 'community'],
        substance_avoidance: ['smoke', 'drink', 'alcohol', 'quit', 'addiction', 'substance'],
        general: [],
      };

      const queryLower = query.toLowerCase();
      const relevantAgents: HealthAgent[] = [];

      for (const agent of agents) {
        if (!agent.isActive) continue;

        const agentKeywords = keywords[agent.specialty];
        if (agentKeywords.some(keyword => queryLower.includes(keyword))) {
          relevantAgents.push(agent);
        }
      }

      // If no specific agents found, return general agent
      if (relevantAgents.length === 0) {
        const generalAgent = agents.find(a => a.specialty === 'general');
        if (generalAgent) relevantAgents.push(generalAgent);
      }

      return relevantAgents;
    },

    clearConsultationHistory: () => {
      set({ consultationHistory: [] });
    },
  }))
);
