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
  category: LifestylePillar | 'medication' | 'general';
  target: string;
  timeline: string;
  progress: number; // 0-100
  status: 'active' | 'completed' | 'paused' | 'archived';
  assignedCoach: string; // AICompanion ID
  carePlan?: CarePlan;
  nudgeSettings: NudgeConfiguration;
  createdAt: Date;
  updatedAt: Date;
}

export interface CarePlan {
  id: string;
  userId: string;
  title: string;
  description: string;
  lifestylePillars: LifestylePillar[];
  phases: CarePlanPhase[];
  currentPhase: number;
  assignedTeam: CoachTeam;
  escalationTriggers: EscalationTrigger[];
  mayoClinicProtocols: string[];
  createdAt: Date;
  updatedAt: Date;
  nextReview: Date;
}

export interface CarePlanPhase {
  id: string;
  name: string;
  description: string;
  durationWeeks: number;
  goals: HealthGoal[];
  milestones: CarePlanMilestone[];
  requiredActivities: ActivityRequirement[];
}

export interface CarePlanMilestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  isAchieved: boolean;
  achievedDate?: Date;
  celebrationMessage?: string;
}

// CARE AI System Types - Enhanced for Lifestyle Medicine
export interface AICompanion {
  id: string;
  name: string;
  personality: 'supportive' | 'coach' | 'medical' | 'friend' | 'specialist';
  expertise: string[];
  avatar: string;
  isActive: boolean;
  specialization?: LifestylePillar;
  role: 'primary_coach' | 'pillar_specialist' | 'general_support';
  credentials?: string[];
  mayoClinicProtocols?: string[];
}

export type LifestylePillar =
  | 'optimal_nutrition'
  | 'physical_activity'
  | 'stress_management'
  | 'restorative_sleep'
  | 'connectedness'
  | 'substance_avoidance';

export interface CoachTeam {
  primaryCoach: AICompanion;
  specialists: Record<LifestylePillar, AICompanion>;
  coordinationStrategy: 'collaborative' | 'referral_based' | 'integrated';
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
    // Extended metadata for Realtime API
    source?: string;
    inputType?: 'voice' | 'text' | 'keyboard' | 'realtime';
    completed?: boolean;
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
  relationship: 'family' | 'friend' | 'healthcare_provider' | 'physician' | 'nurse' | 'coach' | 'other';
  permissions: CaregiverPermissions;
  specialization?: LifestylePillar;
  credentials?: string[];
  isActive: boolean;
  lastActive: Date;
  escalationLevel: 'primary' | 'secondary' | 'emergency';
  communicationPreferences: CommunicationPreferences;
}

export interface CommunicationPreferences {
  preferredChannel: 'email' | 'sms' | 'app' | 'phone';
  urgencyThreshold: 'low' | 'medium' | 'high' | 'emergency';
  quietHours: {
    start: string;
    end: string;
  };
  languages: string[];
}

export interface CaregiverPermissions {
  viewProgress: boolean;
  receiveAlerts: boolean;
  sendEncouragement: boolean;
  accessHealthData: boolean;
  emergencyContact: boolean;
  modifyCarePlan: boolean;
  escalateToPhysician: boolean;
  accessMedicalHistory: boolean;
  coordinateWithAI: boolean;
}

export interface EscalationTrigger {
  id: string;
  type: 'missed_goals' | 'health_decline' | 'no_engagement' | 'emergency_pattern' | 'user_request';
  conditions: {
    threshold?: number;
    timeWindow?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  };
  targetCaregivers: string[]; // Caregiver IDs
  escalationMessage: string;
  isActive: boolean;
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
  type: 'reminder' | 'encouragement' | 'social_proof' | 'gamification' | 'education' | 'care_plan_check' | 'milestone_celebration';
  title: string;
  message: string;
  trigger: NudgeTrigger;
  timing: NudgeTiming;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  pillar?: LifestylePillar;
  assignedCoach: string;
  isActive: boolean;
  effectiveness?: number; // 0-1 based on user response
  userResponse?: 'positive' | 'negative' | 'neutral' | 'ignored';
  escalationRequired?: boolean;
  createdAt: Date;
}

export interface NudgeConfiguration {
  enabled: boolean;
  frequency: 'low' | 'medium' | 'high';
  preferredTypes: string[];
  personalizedStyle: 'gentle' | 'motivational' | 'direct' | 'scientific';
  respectQuietHours: boolean;
  adaptToMoodPattern: boolean;
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
  pillars: LifestylePillar[];
  phases: ProtocolPhase[];
  targetConditions: string[];
  evidence: {
    studyCount: number;
    effectivenessRating: number; // 0-10
    recommendationGrade: 'A' | 'B' | 'C' | 'D';
  };
  mayoClinicApproved: boolean;
  lastReviewed: Date;
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
  coachTeam: CoachTeam | null;
  activeCoach: AICompanion | null; // Currently active coach in conversation
  currentCarePlan: CarePlan | null;
  currentView: 'dashboard' | 'chat' | 'goals' | 'activity' | 'caregivers' | 'care_plan' | 'settings';
  isLoading: boolean;
  error: string | null;
  pendingEscalations: EscalationTrigger[];
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
    escalations: boolean;
    caregiverUpdates: boolean;
  };
  quietHours: {
    start: string;
    end: string;
  };
  preferredChannels: ('app' | 'email' | 'sms' | 'push')[];
}

// Additional types for enhanced system
export interface ActivityRequirement {
  id: string;
  title: string;
  description: string;
  pillar: LifestylePillar;
  frequency: 'daily' | 'weekly' | 'monthly';
  target: {
    value: number;
    unit: string;
  };
  isOptional: boolean;
}

export interface MedicalHistoryData {
  id: string;
  userId: string;
  type: 'condition' | 'medication' | 'allergy' | 'procedure' | 'lab_result' | 'vital_sign';
  title: string;
  description: string;
  dateRecorded: Date;
  source: 'user_input' | 'ehr_integration' | 'physician_input' | 'mcp_import';
  isActive: boolean;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
}

export interface HealthDataIntegration {
  id: string;
  userId: string;
  source: 'apple_health' | 'google_fit' | 'fitbit' | 'garmin' | 'oura' | 'whoop' | 'manual';
  dataType: 'steps' | 'heart_rate' | 'sleep' | 'calories' | 'weight' | 'blood_pressure' | 'glucose';
  isActive: boolean;
  lastSync: Date;
  apiCredentials?: any; // Encrypted storage
}

export interface ProactiveInsight {
  id: string;
  userId: string;
  type: 'trend_analysis' | 'goal_deviation' | 'health_opportunity' | 'lifestyle_correlation';
  title: string;
  description: string;
  data: any;
  confidence: number; // 0-1
  actionRecommendations: string[];
  generatedBy: string; // AICompanion ID
  pillar: LifestylePillar;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  isActedUpon: boolean;
}