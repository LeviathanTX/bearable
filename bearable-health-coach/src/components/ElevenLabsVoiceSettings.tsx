import React, { useState } from 'react';
import { voiceService } from '../services/elevenLabsVoiceService';

interface ElevenLabsVoiceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: (settings: any) => void;
}

export const ElevenLabsVoiceSettings: React.FC<ElevenLabsVoiceSettingsProps> = ({
  isOpen,
  onClose,
  onSettingsChange
}) => {
  const [selectedSpecialistId, setSelectedSpecialistId] = useState('dr-maya-wellness');
  const [selectedVoiceId, setSelectedVoiceId] = useState('pNInz6obpgDQGcFmaJgB'); // Default to Adam
  const [voiceSettings, setVoiceSettings] = useState({
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.2,
    use_speaker_boost: false
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testPhrase, setTestPhrase] = useState(
    "Hello! I'm your health specialist, ready to provide evidence-based guidance for your wellness journey."
  );

  const specialists = voiceService.getAllSpecialists();
  const selectedSpecialist = voiceService.getSpecialist(selectedSpecialistId);
  const availableVoices = selectedSpecialist ? voiceService.getSpecialistVoices(selectedSpecialistId) : [];
  const selectedVoice = availableVoices.find(v => v.elevenlabs_voice_id === selectedVoiceId);

  // Update selected voice when specialist changes
  React.useEffect(() => {
    if (selectedSpecialist) {
      setSelectedVoiceId(selectedSpecialist.defaultVoiceId);
      const defaultVoice = selectedSpecialist.voices.find(v => v.elevenlabs_voice_id === selectedSpecialist.defaultVoiceId);
      if (defaultVoice) {
        setVoiceSettings({
          stability: defaultVoice.settings.stability,
          similarity_boost: defaultVoice.settings.similarity_boost,
          style: defaultVoice.settings.style || 0,
          use_speaker_boost: defaultVoice.settings.use_speaker_boost || false
        });
      }
    }
  }, [selectedSpecialistId, selectedSpecialist]);

  const handleTestVoice = async () => {
    if (isTesting || !selectedSpecialist) return;

    setIsTesting(true);
    try {
      await voiceService.speakText(testPhrase, selectedSpecialistId, selectedVoiceId, voiceSettings);
    } catch (error) {
      console.error('Voice test failed:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSettings = () => {
    if (onSettingsChange) {
      onSettingsChange({
        defaultSpecialist: selectedSpecialistId,
        selectedVoiceId,
        voiceSettings
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                🎵
              </div>
              <h2 className="text-xl font-semibold text-slate-800">ElevenLabs Voice Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(80vh-120px)] overflow-y-auto">
          {/* Specialist Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Health Specialist Voice
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {specialists.map((specialist) => (
                <button
                  key={specialist.id}
                  onClick={() => setSelectedSpecialistId(specialist.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedSpecialistId === specialist.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{specialist.avatar}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">{specialist.name}</div>
                      <div className="text-xs text-gray-600">{specialist.title}</div>
                      <div className="text-xs text-purple-600 mt-1">
                        {specialist.voices.length} voice option{specialist.voices.length !== 1 ? 's' : ''} available
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Selection */}
          {selectedSpecialist && availableVoices.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Choose Voice for {selectedSpecialist.name}
              </label>
              <div className="grid grid-cols-1 gap-3">
                {availableVoices.map((voice) => (
                  <button
                    key={voice.elevenlabs_voice_id}
                    onClick={() => {
                      setSelectedVoiceId(voice.elevenlabs_voice_id);
                      setVoiceSettings({
                        stability: voice.settings.stability,
                        similarity_boost: voice.settings.similarity_boost,
                        style: voice.settings.style || 0,
                        use_speaker_boost: voice.settings.use_speaker_boost || false
                      });
                    }}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      selectedVoiceId === voice.elevenlabs_voice_id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{voice.name}</div>
                        <div className="text-xs text-gray-600 mt-1">{voice.description}</div>
                        <div className="flex space-x-2 mt-1">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {voice.gender}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {voice.accent}
                          </span>
                        </div>
                      </div>
                      {selectedVoiceId === voice.elevenlabs_voice_id && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Voice Settings */}
          {selectedSpecialist && selectedVoice && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Voice Configuration for {selectedSpecialist.name}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Stability */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Stability: {voiceSettings.stability.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={voiceSettings.stability}
                    onChange={(e) => setVoiceSettings({
                      ...voiceSettings,
                      stability: parseFloat(e.target.value)
                    })}
                    className="w-full accent-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lower values add more variability
                  </p>
                </div>

                {/* Similarity Boost */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Similarity: {voiceSettings.similarity_boost.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={voiceSettings.similarity_boost}
                    onChange={(e) => setVoiceSettings({
                      ...voiceSettings,
                      similarity_boost: parseFloat(e.target.value)
                    })}
                    className="w-full accent-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Higher values enhance voice similarity
                  </p>
                </div>

                {/* Style */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Style: {voiceSettings.style.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={voiceSettings.style}
                    onChange={(e) => setVoiceSettings({
                      ...voiceSettings,
                      style: parseFloat(e.target.value)
                    })}
                    className="w-full accent-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Controls expressiveness level
                  </p>
                </div>

                {/* Speaker Boost */}
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={voiceSettings.use_speaker_boost}
                      onChange={(e) => setVoiceSettings({
                        ...voiceSettings,
                        use_speaker_boost: e.target.checked
                      })}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Speaker Boost
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Enhances speaker similarity
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Test Phrase */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Test Phrase
            </label>
            <textarea
              value={testPhrase}
              onChange={(e) => setTestPhrase(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Enter text to test the voice quality..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleTestVoice}
              disabled={isTesting || !selectedSpecialist}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                isTesting
                  ? 'bg-amber-100 text-amber-700 cursor-not-allowed'
                  : 'bg-purple-500 text-white hover:bg-purple-600'
              }`}
            >
              {isTesting ? '🔊 Testing...' : '🎤 Test Voice'}
            </button>

            <button
              onClick={handleSaveSettings}
              className="flex-1 py-3 px-4 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-all"
            >
              💾 Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};