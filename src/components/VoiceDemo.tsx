import React, { useState, useEffect } from 'react';
import { voiceService } from '../services/elevenLabsVoiceService';
import type { HealthSpecialist, VoiceOption } from '../types';

/**
 * Voice Demo Component for Mayo Partners
 *
 * This component provides a comprehensive testing interface for all 7 health
 * specialists and their voice options. Designed for Mayo Clinic partners to
 * evaluate and select the best voice combinations for patient interactions.
 */
export const VoiceDemo: React.FC = () => {
  const [specialists] = useState(voiceService.getAllSpecialists());
  const [selectedSpecialistId, setSelectedSpecialistId] = useState('dr-maya-wellness');
  const [selectedVoiceId, setSelectedVoiceId] = useState('pNInz6obpgDQGcFmaJgB');
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [customPhrase, setCustomPhrase] = useState('');

  const selectedSpecialist = specialists.find(s => s.id === selectedSpecialistId);
  const availableVoices = selectedSpecialist ? voiceService.getSpecialistVoices(selectedSpecialistId) : [];

  // Sample phrases for different contexts
  const samplePhrases = [
    {
      category: 'Greeting',
      text: `Hello! I'm ${selectedSpecialist?.name}, and I'm here to support your wellness journey. How are you feeling today?`
    },
    {
      category: 'Encouragement',
      text: "You're making excellent progress! Small, consistent steps are the foundation of lasting health changes. Keep up the great work!"
    },
    {
      category: 'Education',
      text: `Based on Mayo Clinic research, ${selectedSpecialist?.expertise[0]?.toLowerCase()} plays a crucial role in overall health. Let me explain how we can work together on this.`
    },
    {
      category: 'Empathy',
      text: "I understand that making health changes can feel challenging. It's completely normal to have ups and downs. What matters most is that you're here and committed to your wellbeing."
    },
    {
      category: 'Question',
      text: `Tell me more about your goals for ${selectedSpecialist?.specialization?.toLowerCase()}. What would success look like for you in the next few weeks?`
    }
  ];

  const [selectedPhrase, setSelectedPhrase] = useState(samplePhrases[0]);

  // Update selected voice when specialist changes
  useEffect(() => {
    if (selectedSpecialist) {
      setSelectedVoiceId(selectedSpecialist.defaultVoiceId);
    }
  }, [selectedSpecialistId, selectedSpecialist]);

  const handleTestVoice = async (voiceId?: string, customText?: string) => {
    const testVoiceId = voiceId || selectedVoiceId;
    const testText = customText || selectedPhrase.text;

    setIsTesting(true);
    const testKey = `${selectedSpecialistId}-${testVoiceId}`;

    try {
      await voiceService.speakText(testText, selectedSpecialistId, testVoiceId);
      setTestResults(prev => ({ ...prev, [testKey]: true }));
    } catch (error) {
      console.error('Voice test failed:', error);
      setTestResults(prev => ({ ...prev, [testKey]: false }));
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestAllVoices = async () => {
    if (!selectedSpecialist) return;

    setIsTesting(true);
    const testPhrase = `Hello, this is ${selectedSpecialist.name}. Testing voice quality.`;

    for (const voice of availableVoices) {
      try {
        await voiceService.speakText(testPhrase, selectedSpecialistId, voice.elevenlabs_voice_id);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Pause between tests
        setTestResults(prev => ({
          ...prev,
          [`${selectedSpecialistId}-${voice.elevenlabs_voice_id}`]: true
        }));
      } catch (error) {
        setTestResults(prev => ({
          ...prev,
          [`${selectedSpecialistId}-${voice.elevenlabs_voice_id}`]: false
        }));
      }
    }

    setIsTesting(false);
  };

  const handleStopVoice = () => {
    voiceService.stopSpeaking();
    setIsTesting(false);
  };

  const getVoiceTestStatus = (voiceId: string) => {
    const testKey = `${selectedSpecialistId}-${voiceId}`;
    return testResults[testKey];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🎤 Voice Quality Demo
              </h1>
              <p className="text-gray-600">
                Mayo Clinic Partner Testing Portal - Evaluate all {specialists.length} health specialists and {specialists.reduce((acc, s) => acc + s.voices.length, 0)} voice options
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">ElevenLabs Integration</div>
              <div className="text-2xl font-bold text-purple-600">
                {specialists.length} Specialists
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Specialist Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Health Specialists
              </h2>
              <div className="space-y-2">
                {specialists.map((specialist) => (
                  <button
                    key={specialist.id}
                    onClick={() => setSelectedSpecialistId(specialist.id)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedSpecialistId === specialist.id
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{specialist.avatar}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm truncate">
                          {specialist.name}
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {specialist.title}
                        </div>
                        <div className="text-xs text-purple-600 mt-1">
                          {specialist.voices.length} voices
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Voice Testing Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Specialist Info */}
            {selectedSpecialist && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="text-5xl">{selectedSpecialist.avatar}</div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedSpecialist.name}
                    </h2>
                    <p className="text-purple-600 font-medium mb-2">
                      {selectedSpecialist.title}
                    </p>
                    <p className="text-gray-700 mb-3">
                      {selectedSpecialist.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSpecialist.expertise.map((exp, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                        >
                          {exp}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
                      <div className="text-xs font-semibold text-indigo-900 mb-1">
                        Personality Profile
                      </div>
                      <div className="text-sm text-indigo-700">
                        {selectedSpecialist.personality}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sample Phrases */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Test Scenarios
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
                {samplePhrases.map((phrase, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPhrase(phrase)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      selectedPhrase.category === phrase.category
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-900">
                      {phrase.category}
                    </div>
                  </button>
                ))}
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">Selected phrase:</div>
                <div className="text-gray-900">{selectedPhrase.text}</div>
              </div>

              {/* Custom Phrase */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or enter custom phrase:
                </label>
                <textarea
                  value={customPhrase}
                  onChange={(e) => setCustomPhrase(e.target.value)}
                  placeholder="Type a custom phrase to test voice quality..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Voice Options */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Voice Options ({availableVoices.length})
                </h3>
                <button
                  onClick={handleTestAllVoices}
                  disabled={isTesting}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium transition-all"
                >
                  Test All Voices
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableVoices.map((voice) => {
                  const testStatus = getVoiceTestStatus(voice.elevenlabs_voice_id);
                  return (
                    <div
                      key={voice.elevenlabs_voice_id}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedVoiceId === voice.elevenlabs_voice_id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 text-sm">
                            {voice.name}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {voice.description}
                          </div>
                          <div className="flex space-x-2 mt-2">
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {voice.gender}
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {voice.accent}
                            </span>
                          </div>
                        </div>
                        {testStatus !== undefined && (
                          <div className={`text-xl ${testStatus ? 'text-green-500' : 'text-red-500'}`}>
                            {testStatus ? '✓' : '✗'}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-1 text-xs text-gray-600 mt-3 mb-3">
                        <div>
                          <div className="font-medium">Stability</div>
                          <div>{voice.settings.stability.toFixed(1)}</div>
                        </div>
                        <div>
                          <div className="font-medium">Similarity</div>
                          <div>{voice.settings.similarity_boost.toFixed(1)}</div>
                        </div>
                        <div>
                          <div className="font-medium">Style</div>
                          <div>{(voice.settings.style || 0).toFixed(1)}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedVoiceId(voice.elevenlabs_voice_id);
                          handleTestVoice(voice.elevenlabs_voice_id, customPhrase || undefined);
                        }}
                        disabled={isTesting}
                        className="w-full py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium transition-all"
                      >
                        {isTesting ? '⏸ Testing...' : '▶ Test Voice'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Control Panel */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Voice Control
                  </h3>
                  <p className="text-sm text-gray-600">
                    {isTesting ? 'Voice test in progress...' : 'Ready to test'}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleTestVoice(selectedVoiceId, customPhrase || undefined)}
                    disabled={isTesting}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-all shadow-md"
                  >
                    ▶ Play Selected
                  </button>
                  <button
                    onClick={handleStopVoice}
                    disabled={!isTesting}
                    className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-all shadow-md"
                  >
                    ⏹ Stop
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mayo Clinic Integration Info */}
        <div className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="text-4xl">🏥</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1">
                Mayo Clinic CARE OAISYS Platform
              </h3>
              <p className="text-blue-100">
                This voice demo showcases AI health specialists powered by ElevenLabs premium voices.
                Each specialist is designed with evidence-based personality traits and communication styles
                aligned with Mayo Clinic's 6 Pillars of Lifestyle Medicine.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
