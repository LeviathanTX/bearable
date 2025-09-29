// Core Types for Bearable AI Health Coaching Platform

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
  preferences: UserPreferences;
  healthProfile: HealthProfile;
  contactInfo: ContactInfo;
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
  nudgingPreferences: NudgingPreferences;
}

export interface ContactInfo {
  email: string;
  phone?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface NudgingPreferences {
  enableNudging: boolean;
  channels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
    phone: boolean;
  };
  frequency: 'minimal' | 'moderate' | 'active' | 'intensive';
  types: {
    healthReminders: boolean;
    goalMotivation: boolean;
    protocolAdherence: boolean;
    achievements: boolean;
    checkIns: boolean;
    emergencyAlerts: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
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
  | 'substance_avoidance'
  | 'movement'
  | 'nutrition'
  | 'sleep';

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
    source?: string;
    inputType?: 'voice' | 'text' | 'keyboard';
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
  currentView: 'dashboard' | 'chat' | 'multi_agent' | 'voice_multi_agent' | 'coaches' | 'goals' | 'activity' | 'caregivers' | 'care_plan' | 'settings';
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

// === CUSTOM COACH CREATION PLATFORM TYPES ===

export interface CustomCoach extends AICompanion {
  // Extended fields for custom coaches
  isCustom: true;
  createdBy: string; // User ID who created this coach
  description: string;
  template?: CoachTemplate;
  systemPrompt: string;
  voiceSettings: CoachVoiceSettings;
  healthSpecializations: HealthSpecialization[];
  mayoProtocols: MayoProtocol[];
  behaviorSettings: CoachBehaviorSettings;
  coachingStyle: CoachingStyle;
  patientInteractionHistory: PatientInteraction[];
  effectivenessMetrics: EffectivenessMetrics;
  approvalStatus: 'draft' | 'pending_review' | 'approved' | 'rejected';
  sharedWith: CoachSharingSettings;
  version: number;
  lastOptimized: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CoachTemplate {
  id: string;
  name: string;
  description: string;
  category: HealthConditionCategory;
  targetConditions: string[];
  basePersonality: AICompanion['personality'];
  systemPromptTemplate: string;
  recommendedSpecializations: HealthSpecialization[];
  defaultVoiceSettings: CoachVoiceSettings;
  mayoProtocolIds: string[];
  tags: string[];
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  estimatedSetupTime: number; // minutes
  popularity: number;
  rating: number;
  createdBy: 'system' | 'community' | string; // User ID
  isVerified: boolean;
  lastUpdated: Date;
}

export type HealthConditionCategory =
  | 'diabetes'
  | 'cardiovascular'
  | 'mental_health'
  | 'chronic_pain'
  | 'cancer_care'
  | 'weight_management'
  | 'substance_recovery'
  | 'respiratory'
  | 'autoimmune'
  | 'aging_wellness'
  | 'pediatric'
  | 'womens_health'
  | 'mens_health'
  | 'general_wellness';

export interface HealthSpecialization {
  id: string;
  name: string;
  category: HealthConditionCategory;
  description: string;
  requiredKnowledge: string[];
  certificationLevel: 'basic' | 'intermediate' | 'expert';
  evidenceBase: 'research_proven' | 'clinical_guidelines' | 'expert_consensus';
  lastReviewed: Date;
}

export interface CoachVoiceSettings {
  provider: 'openai' | 'elevenlabs' | 'azure' | 'google';
  voiceId: string;
  voiceName: string;
  gender: 'male' | 'female' | 'neutral';
  accent: string;
  speed: number; // 0.5 - 2.0
  pitch: number; // 0.5 - 2.0
  stability: number; // 0.0 - 1.0 (ElevenLabs specific)
  clarityAndSimilarity: number; // 0.0 - 1.0 (ElevenLabs specific)
  emotionalRange: 'minimal' | 'moderate' | 'expressive';
  customization: {
    warmth: number; // 0-10
    authority: number; // 0-10
    empathy: number; // 0-10
    energy: number; // 0-10
  };
}

export interface CoachBehaviorSettings {
  responseStyle: 'concise' | 'detailed' | 'conversational' | 'clinical';
  encouragementLevel: 'subtle' | 'moderate' | 'high' | 'enthusiastic';
  challengeLevel: 'gentle' | 'moderate' | 'assertive' | 'direct';
  personalizationDepth: 'basic' | 'moderate' | 'deep' | 'comprehensive';
  memoryRetention: 'session' | 'short_term' | 'long_term' | 'permanent';
  escalationSensitivity: 'low' | 'medium' | 'high' | 'very_high';
  culturalAdaptation: boolean;
  languageComplexity: 'simple' | 'standard' | 'advanced' | 'medical';
  humorAppropriate: boolean;
  motivationalApproach: 'intrinsic' | 'extrinsic' | 'mixed' | 'adaptive';
}

export type CoachingStyle =
  | 'supportive_companion'
  | 'expert_advisor'
  | 'motivational_coach'
  | 'clinical_specialist'
  | 'lifestyle_mentor'
  | 'behavioral_therapist'
  | 'wellness_educator'
  | 'recovery_advocate';

export interface MayoProtocol {
  id: string;
  title: string;
  category: HealthConditionCategory;
  description: string;
  clinicalGuidelines: string[];
  evidenceLevel: 'A' | 'B' | 'C' | 'D';
  lastReviewed: Date;
  applicableConditions: string[];
  contraindicationsnd: string[];
  implementationSteps: ProtocolStep[];
  monitoringCriteria: MonitoringCriterion[];
  outcomeMetrics: string[];
  isActive: boolean;
}

export interface ProtocolStep {
  id: string;
  title: string;
  description: string;
  pillar: LifestylePillar;
  timeframe: string;
  priority: 'critical' | 'important' | 'beneficial' | 'optional';
  prerequisites: string[];
  expectedOutcomes: string[];
  patientInstructions: string;
  providerNotes: string;
}

export interface MonitoringCriterion {
  id: string;
  metric: string;
  target: {
    value: number;
    unit: string;
    operator: '<' | '>' | '=' | '≤' | '≥' | 'range';
  };
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  alertThresholds: {
    warning: number;
    critical: number;
  };
  dataSource: 'patient_reported' | 'wearable' | 'clinical' | 'lab_result';
}

export interface PatientInteraction {
  id: string;
  coachId: string;
  userId: string;
  sessionId: string;
  timestamp: Date;
  duration: number; // seconds
  interactionType: 'conversation' | 'goal_setting' | 'progress_review' | 'crisis_support';
  topicsDiscussed: string[];
  emotionalState: {
    detected: string;
    confidence: number;
  };
  effectiveness: {
    userRating: number; // 1-5
    engagementScore: number; // 0-100
    goalProgress: number; // 0-100
  };
  outcomeCategories: InteractionOutcome[];
  followUpRequired: boolean;
  escalationTriggered: boolean;
}

export type InteractionOutcome =
  | 'goal_achieved'
  | 'progress_made'
  | 'maintained_status'
  | 'declined_progress'
  | 'crisis_averted'
  | 'escalation_needed'
  | 'education_provided'
  | 'motivation_enhanced';

export interface EffectivenessMetrics {
  totalInteractions: number;
  averageRating: number;
  engagementScore: number; // 0-100
  goalAchievementRate: number; // 0-100
  patientRetentionRate: number; // 0-100
  crisisPreventionCount: number;
  positiveOutcomePercentage: number;
  recommendationAcceptanceRate: number;
  lastCalculated: Date;
  trendAnalysis: {
    improving: boolean;
    stagnant: boolean;
    declining: boolean;
    trend: number; // -1 to 1
  };
}

export interface CoachSharingSettings {
  isPublic: boolean;
  shareWithCaregivers: boolean;
  shareWithHealthcareProviders: boolean;
  allowCommunityAccess: boolean;
  sharedWithUsers: string[]; // User IDs
  permissionLevel: 'view_only' | 'can_modify' | 'full_access';
  shareAnalytics: boolean;
  anonymizeData: boolean;
}

// Coach Management Dashboard Types
export interface CoachDashboardFilter {
  categories: HealthConditionCategory[];
  specializations: string[];
  effectivenessRange: [number, number];
  createdDateRange: [Date, Date];
  approvalStatus: CustomCoach['approvalStatus'][];
  isCustom: boolean | null;
  searchQuery: string;
}

export interface CoachBulkOperation {
  type: 'delete' | 'duplicate' | 'export' | 'archive' | 'approve' | 'reject';
  coachIds: string[];
  parameters?: any;
}

export interface CoachAnalytics {
  coachId: string;
  timeframe: 'day' | 'week' | 'month' | 'quarter' | 'year';
  metrics: {
    totalInteractions: number;
    uniqueUsers: number;
    averageSessionDuration: number;
    satisfactionScore: number;
    goalCompletionRate: number;
    retentionRate: number;
    escalationRate: number;
  };
  trends: {
    interactionTrend: number[];
    satisfactionTrend: number[];
    performanceTrend: number[];
  };
  comparisons: {
    versusBaseline: number;
    versusCategory: number;
    rankInCategory: number;
  };
}

// AI Optimization Types
export interface CoachOptimization {
  id: string;
  coachId: string;
  optimizationType: 'personality' | 'voice' | 'behavior' | 'protocols' | 'comprehensive';
  triggeredBy: 'performance_decline' | 'user_feedback' | 'scheduled' | 'manual';
  analysisData: {
    performanceMetrics: EffectivenessMetrics;
    userFeedbackSummary: string;
    interactionPatterns: any;
    identifiedIssues: string[];
  };
  recommendations: OptimizationRecommendation[];
  implementedChanges: CoachChange[];
  expectedImprovement: number; // 0-100
  actualImprovement?: number; // 0-100 (after implementation)
  status: 'analyzing' | 'recommendations_ready' | 'implementing' | 'testing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

export interface OptimizationRecommendation {
  id: string;
  category: 'personality' | 'voice' | 'behavior' | 'protocol' | 'specialization';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expectedImpact: number; // 0-100
  confidence: number; // 0-100
  implementationComplexity: 'simple' | 'moderate' | 'complex';
  suggestedChanges: any;
  reasoning: string;
  evidenceBase: string[];
}

export interface CoachChange {
  id: string;
  timestamp: Date;
  changeType: 'personality_adjustment' | 'voice_modification' | 'behavior_update' | 'protocol_change' | 'specialization_add';
  description: string;
  oldValue: any;
  newValue: any;
  changeBy: 'ai_optimization' | 'user_manual' | 'system_update';
  isReverted: boolean;
  effectivenessImpact?: number;
}

// Database Schema Types for Supabase
export interface DatabaseTables {
  coaches: CustomCoach;
  coach_templates: CoachTemplate;
  health_specializations: HealthSpecialization;
  mayo_protocols: MayoProtocol;
  patient_interactions: PatientInteraction;
  coach_optimizations: CoachOptimization;
  conversation_sessions: {
    id: string;
    coach_id: string;
    user_id: string;
    started_at: Date;
    ended_at?: Date;
    duration_seconds?: number;
    message_count: number;
    satisfaction_rating?: number;
    goal_progress?: number;
    escalation_triggered: boolean;
  };
}

// Multi-Agent Health Conversation Types
export interface HealthSpecialistAgent {
  id: string;
  name: string;
  title: string;
  specialization: LifestylePillar | 'primary_care' | 'mental_health' | 'chronic_care' | 'wellness_coaching';
  avatar: string;
  expertise: string[];
  personalityTraits: string[];
  communicationStyle: 'supportive' | 'clinical' | 'motivational' | 'analytical' | 'empathetic';
  bio: string;
  credentials: string[];
  systemPrompt?: string;
  isActive: boolean;
  mayoClinicAffiliation?: boolean;
}

export interface ConversationMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requiredSpecializations?: string[];
  maxParticipants?: number;
  facilitationStyle: 'collaborative' | 'facilitated' | 'sequential' | 'consensus';
}

export interface MultiAgentMessage {
  id: string;
  type: 'user' | 'agent' | 'system' | 'consensus' | 'facilitation';
  content: string;
  timestamp: Date;
  agentId?: string;
  agent?: HealthSpecialistAgent;
  messageType: 'text' | 'voice' | 'file' | 'action' | 'recommendation' | 'consensus' | 'specialist_response' | 'facilitation' | 'user_input' | 'error';
  inputMethod?: 'voice' | 'text';
  role?: 'user' | 'assistant' | 'system';
  agentName?: string;
  agentAvatar?: string;
  expertise?: string[];
  specialization?: LifestylePillar | 'primary_care' | 'mental_health' | 'chronic_care' | 'wellness_coaching';
  confidence?: number;
  keyPoints?: string[];
  recommendations?: string[];
  // Consensus-specific properties
  consensusLevel?: 'low' | 'medium' | 'high';
  agreedPoints?: string[];
  disagreements?: string[];
  nextSteps?: string[];
  metadata?: {
    inputType?: 'voice' | 'text';
    source?: 'chat' | 'system' | 'facilitation';
    completed?: boolean;
    confidence?: number;
    consensusLevel?: 'low' | 'medium' | 'high';
    escalation?: {
      reason: string;
      urgency: 'low' | 'medium' | 'high' | 'emergency';
      targetCaregiverId?: string;
    };
    healthMetrics?: {
      category: LifestylePillar;
      impact: 'positive' | 'negative' | 'neutral';
      actionRequired: boolean;
    };
  };
  attachments?: any[];
  relatedGoalIds?: string[];
}

export interface HealthConversation {
  id: string;
  userId: string;
  mode: ConversationMode;
  messages: MultiAgentMessage[];
  selectedAgents: string[];
  facilitatorAgent?: HealthSpecialistAgent;
  documentIds: string[];
  healthGoalIds: string[];
  createdAt: Date;
  updatedAt: Date;
  settings: HealthConversationSettings;
  metadata?: {
    context?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    tags?: string[];
    phase?: 'assessment' | 'planning' | 'implementation' | 'monitoring' | 'adjustment';
    consensusReached?: boolean;
    carePlanUpdated?: boolean;
  };
}

export interface HealthConversationSettings {
  enableConsensusBuilding: boolean;
  enableFacilitation: boolean;
  maxResponseRounds: number;
  requireUnanimous: boolean;
  enableVoiceMode: boolean;
  autoEscalation: boolean;
  enableHealthTracking: boolean;
  privacyLevel: 'individual' | 'team' | 'caregiver' | 'family';
}

// Voice and Speech Interfaces for ElevenLabs Integration
export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

// Enhanced HealthSpecialist that includes voice capabilities
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
  defaultVoiceId: string; // Points to one of the voice IDs in voices array
  personality: string;
  expertise: string[];
  isCustom?: boolean; // True for user-created specialists
  createdBy?: string; // User ID who created this specialist
  isActive?: boolean; // Can be deactivated
  mayoClinicAffiliation?: boolean;
}

export interface CustomCoachTemplate {
  id: string;
  name: string;
  title: string;
  specialization: string;
  description: string;
  avatar: string;
  personality: string;
  expertise: string[];
  systemPrompt: string;
  preferredVoiceId?: string;
  voiceSettings?: VoiceSettings;
  isPublic: boolean; // Can other users use this template?
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  rating: number;
}