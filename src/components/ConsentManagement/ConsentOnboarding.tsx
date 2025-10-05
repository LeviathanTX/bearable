/**
 * Consent Onboarding Flow
 *
 * HIPAA-compliant multi-step consent flow for new users
 * Implements progressive disclosure and granular consent options
 */

import React, { useState } from 'react';
import {
  ConsentScope,
  DataCategory,
  AccessLevel,
  ConsentPermissions,
  AIConsentPermissions,
} from '../../types/consent';

interface ConsentOnboardingProps {
  userId: string;
  userName: string;
  onComplete: (consents: ConsentConfiguration[]) => void;
  onSkip?: () => void;
}

interface ConsentConfiguration {
  scope: ConsentScope;
  permissions: ConsentPermissions;
}

type OnboardingStep = 'welcome' | 'essential' | 'ai_personalization' | 'caregivers' | 'third_party' | 'review';

export const ConsentOnboarding: React.FC<ConsentOnboardingProps> = ({
  userId,
  userName,
  onComplete,
  onSkip,
}) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [consents, setConsents] = useState<ConsentConfiguration[]>([]);

  // Essential AI consent state
  const [essentialAIEnabled, setEssentialAIEnabled] = useState(true);
  const [essentialDataCategories, setEssentialDataCategories] = useState<Set<DataCategory>>(
    new Set(['demographics', 'health_metrics', 'activity_logs'] as DataCategory[])
  );

  // AI Personalization consent state
  const [aiPersonalization, setAIPersonalization] = useState({
    allowModelTraining: false,
    allowPersonalization: true,
    allowPredictiveAnalytics: true,
    allowBehavioralAnalysis: false,
    allowProactiveOutreach: true,
  });

  // Caregiver consent state
  const [caregiverEnabled, setCaregiverEnabled] = useState(false);
  const [caregiverDataSharing, setCaregiverDataSharing] = useState<Set<DataCategory>>(
    new Set(['activity_logs', 'ai_recommendations'] as DataCategory[])
  );

  // Third-party integration state
  const [thirdPartyEnabled, setThirdPartyEnabled] = useState(false);
  const [wearableSync, setWearableSync] = useState(false);

  const steps: OnboardingStep[] = ['welcome', 'essential', 'ai_personalization', 'caregivers', 'third_party', 'review'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleComplete = () => {
    const finalConsents: ConsentConfiguration[] = [];

    // Essential AI consent (required)
    if (essentialAIEnabled) {
      const dataAccess: ConsentPermissions['dataAccess'] = {};
      essentialDataCategories.forEach((cat) => {
        dataAccess[cat] = 'detailed';
      });

      finalConsents.push({
        scope: 'personal_ai',
        permissions: {
          dataAccess,
          canView: true,
          canModify: false,
          canDelete: false,
          canExport: true,
          canShare: false,
          aiPermissions: {
            allowModelTraining: aiPersonalization.allowModelTraining,
            allowPersonalization: aiPersonalization.allowPersonalization,
            allowInsightGeneration: true,
            allowPredictiveAnalytics: aiPersonalization.allowPredictiveAnalytics,
            allowBehavioralAnalysis: aiPersonalization.allowBehavioralAnalysis,
            allowRiskAssessment: true,
            allowProactiveOutreach: aiPersonalization.allowProactiveOutreach,
            allowEmergencyOverride: true,
            requireExplanations: true,
            explanationDetail: 'moderate',
          },
        },
      });
    }

    // Caregiver consent (optional)
    if (caregiverEnabled) {
      const dataAccess: ConsentPermissions['dataAccess'] = {};
      caregiverDataSharing.forEach((cat) => {
        dataAccess[cat] = 'summary';
      });

      finalConsents.push({
        scope: 'caregiver',
        permissions: {
          dataAccess,
          canView: true,
          canModify: false,
          canDelete: false,
          canExport: false,
          canShare: false,
        },
      });
    }

    // Third-party integrations (optional)
    if (thirdPartyEnabled && wearableSync) {
      finalConsents.push({
        scope: 'third_party_integration',
        permissions: {
          dataAccess: {
            activity_logs: 'full',
            health_metrics: 'detailed',
          },
          canView: true,
          canModify: false,
          canDelete: false,
          canExport: true,
          canShare: false,
        },
      });
    }

    onComplete(finalConsents);
  };

  const toggleDataCategory = (category: DataCategory, set: Set<DataCategory>, setter: (s: Set<DataCategory>) => void) => {
    const newSet = new Set(set);
    if (newSet.has(category)) {
      newSet.delete(category);
    } else {
      newSet.add(category);
    }
    setter(newSet);
  };

  const renderWelcome = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-4xl mb-4">
          🔒
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Privacy Matters</h2>
        <p className="text-lg text-gray-600">
          Welcome, {userName}! Let's set up your privacy preferences.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">What you'll control:</h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>Which AI specialists can access your health data</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>What caregivers and healthcare providers can see</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>How your data is used for personalization and insights</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>Third-party app and device integrations</span>
          </li>
        </ul>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          <strong>HIPAA Compliant:</strong> Your health data is protected under federal law.
          You can change these settings anytime, and we'll always ask before sharing your information.
        </p>
      </div>

      <button
        onClick={handleNext}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
      >
        Get Started
      </button>

      {onSkip && (
        <button
          onClick={onSkip}
          className="w-full text-gray-600 py-2 hover:text-gray-800 transition-colors"
        >
          Skip for now
        </button>
      )}
    </div>
  );

  const renderEssential = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Essential AI Services</h2>
        <p className="text-gray-600">
          Your personal Bearable AI companion needs access to basic health information to help you.
        </p>
      </div>

      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl">
              🐻
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Wellness Bear</h3>
              <p className="text-sm text-gray-600">Your personal AI health companion</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={essentialAIEnabled}
              onChange={(e) => setEssentialAIEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {essentialAIEnabled && (
          <div className="space-y-3 mt-4 pt-4 border-t border-blue-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Data access permissions:</p>

            {[
              { id: 'demographics' as DataCategory, label: 'Basic Profile', desc: 'Age, gender, location' },
              { id: 'health_metrics' as DataCategory, label: 'Health Metrics', desc: 'Weight, blood pressure, vitals' },
              { id: 'activity_logs' as DataCategory, label: 'Activity Logs', desc: 'Exercise, sleep, nutrition tracking' },
              { id: 'medical_history' as DataCategory, label: 'Medical History', desc: 'Conditions, diagnoses' },
              { id: 'medications' as DataCategory, label: 'Medications', desc: 'Current and past medications' },
            ].map((item) => (
              <label key={item.id} className="flex items-start space-x-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                <input
                  type="checkbox"
                  checked={essentialDataCategories.has(item.id)}
                  onChange={() => toggleDataCategory(item.id, essentialDataCategories, setEssentialDataCategories)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.label}</div>
                  <div className="text-sm text-gray-500">{item.desc}</div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {!essentialAIEnabled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Disabling your personal AI will limit the app's ability to provide
            personalized health insights and recommendations.
          </p>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          onClick={handleBack}
          className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderAIPersonalization = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Personalization</h2>
        <p className="text-gray-600">
          Help your AI companion learn and adapt to your unique health journey.
        </p>
      </div>

      <div className="space-y-4">
        {[
          {
            key: 'allowPersonalization' as keyof typeof aiPersonalization,
            title: 'Personalized Recommendations',
            desc: 'Tailor suggestions based on your health goals, preferences, and progress',
            recommended: true,
          },
          {
            key: 'allowPredictiveAnalytics' as keyof typeof aiPersonalization,
            title: 'Predictive Health Insights',
            desc: 'Identify patterns and predict potential health risks before they become serious',
            recommended: true,
          },
          {
            key: 'allowProactiveOutreach' as keyof typeof aiPersonalization,
            title: 'Proactive Nudges',
            desc: 'Receive timely reminders and encouragement based on your routine',
            recommended: true,
          },
          {
            key: 'allowBehavioralAnalysis' as keyof typeof aiPersonalization,
            title: 'Behavioral Analysis',
            desc: 'Analyze habits and behaviors to improve adherence and outcomes',
            recommended: false,
          },
          {
            key: 'allowModelTraining' as keyof typeof aiPersonalization,
            title: 'Improve AI Models (Anonymous)',
            desc: 'Help improve Bearable for everyone by contributing anonymized data',
            recommended: false,
          },
        ].map((item) => (
          <div key={item.key} className="bg-white border border-gray-200 rounded-lg p-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={aiPersonalization[item.key]}
                onChange={(e) => setAIPersonalization({ ...aiPersonalization, [item.key]: e.target.checked })}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{item.title}</span>
                  {item.recommended && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
              </div>
            </label>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Right to Explanation:</strong> You can always ask why the AI made a specific
          recommendation. All AI decisions are explainable and transparent.
        </p>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleBack}
          className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderCaregivers = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Caregiver & Family Access</h2>
        <p className="text-gray-600">
          Share your health journey with loved ones and healthcare providers.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Enable Caregiver Sharing</h3>
            <p className="text-sm text-gray-500">You can invite caregivers later</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={caregiverEnabled}
              onChange={(e) => setCaregiverEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {caregiverEnabled && (
          <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Default sharing level:</p>

            {[
              { id: 'activity_logs' as DataCategory, label: 'Activity & Progress', desc: 'Exercise, sleep, daily activities' },
              { id: 'ai_recommendations' as DataCategory, label: 'AI Recommendations', desc: 'Health tips and suggestions' },
              { id: 'health_metrics' as DataCategory, label: 'Health Metrics', desc: 'Weight, vitals, measurements' },
              { id: 'medications' as DataCategory, label: 'Medications', desc: 'Medication schedule and adherence' },
              { id: 'medical_history' as DataCategory, label: 'Medical History', desc: 'Conditions and diagnoses' },
            ].map((item) => (
              <label key={item.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                <input
                  type="checkbox"
                  checked={caregiverDataSharing.has(item.id)}
                  onChange={() => toggleDataCategory(item.id, caregiverDataSharing, setCaregiverDataSharing)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.label}</div>
                  <div className="text-sm text-gray-500">{item.desc}</div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <p className="text-sm text-purple-800">
          <strong>Granular Control:</strong> You can set different permissions for each caregiver
          (family, friends, healthcare providers) when you invite them.
        </p>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleBack}
          className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderThirdParty = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Third-Party Integrations</h2>
        <p className="text-gray-600">
          Connect wearables and health apps to enrich your health data.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Enable Integrations</h3>
            <p className="text-sm text-gray-500">Connect apps and devices later</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={thirdPartyEnabled}
              onChange={(e) => setThirdPartyEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {thirdPartyEnabled && (
          <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
            <label className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
              <input
                type="checkbox"
                checked={wearableSync}
                onChange={(e) => setWearableSync(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Wearable Device Sync</div>
                <div className="text-sm text-gray-500 mt-1">
                  Apple Watch, Fitbit, Garmin, Oura, WHOOP, and more
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Data synced: Steps, heart rate, sleep, workouts
                </div>
              </div>
            </label>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Privacy Note:</strong> Third-party apps have their own privacy policies.
          Review them carefully before connecting.
        </p>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleBack}
          className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          Review
        </button>
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Choices</h2>
        <p className="text-gray-600">
          You can always change these settings in your Privacy Dashboard.
        </p>
      </div>

      <div className="space-y-4">
        {/* Essential AI */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">Personal AI Companion</h3>
            <span className={`text-sm px-2 py-1 rounded-full ${essentialAIEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {essentialAIEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          {essentialAIEnabled && (
            <div className="text-sm text-gray-600">
              Access to: {Array.from(essentialDataCategories).join(', ')}
            </div>
          )}
        </div>

        {/* AI Personalization */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">AI Personalization</h3>
          <div className="text-sm text-gray-600 space-y-1">
            {Object.entries(aiPersonalization).map(([key, value]) => (
              value && (
                <div key={key}>✓ {key.replace(/([A-Z])/g, ' $1').replace('allow', '').trim()}</div>
              )
            ))}
          </div>
        </div>

        {/* Caregivers */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">Caregiver Sharing</h3>
            <span className={`text-sm px-2 py-1 rounded-full ${caregiverEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {caregiverEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          {caregiverEnabled && (
            <div className="text-sm text-gray-600">
              Sharing: {Array.from(caregiverDataSharing).join(', ')}
            </div>
          )}
        </div>

        {/* Third-party */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">Third-Party Integrations</h3>
            <span className={`text-sm px-2 py-1 rounded-full ${thirdPartyEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {thirdPartyEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          {thirdPartyEnabled && wearableSync && (
            <div className="text-sm text-gray-600">Wearable sync enabled</div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Your Rights</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>✓ View all data we have about you</li>
          <li>✓ Export your data anytime</li>
          <li>✓ Revoke any consent instantly</li>
          <li>✓ Request deletion of your data</li>
          <li>✓ See who accessed your information</li>
        </ul>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleBack}
          className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleComplete}
          className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all"
        >
          Complete Setup
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStepIndex + 1} of {steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        {currentStep === 'welcome' && renderWelcome()}
        {currentStep === 'essential' && renderEssential()}
        {currentStep === 'ai_personalization' && renderAIPersonalization()}
        {currentStep === 'caregivers' && renderCaregivers()}
        {currentStep === 'third_party' && renderThirdParty()}
        {currentStep === 'review' && renderReview()}
      </div>
    </div>
  );
};
