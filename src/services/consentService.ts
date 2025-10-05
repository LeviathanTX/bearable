/**
 * HIPAA-Compliant Consent Management Service
 *
 * Handles all consent-related operations with comprehensive audit logging,
 * granular permission checking, and regulatory compliance.
 */

import {
  ConsentRecord,
  ConsentHistory,
  DataAccessLog,
  ConsentStatus,
  ConsentScope,
  DataCategory,
  AccessLevel,
  ConsentPermissions,
  EmergencyOverride,
  ConsentWithdrawalRequest,
  DataSharingsSummary,
  SpecialistAIConsent,
  CaregiverConsent,
  ClinicianConsent,
  ThirdPartyConsent,
  ConsentPreferences,
} from '../types/consent';

/**
 * Core Consent Management
 */
export class ConsentService {
  private static instance: ConsentService;

  private constructor() {
    // Singleton pattern for consistent audit logging
  }

  public static getInstance(): ConsentService {
    if (!ConsentService.instance) {
      ConsentService.instance = new ConsentService();
    }
    return ConsentService.instance;
  }

  /**
   * Grant new consent
   */
  async grantConsent(
    userId: string,
    scope: ConsentScope,
    permissions: ConsentPermissions,
    options: {
      purpose: string;
      legalBasis?: ConsentRecord['legalBasis'];
      expiresAt?: Date;
      grantedBy?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<ConsentRecord> {
    const now = new Date();

    const consent: ConsentRecord = {
      id: this.generateConsentId(),
      userId,
      scope,
      status: 'active',
      version: this.getCurrentConsentVersion(),
      permissions,
      grantedAt: now,
      effectiveFrom: now,
      expiresAt: options.expiresAt,
      grantedBy: options.grantedBy || userId,
      grantMethod: 'explicit_consent',
      purpose: options.purpose,
      legalBasis: options.legalBasis || 'consent',
      metadata: options.metadata,
    };

    // Store consent record
    await this.storeConsent(consent);

    // Create audit history
    await this.logConsentHistory({
      id: this.generateId(),
      consentId: consent.id,
      userId,
      action: 'granted',
      newStatus: 'active',
      performedBy: consent.grantedBy,
      performedAt: now,
    });

    // Notify user
    await this.sendConsentNotification(userId, 'new_consent_granted', consent);

    return consent;
  }

  /**
   * Check if a specific data access is permitted
   * This is called before ANY data access operation
   */
  async checkDataAccess(
    userId: string,
    accessorId: string,
    accessorType: DataAccessLog['accessorType'],
    dataCategory: DataCategory,
    operation: DataAccessLog['operation'],
    context?: {
      purpose?: string;
      sessionId?: string;
      requestId?: string;
    }
  ): Promise<{
    allowed: boolean;
    accessLevel?: AccessLevel;
    consentId?: string;
    reason?: string;
  }> {
    // 1. Determine the appropriate consent scope
    const scope = this.mapAccessorTypeToScope(accessorType);

    // 2. Get active consent for this scope
    const consent = await this.getActiveConsent(userId, scope, accessorId);

    if (!consent) {
      await this.logAccessAttempt(userId, accessorId, accessorType, dataCategory, operation, false, 'No active consent');
      return { allowed: false, reason: 'No active consent found' };
    }

    // 3. Check if consent is expired
    if (consent.expiresAt && consent.expiresAt < new Date()) {
      await this.expireConsent(consent.id);
      await this.logAccessAttempt(userId, accessorId, accessorType, dataCategory, operation, false, 'Consent expired');
      return { allowed: false, reason: 'Consent has expired' };
    }

    // 4. Check data category permission
    const accessLevel = consent.permissions.dataAccess[dataCategory];
    if (!accessLevel || accessLevel === 'none') {
      await this.logAccessAttempt(userId, accessorId, accessorType, dataCategory, operation, false, 'Data category not permitted');
      return { allowed: false, reason: `Access to ${dataCategory} not permitted` };
    }

    // 5. Check operation permission
    const operationAllowed = this.isOperationAllowed(operation, consent.permissions);
    if (!operationAllowed) {
      await this.logAccessAttempt(userId, accessorId, accessorType, dataCategory, operation, false, 'Operation not permitted');
      return { allowed: false, reason: `Operation ${operation} not permitted` };
    }

    // 6. Check temporal restrictions
    if (consent.permissions.accessSchedule) {
      const temporalCheck = this.checkTemporalAccess(consent.permissions.accessSchedule);
      if (!temporalCheck.allowed) {
        await this.logAccessAttempt(userId, accessorId, accessorType, dataCategory, operation, false, temporalCheck.reason);
        return { allowed: false, reason: temporalCheck.reason };
      }
    }

    // 7. Check rate limits
    if (consent.permissions.rateLimit) {
      const rateLimitCheck = await this.checkRateLimit(userId, accessorId, consent.permissions.rateLimit);
      if (!rateLimitCheck.allowed) {
        await this.logAccessAttempt(userId, accessorId, accessorType, dataCategory, operation, false, rateLimitCheck.reason);
        return { allowed: false, reason: rateLimitCheck.reason };
      }
    }

    // 8. Log successful access
    await this.logAccessAttempt(
      userId,
      accessorId,
      accessorType,
      dataCategory,
      operation,
      true,
      undefined,
      {
        consentId: consent.id,
        purpose: context?.purpose || consent.purpose,
        sessionId: context?.sessionId,
        requestId: context?.requestId,
      }
    );

    return {
      allowed: true,
      accessLevel,
      consentId: consent.id,
    };
  }

  /**
   * Revoke consent
   */
  async revokeConsent(
    consentId: string,
    revokedBy: string,
    reason?: string
  ): Promise<void> {
    const consent = await this.getConsentById(consentId);
    if (!consent) {
      throw new Error('Consent not found');
    }

    if (consent.status === 'revoked') {
      return; // Already revoked
    }

    const now = new Date();

    // Update consent status
    consent.status = 'revoked';
    consent.revokedAt = now;

    await this.updateConsent(consent);

    // Log history
    await this.logConsentHistory({
      id: this.generateId(),
      consentId,
      userId: consent.userId,
      action: 'revoked',
      previousStatus: 'active',
      newStatus: 'revoked',
      performedBy: revokedBy,
      performedAt: now,
      reason,
    });

    // Notify affected parties
    await this.notifyConsentRevocation(consent);
  }

  /**
   * Handle emergency override
   * When consent must be bypassed for medical emergencies
   */
  async createEmergencyOverride(
    userId: string,
    triggeredBy: string,
    emergencyType: EmergencyOverride['emergencyType'],
    severity: EmergencyOverride['severity'],
    description: string,
    options: {
      scopes: ConsentScope[];
      dataCategories: DataCategory[];
      accessGrantedTo: string[];
      durationMinutes?: number;
      witnessedBy?: string[];
    }
  ): Promise<EmergencyOverride> {
    const now = new Date();
    const durationMinutes = options.durationMinutes || 60; // Default 1 hour

    const override: EmergencyOverride = {
      id: this.generateId(),
      userId,
      triggeredBy,
      triggeredAt: now,
      emergencyType,
      severity,
      description,
      overrideScope: options.scopes,
      dataAccessed: options.dataCategories,
      accessGrantedTo: options.accessGrantedTo,
      startTime: now,
      autoExpireAfterMinutes: durationMinutes,
      resolved: false,
      witnessedBy: options.witnessedBy,
      complianceReviewed: false,
    };

    await this.storeEmergencyOverride(override);

    // Schedule auto-expiration
    setTimeout(async () => {
      await this.resolveEmergencyOverride(override.id, 'system', 'Auto-expired after duration');
    }, durationMinutes * 60 * 1000);

    // Alert compliance team
    await this.alertComplianceTeam(override);

    return override;
  }

  /**
   * Process consent withdrawal and data deletion request
   * Implements GDPR Right to Erasure and HIPAA Right to Restrict
   */
  async processWithdrawalRequest(
    userId: string,
    withdrawalScope: ConsentWithdrawalRequest['withdrawalScope'],
    options: {
      consentIds?: string[];
      requestDataDeletion?: boolean;
      deleteCategories?: DataCategory[];
    }
  ): Promise<ConsentWithdrawalRequest> {
    const now = new Date();
    const deadline = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days for GDPR

    const request: ConsentWithdrawalRequest = {
      id: this.generateId(),
      userId,
      requestedAt: now,
      withdrawalScope,
      consentIds: options.consentIds,
      requestDataDeletion: options.requestDataDeletion || false,
      deleteCategories: options.deleteCategories,
      status: 'pending',
      gdprRequest: true,
      hipaaRequest: true,
      complianceDeadline: deadline,
      confirmationSent: false,
    };

    await this.storeWithdrawalRequest(request);

    // Initiate processing workflow
    await this.initiateWithdrawalWorkflow(request);

    return request;
  }

  /**
   * Generate user-friendly data sharing summary
   */
  async getDataSharingSummary(userId: string): Promise<DataSharingsSummary> {
    const activeConsents = await this.getActiveConsents(userId);
    const recentAccessLogs = await this.getRecentAccessLogs(userId, 30); // Last 30 days

    const activeShares = await Promise.all(
      activeConsents.map(async (consent) => {
        const accessor = await this.getAccessorInfo(consent);
        return {
          scope: consent.scope,
          recipientId: accessor.id,
          recipientName: accessor.name,
          recipientType: accessor.type,
          dataCategories: Object.keys(consent.permissions.dataAccess).filter(
            (cat) => consent.permissions.dataAccess[cat as DataCategory] !== 'none'
          ) as DataCategory[],
          accessLevel: this.getHighestAccessLevel(consent.permissions.dataAccess),
          grantedAt: consent.grantedAt,
          expiresAt: consent.expiresAt,
        };
      })
    );

    const expiringConsents = activeConsents.filter(
      (c) => c.expiresAt && c.expiresAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 // 7 days
    );

    const unusedConsents = activeConsents.filter(
      (c) => !recentAccessLogs.some((log) => log.consentId === c.id)
    );

    const suspiciousActivity = await this.detectSuspiciousAccess(recentAccessLogs);

    return {
      userId,
      generatedAt: new Date(),
      activeShares,
      totalActiveConsents: activeConsents.length,
      totalDataAccessors: new Set(activeShares.map((s) => s.recipientId)).size,
      dataAccessLastMonth: recentAccessLogs.filter((log) => log.success).length,
      expiringConsents,
      unusedConsents,
      suspiciousActivity: suspiciousActivity.length > 0 ? suspiciousActivity : undefined,
    };
  }

  /**
   * Helper: Map accessor type to consent scope
   */
  private mapAccessorTypeToScope(accessorType: DataAccessLog['accessorType']): ConsentScope {
    const mapping: Record<DataAccessLog['accessorType'], ConsentScope> = {
      user: 'personal_ai',
      ai_agent: 'specialist_ai',
      caregiver: 'caregiver',
      clinician: 'mayo_clinician',
      system: 'personal_ai',
    };
    return mapping[accessorType];
  }

  /**
   * Helper: Check if operation is allowed by permissions
   */
  private isOperationAllowed(operation: DataAccessLog['operation'], permissions: ConsentPermissions): boolean {
    const operationMap: Record<DataAccessLog['operation'], keyof ConsentPermissions> = {
      read: 'canView',
      write: 'canModify',
      update: 'canModify',
      delete: 'canDelete',
      export: 'canExport',
      share: 'canShare',
    };

    const permissionKey = operationMap[operation];
    return permissions[permissionKey] as boolean;
  }

  /**
   * Helper: Check temporal access restrictions
   */
  private checkTemporalAccess(schedule: NonNullable<ConsentPermissions['accessSchedule']>): {
    allowed: boolean;
    reason?: string;
  } {
    const now = new Date();

    // Check blackout periods
    if (schedule.blackoutPeriods) {
      for (const period of schedule.blackoutPeriods) {
        if (now >= period.start && now <= period.end) {
          return { allowed: false, reason: `Access restricted during blackout period: ${period.reason || 'Scheduled maintenance'}` };
        }
      }
    }

    // Check allowed days
    if (schedule.allowedDays) {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDay = dayNames[now.getDay()];
      if (!schedule.allowedDays.includes(currentDay as any)) {
        return { allowed: false, reason: `Access not allowed on ${currentDay}` };
      }
    }

    // Check allowed hours
    if (schedule.allowedHours) {
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      if (currentTime < schedule.allowedHours.start || currentTime > schedule.allowedHours.end) {
        return { allowed: false, reason: `Access only allowed between ${schedule.allowedHours.start} and ${schedule.allowedHours.end}` };
      }
    }

    return { allowed: true };
  }

  /**
   * Helper: Check rate limits
   */
  private async checkRateLimit(
    userId: string,
    accessorId: string,
    rateLimit: NonNullable<ConsentPermissions['rateLimit']>
  ): Promise<{ allowed: boolean; reason?: string }> {
    const now = new Date();
    const recentLogs = await this.getAccessLogsForRateLimit(userId, accessorId, now);

    // Check hourly limit
    if (rateLimit.maxRequestsPerHour) {
      const lastHourLogs = recentLogs.filter((log) => now.getTime() - log.timestamp.getTime() < 60 * 60 * 1000);
      if (lastHourLogs.length >= rateLimit.maxRequestsPerHour) {
        return { allowed: false, reason: 'Hourly rate limit exceeded' };
      }
    }

    // Check daily limit
    if (rateLimit.maxRequestsPerDay) {
      const todayLogs = recentLogs.filter((log) => {
        const logDate = new Date(log.timestamp);
        return logDate.toDateString() === now.toDateString();
      });
      if (todayLogs.length >= rateLimit.maxRequestsPerDay) {
        return { allowed: false, reason: 'Daily rate limit exceeded' };
      }
    }

    // Check data volume limit
    if (rateLimit.maxDataVolumePerDay) {
      const todayLogs = recentLogs.filter((log) => {
        const logDate = new Date(log.timestamp);
        return logDate.toDateString() === now.toDateString();
      });
      const totalVolume = todayLogs.reduce((sum, log) => sum + (log.dataVolume || 0), 0);
      if (totalVolume >= rateLimit.maxDataVolumePerDay) {
        return { allowed: false, reason: 'Daily data volume limit exceeded' };
      }
    }

    return { allowed: true };
  }

  /**
   * Helper: Detect suspicious access patterns
   */
  private async detectSuspiciousAccess(logs: DataAccessLog[]): Promise<DataAccessLog[]> {
    const suspicious: DataAccessLog[] = [];

    // Check for unusual access patterns
    for (const log of logs) {
      // Access outside normal hours
      const hour = log.timestamp.getHours();
      if (hour < 6 || hour > 22) {
        suspicious.push(log);
      }

      // Bulk exports
      if (log.operation === 'export' && log.dataVolume && log.dataVolume > 10 * 1024 * 1024) {
        // > 10MB
        suspicious.push(log);
      }

      // Failed access attempts
      if (!log.success) {
        suspicious.push(log);
      }
    }

    return suspicious;
  }

  /**
   * Helper: Get highest access level from permissions
   */
  private getHighestAccessLevel(dataAccess: ConsentPermissions['dataAccess']): AccessLevel {
    const levels: AccessLevel[] = ['none', 'summary', 'aggregated', 'detailed', 'full'];
    let highest: AccessLevel = 'none';

    for (const level of Object.values(dataAccess)) {
      if (level && levels.indexOf(level) > levels.indexOf(highest)) {
        highest = level;
      }
    }

    return highest;
  }

  // Storage methods (to be implemented with actual database)
  private async storeConsent(consent: ConsentRecord): Promise<void> {
    // TODO: Implement Supabase storage
    console.log('Storing consent:', consent);
  }

  private async updateConsent(consent: ConsentRecord): Promise<void> {
    // TODO: Implement Supabase update
    console.log('Updating consent:', consent);
  }

  private async getConsentById(id: string): Promise<ConsentRecord | null> {
    // TODO: Implement Supabase query
    return null;
  }

  private async getActiveConsent(userId: string, scope: ConsentScope, accessorId: string): Promise<ConsentRecord | null> {
    // TODO: Implement Supabase query
    return null;
  }

  private async getActiveConsents(userId: string): Promise<ConsentRecord[]> {
    // TODO: Implement Supabase query
    return [];
  }

  private async logConsentHistory(history: ConsentHistory): Promise<void> {
    // TODO: Implement Supabase storage
    console.log('Logging consent history:', history);
  }

  private async logAccessAttempt(
    userId: string,
    accessorId: string,
    accessorType: DataAccessLog['accessorType'],
    dataCategory: DataCategory,
    operation: DataAccessLog['operation'],
    success: boolean,
    denialReason?: string,
    context?: any
  ): Promise<void> {
    const log: DataAccessLog = {
      id: this.generateId(),
      userId,
      accessorId,
      accessorType,
      dataCategory,
      accessLevel: 'summary', // Will be set based on actual access
      operation,
      method: 'api',
      timestamp: new Date(),
      success,
      denialReason,
      purpose: context?.purpose,
      consentId: context?.consentId,
      sessionId: context?.sessionId,
      requestId: context?.requestId,
    };

    // TODO: Implement Supabase storage
    console.log('Logging access attempt:', log);
  }

  private async storeEmergencyOverride(override: EmergencyOverride): Promise<void> {
    // TODO: Implement Supabase storage
    console.log('Storing emergency override:', override);
  }

  private async resolveEmergencyOverride(id: string, resolvedBy: string, resolution: string): Promise<void> {
    // TODO: Implement resolution logic
    console.log('Resolving emergency override:', id);
  }

  private async storeWithdrawalRequest(request: ConsentWithdrawalRequest): Promise<void> {
    // TODO: Implement Supabase storage
    console.log('Storing withdrawal request:', request);
  }

  private async initiateWithdrawalWorkflow(request: ConsentWithdrawalRequest): Promise<void> {
    // TODO: Implement workflow
    console.log('Initiating withdrawal workflow:', request);
  }

  private async getRecentAccessLogs(userId: string, days: number): Promise<DataAccessLog[]> {
    // TODO: Implement Supabase query
    return [];
  }

  private async getAccessLogsForRateLimit(userId: string, accessorId: string, now: Date): Promise<DataAccessLog[]> {
    // TODO: Implement Supabase query
    return [];
  }

  private async getAccessorInfo(consent: ConsentRecord): Promise<{ id: string; name: string; type: 'ai' | 'person' | 'organization' }> {
    // TODO: Implement lookup based on consent scope
    return { id: 'unknown', name: 'Unknown', type: 'ai' };
  }

  private async expireConsent(consentId: string): Promise<void> {
    // TODO: Implement expiration logic
    console.log('Expiring consent:', consentId);
  }

  private async sendConsentNotification(userId: string, type: string, consent: ConsentRecord): Promise<void> {
    // TODO: Implement notification
    console.log('Sending consent notification:', type, userId);
  }

  private async notifyConsentRevocation(consent: ConsentRecord): Promise<void> {
    // TODO: Implement notification
    console.log('Notifying consent revocation:', consent.id);
  }

  private async alertComplianceTeam(override: EmergencyOverride): Promise<void> {
    // TODO: Implement alert
    console.log('Alerting compliance team:', override);
  }

  // Utility methods
  private generateConsentId(): string {
    return `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentConsentVersion(): string {
    return '1.0.0'; // Should be managed centrally
  }
}

// Export singleton instance
export const consentService = ConsentService.getInstance();
