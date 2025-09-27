import React, { useState, useEffect } from 'react';
import { CustomCoach, CoachTemplate, HealthConditionCategory } from '../../types';
import { coachService } from '../../services/coachService';
import { COACH_TEMPLATES, getTemplatesByCategory } from '../../data/coachTemplates';
import TemplateSelector from './TemplateSelector';
import CoachEditor from './CoachEditor';
import CoachPreview from './CoachPreview';

interface CoachBuilderProps {
  initialCoach?: CustomCoach;
  onSave: (coach: CustomCoach) => void;
  onCancel: () => void;
}

type BuilderStep = 'template' | 'customize' | 'preview';

const CoachBuilder: React.FC<CoachBuilderProps> = ({
  initialCoach,
  onSave,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState<BuilderStep>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<CoachTemplate | null>(null);
  const [coachData, setCoachData] = useState<Partial<CustomCoach>>(
    initialCoach || {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If editing existing coach, skip template selection
  useEffect(() => {
    if (initialCoach) {
      setCurrentStep('customize');
      setSelectedTemplate(initialCoach.template || null);
    }
  }, [initialCoach]);

  const handleTemplateSelect = (template: CoachTemplate) => {
    setSelectedTemplate(template);
    setCurrentStep('customize');

    // Initialize coach data from template
    setCoachData({
      name: `My ${template.name}`,
      description: template.description,
      personality: template.basePersonality,
      expertise: [],
      avatar: 'default-avatar.png',
      role: 'primary_coach',
      credentials: [],
      mayoClinicProtocols: [],
      systemPrompt: template.systemPromptTemplate,
      voiceSettings: template.defaultVoiceSettings,
      healthSpecializations: template.recommendedSpecializations,
      mayoProtocols: [],
      coachingStyle: 'supportive_companion',
      approvalStatus: 'draft',
      isCustom: true,
      createdBy: 'current-user-id', // Would come from auth context
      behaviorSettings: {
        responseStyle: 'conversational',
        encouragementLevel: 'moderate',
        challengeLevel: 'moderate',
        personalizationDepth: 'moderate',
        memoryRetention: 'long_term',
        escalationSensitivity: 'medium',
        culturalAdaptation: true,
        languageComplexity: 'standard',
        humorAppropriate: true,
        motivationalApproach: 'mixed'
      },
      sharedWith: {
        isPublic: false,
        shareWithCaregivers: false,
        shareWithHealthcareProviders: false,
        allowCommunityAccess: false,
        sharedWithUsers: [],
        permissionLevel: 'view_only',
        shareAnalytics: false,
        anonymizeData: true
      },
      version: 1,
      lastOptimized: new Date()
    });
  };

  const handleCustomizeComplete = (updatedCoachData: Partial<CustomCoach>) => {
    setCoachData(updatedCoachData);
    setCurrentStep('preview');
  };

  const handleSaveCoach = async () => {
    if (!coachData.name) {
      setError('Coach name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let savedCoach: CustomCoach;

      if (initialCoach) {
        // Update existing coach
        savedCoach = await coachService.updateCustomCoach(initialCoach.id, coachData);
      } else {
        // Create new coach
        savedCoach = await coachService.createCustomCoach(coachData as any);
      }

      onSave(savedCoach);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save coach');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepBack = () => {
    switch (currentStep) {
      case 'customize':
        if (!initialCoach) {
          setCurrentStep('template');
        }
        break;
      case 'preview':
        setCurrentStep('customize');
        break;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'template':
        return (
          <TemplateSelector
            templates={COACH_TEMPLATES}
            onSelect={handleTemplateSelect}
            onSkip={() => {
              setCurrentStep('customize');
              setCoachData({
                name: 'Custom Coach',
                description: 'A personalized health coach created from scratch',
                personality: 'supportive',
                expertise: [],
                avatar: 'default-avatar.png',
                role: 'primary_coach',
                credentials: [],
                mayoClinicProtocols: [],
                systemPrompt: 'You are a supportive health coach...',
                voiceSettings: {
                  provider: 'openai',
                  voiceId: 'nova',
                  voiceName: 'Nova',
                  gender: 'female',
                  accent: 'american',
                  speed: 1.0,
                  pitch: 1.0,
                  stability: 0.8,
                  clarityAndSimilarity: 0.9,
                  emotionalRange: 'moderate',
                  customization: {
                    warmth: 8,
                    authority: 6,
                    empathy: 9,
                    energy: 6
                  }
                },
                healthSpecializations: [],
                mayoProtocols: [],
                coachingStyle: 'supportive_companion',
                approvalStatus: 'draft',
                isCustom: true,
                createdBy: 'current-user-id',
                behaviorSettings: {
                  responseStyle: 'conversational',
                  encouragementLevel: 'moderate',
                  challengeLevel: 'moderate',
                  personalizationDepth: 'moderate',
                  memoryRetention: 'long_term',
                  escalationSensitivity: 'medium',
                  culturalAdaptation: true,
                  languageComplexity: 'standard',
                  humorAppropriate: true,
                  motivationalApproach: 'mixed'
                },
                sharedWith: {
                  isPublic: false,
                  shareWithCaregivers: false,
                  shareWithHealthcareProviders: false,
                  allowCommunityAccess: false,
                  sharedWithUsers: [],
                  permissionLevel: 'view_only',
                  shareAnalytics: false,
                  anonymizeData: true
                },
                version: 1,
                lastOptimized: new Date()
              });
            }}
          />
        );

      case 'customize':
        return (
          <CoachEditor
            coachData={coachData}
            selectedTemplate={selectedTemplate}
            onChange={setCoachData}
            onComplete={handleCustomizeComplete}
          />
        );

      case 'preview':
        return (
          <CoachPreview
            coachData={coachData as CustomCoach}
            onEdit={() => setCurrentStep('customize')}
            onSave={handleSaveCoach}
            isLoading={isLoading}
            error={error}
          />
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'template':
        return 'Choose a Template';
      case 'customize':
        return initialCoach ? 'Edit Coach' : 'Customize Your Coach';
      case 'preview':
        return 'Preview & Save';
      default:
        return 'Coach Builder';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{getStepTitle()}</h1>
          <p className="text-gray-600 mt-2">
            {initialCoach ? 'Modify your custom health coach' : 'Create a personalized AI health coach'}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {currentStep !== 'template' && (
            <button
              onClick={handleStepBack}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
          )}
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      {!initialCoach && (
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep === 'template' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className={`h-1 w-16 ${
              ['customize', 'preview'].includes(currentStep) ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep === 'customize' ? 'bg-blue-600 text-white' :
              currentStep === 'preview' ? 'bg-gray-200 text-gray-600' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <div className={`h-1 w-16 ${
              currentStep === 'preview' ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-gray-50 rounded-lg p-6">
        {renderStepContent()}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
};

export default CoachBuilder;