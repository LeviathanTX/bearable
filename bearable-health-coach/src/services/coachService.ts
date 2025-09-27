import { supabase, TABLES, handleSupabaseError } from './supabase';
import {
  CustomCoach,
  CoachTemplate,
  CoachDashboardFilter,
  CoachBulkOperation,
  CoachAnalytics,
  EffectivenessMetrics,
  PatientInteraction,
  CoachOptimization
} from '../types';
import { v4 as uuidv4 } from 'uuid';

export class CoachService {

  // === CREATE OPERATIONS ===

  /**
   * Create a new custom coach
   */
  async createCustomCoach(coachData: Omit<CustomCoach, 'id' | 'createdAt' | 'updatedAt' | 'effectivenessMetrics' | 'patientInteractionHistory'>): Promise<CustomCoach> {
    try {
      const now = new Date();
      const id = uuidv4();

      const newCoach: CustomCoach = {
        ...coachData,
        id,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        effectivenessMetrics: this.createDefaultEffectivenessMetrics(),
        patientInteractionHistory: [],
        version: 1,
        lastOptimized: now
      };

      const { data, error } = await supabase
        .from(TABLES.COACHES)
        .insert([newCoach])
        .select()
        .single();

      if (error) {
        handleSupabaseError(error);
      }

      return data as CustomCoach;
    } catch (error) {
      console.error('Error creating custom coach:', error);
      throw error;
    }
  }

  /**
   * Create a coach from a template
   */
  async createCoachFromTemplate(templateId: string, customizations: Partial<CustomCoach>, userId: string): Promise<CustomCoach> {
    try {
      const template = await this.getCoachTemplate(templateId);
      if (!template) {
        throw new Error(`Template with ID ${templateId} not found`);
      }

      const coachData: Omit<CustomCoach, 'id' | 'createdAt' | 'updatedAt' | 'effectivenessMetrics' | 'patientInteractionHistory'> = {
        isCustom: true,
        createdBy: userId,
        name: customizations.name || `My ${template.name}`,
        description: customizations.description || template.description,
        personality: template.basePersonality,
        expertise: customizations.expertise || [],
        avatar: customizations.avatar || 'default-avatar.png',
        isActive: true,
        specialization: customizations.specialization,
        role: customizations.role || 'primary_coach',
        credentials: customizations.credentials || [],
        mayoClinicProtocols: customizations.mayoClinicProtocols || [],
        template,
        systemPrompt: customizations.systemPrompt || template.systemPromptTemplate,
        voiceSettings: customizations.voiceSettings || template.defaultVoiceSettings,
        healthSpecializations: customizations.healthSpecializations || template.recommendedSpecializations,
        mayoProtocols: customizations.mayoProtocols || [],
        behaviorSettings: customizations.behaviorSettings || this.createDefaultBehaviorSettings(),
        coachingStyle: customizations.coachingStyle || 'supportive_companion',
        approvalStatus: 'draft',
        sharedWith: customizations.sharedWith || this.createDefaultSharingSettings(),
        version: 1,
        lastOptimized: new Date()
      };

      return await this.createCustomCoach(coachData);
    } catch (error) {
      console.error('Error creating coach from template:', error);
      throw error;
    }
  }

  // === READ OPERATIONS ===

  /**
   * Get a custom coach by ID
   */
  async getCustomCoach(id: string): Promise<CustomCoach | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.COACHES)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null;
        }
        handleSupabaseError(error);
      }

      return data as CustomCoach;
    } catch (error) {
      console.error('Error getting custom coach:', error);
      throw error;
    }
  }

  /**
   * Get all coaches for a user with filtering
   */
  async getUserCoaches(userId: string, filters?: CoachDashboardFilter): Promise<CustomCoach[]> {
    try {
      let query = supabase
        .from(TABLES.COACHES)
        .select('*')
        .eq('createdBy', userId)
        .order('updatedAt', { ascending: false });

      // Apply filters
      if (filters) {
        if (filters.categories.length > 0) {
          query = query.in('template.category', filters.categories);
        }

        if (filters.approvalStatus.length > 0) {
          query = query.in('approvalStatus', filters.approvalStatus);
        }

        if (filters.searchQuery) {
          query = query.or(`name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
        }

        if (filters.effectivenessRange) {
          query = query
            .gte('effectivenessMetrics.averageRating', filters.effectivenessRange[0])
            .lte('effectivenessMetrics.averageRating', filters.effectivenessRange[1]);
        }

        if (filters.createdDateRange) {
          query = query
            .gte('createdAt', filters.createdDateRange[0].toISOString())
            .lte('createdAt', filters.createdDateRange[1].toISOString());
        }
      }

      const { data, error } = await query;

      if (error) {
        handleSupabaseError(error);
      }

      return data as CustomCoach[];
    } catch (error) {
      console.error('Error getting user coaches:', error);
      throw error;
    }
  }

  /**
   * Get public coaches with filtering
   */
  async getPublicCoaches(filters?: CoachDashboardFilter): Promise<CustomCoach[]> {
    try {
      let query = supabase
        .from(TABLES.COACHES)
        .select('*')
        .eq('sharedWith.isPublic', true)
        .eq('approvalStatus', 'approved')
        .order('effectivenessMetrics.averageRating', { ascending: false });

      // Apply filters similar to getUserCoaches
      if (filters) {
        if (filters.categories.length > 0) {
          query = query.in('template.category', filters.categories);
        }

        if (filters.searchQuery) {
          query = query.or(`name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
        }
      }

      const { data, error } = await query;

      if (error) {
        handleSupabaseError(error);
      }

      return data as CustomCoach[];
    } catch (error) {
      console.error('Error getting public coaches:', error);
      throw error;
    }
  }

  /**
   * Get coach templates
   */
  async getCoachTemplates(): Promise<CoachTemplate[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.COACH_TEMPLATES)
        .select('*')
        .order('popularity', { ascending: false });

      if (error) {
        handleSupabaseError(error);
      }

      return data as CoachTemplate[];
    } catch (error) {
      console.error('Error getting coach templates:', error);
      throw error;
    }
  }

  /**
   * Get a specific coach template
   */
  async getCoachTemplate(id: string): Promise<CoachTemplate | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.COACH_TEMPLATES)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        handleSupabaseError(error);
      }

      return data as CoachTemplate;
    } catch (error) {
      console.error('Error getting coach template:', error);
      throw error;
    }
  }

  // === UPDATE OPERATIONS ===

  /**
   * Update a custom coach
   */
  async updateCustomCoach(id: string, updates: Partial<CustomCoach>): Promise<CustomCoach> {
    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date(),
        version: updates.version ? updates.version + 1 : undefined
      };

      const { data, error } = await supabase
        .from(TABLES.COACHES)
        .update(updatedData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        handleSupabaseError(error);
      }

      return data as CustomCoach;
    } catch (error) {
      console.error('Error updating custom coach:', error);
      throw error;
    }
  }

  /**
   * Update coach effectiveness metrics
   */
  async updateCoachMetrics(coachId: string, metrics: Partial<EffectivenessMetrics>): Promise<void> {
    try {
      const coach = await this.getCustomCoach(coachId);
      if (!coach) {
        throw new Error(`Coach with ID ${coachId} not found`);
      }

      const updatedMetrics = {
        ...coach.effectivenessMetrics,
        ...metrics,
        lastCalculated: new Date()
      };

      await this.updateCustomCoach(coachId, { effectivenessMetrics: updatedMetrics });
    } catch (error) {
      console.error('Error updating coach metrics:', error);
      throw error;
    }
  }

  /**
   * Add patient interaction to coach history
   */
  async addPatientInteraction(coachId: string, interaction: PatientInteraction): Promise<void> {
    try {
      const coach = await this.getCustomCoach(coachId);
      if (!coach) {
        throw new Error(`Coach with ID ${coachId} not found`);
      }

      const updatedHistory = [...coach.patientInteractionHistory, interaction];

      // Keep only the last 1000 interactions to manage storage
      if (updatedHistory.length > 1000) {
        updatedHistory.splice(0, updatedHistory.length - 1000);
      }

      await this.updateCustomCoach(coachId, { patientInteractionHistory: updatedHistory });

      // Update effectiveness metrics based on the new interaction
      await this.recalculateEffectivenessMetrics(coachId);
    } catch (error) {
      console.error('Error adding patient interaction:', error);
      throw error;
    }
  }

  // === DELETE OPERATIONS ===

  /**
   * Delete a custom coach
   */
  async deleteCustomCoach(id: string, userId: string): Promise<void> {
    try {
      // Verify ownership before deletion
      const coach = await this.getCustomCoach(id);
      if (!coach) {
        throw new Error(`Coach with ID ${id} not found`);
      }

      if (coach.createdBy !== userId) {
        throw new Error('You do not have permission to delete this coach');
      }

      const { error } = await supabase
        .from(TABLES.COACHES)
        .delete()
        .eq('id', id)
        .eq('createdBy', userId);

      if (error) {
        handleSupabaseError(error);
      }
    } catch (error) {
      console.error('Error deleting custom coach:', error);
      throw error;
    }
  }

  /**
   * Bulk operations on coaches
   */
  async performBulkOperation(operation: CoachBulkOperation, userId: string): Promise<void> {
    try {
      switch (operation.type) {
        case 'delete':
          await this.bulkDeleteCoaches(operation.coachIds, userId);
          break;
        case 'duplicate':
          await this.bulkDuplicateCoaches(operation.coachIds, userId);
          break;
        case 'archive':
          await this.bulkArchiveCoaches(operation.coachIds, userId);
          break;
        case 'approve':
          await this.bulkApproveCoaches(operation.coachIds, userId);
          break;
        case 'reject':
          await this.bulkRejectCoaches(operation.coachIds, userId);
          break;
        case 'export':
          // Export functionality would be handled differently (return data instead of void)
          throw new Error('Export operation should use separate method');
      }
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      throw error;
    }
  }

  // === ANALYTICS OPERATIONS ===

  /**
   * Get coach analytics
   */
  async getCoachAnalytics(coachId: string, timeframe: CoachAnalytics['timeframe']): Promise<CoachAnalytics> {
    try {
      const coach = await this.getCustomCoach(coachId);
      if (!coach) {
        throw new Error(`Coach with ID ${coachId} not found`);
      }

      // Calculate date range based on timeframe
      const now = new Date();
      const startDate = this.getStartDateForTimeframe(now, timeframe);

      // Get conversation sessions for the timeframe
      const { data: sessions, error } = await supabase
        .from('conversation_sessions')
        .select('*')
        .eq('coach_id', coachId)
        .gte('started_at', startDate.toISOString());

      if (error) {
        handleSupabaseError(error);
      }

      // Calculate metrics
      const metrics = this.calculateAnalyticsMetrics(sessions || []);
      const trends = this.calculateTrends(sessions || [], timeframe);
      const comparisons = await this.calculateComparisons(coachId, metrics);

      return {
        coachId,
        timeframe,
        metrics,
        trends,
        comparisons
      };
    } catch (error) {
      console.error('Error getting coach analytics:', error);
      throw error;
    }
  }

  // === PRIVATE HELPER METHODS ===

  private createDefaultEffectivenessMetrics(): EffectivenessMetrics {
    return {
      totalInteractions: 0,
      averageRating: 0,
      engagementScore: 0,
      goalAchievementRate: 0,
      patientRetentionRate: 0,
      crisisPreventionCount: 0,
      positiveOutcomePercentage: 0,
      recommendationAcceptanceRate: 0,
      lastCalculated: new Date(),
      trendAnalysis: {
        improving: false,
        stagnant: true,
        declining: false,
        trend: 0
      }
    };
  }

  private createDefaultBehaviorSettings() {
    return {
      responseStyle: 'conversational' as const,
      encouragementLevel: 'moderate' as const,
      challengeLevel: 'moderate' as const,
      personalizationDepth: 'moderate' as const,
      memoryRetention: 'long_term' as const,
      escalationSensitivity: 'medium' as const,
      culturalAdaptation: true,
      languageComplexity: 'standard' as const,
      humorAppropriate: true,
      motivationalApproach: 'mixed' as const
    };
  }

  private createDefaultSharingSettings() {
    return {
      isPublic: false,
      shareWithCaregivers: false,
      shareWithHealthcareProviders: false,
      allowCommunityAccess: false,
      sharedWithUsers: [],
      permissionLevel: 'view_only' as const,
      shareAnalytics: false,
      anonymizeData: true
    };
  }

  private async recalculateEffectivenessMetrics(coachId: string): Promise<void> {
    const coach = await this.getCustomCoach(coachId);
    if (!coach || coach.patientInteractionHistory.length === 0) {
      return;
    }

    const interactions = coach.patientInteractionHistory;
    const totalInteractions = interactions.length;

    // Calculate metrics
    const averageRating = interactions.reduce((sum, i) => sum + i.effectiveness.userRating, 0) / totalInteractions;
    const engagementScore = interactions.reduce((sum, i) => sum + i.effectiveness.engagementScore, 0) / totalInteractions;
    const goalAchievementRate = interactions.reduce((sum, i) => sum + i.effectiveness.goalProgress, 0) / totalInteractions;

    const positiveOutcomes = interactions.filter(i =>
      i.outcomeCategories.some(outcome =>
        ['goal_achieved', 'progress_made', 'crisis_averted', 'education_provided', 'motivation_enhanced'].includes(outcome)
      )
    ).length;

    const positiveOutcomePercentage = (positiveOutcomes / totalInteractions) * 100;
    const crisisPreventionCount = interactions.filter(i =>
      i.outcomeCategories.includes('crisis_averted')
    ).length;

    // Calculate trend (simplified - compare last 10 vs previous 10 interactions)
    let trend = 0;
    if (totalInteractions >= 20) {
      const recent = interactions.slice(-10);
      const previous = interactions.slice(-20, -10);

      const recentAvg = recent.reduce((sum, i) => sum + i.effectiveness.userRating, 0) / 10;
      const previousAvg = previous.reduce((sum, i) => sum + i.effectiveness.userRating, 0) / 10;

      trend = (recentAvg - previousAvg) / 5; // Normalize to -1 to 1 range
    }

    const updatedMetrics: EffectivenessMetrics = {
      totalInteractions,
      averageRating,
      engagementScore,
      goalAchievementRate,
      patientRetentionRate: 80, // Would need session data to calculate properly
      crisisPreventionCount,
      positiveOutcomePercentage,
      recommendationAcceptanceRate: 75, // Would need specific tracking
      lastCalculated: new Date(),
      trendAnalysis: {
        improving: trend > 0.1,
        stagnant: Math.abs(trend) <= 0.1,
        declining: trend < -0.1,
        trend
      }
    };

    await this.updateCoachMetrics(coachId, updatedMetrics);
  }

  private async bulkDeleteCoaches(coachIds: string[], userId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.COACHES)
      .delete()
      .in('id', coachIds)
      .eq('createdBy', userId);

    if (error) {
      handleSupabaseError(error);
    }
  }

  private async bulkDuplicateCoaches(coachIds: string[], userId: string): Promise<void> {
    for (const coachId of coachIds) {
      const coach = await this.getCustomCoach(coachId);
      if (coach && coach.createdBy === userId) {
        const duplicatedCoach = {
          ...coach,
          name: `${coach.name} (Copy)`,
          id: undefined,
          createdAt: undefined,
          updatedAt: undefined,
          effectivenessMetrics: undefined,
          patientInteractionHistory: undefined
        };

        await this.createCustomCoach(duplicatedCoach as any);
      }
    }
  }

  private async bulkArchiveCoaches(coachIds: string[], userId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.COACHES)
      .update({ isActive: false, updatedAt: new Date() })
      .in('id', coachIds)
      .eq('createdBy', userId);

    if (error) {
      handleSupabaseError(error);
    }
  }

  private async bulkApproveCoaches(coachIds: string[], userId: string): Promise<void> {
    // This would typically require admin permissions
    const { error } = await supabase
      .from(TABLES.COACHES)
      .update({ approvalStatus: 'approved', updatedAt: new Date() })
      .in('id', coachIds);

    if (error) {
      handleSupabaseError(error);
    }
  }

  private async bulkRejectCoaches(coachIds: string[], userId: string): Promise<void> {
    // This would typically require admin permissions
    const { error } = await supabase
      .from(TABLES.COACHES)
      .update({ approvalStatus: 'rejected', updatedAt: new Date() })
      .in('id', coachIds);

    if (error) {
      handleSupabaseError(error);
    }
  }

  private getStartDateForTimeframe(now: Date, timeframe: CoachAnalytics['timeframe']): Date {
    const startDate = new Date(now);

    switch (timeframe) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    return startDate;
  }

  private calculateAnalyticsMetrics(sessions: any[]): CoachAnalytics['metrics'] {
    if (sessions.length === 0) {
      return {
        totalInteractions: 0,
        uniqueUsers: 0,
        averageSessionDuration: 0,
        satisfactionScore: 0,
        goalCompletionRate: 0,
        retentionRate: 0,
        escalationRate: 0
      };
    }

    const totalInteractions = sessions.length;
    const uniqueUsers = new Set(sessions.map(s => s.user_id)).size;
    const averageSessionDuration = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / totalInteractions;
    const satisfactionScore = sessions.reduce((sum, s) => sum + (s.satisfaction_rating || 0), 0) / sessions.filter(s => s.satisfaction_rating).length || 0;
    const goalCompletionRate = sessions.reduce((sum, s) => sum + (s.goal_progress || 0), 0) / sessions.filter(s => s.goal_progress).length || 0;
    const escalationRate = (sessions.filter(s => s.escalation_triggered).length / totalInteractions) * 100;

    return {
      totalInteractions,
      uniqueUsers,
      averageSessionDuration,
      satisfactionScore,
      goalCompletionRate,
      retentionRate: 80, // Would need more complex calculation
      escalationRate
    };
  }

  private calculateTrends(sessions: any[], timeframe: CoachAnalytics['timeframe']): CoachAnalytics['trends'] {
    // Simplified trend calculation
    const periods = this.groupSessionsByPeriod(sessions, timeframe);

    return {
      interactionTrend: periods.map(p => p.length),
      satisfactionTrend: periods.map(p => {
        const rated = p.filter(s => s.satisfaction_rating);
        return rated.length > 0 ? rated.reduce((sum, s) => sum + s.satisfaction_rating, 0) / rated.length : 0;
      }),
      performanceTrend: periods.map(p => {
        const withProgress = p.filter(s => s.goal_progress);
        return withProgress.length > 0 ? withProgress.reduce((sum, s) => sum + s.goal_progress, 0) / withProgress.length : 0;
      })
    };
  }

  private groupSessionsByPeriod(sessions: any[], timeframe: CoachAnalytics['timeframe']): any[][] {
    // Group sessions by time periods based on timeframe
    // This is a simplified implementation
    const periods: any[][] = [];

    // For now, just create 7 periods with roughly equal distribution
    const periodSize = Math.ceil(sessions.length / 7);
    for (let i = 0; i < sessions.length; i += periodSize) {
      periods.push(sessions.slice(i, i + periodSize));
    }

    return periods;
  }

  private async calculateComparisons(coachId: string, metrics: CoachAnalytics['metrics']): Promise<CoachAnalytics['comparisons']> {
    // Simplified comparison calculation
    // In a real implementation, you'd compare against category averages, etc.

    return {
      versusBaseline: 0, // Would compare against historical baseline
      versusCategory: 0, // Would compare against other coaches in same category
      rankInCategory: 1  // Would calculate rank among similar coaches
    };
  }
}

// Export a singleton instance
export const coachService = new CoachService();