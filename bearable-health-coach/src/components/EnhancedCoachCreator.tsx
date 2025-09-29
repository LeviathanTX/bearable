import React, { useState, useRef } from 'react';
import { X, Brain, Save, Plus, Trash2, Settings, Upload, Image, Folder, FileText } from 'lucide-react';
import { CustomCoachService } from '../services/customCoachService';
import { CustomCoachTemplate, VoiceOption, VoiceSettings } from '../types';
import { voiceService } from '../services/elevenLabsVoiceService';

interface EnhancedCoachCreatorProps {
  userId: string;
  coach?: CustomCoachTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (coach: CustomCoachTemplate) => void;
}

const availableExpertise = [
  'Diabetes Management', 'Cardiovascular Health', 'Mental Health', 'Chronic Pain',
  'Weight Management', 'Nutrition Counseling', 'Exercise Physiology', 'Sleep Medicine',
  'Stress Management', 'Addiction Recovery', 'Geriatric Care', 'Pediatric Health',
  'Women\'s Health', 'Men\'s Health', 'Preventive Medicine', 'Lifestyle Medicine',
  'Mindfulness', 'Cognitive Behavioral Therapy', 'Behavioral Change', 'Health Coaching'
];

const availableSpecializations = [
  'Primary Care', 'Endocrinology', 'Cardiology', 'Psychology', 'Psychiatry',
  'Physical Therapy', 'Nutrition', 'Exercise Science', 'Sleep Medicine',
  'Pain Management', 'Addiction Medicine', 'Geriatrics', 'Pediatrics',
  'Women\'s Health', 'Men\'s Health', 'Preventive Medicine', 'Lifestyle Medicine'
];

const availableEmojis = [
  '👨‍⚕️', '👩‍⚕️', '🧑‍⚕️', '👨‍💻', '👩‍💻', '🧑‍💻', '👨‍🔬', '👩‍🔬',
  '🧑‍🔬', '👨‍🎓', '👩‍🎓', '🧑‍🎓', '🧠', '💡', '⚡', '🚀', '💼', '📊',
  '💊', '🩺', '❤️', '🫁', '🦴', '🧘‍♀️', '🧘‍♂️', '💪', '🥗', '😴'
];

export function EnhancedCoachCreator({ userId, coach, isOpen, onClose, onSave }: EnhancedCoachCreatorProps) {
  const [formData, setFormData] = useState<Partial<CustomCoachTemplate>>({
    name: '',
    title: '',
    specialization: 'Primary Care',
    description: '',
    avatar: '👨‍⚕️',
    personality: '',
    expertise: [],
    systemPrompt: '',
    preferredVoiceId: '',
    isPublic: false,
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    usageCount: 0,
    rating: 0
  });

  const [newExpertise, setNewExpertise] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [avatarMode, setAvatarMode] = useState<'emoji' | 'image'>('emoji');
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null>(null);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.2,
    use_speaker_boost: false
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableVoices = CustomCoachService.getAllAvailableVoices();

  React.useEffect(() => {
    if (coach) {
      setFormData({
        ...coach,
        expertise: coach.expertise || []
      });
      if (coach.preferredVoiceId) {
        const voice = availableVoices.find(v => v.elevenlabs_voice_id === coach.preferredVoiceId);
        if (voice) {
          setSelectedVoice(voice);
          if (coach.voiceSettings) {
            setVoiceSettings(coach.voiceSettings);
          }
        }
      }
      setIsCreating(false);
    } else if (isOpen) {
      setFormData({
        name: '',
        title: '',
        specialization: 'Primary Care',
        description: '',
        avatar: '👨‍⚕️',
        personality: '',
        expertise: [],
        systemPrompt: '',
        preferredVoiceId: '',
        isPublic: false,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        rating: 0
      });
      setAvatarMode('emoji');
      setIsCreating(true);
    }
  }, [coach, isOpen, userId, availableVoices]);

  const handleSave = () => {
    if (!formData.name || !formData.title || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    const coachData = {
      ...formData,
      preferredVoiceId: selectedVoice?.elevenlabs_voice_id,
      voiceSettings: selectedVoice ? voiceSettings : undefined,
      updatedAt: new Date()
    } as CustomCoachTemplate;

    if (isCreating) {
      const newCoach = CustomCoachService.createCustomCoach(userId, coachData);
      if (onSave) onSave(newCoach);
    } else if (coach) {
      const updatedCoach = CustomCoachService.updateCustomCoach(coach.id, userId, coachData);
      if (updatedCoach && onSave) onSave(updatedCoach);
    }

    onClose();
  };

  const addExpertise = () => {
    if (newExpertise.trim() && !formData.expertise?.includes(newExpertise.trim())) {
      setFormData(prev => ({
        ...prev,
        expertise: [...(prev.expertise || []), newExpertise.trim()]
      }));
      setNewExpertise('');
    }
  };

  const removeExpertise = (expertise: string) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise?.filter(e => e !== expertise) || []
    }));
  };

  const handleVoiceSelect = (voice: VoiceOption) => {
    setSelectedVoice(voice);
    setVoiceSettings(voice.settings);
  };

  const generateSystemPrompt = () => {
    const prompt = `You are ${formData.name}, a ${formData.title} specializing in ${formData.specialization}.

Your personality: ${formData.personality}

Your expertise includes: ${formData.expertise?.join(', ')}

Provide evidence-based health guidance while maintaining your professional demeanor. Always encourage users to consult with their healthcare providers for medical decisions. Focus on education, support, and lifestyle recommendations within your area of expertise.

Remember to:
- Be empathetic and supportive
- Provide evidence-based information
- Encourage professional medical consultation when appropriate
- Stay within your scope of expertise
- Use language appropriate for your personality and communication style`;

    setFormData(prev => ({ ...prev, systemPrompt: prompt }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">
                {isCreating ? 'Create Health Coach' : `Edit ${coach?.name}`}
              </h2>
              <p className="text-sm text-slate-600">
                Design a specialized AI health coach with custom expertise and personality
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Main Form */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Coach Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Dr. Sarah Johnson"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Professional Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Diabetes Management Specialist"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Specialization
                  </label>
                  <select
                    value={formData.specialization || 'Primary Care'}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {availableSpecializations.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Avatar
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <button
                      onClick={() => setAvatarMode('emoji')}
                      className={`px-3 py-1 text-sm rounded ${
                        avatarMode === 'emoji'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Emoji
                    </button>
                    <button
                      onClick={() => setAvatarMode('image')}
                      className={`px-3 py-1 text-sm rounded ${
                        avatarMode === 'image'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Image
                    </button>
                  </div>

                  {avatarMode === 'emoji' ? (
                    <div className="grid grid-cols-6 gap-2">
                      {availableEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => setFormData(prev => ({ ...prev, avatar: emoji }))}
                          className={`p-2 text-2xl rounded-lg border-2 transition-all ${
                            formData.avatar === emoji
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                      />
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Upload custom avatar</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Choose File
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Specialist in comprehensive diabetes care, blood sugar management, and lifestyle modifications for diabetic patients"
                />
              </div>

              {/* Personality */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Personality & Communication Style
                </label>
                <textarea
                  value={formData.personality || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, personality: e.target.value }))}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={2}
                  placeholder="Caring, precise, and encouraging with focus on empowering patients to manage their condition"
                />
              </div>

              {/* Expertise */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Areas of Expertise
                </label>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <select
                      value={newExpertise}
                      onChange={(e) => setNewExpertise(e.target.value)}
                      className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select expertise area...</option>
                      {availableExpertise
                        .filter(exp => !formData.expertise?.includes(exp))
                        .map((exp) => (
                          <option key={exp} value={exp}>
                            {exp}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={addExpertise}
                      disabled={!newExpertise}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {formData.expertise && formData.expertise.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.expertise.map((exp) => (
                        <div
                          key={exp}
                          className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          <span>{exp}</span>
                          <button
                            onClick={() => removeExpertise(exp)}
                            className="hover:bg-blue-200 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* System Prompt */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    AI Instructions (System Prompt)
                  </label>
                  <button
                    onClick={generateSystemPrompt}
                    className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded hover:bg-purple-200 transition-colors"
                  >
                    Generate
                  </button>
                </div>
                <textarea
                  value={formData.systemPrompt || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={6}
                  placeholder="Detailed instructions for how the AI should behave, communicate, and provide guidance..."
                />
              </div>

              {/* Settings */}
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isPublic || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-slate-700">Make this coach publicly available for other users</span>
                </label>
              </div>
            </div>
          </div>

          {/* Voice Selection Sidebar */}
          <div className="w-80 border-l border-slate-200 p-6 overflow-y-auto bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Voice Selection</h3>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {availableVoices.slice(0, 12).map((voice) => (
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
                  <div className="text-xs text-gray-600 mt-1">{voice.description}</div>
                  <div className="flex space-x-2 mt-2">
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

            {selectedVoice && (
              <div className="mt-6 p-4 bg-white rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-3">Voice Settings</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Stability: {voiceSettings.stability.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={voiceSettings.stability}
                      onChange={(e) => setVoiceSettings(prev => ({
                        ...prev,
                        stability: parseFloat(e.target.value)
                      }))}
                      className="w-full accent-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Similarity: {voiceSettings.similarity_boost.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={voiceSettings.similarity_boost}
                      onChange={(e) => setVoiceSettings(prev => ({
                        ...prev,
                        similarity_boost: parseFloat(e.target.value)
                      }))}
                      className="w-full accent-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {isCreating ? 'Create a new health coach' : 'Update existing coach'}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isCreating ? 'Create Coach' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}