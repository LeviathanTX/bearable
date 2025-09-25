import React, { useState, useEffect } from 'react';
import { VoiceService, VoiceConfig } from '../services/voiceService';

interface VoiceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({ isOpen, onClose }) => {
  const [voiceService] = useState(() => new VoiceService());
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [currentVoice, setCurrentVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({
    language: 'en-US',
    rate: 0.75,
    pitch: 0.88,
    volume: 0.95
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testPhrase, setTestPhrase] = useState(
    "Hello! I'm your Bearable AI health companion. I'm here to support you on your wellness journey with gentle guidance and encouragement."
  );

  useEffect(() => {
    if (isOpen) {
      const voices = voiceService.getAvailableVoices();
      setAvailableVoices(voices);
      const defaultVoice = voiceService.getDefaultVoice();
      setCurrentVoice(defaultVoice);
      setSelectedVoice(defaultVoice);
    }
  }, [isOpen, voiceService]);

  const testVoice = async (voice: SpeechSynthesisVoice | null, config: VoiceConfig) => {
    if (isTesting) return;

    setIsTesting(true);
    try {
      const customConfig = {
        ...config,
        voiceURI: voice?.voiceURI
      };

      await voiceService.speak(testPhrase, customConfig);
    } catch (error) {
      console.error('Voice test error:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const saveVoicePreference = () => {
    // In a real app, this would save to localStorage or user preferences
    localStorage.setItem('bearable-voice-config', JSON.stringify({
      voiceURI: selectedVoice?.voiceURI,
      voiceName: selectedVoice?.name,
      ...voiceConfig
    }));
    onClose();
  };

  const groupedVoices = availableVoices.reduce((groups, voice) => {
    let category = 'Other';

    if (voice.name.toLowerCase().includes('enhanced') || voice.name.toLowerCase().includes('premium')) {
      category = '🌟 Premium Voices';
    } else if (voice.name.toLowerCase().includes('neural') || voice.name.toLowerCase().includes('natural')) {
      category = '🧠 Neural Voices';
    } else if (voice.name.includes('Google')) {
      category = '🔍 Google Voices';
    } else if (voice.name.includes('Microsoft')) {
      category = '🏢 Microsoft Voices';
    } else if (voice.lang.startsWith('en-')) {
      category = '🌍 English Voices';
    }

    if (!groups[category]) groups[category] = [];
    groups[category].push(voice);
    return groups;
  }, {} as Record<string, SpeechSynthesisVoice[]>);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-white/20">
        {/* Header */}
        <div className="p-6 border-b border-slate-200/60 bg-gradient-to-r from-cyan-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                🎙️ Voice Customization
              </h2>
              <p className="text-slate-600 mt-1">Find your perfect AI companion voice</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex h-[70vh]">
          {/* Voice List */}
          <div className="w-1/2 p-6 overflow-y-auto border-r border-slate-200/60">
            <h3 className="text-lg font-medium text-slate-800 mb-4">Available Voices</h3>

            {/* Current Voice */}
            {currentVoice && (
              <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-xl border border-emerald-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-emerald-800">Currently Using</p>
                    <p className="text-sm text-emerald-600">{currentVoice.name}</p>
                    <p className="text-xs text-emerald-500">{currentVoice.lang}</p>
                  </div>
                  <button
                    onClick={() => testVoice(currentVoice, voiceConfig)}
                    disabled={isTesting}
                    className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-sm transition-colors"
                  >
                    {isTesting ? '🔊' : '▶️'} Test
                  </button>
                </div>
              </div>
            )}

            {/* Voice Groups */}
            {Object.entries(groupedVoices).map(([category, voices]) => (
              <div key={category} className="mb-6">
                <h4 className="font-medium text-slate-700 mb-2 text-sm">{category}</h4>
                <div className="space-y-2">
                  {voices.map((voice) => (
                    <div
                      key={voice.voiceURI}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        selectedVoice?.voiceURI === voice.voiceURI
                          ? 'border-cyan-300 bg-cyan-50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                      onClick={() => setSelectedVoice(voice)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-slate-800 text-sm">{voice.name}</p>
                          <p className="text-xs text-slate-500">
                            {voice.lang} • {voice.localService ? 'Local' : 'Online'}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            testVoice(voice, voiceConfig);
                          }}
                          disabled={isTesting}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs transition-colors"
                        >
                          {isTesting ? '🔊' : '▶️'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Voice Controls */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <h3 className="text-lg font-medium text-slate-800 mb-4">Voice Parameters</h3>

            {/* Test Phrase */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Test Phrase
              </label>
              <textarea
                value={testPhrase}
                onChange={(e) => setTestPhrase(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            {/* Rate Control */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Speaking Rate: {voiceConfig.rate}x
              </label>
              <input
                type="range"
                min="0.3"
                max="2.0"
                step="0.1"
                value={voiceConfig.rate}
                onChange={(e) => setVoiceConfig({...voiceConfig, rate: parseFloat(e.target.value)})}
                className="w-full accent-cyan-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Slow</span>
                <span>Normal</span>
                <span>Fast</span>
              </div>
            </div>

            {/* Pitch Control */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Voice Pitch: {voiceConfig.pitch}
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={voiceConfig.pitch}
                onChange={(e) => setVoiceConfig({...voiceConfig, pitch: parseFloat(e.target.value)})}
                className="w-full accent-cyan-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Low</span>
                <span>Normal</span>
                <span>High</span>
              </div>
            </div>

            {/* Volume Control */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Volume: {Math.round(voiceConfig.volume * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={voiceConfig.volume}
                onChange={(e) => setVoiceConfig({...voiceConfig, volume: parseFloat(e.target.value)})}
                className="w-full accent-cyan-500"
              />
            </div>

            {/* Test Button */}
            <button
              onClick={() => testVoice(selectedVoice, voiceConfig)}
              disabled={isTesting}
              className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${
                isTesting
                  ? 'bg-amber-100 text-amber-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 hover:shadow-lg'
              }`}
            >
              {isTesting ? '🔊 Testing Voice...' : '🎤 Test Selected Voice'}
            </button>

            {/* Save Button */}
            <button
              onClick={saveVoicePreference}
              className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-green-700 hover:shadow-lg transition-all"
            >
              💾 Save Voice Preferences
            </button>

            {/* Collaboration Note */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
              <h4 className="font-medium text-blue-800 mb-2">🤝 Voice Collaboration</h4>
              <p className="text-sm text-blue-700">
                Don't love any of these voices? Share an audio sample of your ideal voice and I'll help analyze and replicate its qualities through parameter adjustments!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};