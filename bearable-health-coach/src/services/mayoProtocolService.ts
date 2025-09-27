import { supabase, TABLES, handleSupabaseError } from './supabase';
import {
  MayoProtocol,
  ProtocolStep,
  MonitoringCriterion,
  HealthConditionCategory,
  LifestylePillar
} from '../types';

export class MayoProtocolService {

  /**
   * Get all available Mayo Clinic protocols
   */
  async getAllProtocols(): Promise<MayoProtocol[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.MAYO_PROTOCOLS)
        .select('*')
        .eq('isActive', true)
        .order('lastReviewed', { ascending: false });

      if (error) {
        handleSupabaseError(error);
      }

      return data as MayoProtocol[];
    } catch (error) {
      console.error('Error fetching Mayo protocols:', error);
      throw error;
    }
  }

  /**
   * Get protocols by health condition category
   */
  async getProtocolsByCategory(category: HealthConditionCategory): Promise<MayoProtocol[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.MAYO_PROTOCOLS)
        .select('*')
        .eq('category', category)
        .eq('isActive', true)
        .order('evidenceLevel', { ascending: true }); // A-grade evidence first

      if (error) {
        handleSupabaseError(error);
      }

      return data as MayoProtocol[];
    } catch (error) {
      console.error('Error fetching protocols by category:', error);
      throw error;
    }
  }

  /**
   * Get specific protocol by ID
   */
  async getProtocol(id: string): Promise<MayoProtocol | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.MAYO_PROTOCOLS)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        handleSupabaseError(error);
      }

      return data as MayoProtocol;
    } catch (error) {
      console.error('Error fetching protocol:', error);
      throw error;
    }
  }

  /**
   * Get protocols suitable for specific conditions
   */
  async getProtocolsForConditions(conditions: string[]): Promise<MayoProtocol[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.MAYO_PROTOCOLS)
        .select('*')
        .overlaps('applicableConditions', conditions)
        .eq('isActive', true)
        .order('evidenceLevel', { ascending: true });

      if (error) {
        handleSupabaseError(error);
      }

      return data as MayoProtocol[];
    } catch (error) {
      console.error('Error fetching protocols for conditions:', error);
      throw error;
    }
  }

  /**
   * Get protocols by lifestyle pillar
   */
  async getProtocolsByPillar(pillar: LifestylePillar): Promise<MayoProtocol[]> {
    try {
      const protocols = await this.getAllProtocols();

      return protocols.filter(protocol =>
        protocol.implementationSteps.some(step => step.pillar === pillar)
      );
    } catch (error) {
      console.error('Error fetching protocols by pillar:', error);
      throw error;
    }
  }

  /**
   * Validate protocol applicability for patient
   */
  async validateProtocolForPatient(
    protocolId: string,
    patientConditions: string[],
    contraindications: string[]
  ): Promise<{
    isApplicable: boolean;
    warnings: string[];
    recommendations: string[];
  }> {
    try {
      const protocol = await this.getProtocol(protocolId);
      if (!protocol) {
        throw new Error(`Protocol ${protocolId} not found`);
      }

      const warnings: string[] = [];
      const recommendations: string[] = [];

      // Check contraindications
      const hasContraindications = protocol.contraindicationsnd.some(contra =>
        contraindications.some(patientContra =>
          patientContra.toLowerCase().includes(contra.toLowerCase())
        )
      );

      if (hasContraindications) {
        warnings.push('This protocol has contraindications for this patient');
      }

      // Check if patient conditions match protocol targets
      const hasMatchingConditions = protocol.applicableConditions.some(condition =>
        patientConditions.some(patientCondition =>
          patientCondition.toLowerCase().includes(condition.toLowerCase())
        )
      );

      if (!hasMatchingConditions) {
        warnings.push('Patient conditions may not fully align with protocol targets');
      }

      // Generate recommendations based on evidence level
      if (protocol.evidenceLevel === 'A') {
        recommendations.push('This protocol has the highest level of clinical evidence');
      } else if (protocol.evidenceLevel === 'B') {
        recommendations.push('This protocol has good clinical evidence support');
      }

      return {
        isApplicable: !hasContraindications && hasMatchingConditions,
        warnings,
        recommendations
      };
    } catch (error) {
      console.error('Error validating protocol:', error);
      throw error;
    }
  }

  /**
   * Get personalized protocol recommendations
   */
  async getPersonalizedRecommendations(
    patientProfile: {
      conditions: string[];
      age?: number;
      medications: string[];
      lifestyle: {
        activityLevel: string;
        stressLevel: number;
      };
    }
  ): Promise<{
    primaryProtocols: MayoProtocol[];
    supportingProtocols: MayoProtocol[];
    riskFactors: string[];
  }> {
    try {
      // Get protocols for patient's conditions
      const applicableProtocols = await this.getProtocolsForConditions(patientProfile.conditions);

      // Validate each protocol
      const validatedProtocols = await Promise.all(
        applicableProtocols.map(async (protocol) => {
          const validation = await this.validateProtocolForPatient(
            protocol.id,
            patientProfile.conditions,
            patientProfile.medications // Treating medications as potential contraindications for simplicity
          );
          return { protocol, validation };
        })
      );

      // Separate into primary and supporting protocols
      const primaryProtocols = validatedProtocols
        .filter(({ validation }) => validation.isApplicable)
        .map(({ protocol }) => protocol)
        .slice(0, 3); // Limit to top 3

      const supportingProtocols = validatedProtocols
        .filter(({ validation }) => !validation.isApplicable && validation.warnings.length === 0)
        .map(({ protocol }) => protocol)
        .slice(0, 5); // Limit to top 5

      // Identify risk factors
      const riskFactors: string[] = [];

      if (patientProfile.age && patientProfile.age > 65) {
        riskFactors.push('Advanced age may require modified protocols');
      }

      if (patientProfile.lifestyle.stressLevel > 3) {
        riskFactors.push('High stress levels may impact treatment effectiveness');
      }

      if (patientProfile.lifestyle.activityLevel === 'sedentary') {
        riskFactors.push('Sedentary lifestyle may require gradual activity progression');
      }

      return {
        primaryProtocols,
        supportingProtocols,
        riskFactors
      };
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      throw error;
    }
  }

  /**
   * Generate coach integration instructions
   */
  async generateCoachInstructions(protocolIds: string[]): Promise<{
    systemPromptAdditions: string;
    behaviorModifications: any;
    monitoringPoints: string[];
    escalationTriggers: string[];
  }> {
    try {
      const protocols = await Promise.all(
        protocolIds.map(id => this.getProtocol(id))
      );

      const validProtocols = protocols.filter(p => p !== null) as MayoProtocol[];

      // Generate system prompt additions
      const protocolDescriptions = validProtocols.map(protocol => {
        return `\n### ${protocol.title}\n${protocol.description}\n\nKey Implementation Steps:\n${
          protocol.implementationSteps.map(step =>
            `- ${step.title}: ${step.description} (${step.pillar} focus)`
          ).join('\n')
        }`;
      }).join('\n');

      const systemPromptAdditions = `
CLINICAL PROTOCOLS:
You are integrating the following Mayo Clinic evidence-based protocols:
${protocolDescriptions}

PROTOCOL ADHERENCE:
- Always reference appropriate protocols when making recommendations
- Ensure recommendations align with evidence-based guidelines
- Monitor for protocol adherence and patient progress
- Escalate when protocol parameters are not met

EVIDENCE LEVELS:
${validProtocols.map(p => `- ${p.title}: Evidence Level ${p.evidenceLevel}`).join('\n')}
`;

      // Generate behavior modifications
      const behaviorModifications = {
        responseStyle: 'clinical', // More clinical when using protocols
        escalationSensitivity: 'high', // Higher sensitivity with medical protocols
        evidenceBasedFocus: true,
        protocolCompliance: true
      };

      // Extract monitoring points
      const monitoringPoints = validProtocols.flatMap(protocol =>
        protocol.monitoringCriteria.map(criterion =>
          `Monitor ${criterion.metric} ${criterion.target.operator} ${criterion.target.value} ${criterion.target.unit} (${criterion.frequency})`
        )
      );

      // Extract escalation triggers
      const escalationTriggers = validProtocols.flatMap(protocol =>
        protocol.monitoringCriteria
          .filter(criterion => criterion.alertThresholds.critical)
          .map(criterion =>
            `Critical: ${criterion.metric} reaches ${criterion.alertThresholds.critical} ${criterion.target.unit}`
          )
      );

      return {
        systemPromptAdditions,
        behaviorModifications,
        monitoringPoints,
        escalationTriggers
      };
    } catch (error) {
      console.error('Error generating coach instructions:', error);
      throw error;
    }
  }

  /**
   * Track protocol adherence for a patient
   */
  async trackProtocolAdherence(
    protocolId: string,
    patientId: string,
    completedSteps: string[],
    metrics: Record<string, { value: number; unit: string; timestamp: Date }>
  ): Promise<{
    adherenceScore: number;
    completedSteps: number;
    totalSteps: number;
    nextSteps: ProtocolStep[];
    warnings: string[];
  }> {
    try {
      const protocol = await this.getProtocol(protocolId);
      if (!protocol) {
        throw new Error(`Protocol ${protocolId} not found`);
      }

      const totalSteps = protocol.implementationSteps.length;
      const completedCount = completedSteps.length;
      const adherenceScore = (completedCount / totalSteps) * 100;

      // Find next steps
      const nextSteps = protocol.implementationSteps.filter(step =>
        !completedSteps.includes(step.id)
      ).slice(0, 3); // Next 3 steps

      // Check for warnings based on monitoring criteria
      const warnings: string[] = [];
      protocol.monitoringCriteria.forEach(criterion => {
        const metric = metrics[criterion.metric];
        if (metric) {
          const { value } = metric;
          const { target, alertThresholds } = criterion;

          let isOutOfRange = false;

          switch (target.operator) {
            case '>':
              isOutOfRange = value <= target.value;
              break;
            case '<':
              isOutOfRange = value >= target.value;
              break;
            case '≥':
              isOutOfRange = value < target.value;
              break;
            case '≤':
              isOutOfRange = value > target.value;
              break;
            case '=':
              isOutOfRange = Math.abs(value - target.value) > (target.value * 0.1);
              break;
          }

          if (isOutOfRange) {
            if (alertThresholds.critical &&
                (value >= alertThresholds.critical || value <= alertThresholds.critical)) {
              warnings.push(`CRITICAL: ${criterion.metric} is at critical levels (${value} ${target.unit})`);
            } else if (alertThresholds.warning &&
                      (value >= alertThresholds.warning || value <= alertThresholds.warning)) {
              warnings.push(`WARNING: ${criterion.metric} is outside target range (${value} ${target.unit})`);
            }
          }
        }
      });

      return {
        adherenceScore,
        completedSteps: completedCount,
        totalSteps,
        nextSteps,
        warnings
      };
    } catch (error) {
      console.error('Error tracking protocol adherence:', error);
      throw error;
    }
  }

  /**
   * Search protocols by keywords
   */
  async searchProtocols(query: string): Promise<MayoProtocol[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.MAYO_PROTOCOLS)
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('isActive', true)
        .order('evidenceLevel', { ascending: true });

      if (error) {
        handleSupabaseError(error);
      }

      return data as MayoProtocol[];
    } catch (error) {
      console.error('Error searching protocols:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const mayoProtocolService = new MayoProtocolService();