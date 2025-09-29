import React, { useState } from 'react';
import { CustomCoachService } from '../services/customCoachService';
import { CustomCoachTemplate, VoiceOption, VoiceSettings } from '../types';
import { voiceService } from '../services/elevenLabsVoiceService';

interface CustomCoachCreatorProps {
  userId: string;
  onCoachCreated: (coach: CustomCoachTemplate) => void;
  onClose: () => void;
}

export const CustomCoachCreator: React.FC<CustomCoachCreatorProps> = ({
  userId,
  onCoachCreated,
  onClose
}) => {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    specialization: '',
    description: '',
    avatar: '🩺',
    personality: '',
    expertise: [''],
    systemPrompt: '',
    preferredVoiceId: '',
    isPublic: false
  });

  const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null>(null);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.2,
    use_speaker_boost: false
  });

  const availableVoices = CustomCoachService.getAllAvailableVoices();
  const availableAvatars = ['🩺', '👨‍⚕️', '👩‍⚕️', '🧠', '💪', '🥗', '😴', '🧘‍♀️', '🤝', '🎯', '⚡', '🔬', '📊', '🌟', '💊', '🦴', '❤️', '🫁'];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleExpertiseChange = (index: number, value: string) => {
    const newExpertise = [...formData.expertise];
    newExpertise[index] = value;
    setFormData(prev => ({ ...prev, expertise: newExpertise }));
  };

  const addExpertiseField = () => {
    setFormData(prev => ({ ...prev, expertise: [...prev.expertise, ''] }));
  };

  const removeExpertiseField = (index: number) => {
    if (formData.expertise.length > 1) {
      const newExpertise = formData.expertise.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, expertise: newExpertise }));
    }
  };

  const handleVoiceSelect = (voice: VoiceOption) => {
    setSelectedVoice(voice);
    setFormData(prev => ({ ...prev, preferredVoiceId: voice.elevenlabs_voice_id }));
    setVoiceSettings(voice.settings);
  };

  const handleCreateCoach = () => {
    const coach = CustomCoachService.createCustomCoach(userId, {
      ...formData,
      expertise: formData.expertise.filter(exp => exp.trim() !== ''),
      voiceSettings
    });

    onCoachCreated(coach);
    onClose();
  };

  const isFormValid = () => {
    return formData.name.trim() !== '' &&
           formData.title.trim() !== '' &&
           formData.specialization.trim() !== '' &&
           formData.description.trim() !== '' &&
           formData.personality.trim() !== '' &&
           formData.systemPrompt.trim() !== '' &&
           formData.expertise.some(exp => exp.trim() !== '');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                🤖
              </div>
              <h2 className="text-xl font-semibold text-slate-800">Create Custom Health Coach</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Coach Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Dr. Sarah Johnson"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Professional Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Diabetes Management Specialist"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Specialization</label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => handleInputChange('specialization', e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Endocrinology"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Avatar</label>
                <div className="grid grid-cols-6 gap-2">
                  {availableAvatars.map((avatar) => (
                    <button
                      key={avatar}
                      onClick={() => handleInputChange('avatar', avatar)}
                      className={`p-2 text-2xl rounded-lg border-2 transition-all ${
                        formData.avatar === avatar
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Voice Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Voice Selection</h3>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {availableVoices.slice(0, 8).map((voice) => (
                  <button
                    key={voice.elevenlabs_voice_id}
                    onClick={() => handleVoiceSelect(voice)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      selectedVoice?.elevenlabs_voice_id === voice.elevenlabs_voice_id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900 text-sm">{voice.name}</div>
                    <div className="text-xs text-gray-600">{voice.description}</div>
                    <div className="flex space-x-2 mt-1">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {voice.gender}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {voice.accent}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description and Personality */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="Specialist in comprehensive diabetes care, blood sugar management, and lifestyle modifications for diabetic patients"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Personality & Communication Style</label>
              <textarea
                value={formData.personality}
                onChange={(e) => handleInputChange('personality', e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                rows={2}
                placeholder="Caring, precise, and encouraging with focus on empowering patients to manage their condition"
              />
            </div>
          </div>

          {/* Expertise */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Areas of Expertise</label>
            <div className="space-y-2">
              {formData.expertise.map((expertise, index) => (
                <div key={index} className="flex space-x-2">
                  <input
                    type="text"
                    value={expertise}
                    onChange={(e) => handleExpertiseChange(index, e.target.value)}
                    className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Blood Sugar Management"
                  />
                  {formData.expertise.length > 1 && (
                    <button
                      onClick={() => removeExpertiseField(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addExpertiseField}
                className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-sm"
              >
                + Add Expertise Area
              </button>
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">AI Instructions (System Prompt)</label>
            <textarea
              value={formData.systemPrompt}
              onChange={(e) => handleInputChange('systemPrompt', e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="You are Dr. Sarah, a diabetes specialist. Provide evidence-based advice on diabetes management, blood sugar control, and lifestyle modifications. Always emphasize the importance of working with healthcare providers for medical decisions."
            />
          </div>

          {/* Settings */}
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-sm text-slate-700">Make this coach publicly available for other users</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateCoach}
              disabled={!isFormValid()}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isFormValid()
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Create Coach
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};