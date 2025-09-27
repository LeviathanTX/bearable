import React, { useState } from 'react';
import { CustomCoach } from '../../types';

interface CoachPreviewProps {
  coachData: CustomCoach;
  onEdit: () => void;
  onSave: () => void;
  isLoading: boolean;
  error: string | null;
}

const CoachPreview: React.FC<CoachPreviewProps> = ({
  coachData,
  onEdit,
  onSave,
  isLoading,
  error
}) => {
  const [testMessage, setTestMessage] = useState('');
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  const handleVoiceTest = async () => {
    if (!testMessage.trim()) return;

    setIsTestingVoice(true);
    try {
      // Simulate voice testing - in real implementation, this would call the voice service
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Voice test completed for:', testMessage);
    } catch (err) {
      console.error('Voice test failed:', err);
    } finally {
      setIsTestingVoice(false);
    }
  };

  const getPersonalityBadgeColor = (personality: string) => {
    switch (personality) {
      case 'supportive':
        return 'bg-green-100 text-green-800';
      case 'coach':
        return 'bg-blue-100 text-blue-800';
      case 'medical':
        return 'bg-purple-100 text-purple-800';
      case 'friend':
        return 'bg-yellow-100 text-yellow-800';
      case 'specialist':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'primary_coach':
        return 'bg-indigo-100 text-indigo-800';
      case 'pillar_specialist':
        return 'bg-orange-100 text-orange-800';
      case 'general_support':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Coach Overview Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start space-x-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-3xl">👤</span>
            </div>
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{coachData.name}</h2>
              <div className="flex space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPersonalityBadgeColor(coachData.personality)}`}>
                  {coachData.personality}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(coachData.role)}`}>
                  {coachData.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            <p className="text-gray-600 mb-4">{coachData.description}</p>

            {/* Template Info */}
            {coachData.template && (
              <div className="mb-4">
                <span className="text-sm text-gray-500">Based on template: </span>
                <span className="text-sm font-medium text-blue-600">{coachData.template.name}</span>
              </div>
            )}

            {/* Coaching Style */}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>
                <strong>Style:</strong> {coachData.coachingStyle.replace('_', ' ')}
              </span>
              <span>
                <strong>Voice:</strong> {coachData.voiceSettings.voiceName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Testing */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Test Voice Settings</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="testMessage" className="block text-sm font-medium text-gray-700 mb-2">
              Test Message
            </label>
            <textarea
              id="testMessage"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter a message to test your coach's voice..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleVoiceTest}
              disabled={!testMessage.trim() || isTestingVoice}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isTestingVoice ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Testing Voice...
                </span>
              ) : (
                'Test Voice'
              )}
            </button>

            <div className="text-sm text-gray-600">
              <strong>Provider:</strong> {coachData.voiceSettings.provider} |
              <strong> Speed:</strong> {coachData.voiceSettings.speed}x |
              <strong> Pitch:</strong> {coachData.voiceSettings.pitch}x
            </div>
          </div>
        </div>
      </div>

      {/* Behavior Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Behavior Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{coachData.behaviorSettings.responseStyle}</div>
            <div className="text-sm text-gray-600">Response Style</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{coachData.behaviorSettings.encouragementLevel}</div>
            <div className="text-sm text-gray-600">Encouragement</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{coachData.behaviorSettings.challengeLevel}</div>
            <div className="text-sm text-gray-600">Challenge Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{coachData.behaviorSettings.memoryRetention.replace('_', ' ')}</div>
            <div className="text-sm text-gray-600">Memory</div>
          </div>
        </div>
      </div>

      {/* Sharing Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sharing & Privacy</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${coachData.sharedWith.isPublic ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className="text-sm">Public Access</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${coachData.sharedWith.shareWithCaregivers ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className="text-sm">Caregiver Sharing</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${coachData.sharedWith.shareAnalytics ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className="text-sm">Analytics Sharing</span>
          </div>
        </div>
      </div>

      {/* System Prompt Preview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Prompt</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
            {coachData.systemPrompt.substring(0, 500)}
            {coachData.systemPrompt.length > 500 && '...'}
          </pre>
        </div>
        {coachData.systemPrompt.length > 500 && (
          <button
            onClick={onEdit}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            View full prompt in editor →
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <button
          onClick={onEdit}
          className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Edit Coach
        </button>

        <div className="flex space-x-4">
          <button
            onClick={onSave}
            disabled={isLoading}
            className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving Coach...
              </span>
            ) : (
              'Save Coach'
            )}
          </button>
        </div>
      </div>

      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-green-800 font-medium">Coach Ready to Save</h4>
            <p className="text-green-700 text-sm">Your custom coach is configured and ready to help patients achieve their health goals.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachPreview;