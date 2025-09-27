import { supabase, TABLES, handleSupabaseError } from './supabase';
import {
  CustomCoach,
  CoachOptimization,
  OptimizationRecommendation,
  CoachChange,
  EffectivenessMetrics,
  PatientInteraction
} from '../types';
import { coachService } from './coachService';
import { v4 as uuidv4 } from 'uuid';

export class CoachOptimizationService {

  /**
   * Analyze coach performance and generate optimization recommendations
   */
  async analyzeCoachPerformance(coachId: string): Promise<CoachOptimization> {
    try {
      const coach = await coachService.getCustomCoach(coachId);
      if (!coach) {
        throw new Error(`Coach ${coachId} not found`);
      }

      const optimization: CoachOptimization = {
        id: uuidv4(),
        coachId,
        optimizationType: 'comprehensive',
        triggeredBy: 'scheduled',
        analysisData: await this.gatherAnalysisData(coach),
        recommendations: await this.generateRecommendations(coach),
        implementedChanges: [],
        expectedImprovement: 0,
        status: 'recommendations_ready',
        createdAt: new Date()
      };

      // Calculate expected improvement
      optimization.expectedImprovement = this.calculateExpectedImprovement(optimization.recommendations);

      // Save optimization record
      const { data, error } = await supabase
        .from(TABLES.COACH_OPTIMIZATIONS)
        .insert([optimization])
        .select()
        .single();

      if (error) {
        handleSupabaseError(error);
      }

      return data as CoachOptimization;
    } catch (error) {
      console.error('Error analyzing coach performance:', error);
      throw error;
    }
  }

  /**
   * Implement optimization recommendations automatically
   */
  async implementOptimizations(
    optimizationId: string,
    selectedRecommendationIds: string[]
  ): Promise<CoachOptimization> {
    try {
      const optimization = await this.getOptimization(optimizationId);
      if (!optimization) {
        throw new Error(`Optimization ${optimizationId} not found`);
      }

      const selectedRecommendations = optimization.recommendations.filter(rec =>
        selectedRecommendationIds.includes(rec.id)
      );

      const implementedChanges: CoachChange[] = [];

      for (const recommendation of selectedRecommendations) {
        const change = await this.implementRecommendation(optimization.coachId, recommendation);
        implementedChanges.push(change);
      }

      // Update optimization status
      const updatedOptimization = {
        ...optimization,
        implementedChanges,
        status: 'implementing' as const,
        completedAt: new Date()
      };

      const { data, error } = await supabase
        .from(TABLES.COACH_OPTIMIZATIONS)
        .update(updatedOptimization)
        .eq('id', optimizationId)
        .select()
        .single();

      if (error) {
        handleSupabaseError(error);
      }

      return data as CoachOptimization;
    } catch (error) {
      console.error('Error implementing optimizations:', error);
      throw error;
    }
  }

  /**
   * Get optimization history for a coach
   */
  async getCoachOptimizationHistory(coachId: string): Promise<CoachOptimization[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.COACH_OPTIMIZATIONS)
        .select('*')
        .eq('coachId', coachId)
        .order('createdAt', { ascending: false });

      if (error) {
        handleSupabaseError(error);
      }

      return data as CoachOptimization[];
    } catch (error) {
      console.error('Error fetching optimization history:', error);
      throw error;
    }
  }

  /**
   * Get specific optimization
   */
  async getOptimization(id: string): Promise<CoachOptimization | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.COACH_OPTIMIZATIONS)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        handleSupabaseError(error);
      }

      return data as CoachOptimization;
    } catch (error) {
      console.error('Error fetching optimization:', error);
      throw error;
    }
  }

  /**
   * Run automatic optimization check for all coaches
   */
  async runAutomaticOptimization(): Promise<{
    analyzed: number;
    optimizationsCreated: number;
    errors: string[];
  }> {
    try {
      // Get all active coaches
      const coaches = await this.getAllActiveCoaches();
      let analyzed = 0;
      let optimizationsCreated = 0;
      const errors: string[] = [];

      for (const coach of coaches) {
        try {
          // Check if coach needs optimization
          if (await this.shouldOptimizeCoach(coach)) {
            await this.analyzeCoachPerformance(coach.id);
            optimizationsCreated++;
          }
          analyzed++;
        } catch (error) {
          errors.push(`Failed to optimize coach ${coach.id}: ${error}`);
        }
      }

      return { analyzed, optimizationsCreated, errors };
    } catch (error) {
      console.error('Error running automatic optimization:', error);
      throw error;
    }
  }

  // === PRIVATE HELPER METHODS ===

  private async gatherAnalysisData(coach: CustomCoach) {
    const recentInteractions = coach.patientInteractionHistory.slice(-50); // Last 50 interactions

    // Analyze interaction patterns
    const interactionPatterns = this.analyzeInteractionPatterns(recentInteractions);

    // Analyze user feedback
    const userFeedbackSummary = this.analyzeUserFeedback(recentInteractions);

    // Identify performance issues
    const identifiedIssues = this.identifyPerformanceIssues(coach, recentInteractions);

    return {
      performanceMetrics: coach.effectivenessMetrics,
      userFeedbackSummary,
      interactionPatterns,
      identifiedIssues
    };
  }

  private async generateRecommendations(coach: CustomCoach): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    const metrics = coach.effectivenessMetrics;

    // Personality optimization
    if (metrics.averageRating < 3.5) {
      recommendations.push({
        id: uuidv4(),
        category: 'personality',
        priority: 'high',
        description: 'Adjust coach personality to be more supportive and empathetic',
        expectedImpact: 25,
        confidence: 85,
        implementationComplexity: 'simple',
        suggestedChanges: {
          personality: 'supportive',
          behaviorSettings: {
            encouragementLevel: 'high',
            challengeLevel: 'gentle',
            empathy: 9
          }
        },
        reasoning: 'Low user ratings suggest patients need more supportive interactions',
        evidenceBase: ['User feedback analysis', 'Personality-performance correlation studies']
      });
    }

    // Voice optimization
    if (metrics.engagementScore < 60) {
      recommendations.push({
        id: uuidv4(),
        category: 'voice',
        priority: 'medium',
        description: 'Optimize voice settings for better patient engagement',
        expectedImpact: 20,
        confidence: 75,
        implementationComplexity: 'simple',
        suggestedChanges: {
          voiceSettings: {
            speed: 0.9, // Slightly slower for better comprehension
            warmth: 9,
            energy: 7
          }
        },
        reasoning: 'Low engagement scores may indicate voice characteristics are not optimal',
        evidenceBase: ['Engagement pattern analysis', 'Voice psychology research']
      });
    }

    // Behavior optimization
    if (metrics.goalAchievementRate < 50) {
      recommendations.push({
        id: uuidv4(),
        category: 'behavior',
        priority: 'high',
        description: 'Enhance goal-setting and motivation strategies',
        expectedImpact: 35,
        confidence: 90,
        implementationComplexity: 'moderate',
        suggestedChanges: {
          behaviorSettings: {
            challengeLevel: 'moderate',
            motivationalApproach: 'intrinsic',
            personalizationDepth: 'deep'
          }
        },
        reasoning: 'Low goal achievement suggests need for better motivation and personalization',
        evidenceBase: ['Goal achievement analysis', 'Motivational psychology research']
      });
    }

    // Protocol optimization
    if (coach.mayoProtocols.length === 0 && coach.template?.category !== 'general_wellness') {
      recommendations.push({
        id: uuidv4(),
        category: 'protocol',
        priority: 'high',
        description: 'Integrate relevant Mayo Clinic protocols for evidence-based guidance',
        expectedImpact: 40,
        confidence: 95,
        implementationComplexity: 'moderate',
        suggestedChanges: {
          mayoProtocols: await this.suggestRelevantProtocols(coach)
        },
        reasoning: 'Evidence-based protocols significantly improve clinical outcomes',
        evidenceBase: ['Clinical guideline effectiveness studies', 'Protocol adherence research']
      });
    }

    // Specialization optimization
    if (metrics.totalInteractions > 20 && coach.healthSpecializations.length < 2) {
      recommendations.push({
        id: uuidv4(),
        category: 'specialization',
        priority: 'medium',
        description: 'Add relevant health specializations to improve expertise depth',
        expectedImpact: 15,
        confidence: 70,
        implementationComplexity: 'simple',
        suggestedChanges: {
          healthSpecializations: await this.suggestAdditionalSpecializations(coach)
        },
        reasoning: 'More specializations can improve coach relevance and effectiveness',
        evidenceBase: ['Specialization-outcome correlation', 'Expert system research']
      });
    }

    return recommendations;
  }

  private calculateExpectedImprovement(recommendations: OptimizationRecommendation[]): number {
    const totalImpact = recommendations.reduce((sum, rec) => {
      return sum + (rec.expectedImpact * rec.confidence / 100);
    }, 0);

    return Math.min(100, totalImpact); // Cap at 100%
  }

  private async implementRecommendation(
    coachId: string,
    recommendation: OptimizationRecommendation
  ): Promise<CoachChange> {
    const coach = await coachService.getCustomCoach(coachId);
    if (!coach) {
      throw new Error(`Coach ${coachId} not found`);
    }

    const change: CoachChange = {
      id: uuidv4(),
      timestamp: new Date(),
      changeType: this.mapCategoryToChangeType(recommendation.category),
      description: recommendation.description,
      oldValue: this.extractOldValue(coach, recommendation.category),
      newValue: recommendation.suggestedChanges,
      changeBy: 'ai_optimization',
      isReverted: false
    };

    // Apply the changes to the coach
    const updatedFields = this.applyChangesToCoach(coach, recommendation.suggestedChanges);
    await coachService.updateCustomCoach(coachId, updatedFields);

    return change;
  }

  private mapCategoryToChangeType(category: string): CoachChange['changeType'] {
    switch (category) {
      case 'personality':
        return 'personality_adjustment';
      case 'voice':
        return 'voice_modification';
      case 'behavior':
        return 'behavior_update';
      case 'protocol':
        return 'protocol_change';
      case 'specialization':
        return 'specialization_add';
      default:
        return 'behavior_update';
    }
  }

  private extractOldValue(coach: CustomCoach, category: string): any {
    switch (category) {
      case 'personality':
        return { personality: coach.personality };
      case 'voice':
        return { voiceSettings: coach.voiceSettings };
      case 'behavior':
        return { behaviorSettings: coach.behaviorSettings };
      case 'protocol':
        return { mayoProtocols: coach.mayoProtocols };
      case 'specialization':
        return { healthSpecializations: coach.healthSpecializations };
      default:
        return {};
    }
  }

  private applyChangesToCoach(coach: CustomCoach, changes: any): Partial<CustomCoach> {
    const updatedFields: Partial<CustomCoach> = {};

    if (changes.personality) {
      updatedFields.personality = changes.personality;
    }

    if (changes.voiceSettings) {
      updatedFields.voiceSettings = { ...coach.voiceSettings, ...changes.voiceSettings };
    }

    if (changes.behaviorSettings) {
      updatedFields.behaviorSettings = { ...coach.behaviorSettings, ...changes.behaviorSettings };
    }

    if (changes.mayoProtocols) {
      updatedFields.mayoProtocols = changes.mayoProtocols;
    }

    if (changes.healthSpecializations) {
      updatedFields.healthSpecializations = [
        ...coach.healthSpecializations,
        ...changes.healthSpecializations
      ];
    }

    updatedFields.lastOptimized = new Date();
    updatedFields.version = coach.version + 1;

    return updatedFields;
  }

  private analyzeInteractionPatterns(interactions: PatientInteraction[]) {
    if (interactions.length === 0) return {};

    const avgDuration = interactions.reduce((sum, i) => sum + i.duration, 0) / interactions.length;
    const avgRating = interactions.reduce((sum, i) => sum + i.effectiveness.userRating, 0) / interactions.length;
    const topicsFrequency = this.getTopicFrequency(interactions);
    const outcomePatterns = this.getOutcomePatterns(interactions);

    return {
      avgDuration,
      avgRating,
      topicsFrequency,
      outcomePatterns,
      totalInteractions: interactions.length
    };
  }

  private analyzeUserFeedback(interactions: PatientInteraction[]): string {
    const ratings = interactions.map(i => i.effectiveness.userRating);
    const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

    const outcomes = interactions.flatMap(i => i.outcomeCategories);
    const positiveOutcomes = outcomes.filter(o =>
      ['goal_achieved', 'progress_made', 'motivation_enhanced'].includes(o)
    ).length;

    const negativeOutcomes = outcomes.filter(o =>
      ['declined_progress', 'escalation_needed'].includes(o)
    ).length;

    return `Average rating: ${avgRating.toFixed(1)}/5. Positive outcomes: ${positiveOutcomes}, Negative outcomes: ${negativeOutcomes}. Common topics: ${this.getTopTopics(interactions).join(', ')}.`;
  }

  private identifyPerformanceIssues(coach: CustomCoach, interactions: PatientInteraction[]): string[] {
    const issues: string[] = [];

    if (coach.effectivenessMetrics.averageRating < 3.0) {
      issues.push('Low user satisfaction ratings');
    }

    if (coach.effectivenessMetrics.engagementScore < 50) {
      issues.push('Poor patient engagement');
    }

    if (coach.effectivenessMetrics.goalAchievementRate < 40) {
      issues.push('Low goal achievement rates');
    }

    if (interactions.filter(i => i.followUpRequired).length > interactions.length * 0.3) {
      issues.push('High follow-up requirement rate');
    }

    if (coach.effectivenessMetrics.trendAnalysis.declining) {
      issues.push('Declining performance trend');
    }

    return issues;
  }

  private getTopicFrequency(interactions: PatientInteraction[]) {
    const topics: Record<string, number> = {};
    interactions.forEach(interaction => {
      interaction.topicsDiscussed.forEach(topic => {
        topics[topic] = (topics[topic] || 0) + 1;
      });
    });
    return topics;
  }

  private getOutcomePatterns(interactions: PatientInteraction[]) {
    const outcomes: Record<string, number> = {};
    interactions.forEach(interaction => {
      interaction.outcomeCategories.forEach(outcome => {
        outcomes[outcome] = (outcomes[outcome] || 0) + 1;
      });
    });
    return outcomes;
  }

  private getTopTopics(interactions: PatientInteraction[]): string[] {
    const topicFreq = this.getTopicFrequency(interactions);
    return Object.entries(topicFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([topic]) => topic);
  }

  private async suggestRelevantProtocols(coach: CustomCoach) {
    // This would integrate with Mayo Protocol Service
    // For now, return placeholder based on coach category
    const protocolMap: Record<string, string[]> = {
      'diabetes': ['mayo-diabetes-t1-comprehensive', 'mayo-diabetes-t2-lifestyle'],
      'cardiovascular': ['mayo-cardiac-rehabilitation'],
      'mental_health': ['mayo-depression-lifestyle'],
      'chronic_pain': ['mayo-chronic-pain-management']
    };

    return protocolMap[coach.template?.category || 'general_wellness'] || [];
  }

  private async suggestAdditionalSpecializations(coach: CustomCoach) {
    // Return placeholder specializations based on coach interactions
    return []; // Would analyze interaction patterns to suggest relevant specializations
  }

  private async getAllActiveCoaches(): Promise<CustomCoach[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.COACHES)
        .select('*')
        .eq('isActive', true);

      if (error) {
        handleSupabaseError(error);
      }

      return data as CustomCoach[];
    } catch (error) {
      console.error('Error fetching active coaches:', error);
      throw error;
    }
  }

  private async shouldOptimizeCoach(coach: CustomCoach): Promise<boolean> {
    // Check if coach has enough data for optimization
    if (coach.effectivenessMetrics.totalInteractions < 10) {
      return false;
    }

    // Check if recently optimized
    const daysSinceOptimization = (Date.now() - new Date(coach.lastOptimized).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceOptimization < 7) {
      return false;
    }

    // Check if performance is declining or suboptimal
    return (
      coach.effectivenessMetrics.averageRating < 4.0 ||
      coach.effectivenessMetrics.engagementScore < 70 ||
      coach.effectivenessMetrics.trendAnalysis.declining
    );
  }
}

// Export singleton instance
export const coachOptimizationService = new CoachOptimizationService();