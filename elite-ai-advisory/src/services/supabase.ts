import { createClient } from '@supabase/supabase-js';

// Environment variables - these will be set in production
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'demo-key';

// Demo mode flag
const isDemoMode = !process.env.REACT_APP_SUPABASE_URL;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Tables Schema (for reference)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          subscription_tier: 'founder' | 'scale-up' | 'enterprise';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'founder' | 'scale-up' | 'enterprise';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'founder' | 'scale-up' | 'enterprise';
          updated_at?: string;
        };
      };
      celebrity_advisors: {
        Row: {
          id: string;
          name: string;
          title: string;
          company: string;
          expertise: string[];
          personality_traits: string[];
          communication_style: string;
          avatar_url: string | null;
          bio: string;
          investment_thesis: string | null;
          created_at: string;
        };
      };
      custom_advisors: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          title: string;
          company: string | null;
          expertise: string[];
          personality_description: string;
          communication_style: string;
          background_context: string;
          created_at: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          advisor_id: string;
          advisor_type: 'celebrity' | 'custom';
          mode: 'pitch_practice' | 'strategic_planning' | 'due_diligence' | 'quick_consultation';
          messages: any;
          created_at: string;
          updated_at: string;
        };
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          filename: string;
          file_type: string;
          file_size: number;
          content_text: string | null;
          upload_date: string;
          analysis_status: 'pending' | 'processing' | 'completed' | 'error';
          analysis_results: any | null;
        };
      };
      voice_sessions: {
        Row: {
          id: string;
          user_id: string;
          type: 'pitch_practice' | 'advisor_conversation';
          duration: number;
          transcript: string;
          analysis: any | null;
          created_at: string;
        };
      };
      usage_stats: {
        Row: {
          id: string;
          user_id: string;
          ai_advisor_hours_used: number;
          document_analyses_used: number;
          pitch_practice_sessions_used: number;
          custom_advisors_created: number;
          updated_at: string;
        };
      };
    };
  };
}

// Helper functions for authentication
export const signIn = async (email: string, password: string) => {
  console.log('signIn called:', { email, isDemoMode, supabaseUrl });

  if (isDemoMode) {
    // Demo mode - simulate successful login
    console.log('Using demo mode authentication');
    const demoUser = {
      id: 'demo-user-123',
      email,
      user_metadata: { full_name: 'Demo User' },
      created_at: new Date().toISOString()
    };
    return {
      data: {
        user: demoUser,
        session: { user: demoUser, access_token: 'demo-token' }
      },
      error: null
    };
  }

  console.log('Using real Supabase authentication');
  try {
    // Add a timeout to prevent hanging
    const signinPromise = supabase.auth.signInWithPassword({
      email,
      password,
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Signin timeout after 10 seconds')), 10000)
    );

    const { data, error } = await Promise.race([signinPromise, timeoutPromise]) as any;
    console.log('Supabase auth response:', { data: !!data, error: !!error, errorMessage: error?.message });
    return { data, error };
  } catch (err: any) {
    console.error('Supabase auth exception:', err);
    return { data: null, error: { message: err.message || 'Authentication failed' } };
  }
};

export const signUp = async (email: string, password: string, fullName?: string) => {
  console.log('signUp called:', { email, fullName, isDemoMode });

  if (isDemoMode) {
    // Demo mode - simulate successful signup
    console.log('Using demo mode signup');
    const demoUser = {
      id: 'demo-user-123',
      email,
      user_metadata: { full_name: fullName || 'Demo User' },
      created_at: new Date().toISOString()
    };
    return {
      data: {
        user: demoUser,
        session: { user: demoUser, access_token: 'demo-token' }
      },
      error: null
    };
  }

  console.log('Using real Supabase signup');
  try {
    // Add a timeout to prevent hanging
    const signupPromise = supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Signup timeout after 10 seconds')), 10000)
    );

    const { data, error } = await Promise.race([signupPromise, timeoutPromise]) as any;
    console.log('Supabase signup response:', { data: !!data, error: !!error, errorMessage: error?.message });
    return { data, error };
  } catch (err: any) {
    console.error('Supabase signup exception:', err);
    return { data: null, error: { message: err.message || 'Signup failed' } };
  }
};

export const signOut = async () => {
  if (isDemoMode) {
    return { error: null };
  }
  
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  if (isDemoMode) {
    return { user: null, error: null };
  }
  
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};