import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://localhost:3000';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'development-key';

// For development/testing, use a mock client if credentials are not provided
const isDevelopment = !process.env.REACT_APP_SUPABASE_URL ||
                     process.env.REACT_APP_SUPABASE_URL === 'your_supabase_project_url_here';

export const supabase = isDevelopment
  ? createMockSupabaseClient()
  : createClient(supabaseUrl, supabaseAnonKey);

// Mock Supabase client for development
function createMockSupabaseClient() {
  const createChainableMock = (): any => {
    const mockResult = { data: [], error: null };

    const promise = Promise.resolve(mockResult);

    const chain = Object.assign(promise, {
      select: () => createChainableMock(),
      eq: () => createChainableMock(),
      neq: () => createChainableMock(),
      gt: () => createChainableMock(),
      gte: () => createChainableMock(),
      lt: () => createChainableMock(),
      lte: () => createChainableMock(),
      like: () => createChainableMock(),
      ilike: () => createChainableMock(),
      is: () => createChainableMock(),
      in: () => createChainableMock(),
      contains: () => createChainableMock(),
      containedBy: () => createChainableMock(),
      overlaps: () => createChainableMock(),
      or: () => createChainableMock(),
      and: () => createChainableMock(),
      not: () => createChainableMock(),
      filter: () => createChainableMock(),
      match: () => createChainableMock(),
      order: () => createChainableMock(),
      limit: () => createChainableMock(),
      offset: () => createChainableMock(),
      range: () => createChainableMock(),
      single: () => createChainableMock(),
      maybeSingle: () => createChainableMock(),
      csv: () => createChainableMock()
    });

    return chain;
  };

  return {
    from: (table: string) => ({
      select: (columns?: string) => createChainableMock(),
      insert: (values: any) => createChainableMock(),
      update: (values: any) => createChainableMock(),
      upsert: (values: any) => createChainableMock(),
      delete: () => createChainableMock()
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signIn: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null })
    }
  };
}

// Database table names
export const TABLES = {
  COACHES: 'coaches',
  COACH_TEMPLATES: 'coach_templates',
  COACH_OPTIMIZATIONS: 'coach_optimizations',
  CONVERSATIONS: 'conversations',
  CONVERSATION_MESSAGES: 'conversation_messages',
  USER_PROFILES: 'user_profiles',
  HEALTH_CONDITIONS: 'health_conditions',
  MAYO_PROTOCOLS: 'mayo_protocols'
} as const;

// Helper function for error handling
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  if (error?.message) {
    throw new Error(error.message);
  }
  throw new Error('Database operation failed');
};