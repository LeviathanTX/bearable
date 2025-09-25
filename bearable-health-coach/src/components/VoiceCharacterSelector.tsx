import React, { useState } from 'react';
import { PremiumVoiceService, VoiceCharacter } from '../services/premiumVoiceService';

interface VoiceCharacterSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCharacter: (character: VoiceCharacter) => void;
}

export const VoiceCharacterSelector: React.FC<VoiceCharacterSelectorProps> = ({
  isOpen,
  onClose,
  onSelectCharacter
}) => {
  const [selectedCharacter, setSelectedCharacter] = useState<VoiceCharacter>(PremiumVoiceService.WELLNESS_BEAR);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [premiumVoiceService] = useState(() => new PremiumVoiceService());

  const testPhrase = "Hello! I'm here to support you on your wellness journey. How does my voice sound to you today?";

  const handleTestVoice = async (character: VoiceCharacter) => {
    if (isTestingVoice) return;

    setIsTestingVoice(true);
    try {
      // TEMPORARY: Use browser voice for testing due to OpenAI quota
      console.log('🔊 Testing with browser voice (OpenAI quota exceeded)');

      if (!('speechSynthesis' in window)) {
        throw new Error('Speech synthesis not supported');
      }

      // Create a test utterance
      const utterance = new SpeechSynthesisUtterance(testPhrase);
      utterance.rate = character.speed * 0.8; // Adjust for browser voice
      utterance.pitch = 0.9;
      utterance.volume = 0.95;
      utterance.lang = 'en-US';

      // Try to get a suitable voice
      const voices = window.speechSynthesis.getVoices();
      const suitableVoice = voices.find(v =>
        v.lang.startsWith('en-') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('allison') || v.name.toLowerCase().includes('samantha'))
      ) || voices.find(v => v.lang.startsWith('en-'));

      if (suitableVoice) {
        utterance.voice = suitableVoice;
      }

      // Play the test
      await new Promise<void>((resolve, reject) => {
        utterance.onend = () => resolve();
        utterance.onerror = (event) => reject(new Error(`Voice test error: ${event.error}`));
        window.speechSynthesis.speak(utterance);
      });

      console.log('✅ Browser voice test completed');
    } catch (error) {
      console.error('Voice test failed:', error);
      alert('Voice test failed. Your browser may not support speech synthesis or microphone access may be blocked.');
    } finally {
      setIsTestingVoice(false);
    }
  };

  const handleSelectVoice = (character: VoiceCharacter) => {
    setSelectedCharacter(character);
    onSelectCharacter(character);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-2xl border border-white/20">
        {/* Header */}
        <div className="p-6 border-b border-slate-200/60">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                🎭 Choose Your Voice Character
              </h2>
              <p className="text-slate-600 text-sm mt-1">Select the perfect voice for your wellness companion</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Voice Options */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="grid gap-4">
            {PremiumVoiceService.VOICE_OPTIONS.map((character) => (
              <div
                key={character.name}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedCharacter.name === character.name
                    ? 'border-cyan-300 bg-gradient-to-r from-cyan-50 to-blue-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
                onClick={() => setSelectedCharacter(character)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-slate-800">{character.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        character.personality === 'warm' ? 'bg-orange-100 text-orange-700' :
                        character.personality === 'professional' ? 'bg-blue-100 text-blue-700' :
                        character.personality === 'energetic' ? 'bg-green-100 text-green-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {character.personality}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{character.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-slate-500">
                      <span>Speed: {character.speed}x</span>
                      <span>Style: {character.conversationalStyle}</span>
                      <span>Voice: {character.openaiVoice}</span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestVoice(character);
                      }}
                      disabled={isTestingVoice}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isTestingVoice
                          ? 'bg-amber-100 text-amber-700 cursor-not-allowed'
                          : 'bg-cyan-100 hover:bg-cyan-200 text-cyan-700'
                      }`}
                    >
                      {isTestingVoice ? '🔊 Testing...' : '▶️ Test Voice'}
                    </button>
                    {selectedCharacter.name === character.name && (
                      <button
                        onClick={() => handleSelectVoice(character)}
                        className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-green-700 transition-all"
                      >
                        ✓ Select
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200/60 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-3">
              ✨ <strong>Premium Voice Technology:</strong> Powered by OpenAI's advanced TTS for natural, conversational health coaching
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSelectVoice(selectedCharacter)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all"
              >
                Use {selectedCharacter.name}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};