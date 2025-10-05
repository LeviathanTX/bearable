import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase credentials. Running in offline mode.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database types will be generated from Supabase schema
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          language: string;
          timezone: string;
          communication_style: 'gentle' | 'encouraging' | 'direct' | 'supportive';
          preferred_times: Record<string, string>;
          privacy_settings: Record<string, boolean>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_preferences']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_preferences']['Insert']>;
      };
      health_profiles: {
        Row: {
          id: string;
          user_id: string;
          age?: number;
          conditions: string[];
          medications: string[];
          lifestyle: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['health_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['health_profiles']['Insert']>;
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          companion_id: string;
          context: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          type: 'text' | 'voice' | 'image' | 'data_visualization';
          metadata?: Record<string, any>;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      memory_embeddings: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          embedding: number[];
          metadata: Record<string, any>;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['memory_embeddings']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['memory_embeddings']['Insert']>;
      };
    };
  };
};
