import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { supabase } from '../lib/supabase';
import type { Conversation, Message, ConversationContext } from '../types';

interface ConversationState {
  currentConversation: Conversation | null;
  conversations: Conversation[];
  isLoading: boolean;
  isTyping: boolean;
  isListening: boolean;
  suggestedResponses: string[];
  error: string | null;

  // Actions
  createConversation: (userId: string, companionId: string) => Promise<Conversation>;
  loadConversations: (userId: string) => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  setCurrentConversation: (conversation: Conversation | null) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Promise<void>;
  updateContext: (context: Partial<ConversationContext>) => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  setListening: (isListening: boolean) => void;
  setSuggestedResponses: (responses: string[]) => void;
  clearConversation: () => void;
}

export const useConversationStore = create<ConversationState>()(
  persist(
    immer((set, get) => ({
      currentConversation: null,
      conversations: [],
      isLoading: false,
      isTyping: false,
      isListening: false,
      suggestedResponses: [],
      error: null,

      createConversation: async (userId, companionId) => {
        set({ isLoading: true, error: null });

        try {
          const context: ConversationContext = {
            currentGoals: [],
            recentActivity: [],
            emotionalState: 'neutral',
            lastInteraction: new Date(),
            topicHistory: [],
          };

          const { data, error } = await supabase
            .from('conversations')
            .insert({
              user_id: userId,
              companion_id: companionId,
              context,
            })
            .select()
            .single();

          if (error) throw error;

          const conversation: Conversation = {
            id: data.id,
            userId: data.user_id,
            companionId: data.companion_id,
            messages: [],
            context: data.context,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
          };

          set((state) => {
            state.conversations.push(conversation);
            state.currentConversation = conversation;
            state.isLoading = false;
          });

          return conversation;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create conversation',
            isLoading: false
          });
          throw error;
        }
      },

      loadConversations: async (userId) => {
        set({ isLoading: true, error: null });

        try {
          const { data, error } = await supabase
            .from('conversations')
            .select(`
              *,
              messages (*)
            `)
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

          if (error) throw error;

          const conversations: Conversation[] = data.map((conv: any) => ({
            id: conv.id,
            userId: conv.user_id,
            companionId: conv.companion_id,
            messages: conv.messages.map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              type: msg.type,
              timestamp: new Date(msg.created_at),
              metadata: msg.metadata,
            })),
            context: conv.context,
            createdAt: new Date(conv.created_at),
            updatedAt: new Date(conv.updated_at),
          }));

          set({ conversations, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load conversations',
            isLoading: false
          });
        }
      },

      loadConversation: async (conversationId) => {
        set({ isLoading: true, error: null });

        try {
          const { data, error } = await supabase
            .from('conversations')
            .select(`
              *,
              messages (*)
            `)
            .eq('id', conversationId)
            .single();

          if (error) throw error;

          const conversation: Conversation = {
            id: data.id,
            userId: data.user_id,
            companionId: data.companion_id,
            messages: data.messages.map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              type: msg.type,
              timestamp: new Date(msg.created_at),
              metadata: msg.metadata,
            })),
            context: data.context,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
          };

          set({ currentConversation: conversation, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load conversation',
            isLoading: false
          });
        }
      },

      setCurrentConversation: (conversation) => {
        set({ currentConversation: conversation });
      },

      addMessage: async (message) => {
        const { currentConversation } = get();
        if (!currentConversation) {
          set({ error: 'No active conversation' });
          return;
        }

        try {
          const { data, error } = await supabase
            .from('messages')
            .insert({
              conversation_id: currentConversation.id,
              role: message.role,
              content: message.content,
              type: message.type,
              metadata: message.metadata,
            })
            .select()
            .single();

          if (error) throw error;

          const newMessage: Message = {
            id: data.id,
            role: data.role,
            content: data.content,
            type: data.type,
            timestamp: new Date(data.created_at),
            metadata: data.metadata,
          };

          set((state) => {
            if (state.currentConversation) {
              state.currentConversation.messages.push(newMessage);
              state.currentConversation.updatedAt = new Date();
            }
          });

          // Update conversation timestamp
          await supabase
            .from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', currentConversation.id);
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to add message'
          });
        }
      },

      updateContext: async (context) => {
        const { currentConversation } = get();
        if (!currentConversation) {
          set({ error: 'No active conversation' });
          return;
        }

        try {
          const updatedContext = {
            ...currentConversation.context,
            ...context,
          };

          const { error } = await supabase
            .from('conversations')
            .update({
              context: updatedContext,
              updated_at: new Date().toISOString()
            })
            .eq('id', currentConversation.id);

          if (error) throw error;

          set((state) => {
            if (state.currentConversation) {
              state.currentConversation.context = updatedContext;
              state.currentConversation.updatedAt = new Date();
            }
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update context'
          });
        }
      },

      setTyping: (isTyping) => {
        set({ isTyping });
      },

      setListening: (isListening) => {
        set({ isListening });
      },

      setSuggestedResponses: (responses) => {
        set({ suggestedResponses: responses });
      },

      clearConversation: () => {
        set({ currentConversation: null, suggestedResponses: [] });
      },
    })),
    {
      name: 'bearable-conversation-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentConversation: state.currentConversation,
        conversations: state.conversations.slice(0, 10), // Keep last 10 in cache
      }),
    }
  )
);
