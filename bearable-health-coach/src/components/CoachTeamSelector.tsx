import React, { useState } from 'react';
import { AICompanion, CoachTeam, LifestylePillar, User } from '../types';
import { CoachTeamService } from '../services/coachTeamService';

interface CoachTeamSelectorProps {
  user: User;
  coachTeam: CoachTeam;
  activeCoach: AICompanion;
  onCoachSelect: (coach: AICompanion) => void;
  onStartConversation: (coach: AICompanion) => void;
}

export const CoachTeamSelector: React.FC<CoachTeamSelectorProps> = ({
  user,
  coachTeam,
  activeCoach,
  onCoachSelect,
  onStartConversation
}) => {
  const [selectedPillar, setSelectedPillar] = useState<LifestylePillar | null>(null);

  const pillars: { key: LifestylePillar; name: string; icon: string; description: string }[] = [
    {
      key: 'optimal_nutrition',
      name: 'Optimal Nutrition',
      icon: '🥗',
      description: 'Whole foods, plant-predominant, nutrient-dense eating'
    },
    {
      key: 'physical_activity',
      name: 'Physical Activity',
      icon: '🏃‍♂️',
      description: 'Daily movement with strength, flexibility, and cardio'
    },
    {
      key: 'stress_management',
      name: 'Stress Management',
      icon: '🧘‍♀️',
      description: 'Healthy coping skills and resilience building'
    },
    {
      key: 'restorative_sleep',
      name: 'Restorative Sleep',
      icon: '😴',
      description: '7-9 hours of quality sleep for body recovery'
    },
    {
      key: 'connectedness',
      name: 'Connectedness',
      icon: '🤝',
      description: 'Supportive relationships and meaningful connections'
    },
    {
      key: 'substance_avoidance',
      name: 'Substance Avoidance',
      icon: '🚭',
      description: 'Avoiding harmful substances and risky behaviors'
    }
  ];

  const handleCoachSelect = (coach: AICompanion) => {
    onCoachSelect(coach);
    if (coach.specialization) {
      setSelectedPillar(coach.specialization);
    } else {
      setSelectedPillar(null);
    }
  };

  const handleStartChat = (coach: AICompanion) => {
    handleCoachSelect(coach);
    onStartConversation(coach);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Your BearAble AI Coach Team 🐻
        </h2>
        <p className="text-gray-600">
          Mayo Clinic-backed specialists for each pillar of lifestyle medicine
        </p>
      </div>

      {/* Primary Coach */}
      <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xl">
              {coachTeam.primaryCoach.avatar}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {coachTeam.primaryCoach.name}
              </h3>
              <p className="text-sm text-gray-600">Your Primary Health Coach</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {coachTeam.primaryCoach.credentials?.map((credential, index) => (
                  <span
                    key={index}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                  >
                    {credential}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleCoachSelect(coachTeam.primaryCoach)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCoach.id === coachTeam.primaryCoach.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
              }`}
            >
              {activeCoach.id === coachTeam.primaryCoach.id ? 'Active' : 'Select'}
            </button>
            <button
              onClick={() => handleStartChat(coachTeam.primaryCoach)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              💬 Chat
            </button>
          </div>
        </div>
      </div>

      {/* Lifestyle Medicine Specialists */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Lifestyle Medicine Specialists
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pillars.map(pillar => {
            const specialist = coachTeam.specialists[pillar.key];
            const isSelected = selectedPillar === pillar.key;
            const isActive = activeCoach.id === specialist.id;

            return (
              <div
                key={pillar.key}
                className={`border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${
                  isSelected
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPillar(isSelected ? null : pillar.key)}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-lg">
                    {pillar.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {pillar.name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {specialist.name}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-gray-600 mb-3">
                  {pillar.description}
                </p>

                {isSelected && (
                  <div className="space-y-2">
                    <div className="text-xs">
                      <strong>Credentials:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {specialist.credentials?.map((credential, index) => (
                          <span
                            key={index}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                          >
                            {credential}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs">
                      <strong>Mayo Clinic Protocols:</strong>
                      <ul className="list-disc list-inside mt-1 text-gray-600">
                        {specialist.mayoClinicProtocols?.slice(0, 2).map((protocol, index) => (
                          <li key={index}>{protocol}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex space-x-2 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCoachSelect(specialist);
                        }}
                        className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-green-600 border border-green-600 hover:bg-green-50'
                        }`}
                      >
                        {isActive ? 'Active' : 'Select'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartChat(specialist);
                        }}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                      >
                        💬 Chat
                      </button>
                    </div>
                  </div>
                )}

                {!isSelected && (
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCoachSelect(specialist);
                      }}
                      className={`flex-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {isActive ? 'Active' : 'Select'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartChat(specialist);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                    >
                      💬
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Coach Introduction */}
      {activeCoach && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
          <h4 className="font-medium text-gray-900 mb-2">
            👋 Meet Your Coach
          </h4>
          <p className="text-sm text-gray-700">
            {CoachTeamService.generateCoachIntroduction(activeCoach, user)}
          </p>
        </div>
      )}
    </div>
  );
};