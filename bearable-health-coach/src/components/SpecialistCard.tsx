import React from 'react';

interface SpecialistCardProps {
  agent: any;
  isSelected: boolean;
  onToggle: () => void;
  disabled?: boolean;
  voiceEnabled?: boolean;
}

export const SpecialistCard: React.FC<SpecialistCardProps> = ({
  agent,
  isSelected,
  onToggle,
  disabled = false,
  voiceEnabled = false
}) => {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`p-4 rounded-lg border-2 transition-all text-left group hover:shadow-md ${
        isSelected
          ? 'border-green-500 bg-green-50 shadow-md'
          : 'border-gray-200 hover:border-green-300'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <div className="flex items-center mb-3">
        <span className="text-2xl mr-3">{agent.avatar}</span>
        <div className="flex-1">
          <div className="font-medium text-gray-900 text-sm">{agent.name}</div>
          <div className="text-xs text-gray-600">{agent.title}</div>
        </div>
        {isSelected && (
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-xs text-gray-500">
          {agent.expertise && agent.expertise.slice(0, 2).join(' • ')}
        </div>

        <div className="flex flex-wrap gap-1">
          {agent.mayoClinicAffiliation && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
              Mayo Clinic
            </span>
          )}
          {voiceEnabled && (
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
              🎵 Premium Voice
            </span>
          )}
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
            {agent.specialization && agent.specialization.replace('_', ' ')}
          </span>
        </div>
      </div>
    </button>
  );
};