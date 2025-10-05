// Core Types for Bearable AI Health Coaching Platform

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
  preferences: UserPreferences;
  healthProfile: HealthProfile;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  communicationStyle: 'gentle' | 'encouraging' | 'direct' | 'supportive';
  preferredTimes: {
    morning?: string;
    afternoon?: string;
    evening?: string;
  };
  privacySettings: {
    shareWithCaregivers: boolean;
    allowDataCollection: boolean;
    publicProfile: boolean;
  };
}

export interface HealthProfile {
  age?: number;
  goals: HealthGoal[];
  conditions: string[];
  medications: string[];
  lifestyle: {
    activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
    sleepHours: number;
    stressLevel: 1 | 2 | 3 | 4 | 5;
  };
}

export interface HealthGoal {
  id: string;
  title: string;
  description: string;
  category: 'nutrition' | 'exercise' | 'sleep' | 'stress' | 'medication' | 'general';
  target: string;
  timeline: string;
  progress: number; // 0-100
  status: 'active' | 'completed' | 'paused' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

// CARE AI System Types
export interface AICompanion {
  id: string;
  name: string;
  personality: 'supportive' | 'coach' | 'medical' | 'friend';
  expertise: string[];
  avatar: string;
  isActive: boolean;
}

export interface Conversation {
  id: string;
  userId: string;
  companionId: string;
  messages: Message[];
  context: ConversationContext;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type: 'text' | 'voice' | 'image' | 'data_visualization';
  timestamp: Date;
  metadata?: {
    sources?: string[];
    confidence?: number;
    emotionalTone?: string;
  };
}

export interface ConversationContext {
  currentGoals: string[];
  recentActivity: ActivityLog[];
  emotionalState: string;
  lastInteraction: Date;
  topicHistory: string[];
}

// Health Data & Activity Types
export interface ActivityLog {
  id: string;
  userId: string;
  type: 'exercise' | 'nutrition' | 'sleep' | 'medication' | 'mood' | 'vitals';
  title: string;
  description: string;
  value?: number;
  unit?: string;
  category: string;
  timestamp: Date;
  source: 'manual' | 'wearable' | 'ai_suggestion' | 'caregiver';
  tags: string[];
}

export interface HealthRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  evidence: {
    source: string;
    authority: 'CDC' | 'NIH' | 'Mayo Clinic' | 'WHO' | 'Research Study';
    confidence: number;
  };
  actionable: boolean;
  estimatedTimeMinutes?: number;
  createdAt: Date;
}

// Caregiver & Social Types
export interface Caregiver {
  id: string;
  name: string;
  email: string;
  relationship: 'family' | 'friend' | 'healthcare_provider' | 'coach' | 'other';
  permissions: CaregiverPermissions;
  isActive: boolean;
  lastActive: Date;
}

export interface CaregiverPermissions {
  viewProgress: boolean;
  receiveAlerts: boolean;
  sendEncouragement: boolean;
  accessHealthData: boolean;
  emergencyContact: boolean;
}

export interface CaregiverUpdate {
  id: string;
  userId: string;
  caregiverId: string;
  type: 'progress' | 'milestone' | 'concern' | 'celebration' | 'alert' | 'encouragement';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

// Behavioral Economics & Nudging Types
export interface Nudge {
  id: string;
  type: 'reminder' | 'encouragement' | 'social_proof' | 'gamification' | 'education';
  title: string;
  message: string;
  trigger: NudgeTrigger;
  timing: NudgeTiming;
  isActive: boolean;
  effectiveness?: number; // 0-1 based on user response
  createdAt: Date;
}

export interface NudgeTrigger {
  type: 'time_based' | 'activity_based' | 'goal_progress' | 'external_event';
  conditions: any;
  frequency: 'once' | 'daily' | 'weekly' | 'as_needed';
}

export interface NudgeTiming {
  preferredTime?: string;
  timezone: string;
  respectQuietHours: boolean;
  maxPerDay: number;
}

// Mayo Clinic Integration Types
export interface MayoContent {
  id: string;
  type: 'article' | 'video' | 'guideline' | 'exercise' | 'recipe' | 'tip';
  title: string;
  content: string;
  category: string;
  tags: string[];
  evidenceLevel: 'high' | 'medium' | 'low';
  lastReviewed: Date;
  sourceUrl?: string;
}

export interface LifestyleMedicineProtocol {
  id: string;
  name: string;
  description: string;
  pillars: ('nutrition' | 'physical_activity' | 'sleep' | 'stress_management' | 'social_connection' | 'substance_avoidance')[];
  phases: ProtocolPhase[];
  targetConditions: string[];
  evidence: {
    studyCount: number;
    effectivenessRating: number; // 0-10
    recommendationGrade: 'A' | 'B' | 'C' | 'D';
  };
}

export interface ProtocolPhase {
  id: string;
  name: string;
  description: string;
  durationWeeks: number;
  goals: HealthGoal[];
  activities: string[];
  milestones: string[];
}

// UI State Types
export interface AppState {
  currentUser: User | null;
  activeCompanion: AICompanion | null;
  currentView: 'dashboard' | 'chat' | 'goals' | 'activity' | 'caregivers' | 'settings';
  isLoading: boolean;
  error: string | null;
}

export interface ChatState {
  isTyping: boolean;
  isListening: boolean;
  currentConversation: Conversation | null;
  suggestedResponses: string[];
}

export interface NotificationSettings {
  enabled: boolean;
  types: {
    goals: boolean;
    medications: boolean;
    appointments: boolean;
    social: boolean;
    educational: boolean;
  };
  quietHours: {
    start: string;
    end: string;
  };
  preferredChannels: ('app' | 'email' | 'sms' | 'push')[];
}

// Voice & ElevenLabs Types
export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export interface VoiceOption {
  elevenlabs_voice_id: string;
  name: string;
  description: string;
  gender: 'male' | 'female' | 'neutral';
  accent: string;
  settings: VoiceSettings;
}

export interface HealthSpecialist {
  id: string;
  name: string;
  title: string;
  specialization: string;
  description: string;
  avatar: string;
  voices: VoiceOption[];
  defaultVoiceId: string;
  personality: string;
  expertise: string[];
  isCustom?: boolean;
  createdBy?: string;
  isActive?: boolean;
  mayoClinicAffiliation?: boolean;
}

// Export consent-related types
export * from './consent';