// HIPAA-Compliant Consent Management Types for Healthcare AI

/**
 * Core Consent Types
 */
export type ConsentStatus = 'active' | 'revoked' | 'expired' | 'pending';
export type ConsentScope = 'personal_ai' | 'specialist_ai' | 'caregiver' | 'mayo_clinician' | 'third_party_integration' | 'research';
export type DataCategory = 'demographics' | 'health_metrics' | 'medical_history' | 'medications' | 'activity_logs' | 'conversations' | 'ai_recommendations' | 'wearable_data' | 'clinical_notes';
export type AccessLevel = 'none' | 'summary' | 'aggregated' | 'detailed' | 'full';
export type ConsentVersion = string; // Semantic versioning: "1.0.0"

/**
 * Main Consent Record
 * Tracks granular user consent for different scopes and data categories
 */
export interface ConsentRecord {
  id: string;
  userId: string;
  scope: ConsentScope;
  status: ConsentStatus;
  version: ConsentVersion;

  // Granular permissions
  permissions: ConsentPermissions;

  // Temporal controls
  grantedAt: Date;
  effectiveFrom: Date;
  expiresAt?: Date; // Optional time-limited access
  revokedAt?: Date;

  // Audit trail
  grantedBy: string; // User ID who granted (may differ from userId for guardians)
  grantMethod: 'explicit_consent' | 'implied_consent' | 'emergency_override';
  ipAddress?: string;
  deviceInfo?: string;

  // Context
  purpose: string; // Plain language explanation
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_interest' | 'legitimate_interests';

  // Metadata
  metadata?: Record<string, any>;
}

/**
 * Granular Permissions per Consent Scope
 */
export interface ConsentPermissions {
  // Data access levels per category
  dataAccess: {
    [key in DataCategory]?: AccessLevel;
  };

  // Functional permissions
  canView: boolean;
  canModify: boolean;
  canDelete: boolean;
  canExport: boolean;
  canShare: boolean;

  // AI-specific permissions
  aiPermissions?: AIConsentPermissions;

  // Temporal restrictions
  accessSchedule?: AccessSchedule;

  // Rate limiting
  rateLimit?: RateLimit;
}

/**
 * AI-Specific Consent Permissions
 */
export interface AIConsentPermissions {
  // Training and learning
  allowModelTraining: boolean;
  allowPersonalization: boolean;
  allowInsightGeneration: boolean;

  // Data usage
  allowPredictiveAnalytics: boolean;
  allowBehavioralAnalysis: boolean;
  allowRiskAssessment: boolean;

  // Interaction
  allowProactiveOutreach: boolean;
  allowEmergencyOverride: boolean;

  // Explainability
  requireExplanations: boolean;
  explanationDetail: 'minimal' | 'moderate' | 'comprehensive';
}

/**
 * Temporal Access Controls
 */
export interface AccessSchedule {
  timezone: string;
  allowedDays?: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
  allowedHours?: {
    start: string; // "HH:MM"
    end: string;   // "HH:MM"
  };
  blackoutPeriods?: Array<{
    start: Date;
    end: Date;
    reason?: string;
  }>;
}

/**
 * Rate Limiting for Data Access
 */
export interface RateLimit {
  maxRequestsPerHour?: number;
  maxRequestsPerDay?: number;
  maxDataVolumePerDay?: number; // In bytes
  throttleAfter?: number;
}

/**
 * Consent History for Audit Trail
 */
export interface ConsentHistory {
  id: string;
  consentId: string;
  userId: string;
  action: 'granted' | 'modified' | 'revoked' | 'renewed' | 'expired';
  previousStatus?: ConsentStatus;
  newStatus: ConsentStatus;
  changes?: Partial<ConsentRecord>;
  performedBy: string; // User ID
  performedAt: Date;
  reason?: string;
  ipAddress?: string;
  deviceInfo?: string;
}

/**
 * Data Access Audit Log
 * HIPAA requires comprehensive audit logging
 */
export interface DataAccessLog {
  id: string;
  userId: string; // Data subject
  accessorId: string; // Who accessed the data
  accessorType: 'user' | 'ai_agent' | 'caregiver' | 'clinician' | 'system';

  // What was accessed
  dataCategory: DataCategory;
  dataIds?: string[]; // Specific record IDs
  accessLevel: AccessLevel;

  // How it was accessed
  operation: 'read' | 'write' | 'update' | 'delete' | 'export' | 'share';
  method: 'api' | 'ui' | 'batch' | 'automated';

  // When and where
  timestamp: Date;
  ipAddress?: string;
  deviceInfo?: string;
  location?: string;

  // Why
  purpose: string;
  consentId?: string; // Link to consent record

  // Result
  success: boolean;
  denialReason?: string;
  dataVolume?: number; // Bytes accessed

  // Context
  sessionId?: string;
  requestId?: string;
}

/**
 * Specialist AI Agent Consent
 * Per-pillar access control for CARE AI system
 */
export interface SpecialistAIConsent {
  userId: string;
  specialistId: string; // AI agent identifier
  pillar: 'nutrition' | 'physical_activity' | 'sleep' | 'stress_management' | 'social_connection' | 'substance_avoidance';

  consent: ConsentRecord;

  // Specialist-specific settings
  allowDirectRecommendations: boolean;
  allowDataCollection: boolean;
  allowCrossPillarSharing: boolean; // Can this specialist share insights with other specialists

  // Intervention settings
  interventionLevel: 'passive' | 'moderate' | 'active';
  allowNudges: boolean;
  nudgeFrequency?: 'low' | 'medium' | 'high';
}

/**
 * Caregiver Access Consent
 * Granular control over what caregivers can see and do
 */
export interface CaregiverConsent {
  userId: string; // Patient
  caregiverId: string;
  relationship: 'family' | 'friend' | 'healthcare_provider' | 'coach' | 'guardian' | 'power_of_attorney';

  consent: ConsentRecord;

  // Access tiers
  tier: 'view_only' | 'interactive' | 'collaborative' | 'emergency_full';

  // Specific permissions
  canViewProgress: boolean;
  canViewHealthMetrics: boolean;
  canViewConversations: boolean;
  canViewMedications: boolean;
  canViewDiagnoses: boolean;

  canSendMessages: boolean;
  canSetReminders: boolean;
  canModifyGoals: boolean;
  canReceiveAlerts: boolean;

  // Emergency settings
  isEmergencyContact: boolean;
  allowEmergencyOverride: boolean;
  emergencyAccessDuration?: number; // Minutes of full access in emergency

  // Notification preferences
  notificationSettings: {
    milestones: boolean;
    concerns: boolean;
    dailySummary: boolean;
    weeklySummary: boolean;
    criticalAlerts: boolean;
  };
}

/**
 * Mayo Clinician Consent
 * Healthcare provider access with professional obligations
 */
export interface ClinicianConsent {
  userId: string; // Patient
  clinicianId: string;
  clinicianNPI?: string; // National Provider Identifier
  organization: string;
  specialty?: string;

  consent: ConsentRecord;

  // Clinical access
  canViewFullMedicalHistory: boolean;
  canViewAIRecommendations: boolean;
  canModifyCarePlan: boolean;
  canPrescribe: boolean;
  canOrderTests: boolean;

  // Validation and oversight
  validateAIRecommendations: boolean;
  receiveAIAlerts: boolean;

  // Professional obligations
  treatmentRelationship: boolean;
  hipaaAuthorization: boolean;
  consentFormSigned: boolean;
  consentFormVersion: string;
}

/**
 * Third-Party Integration Consent
 * For external services like HealthBank One, wearables, etc.
 */
export interface ThirdPartyConsent {
  userId: string;
  integrationId: string;
  integrationName: string;
  integrationType: 'wearable' | 'ehr' | 'phr' | 'health_app' | 'research' | 'insurance';

  consent: ConsentRecord;

  // Data sharing direction
  allowDataImport: boolean;
  allowDataExport: boolean;

  // Data categories shared
  sharedDataCategories: DataCategory[];

  // Sync settings
  syncFrequency?: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';
  autoSync: boolean;

  // Security
  encryptionRequired: boolean;
  anonymizeData: boolean;

  // Terms
  thirdPartyTermsUrl?: string;
  thirdPartyPrivacyUrl?: string;
  acceptedTermsVersion?: string;
}

/**
 * Consent Preference Center Configuration
 * User's overall privacy preferences
 */
export interface ConsentPreferences {
  userId: string;
  version: ConsentVersion;
  lastUpdated: Date;

  // Global settings
  defaultDataSharing: 'minimal' | 'moderate' | 'comprehensive';
  requireExplicitConsent: boolean; // vs. opt-out model

  // Data retention
  retentionPreference: 'minimal' | 'standard' | 'extended';
  autoDeleteAfterDays?: number;

  // AI preferences
  allowAITraining: boolean;
  allowAnonymizedResearch: boolean;
  allowProductImprovement: boolean;

  // Communication preferences
  consentReminderFrequency: 'never' | 'quarterly' | 'annually';
  receivePrivacyUpdates: boolean;

  // Right to explanation
  alwaysExplainAIDecisions: boolean;

  // Download and portability
  autoExportFrequency?: 'monthly' | 'quarterly' | 'annually';
  preferredExportFormat?: 'json' | 'csv' | 'pdf' | 'fhir';
}

/**
 * Emergency Override Record
 * Track when consent is bypassed for medical emergencies
 */
export interface EmergencyOverride {
  id: string;
  userId: string;
  triggeredBy: string; // User ID or system
  triggeredAt: Date;

  // Emergency context
  emergencyType: 'medical' | 'safety' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;

  // Override details
  normalConsentId?: string; // The consent that was overridden
  overrideScope: ConsentScope[];
  dataAccessed: DataCategory[];
  accessGrantedTo: string[]; // User IDs

  // Duration
  startTime: Date;
  endTime?: Date;
  autoExpireAfterMinutes: number;

  // Resolution
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;

  // Audit
  witnessedBy?: string[]; // Other users who approved
  documentationUrl?: string;
  complianceReviewed: boolean;
}

/**
 * Consent Withdrawal Request
 * Track user requests to withdraw consent and delete data
 */
export interface ConsentWithdrawalRequest {
  id: string;
  userId: string;
  requestedAt: Date;

  // Scope of withdrawal
  withdrawalScope: 'specific_consent' | 'all_ai' | 'all_caregivers' | 'all_third_party' | 'complete_account';
  consentIds?: string[]; // Specific consents to revoke

  // Data deletion
  requestDataDeletion: boolean;
  deleteCategories?: DataCategory[];
  retainForLegalReasons?: boolean;

  // Processing
  status: 'pending' | 'in_progress' | 'completed' | 'partially_completed' | 'failed';
  processedAt?: Date;
  processedBy?: string;

  // Completion
  completionNotes?: string;
  dataRetained?: string; // Explanation of what couldn't be deleted
  confirmationSent: boolean;

  // Legal compliance
  gdprRequest: boolean; // Right to erasure
  hipaaRequest: boolean; // Right to restrict
  complianceDeadline: Date; // 30 days for GDPR, varies by jurisdiction
}

/**
 * Data Sharing Summary
 * User-friendly view of who has access to what
 */
export interface DataSharingsSummary {
  userId: string;
  generatedAt: Date;

  // Active shares
  activeShares: {
    scope: ConsentScope;
    recipientId: string;
    recipientName: string;
    recipientType: 'ai' | 'person' | 'organization';
    dataCategories: DataCategory[];
    accessLevel: AccessLevel;
    grantedAt: Date;
    expiresAt?: Date;
  }[];

  // Statistics
  totalActiveConsents: number;
  totalDataAccessors: number;
  dataAccessLastMonth: number;

  // Alerts
  expiringConsents: ConsentRecord[];
  unusedConsents: ConsentRecord[]; // Granted but never used
  suspiciousActivity?: DataAccessLog[];
}

/**
 * Consent Template
 * Pre-configured consent bundles for common scenarios
 */
export interface ConsentTemplate {
  id: string;
  name: string;
  description: string;
  category: 'quick_start' | 'standard' | 'enhanced_privacy' | 'clinical_trial' | 'research';

  // Default settings
  defaultPermissions: ConsentPermissions;
  defaultAIPermissions: AIConsentPermissions;
  defaultScopes: ConsentScope[];

  // Recommendations
  recommendedFor: string[];
  privacyLevel: 'minimal' | 'balanced' | 'restrictive';

  // Legal
  requiresSignature: boolean;
  legalReviewRequired: boolean;
  minimumAge?: number;
}

/**
 * Consent Notification
 * Alerts users about consent-related events
 */
export interface ConsentNotification {
  id: string;
  userId: string;
  type: 'renewal_required' | 'expiring_soon' | 'revoked' | 'new_accessor' | 'unusual_access' | 'policy_change';

  title: string;
  message: string;
  severity: 'info' | 'warning' | 'urgent';

  // Related records
  relatedConsentId?: string;
  relatedAccessLogId?: string;

  // Actions
  actionRequired: boolean;
  actionDeadline?: Date;
  actionUrl?: string;

  // Status
  read: boolean;
  acknowledged: boolean;
  acknowledgedAt?: Date;

  createdAt: Date;
}
