import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  HealthSpecialistAgent,
  ConversationMode,
  HealthConversation,
  MultiAgentMessage,
  HealthConversationSettings
} from '../types';

interface MultiAgentState {
  // Conversations
  activeConversationId: string | null;
  conversations: Map<string, HealthConversation>;

  // Agents
  availableAgents: HealthSpecialistAgent[];
  selectedAgents: string[];
  facilitatorAgent: HealthSpecialistAgent | null;

  // UI State
  conversationMode: ConversationMode | null;
  isGeneratingResponse: boolean;
  isConsensusBuilding: boolean;

  // Settings
  globalSettings: HealthConversationSettings;

  // Actions
  setActiveConversation: (id: string | null) => void;
  createConversation: (mode: ConversationMode, userId: string) => string;
  addMessage: (conversationId: string, message: Omit<MultiAgentMessage, 'id' | 'timestamp'>) => void;
  updateConversationSettings: (conversationId: string, settings: Partial<HealthConversationSettings>) => void;

  // Agent Management
  selectAgent: (agentId: string) => void;
  deselectAgent: (agentId: string) => void;
  setFacilitator: (agent: HealthSpecialistAgent | null) => void;
  addAgent: (agent: HealthSpecialistAgent) => void;

  // Conversation Mode
  setConversationMode: (mode: ConversationMode | null) => void;

  // Response Generation
  setGeneratingResponse: (generating: boolean) => void;
  setConsensusBuilding: (building: boolean) => void;

  // Utilities
  getActiveConversation: () => HealthConversation | null;
  getSelectedAgentObjects: () => HealthSpecialistAgent[];
  clearConversation: (conversationId: string) => void;
}

// Default health conversation modes
const defaultConversationModes: ConversationMode[] = [
  {
    id: 'health_assessment',
    name: 'Health Assessment',
    description: 'Comprehensive health evaluation with multiple specialists',
    icon: '🩺',
    color: 'blue',
    requiredSpecializations: ['primary_care'],
    maxParticipants: 4,
    facilitationStyle: 'facilitated'
  },
  {
    id: 'care_planning',
    name: 'Care Planning',
    description: 'Collaborative care plan development',
    icon: '📋',
    color: 'green',
    maxParticipants: 5,
    facilitationStyle: 'consensus'
  },
  {
    id: 'wellness_coaching',
    name: 'Wellness Coaching',
    description: 'Lifestyle and behavior coaching session',
    icon: '🏃‍♀️',
    color: 'orange',
    requiredSpecializations: ['wellness_coaching'],
    maxParticipants: 3,
    facilitationStyle: 'collaborative'
  },
  {
    id: 'crisis_support',
    name: 'Crisis Support',
    description: 'Immediate mental health and crisis intervention',
    icon: '🚨',
    color: 'red',
    requiredSpecializations: ['mental_health'],
    maxParticipants: 2,
    facilitationStyle: 'facilitated'
  },
  {
    id: 'chronic_care',
    name: 'Chronic Care Management',
    description: 'Ongoing support for chronic conditions',
    icon: '💊',
    color: 'purple',
    requiredSpecializations: ['chronic_care'],
    maxParticipants: 4,
    facilitationStyle: 'sequential'
  }
];

// Default health specialist agents
const defaultHealthAgents: HealthSpecialistAgent[] = [
  {
    id: 'dr-maya-wellness',
    name: 'Dr. Maya Patel',
    title: 'Primary Care Physician & Wellness Expert',
    specialization: 'primary_care',
    avatar: '👩‍⚕️',
    expertise: ['preventive care', 'lifestyle medicine', 'chronic disease management', 'health screening'],
    personalityTraits: ['compassionate', 'evidence-based', 'holistic', 'patient-centered'],
    communicationStyle: 'supportive',
    bio: 'Board-certified family medicine physician specializing in lifestyle medicine and preventive care.',
    credentials: ['MD', 'Board Certified Family Medicine', 'Lifestyle Medicine Certification'],
    systemPrompt: 'You are Dr. Maya Patel, a compassionate primary care physician who takes a holistic approach to health. Focus on evidence-based medicine while considering the whole person.',
    isActive: true,
    mayoClinicAffiliation: true
  },
  {
    id: 'coach-alex-fitness',
    name: 'Alex Chen',
    title: 'Certified Exercise Physiologist',
    specialization: 'movement',
    avatar: '🏋️‍♂️',
    expertise: ['exercise prescription', 'injury prevention', 'fitness assessment', 'athletic performance'],
    personalityTraits: ['motivational', 'energetic', 'goal-oriented', 'encouraging'],
    communicationStyle: 'motivational',
    bio: 'Certified exercise physiologist with expertise in creating personalized fitness programs for all ability levels.',
    credentials: ['MS Exercise Physiology', 'ACSM Certified Exercise Physiologist', 'NSCA-CSCS'],
    systemPrompt: 'You are Alex Chen, an energetic and motivational exercise physiologist. Help users achieve their fitness goals with safe, evidence-based exercise recommendations.',
    isActive: true,
    mayoClinicAffiliation: false
  },
  {
    id: 'nutritionist-sarah',
    name: 'Sarah Williams, RD',
    title: 'Registered Dietitian Nutritionist',
    specialization: 'nutrition',
    avatar: '🥗',
    expertise: ['clinical nutrition', 'meal planning', 'weight management', 'eating disorders'],
    personalityTraits: ['knowledgeable', 'practical', 'non-judgmental', 'encouraging'],
    communicationStyle: 'analytical',
    bio: 'Registered dietitian specializing in evidence-based nutrition for optimal health and disease prevention.',
    credentials: ['MS Nutrition', 'RD', 'CDE (Certified Diabetes Educator)'],
    systemPrompt: 'You are Sarah Williams, a knowledgeable and practical registered dietitian. Provide evidence-based nutrition advice that is realistic and sustainable.',
    isActive: true,
    mayoClinicAffiliation: true
  },
  {
    id: 'therapist-david',
    name: 'Dr. David Rodriguez',
    title: 'Licensed Clinical Psychologist',
    specialization: 'mental_health',
    avatar: '🧠',
    expertise: ['cognitive behavioral therapy', 'stress management', 'mindfulness', 'health psychology'],
    personalityTraits: ['empathetic', 'insightful', 'calm', 'supportive'],
    communicationStyle: 'empathetic',
    bio: 'Licensed clinical psychologist specializing in health psychology and behavioral medicine.',
    credentials: ['PhD Clinical Psychology', 'Licensed Psychologist', 'Health Psychology Certification'],
    systemPrompt: 'You are Dr. David Rodriguez, an empathetic and insightful psychologist. Help users with mental health, stress management, and behavior change using evidence-based therapeutic approaches.',
    isActive: true,
    mayoClinicAffiliation: true
  },
  {
    id: 'sleep-specialist-lisa',
    name: 'Dr. Lisa Johnson',
    title: 'Sleep Medicine Specialist',
    specialization: 'sleep',
    avatar: '😴',
    expertise: ['sleep disorders', 'sleep hygiene', 'circadian rhythms', 'sleep apnea'],
    personalityTraits: ['thorough', 'scientific', 'patient', 'detail-oriented'],
    communicationStyle: 'clinical',
    bio: 'Board-certified sleep medicine specialist focused on optimizing sleep for better health outcomes.',
    credentials: ['MD', 'Board Certified Sleep Medicine', 'Pulmonary Medicine'],
    systemPrompt: 'You are Dr. Lisa Johnson, a thorough and scientific sleep specialist. Help users understand and improve their sleep quality with evidence-based recommendations.',
    isActive: true,
    mayoClinicAffiliation: true
  },
  {
    id: 'facilitator-dr-chen',
    name: 'Dr. Jennifer Chen',
    title: 'Health Team Facilitator',
    specialization: 'wellness_coaching',
    avatar: '👥',
    expertise: ['team facilitation', 'care coordination', 'behavioral economics', 'health coaching'],
    personalityTraits: ['organized', 'diplomatic', 'strategic', 'collaborative'],
    communicationStyle: 'analytical',
    bio: 'Health team facilitator specializing in coordinating multidisciplinary care teams for optimal patient outcomes.',
    credentials: ['MD', 'MPH', 'Health Coaching Certification', 'Team Facilitation Training'],
    systemPrompt: 'You are Dr. Jennifer Chen, a skilled health team facilitator. Help coordinate discussions between specialists, build consensus, and ensure all perspectives are heard.',
    isActive: true,
    mayoClinicAffiliation: true
  }
];

// Default settings
const defaultSettings: HealthConversationSettings = {
  enableConsensusBuilding: true,
  enableFacilitation: true,
  maxResponseRounds: 3,
  requireUnanimous: false,
  enableVoiceMode: true,
  autoEscalation: true,
  enableHealthTracking: true,
  privacyLevel: 'individual'
};

export const useMultiAgentStore = create<MultiAgentState>()(
  persist(
    (set, get) => ({
      // Initial State
      activeConversationId: null,
      conversations: new Map(),
      availableAgents: defaultHealthAgents,
      selectedAgents: [],
      facilitatorAgent: null,
      conversationMode: null,
      isGeneratingResponse: false,
      isConsensusBuilding: false,
      globalSettings: defaultSettings,

      // Actions
      setActiveConversation: (id) => {
        set({ activeConversationId: id });
      },

      createConversation: (mode, userId) => {
        const id = `conversation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const conversation: HealthConversation = {
          id,
          userId,
          mode,
          messages: [],
          selectedAgents: get().selectedAgents,
          facilitatorAgent: get().facilitatorAgent || undefined,
          documentIds: [],
          healthGoalIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: { ...get().globalSettings },
          metadata: {
            phase: 'assessment',
            consensusReached: false,
            carePlanUpdated: false
          }
        };

        set((state) => ({
          conversations: new Map(state.conversations).set(id, conversation),
          activeConversationId: id
        }));

        return id;
      },

      addMessage: (conversationId, messageData) => {
        const message: MultiAgentMessage = {
          ...messageData,
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date()
        };

        set((state) => {
          const conversations = new Map(state.conversations);
          const conversation = conversations.get(conversationId);
          if (conversation) {
            const updatedConversation = {
              ...conversation,
              messages: [...conversation.messages, message],
              updatedAt: new Date()
            };
            conversations.set(conversationId, updatedConversation);
          }
          return { conversations };
        });
      },

      updateConversationSettings: (conversationId, newSettings) => {
        set((state) => {
          const conversations = new Map(state.conversations);
          const conversation = conversations.get(conversationId);
          if (conversation) {
            const updatedConversation = {
              ...conversation,
              settings: { ...conversation.settings, ...newSettings },
              updatedAt: new Date()
            };
            conversations.set(conversationId, updatedConversation);
          }
          return { conversations };
        });
      },

      // Agent Management
      selectAgent: (agentId) => {
        set((state) => {
          if (!state.selectedAgents.includes(agentId)) {
            return { selectedAgents: [...state.selectedAgents, agentId] };
          }
          return state;
        });
      },

      deselectAgent: (agentId) => {
        set((state) => ({
          selectedAgents: state.selectedAgents.filter(id => id !== agentId)
        }));
      },

      setFacilitator: (agent) => {
        set({ facilitatorAgent: agent });
      },

      addAgent: (agent) => {
        set((state) => ({
          availableAgents: [...state.availableAgents, agent]
        }));
      },

      // Conversation Mode
      setConversationMode: (mode) => {
        set({ conversationMode: mode });
      },

      // Response Generation
      setGeneratingResponse: (generating) => {
        set({ isGeneratingResponse: generating });
      },

      setConsensusBuilding: (building) => {
        set({ isConsensusBuilding: building });
      },

      // Utilities
      getActiveConversation: () => {
        const state = get();
        return state.activeConversationId
          ? state.conversations.get(state.activeConversationId) || null
          : null;
      },

      getSelectedAgentObjects: () => {
        const state = get();
        return state.selectedAgents
          .map(id => state.availableAgents.find(agent => agent.id === id))
          .filter(Boolean) as HealthSpecialistAgent[];
      },

      clearConversation: (conversationId) => {
        set((state) => {
          const conversations = new Map(state.conversations);
          conversations.delete(conversationId);
          return {
            conversations,
            activeConversationId: state.activeConversationId === conversationId
              ? null
              : state.activeConversationId
          };
        });
      }
    }),
    {
      name: 'multi-agent-health-store',
      partialize: (state) => ({
        conversations: Array.from(state.conversations.entries()),
        globalSettings: state.globalSettings,
        selectedAgents: state.selectedAgents,
        facilitatorAgent: state.facilitatorAgent
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.conversations) {
          // Convert array back to Map
          state.conversations = new Map(state.conversations as any);
        }
      }
    }
  )
);

// Export conversation modes for use in components
export { defaultConversationModes };