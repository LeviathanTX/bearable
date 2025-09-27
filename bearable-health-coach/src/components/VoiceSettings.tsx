import React, { useState, useEffect } from 'react';

export interface VoiceSettings {
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed: number;
  volume: number;
  micSensitivity: number;
  pushToTalk: boolean;
  autoResponse: boolean;
}

interface VoiceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange: (settings: VoiceSettings) => void;
}

export const VoiceSettingsComponent: React.FC<VoiceSettingsProps> = ({
  isOpen,
  onClose,
  onSettingsChange
}) => {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voiceConfig, setVoiceConfig] = useState({
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testPhrase, setTestPhrase] = useState(
    "Hello! I'm your Bearable AI health companion. I'm here to support you on your wellness journey with gentle guidance and encouragement."
  );

  useEffect(() => {
    if (isOpen && window.speechSynthesis) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));
        setAvailableVoices(englishVoices);
        if (englishVoices.length > 0 && !selectedVoice) {
          setSelectedVoice(englishVoices[0]);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [isOpen, selectedVoice]);

  const testVoice = async () => {
    if (isTesting || !selectedVoice) return;

    setIsTesting(true);
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(testPhrase);
      utterance.voice = selectedVoice;
      utterance.rate = voiceConfig.rate;
      utterance.pitch = voiceConfig.pitch;
      utterance.volume = voiceConfig.volume;

      window.speechSynthesis.speak(utterance);

      setTimeout(() => setIsTesting(false), 2000);
    } catch (error) {
      console.error('Voice test failed:', error);
      setIsTesting(false);
    }
  };

  const saveVoicePreference = () => {
    localStorage.setItem('bearable-voice-config', JSON.stringify({
      voiceName: selectedVoice?.name,
      voiceURI: selectedVoice?.voiceURI,
      ...voiceConfig
    }));

    const settings: VoiceSettings = {
      voice: 'nova',
      speed: voiceConfig.rate,
      volume: voiceConfig.volume,
      micSensitivity: 0.5,
      pushToTalk: false,
      autoResponse: true
    };

    onSettingsChange(settings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-cyan-50 to-blue-50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800">🎙️ Voice Settings</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Voice Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Select Voice
            </label>
            <select
              value={selectedVoice?.voiceURI || ''}
              onChange={(e) => {
                const voice = availableVoices.find(v => v.voiceURI === e.target.value);
                setSelectedVoice(voice || null);
              }}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              {availableVoices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Test Phrase */}
          <div>
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

          {/* Voice Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Rate */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Speed: {voiceConfig.rate}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={voiceConfig.rate}
                onChange={(e) => setVoiceConfig({...voiceConfig, rate: parseFloat(e.target.value)})}
                className="w-full accent-cyan-500"
              />
            </div>

            {/* Pitch */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Pitch: {voiceConfig.pitch}
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
            </div>

            {/* Volume */}
            <div>
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
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={testVoice}
              disabled={isTesting || !selectedVoice}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                isTesting
                  ? 'bg-amber-100 text-amber-700 cursor-not-allowed'
                  : 'bg-cyan-500 text-white hover:bg-cyan-600'
              }`}
            >
              {isTesting ? '🔊 Testing...' : '🎤 Test Voice'}
            </button>

            <button
              onClick={saveVoicePreference}
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