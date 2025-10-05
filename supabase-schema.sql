-- Bearable AI Health Coach - Supabase Database Schema
-- Mayo Clinic Lifestyle Medicine Integration

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- ============================================================================
-- USERS & PROFILES
-- ============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  communication_style TEXT DEFAULT 'supportive' CHECK (communication_style IN ('gentle', 'encouraging', 'direct', 'supportive')),
  preferred_times JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{"shareWithCaregivers": false, "allowDataCollection": true, "publicProfile": false}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Health profiles
CREATE TABLE IF NOT EXISTS health_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  age INTEGER,
  conditions TEXT[] DEFAULT '{}',
  medications TEXT[] DEFAULT '{}',
  lifestyle JSONB DEFAULT '{"activityLevel": "sedentary", "sleepHours": 7, "stressLevel": 3}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Health goals
CREATE TABLE IF NOT EXISTS health_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('nutrition', 'exercise', 'sleep', 'stress', 'medication', 'general')),
  target TEXT,
  timeline TEXT,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CONVERSATIONS & MESSAGES
-- ============================================================================

-- AI Companions
CREATE TABLE IF NOT EXISTS ai_companions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  personality TEXT CHECK (personality IN ('supportive', 'coach', 'medical', 'friend')),
  expertise TEXT[] DEFAULT '{}',
  avatar TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  companion_id UUID REFERENCES ai_companions(id),
  context JSONB DEFAULT '{"currentGoals": [], "recentActivity": [], "emotionalState": "neutral", "topicHistory": []}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'voice', 'image', 'data_visualization')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MEMORY & EMBEDDINGS (Vector Search with pgvector)
-- ============================================================================

-- Memory embeddings for personalized AI learning
CREATE TABLE IF NOT EXISTS memory_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast vector similarity search
CREATE INDEX IF NOT EXISTS memory_embeddings_vector_idx ON memory_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================================
-- ACTIVITY & HEALTH DATA
-- ============================================================================

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('exercise', 'nutrition', 'sleep', 'medication', 'mood', 'vitals')),
  title TEXT NOT NULL,
  description TEXT,
  value NUMERIC,
  unit TEXT,
  category TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'wearable', 'ai_suggestion', 'caregiver')),
  tags TEXT[] DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Health recommendations
CREATE TABLE IF NOT EXISTS health_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  evidence JSONB DEFAULT '{}',
  actionable BOOLEAN DEFAULT true,
  estimated_time_minutes INTEGER,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CAREGIVERS & SOCIAL
-- ============================================================================

-- Caregivers
CREATE TABLE IF NOT EXISTS caregivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  relationship TEXT CHECK (relationship IN ('family', 'friend', 'healthcare_provider', 'coach', 'other')),
  permissions JSONB DEFAULT '{"viewProgress": true, "receiveAlerts": true, "sendEncouragement": true, "accessHealthData": false, "emergencyContact": false}',
  is_active BOOLEAN DEFAULT true,
  last_active TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Caregiver updates
CREATE TABLE IF NOT EXISTS caregiver_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  caregiver_id UUID REFERENCES caregivers(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('progress', 'milestone', 'concern', 'celebration', 'alert', 'encouragement')),
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- BEHAVIORAL ECONOMICS & NUDGING
-- ============================================================================

-- Nudges
CREATE TABLE IF NOT EXISTS nudges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('reminder', 'encouragement', 'social_proof', 'gamification', 'education')),
  title TEXT NOT NULL,
  message TEXT,
  trigger JSONB NOT NULL,
  timing JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  effectiveness NUMERIC CHECK (effectiveness >= 0 AND effectiveness <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nudge responses (for ML learning)
CREATE TABLE IF NOT EXISTS nudge_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nudge_id UUID REFERENCES nudges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_taken BOOLEAN DEFAULT false,
  response_time_seconds INTEGER,
  feedback_sentiment TEXT CHECK (feedback_sentiment IN ('positive', 'neutral', 'negative')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MAYO CLINIC INTEGRATION
-- ============================================================================

-- Mayo content library
CREATE TABLE IF NOT EXISTS mayo_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT CHECK (type IN ('article', 'video', 'guideline', 'exercise', 'recipe', 'tip')),
  title TEXT NOT NULL,
  content TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  evidence_level TEXT CHECK (evidence_level IN ('high', 'medium', 'low')),
  last_reviewed TIMESTAMPTZ,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lifestyle medicine protocols
CREATE TABLE IF NOT EXISTS lifestyle_protocols (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  pillars TEXT[] DEFAULT '{}',
  target_conditions TEXT[] DEFAULT '{}',
  evidence JSONB DEFAULT '{}',
  phases JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User protocol enrollments
CREATE TABLE IF NOT EXISTS user_protocols (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  protocol_id UUID REFERENCES lifestyle_protocols(id),
  current_phase INTEGER DEFAULT 0,
  progress NUMERIC DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregiver_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudge_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_protocols ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own health profile" ON health_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own health profile" ON health_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health profile" ON health_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own goals" ON health_goals FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM conversations WHERE id = conversation_id)
);
CREATE POLICY "Users can create own messages" ON messages FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM conversations WHERE id = conversation_id)
);

CREATE POLICY "Users can view own memory" ON memory_embeddings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own memory" ON memory_embeddings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own activities" ON activity_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own recommendations" ON health_recommendations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own caregivers" ON caregivers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own caregiver updates" ON caregiver_updates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own nudges" ON nudges FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own nudge responses" ON nudge_responses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own protocol enrollments" ON user_protocols FOR ALL USING (auth.uid() = user_id);

-- Mayo content and AI companions are public readable
CREATE POLICY "Mayo content is readable by all" ON mayo_content FOR SELECT TO authenticated USING (true);
CREATE POLICY "AI companions are readable by all" ON ai_companions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Lifestyle protocols are readable by all" ON lifestyle_protocols FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_health_goals_user_id ON health_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_health_goals_status ON health_goals(status);
CREATE INDEX IF NOT EXISTS idx_caregivers_user_id ON caregivers(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_embeddings_user_id ON memory_embeddings(user_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_health_profiles_updated_at BEFORE UPDATE ON health_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_health_goals_updated_at BEFORE UPDATE ON health_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default AI companion (Personal Bearable AI)
INSERT INTO ai_companions (id, name, personality, expertise, avatar, is_active)
VALUES (
  uuid_generate_v4(),
  'Bearable',
  'supportive',
  ARRAY['Lifestyle Medicine', 'Behavioral Economics', 'Health Coaching', 'Mayo Clinic Protocols'],
  '/avatars/bearable-companion.png',
  true
) ON CONFLICT DO NOTHING;

-- Insert Mayo Clinic Lifestyle Medicine pillars as sample protocols
INSERT INTO lifestyle_protocols (name, description, pillars, target_conditions, evidence)
VALUES
  (
    'Heart Health Optimization',
    'Comprehensive lifestyle medicine program for cardiovascular health',
    ARRAY['nutrition', 'physical_activity', 'stress_management', 'substance_avoidance'],
    ARRAY['hypertension', 'high cholesterol', 'pre-diabetes'],
    '{"studyCount": 127, "effectivenessRating": 8.5, "recommendationGrade": "A"}'
  ),
  (
    'Sleep Quality Enhancement',
    'Evidence-based protocol for improving sleep duration and quality',
    ARRAY['sleep', 'stress_management', 'physical_activity'],
    ARRAY['insomnia', 'sleep apnea', 'fatigue'],
    '{"studyCount": 89, "effectivenessRating": 8.2, "recommendationGrade": "A"}'
  ),
  (
    'Mental Wellness Foundation',
    'Integrated approach to stress reduction and emotional wellbeing',
    ARRAY['stress_management', 'social_connection', 'physical_activity', 'sleep'],
    ARRAY['anxiety', 'depression', 'burnout'],
    '{"studyCount": 156, "effectivenessRating": 7.8, "recommendationGrade": "B"}'
  )
ON CONFLICT DO NOTHING;
