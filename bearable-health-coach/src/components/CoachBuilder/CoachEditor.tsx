import React, { useState } from 'react';
import { CustomCoach, CoachTemplate, CoachingStyle, HealthConditionCategory } from '../../types';

interface CoachEditorProps {
  coachData: Partial<CustomCoach>;
  selectedTemplate?: CoachTemplate | null;
  onChange: (data: Partial<CustomCoach>) => void;
  onComplete: (data: Partial<CustomCoach>) => void;
}

type EditorTab = 'basic' | 'personality' | 'voice' | 'behavior' | 'specializations' | 'sharing';

const CoachEditor: React.FC<CoachEditorProps> = ({
  coachData,
  selectedTemplate,
  onChange,
  onComplete
}) => {
  const [activeTab, setActiveTab] = useState<EditorTab>('basic');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const tabs = [
    { id: 'basic' as EditorTab, label: 'Basic Info', icon: '👤' },
    { id: 'personality' as EditorTab, label: 'Personality', icon: '🧠' },
    { id: 'voice' as EditorTab, label: 'Voice', icon: '🎙️' },
    { id: 'behavior' as EditorTab, label: 'Behavior', icon: '⚙️' },
    { id: 'specializations' as EditorTab, label: 'Expertise', icon: '🎯' },
    { id: 'sharing' as EditorTab, label: 'Sharing', icon: '🔗' }
  ];

  const updateCoachData = (updates: Partial<CustomCoach>) => {
    const newData = { ...coachData, ...updates };
    onChange(newData);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!coachData.name?.trim()) {
      newErrors.name = 'Coach name is required';
    }

    if (!coachData.description?.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!coachData.systemPrompt?.trim()) {
      newErrors.systemPrompt = 'System prompt is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleComplete = () => {
    if (validateForm()) {
      onComplete(coachData);
    }
  };

  const renderBasicTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Coach Name *
        </label>
        <input
          id="name"
          type="text"
          value={coachData.name || ''}
          onChange={(e) => updateCoachData({ name: e.target.value })}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter coach name"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          id="description"
          value={coachData.description || ''}
          onChange={(e) => updateCoachData({ description: e.target.value })}
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Describe your coach's role and expertise"
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
      </div>

      {/* Avatar Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Avatar</label>
        <div className="flex space-x-4">
          {['default-avatar.png', 'female-doctor.png', 'male-coach.png', 'therapist.png'].map((avatar) => (
            <button
              key={avatar}
              onClick={() => updateCoachData({ avatar })}
              className={`w-16 h-16 rounded-full border-2 ${
                coachData.avatar === avatar ? 'border-blue-500' : 'border-gray-300'
              }`}
            >
              <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                👤
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Role */}
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
          Coach Role
        </label>
        <select
          id="role"
          value={coachData.role || 'primary_coach'}
          onChange={(e) => updateCoachData({ role: e.target.value as any })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="primary_coach">Primary Coach</option>
          <option value="pillar_specialist">Lifestyle Pillar Specialist</option>
          <option value="general_support">General Support</option>
        </select>
      </div>
    </div>
  );

  const renderPersonalityTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Personality & Style</h3>

      {/* Base Personality */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Base Personality</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'supportive', label: 'Supportive', desc: 'Caring and understanding' },
            { value: 'coach', label: 'Coach', desc: 'Motivational and goal-oriented' },
            { value: 'medical', label: 'Medical', desc: 'Clinical and professional' },
            { value: 'friend', label: 'Friend', desc: 'Casual and approachable' },
            { value: 'specialist', label: 'Specialist', desc: 'Expert and authoritative' }
          ].map((personality) => (
            <button
              key={personality.value}
              onClick={() => updateCoachData({ personality: personality.value as any })}
              className={`p-3 border rounded-lg text-left ${
                coachData.personality === personality.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-medium">{personality.label}</div>
              <div className="text-sm text-gray-600">{personality.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Coaching Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Coaching Style</label>
        <select
          value={coachData.coachingStyle || 'supportive_companion'}
          onChange={(e) => updateCoachData({ coachingStyle: e.target.value as CoachingStyle })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="supportive_companion">Supportive Companion</option>
          <option value="expert_advisor">Expert Advisor</option>
          <option value="motivational_coach">Motivational Coach</option>
          <option value="clinical_specialist">Clinical Specialist</option>
          <option value="lifestyle_mentor">Lifestyle Mentor</option>
          <option value="behavioral_therapist">Behavioral Therapist</option>
          <option value="wellness_educator">Wellness Educator</option>
          <option value="recovery_advocate">Recovery Advocate</option>
        </select>
      </div>

      {/* System Prompt */}
      <div>
        <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700 mb-2">
          System Prompt *
        </label>
        <textarea
          id="systemPrompt"
          value={coachData.systemPrompt || ''}
          onChange={(e) => updateCoachData({ systemPrompt: e.target.value })}
          rows={8}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono text-sm ${
            errors.systemPrompt ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Define your coach's personality, expertise, and communication style..."
        />
        {errors.systemPrompt && <p className="mt-1 text-sm text-red-600">{errors.systemPrompt}</p>}
        <p className="mt-1 text-sm text-gray-600">
          This prompt defines how your coach will behave and respond to conversations.
        </p>
      </div>
    </div>
  );

  const renderVoiceTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Voice Settings</h3>

      {/* Voice Provider */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Voice Provider</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'openai', label: 'OpenAI', desc: 'High quality, natural voices' },
            { value: 'elevenlabs', label: 'ElevenLabs', desc: 'Ultra-realistic AI voices' }
          ].map((provider) => (
            <button
              key={provider.value}
              onClick={() => updateCoachData({
                voiceSettings: { ...coachData.voiceSettings!, provider: provider.value as any }
              })}
              className={`p-3 border rounded-lg text-left ${
                coachData.voiceSettings?.provider === provider.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-medium">{provider.label}</div>
              <div className="text-sm text-gray-600">{provider.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Voice Selection */}
      <div>
        <label htmlFor="voiceId" className="block text-sm font-medium text-gray-700 mb-2">
          Voice Character
        </label>
        <select
          id="voiceId"
          value={coachData.voiceSettings?.voiceId || 'nova'}
          onChange={(e) => updateCoachData({
            voiceSettings: {
              ...coachData.voiceSettings!,
              voiceId: e.target.value,
              voiceName: e.target.options[e.target.selectedIndex].text
            }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="nova">Nova - Warm & Empathetic (Female)</option>
          <option value="alloy">Alloy - Professional & Clear (Neutral)</option>
          <option value="echo">Echo - Calm & Reassuring (Male)</option>
          <option value="fable">Fable - Friendly & Upbeat (Female)</option>
          <option value="onyx">Onyx - Authoritative & Confident (Male)</option>
          <option value="shimmer">Shimmer - Gentle & Caring (Female)</option>
        </select>
      </div>

      {/* Voice Customization */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="speed" className="block text-sm font-medium text-gray-700 mb-2">
            Speaking Speed: {coachData.voiceSettings?.speed || 1.0}x
          </label>
          <input
            id="speed"
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={coachData.voiceSettings?.speed || 1.0}
            onChange={(e) => updateCoachData({
              voiceSettings: { ...coachData.voiceSettings!, speed: parseFloat(e.target.value) }
            })}
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="pitch" className="block text-sm font-medium text-gray-700 mb-2">
            Pitch: {coachData.voiceSettings?.pitch || 1.0}x
          </label>
          <input
            id="pitch"
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={coachData.voiceSettings?.pitch || 1.0}
            onChange={(e) => updateCoachData({
              voiceSettings: { ...coachData.voiceSettings!, pitch: parseFloat(e.target.value) }
            })}
            className="w-full"
          />
        </div>
      </div>

      {/* Emotional Characteristics */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Emotional Characteristics</label>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'warmth', label: 'Warmth' },
            { key: 'authority', label: 'Authority' },
            { key: 'empathy', label: 'Empathy' },
            { key: 'energy', label: 'Energy' }
          ].map((trait) => (
            <div key={trait.key}>
              <label className="block text-sm text-gray-600 mb-1">
                {trait.label}: {coachData.voiceSettings?.customization?.[trait.key as keyof typeof coachData.voiceSettings.customization] || 5}
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={coachData.voiceSettings?.customization?.[trait.key as keyof typeof coachData.voiceSettings.customization] || 5}
                onChange={(e) => updateCoachData({
                  voiceSettings: {
                    ...coachData.voiceSettings!,
                    customization: {
                      ...coachData.voiceSettings!.customization,
                      [trait.key]: parseInt(e.target.value)
                    }
                  }
                })}
                className="w-full"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBehaviorTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Behavior Settings</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Response Style */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Response Style</label>
          <select
            value={coachData.behaviorSettings?.responseStyle || 'conversational'}
            onChange={(e) => updateCoachData({
              behaviorSettings: { ...coachData.behaviorSettings!, responseStyle: e.target.value as any }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="concise">Concise</option>
            <option value="detailed">Detailed</option>
            <option value="conversational">Conversational</option>
            <option value="clinical">Clinical</option>
          </select>
        </div>

        {/* Encouragement Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Encouragement Level</label>
          <select
            value={coachData.behaviorSettings?.encouragementLevel || 'moderate'}
            onChange={(e) => updateCoachData({
              behaviorSettings: { ...coachData.behaviorSettings!, encouragementLevel: e.target.value as any }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="subtle">Subtle</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
            <option value="enthusiastic">Enthusiastic</option>
          </select>
        </div>

        {/* Challenge Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Challenge Level</label>
          <select
            value={coachData.behaviorSettings?.challengeLevel || 'moderate'}
            onChange={(e) => updateCoachData({
              behaviorSettings: { ...coachData.behaviorSettings!, challengeLevel: e.target.value as any }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="gentle">Gentle</option>
            <option value="moderate">Moderate</option>
            <option value="assertive">Assertive</option>
            <option value="direct">Direct</option>
          </select>
        </div>

        {/* Memory Retention */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Memory Retention</label>
          <select
            value={coachData.behaviorSettings?.memoryRetention || 'long_term'}
            onChange={(e) => updateCoachData({
              behaviorSettings: { ...coachData.behaviorSettings!, memoryRetention: e.target.value as any }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="session">Session Only</option>
            <option value="short_term">Short Term (1 week)</option>
            <option value="long_term">Long Term (1 month)</option>
            <option value="permanent">Permanent</option>
          </select>
        </div>
      </div>

      {/* Boolean Settings */}
      <div className="space-y-4">
        {[
          { key: 'culturalAdaptation', label: 'Cultural Adaptation', desc: 'Adapt responses based on cultural context' },
          { key: 'humorAppropriate', label: 'Use Appropriate Humor', desc: 'Include light humor when appropriate' }
        ].map((setting) => (
          <div key={setting.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">{setting.label}</h4>
              <p className="text-sm text-gray-600">{setting.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={coachData.behaviorSettings?.[setting.key as keyof typeof coachData.behaviorSettings] as boolean || false}
                onChange={(e) => updateCoachData({
                  behaviorSettings: { ...coachData.behaviorSettings!, [setting.key]: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSpecializationsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Health Specializations</h3>

      {/* Add specializations UI here */}
      <div className="text-center py-8">
        <p className="text-gray-600">Specialization configuration coming soon...</p>
      </div>
    </div>
  );

  const renderSharingTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Sharing & Privacy</h3>

      {/* Public Access */}
      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
        <div>
          <h4 className="font-medium text-gray-900">Make Public</h4>
          <p className="text-sm text-gray-600">Allow others to discover and use this coach</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={coachData.sharedWith?.isPublic || false}
            onChange={(e) => updateCoachData({
              sharedWith: { ...coachData.sharedWith!, isPublic: e.target.checked }
            })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* Share with Caregivers */}
      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
        <div>
          <h4 className="font-medium text-gray-900">Share with Caregivers</h4>
          <p className="text-sm text-gray-600">Allow your caregivers to access this coach</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={coachData.sharedWith?.shareWithCaregivers || false}
            onChange={(e) => updateCoachData({
              sharedWith: { ...coachData.sharedWith!, shareWithCaregivers: e.target.checked }
            })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* Analytics Sharing */}
      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
        <div>
          <h4 className="font-medium text-gray-900">Share Analytics</h4>
          <p className="text-sm text-gray-600">Share usage and effectiveness data (anonymized)</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={coachData.sharedWith?.shareAnalytics || false}
            onChange={(e) => updateCoachData({
              sharedWith: { ...coachData.sharedWith!, shareAnalytics: e.target.checked }
            })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return renderBasicTab();
      case 'personality':
        return renderPersonalityTab();
      case 'voice':
        return renderVoiceTab();
      case 'behavior':
        return renderBehaviorTab();
      case 'specializations':
        return renderSpecializationsTab();
      case 'sharing':
        return renderSharingTab();
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Template Info */}
      {selectedTemplate && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-1">Based on: {selectedTemplate.name}</h3>
          <p className="text-sm text-blue-700">{selectedTemplate.description}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {renderTabContent()}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={handleComplete}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue to Preview
        </button>
      </div>
    </div>
  );
};

export default CoachEditor;