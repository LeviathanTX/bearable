import React, { useState } from 'react';
import { CustomCoach } from '../../types';

interface CoachCardProps {
  coach: CustomCoach;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const CoachCard: React.FC<CoachCardProps> = ({
  coach,
  viewMode,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPersonalityIcon = (personality: string) => {
    switch (personality) {
      case 'supportive':
        return '🤗';
      case 'coach':
        return '💪';
      case 'medical':
        return '🩺';
      case 'friend':
        return '😊';
      case 'specialist':
        return '🎯';
      default:
        return '👤';
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRatingStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="text-yellow-400">★</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="text-yellow-400">☆</span>);
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="text-gray-300">★</span>);
    }

    return stars;
  };

  const handleDeleteClick = () => {
    if (showDeleteConfirm) {
      onDelete();
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-4">
          {/* Selection Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />

          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xl">{getPersonalityIcon(coach.personality)}</span>
            </div>
          </div>

          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{coach.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(coach.approvalStatus)}`}>
                {coach.approvalStatus.replace('_', ' ')}
              </span>
            </div>
            <p className="text-gray-600 text-sm truncate">{coach.description}</p>
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              <span>Created: {formatDate(coach.createdAt)}</span>
              {coach.template && <span>Template: {coach.template.name}</span>}
              <span>Interactions: {coach.effectivenessMetrics.totalInteractions}</span>
            </div>
          </div>

          {/* Metrics */}
          <div className="flex items-center space-x-6 text-sm">
            <div className="text-center">
              <div className="flex items-center space-x-1">
                {getRatingStars(coach.effectivenessMetrics.averageRating)}
              </div>
              <span className="text-gray-600">Rating</span>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {coach.effectivenessMetrics.engagementScore}%
              </div>
              <span className="text-gray-600">Engagement</span>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {coach.effectivenessMetrics.goalAchievementRate}%
              </div>
              <span className="text-gray-600">Goals</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              title="Edit coach"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={onDuplicate}
              className="p-2 text-gray-400 hover:text-green-600 transition-colors"
              title="Duplicate coach"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={handleDeleteClick}
              className={`p-2 transition-colors ${
                showDeleteConfirm ? 'text-red-600 bg-red-50' : 'text-gray-400 hover:text-red-600'
              }`}
              title={showDeleteConfirm ? 'Click again to confirm deletion' : 'Delete coach'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Selection Checkbox */}
      <div className="absolute top-4 left-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </div>

      {/* Status Badge */}
      <div className="absolute top-4 right-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(coach.approvalStatus)}`}>
          {coach.approvalStatus.replace('_', ' ')}
        </span>
      </div>

      {/* Avatar and Basic Info */}
      <div className="text-center mb-4 mt-6">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">{getPersonalityIcon(coach.personality)}</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{coach.name}</h3>
        <p className="text-gray-600 text-sm line-clamp-2">{coach.description}</p>
      </div>

      {/* Template Info */}
      {coach.template && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Template:</span> {coach.template.name}
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Category:</span> {coach.template.category.replace('_', ' ')}
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            {getRatingStars(coach.effectivenessMetrics.averageRating)}
          </div>
          <span className="text-xs text-gray-600">Rating</span>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-blue-600">
            {coach.effectivenessMetrics.totalInteractions}
          </div>
          <span className="text-xs text-gray-600">Interactions</span>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">
            {coach.effectivenessMetrics.engagementScore}%
          </div>
          <span className="text-xs text-gray-600">Engagement</span>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-purple-600">
            {coach.effectivenessMetrics.goalAchievementRate}%
          </div>
          <span className="text-xs text-gray-600">Goal Success</span>
        </div>
      </div>

      {/* Meta Info */}
      <div className="text-xs text-gray-500 text-center border-t border-gray-100 pt-3">
        <div>Created: {formatDate(coach.createdAt)}</div>
        <div>Last updated: {formatDate(coach.updatedAt)}</div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-2 bg-white bg-opacity-95 rounded-lg py-2">
          <button
            onClick={onEdit}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit coach"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDuplicate}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Duplicate coach"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={handleDeleteClick}
            className={`p-2 rounded-lg transition-colors ${
              showDeleteConfirm
                ? 'text-red-600 bg-red-50'
                : 'text-red-600 hover:bg-red-50'
            }`}
            title={showDeleteConfirm ? 'Click again to confirm deletion' : 'Delete coach'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

      {/* Trend Indicator */}
      {coach.effectivenessMetrics.trendAnalysis.trend !== 0 && (
        <div className="absolute top-16 right-4">
          <div className={`p-1 rounded-full ${
            coach.effectivenessMetrics.trendAnalysis.improving
              ? 'bg-green-100 text-green-600'
              : coach.effectivenessMetrics.trendAnalysis.declining
              ? 'bg-red-100 text-red-600'
              : 'bg-gray-100 text-gray-600'
          }`}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              {coach.effectivenessMetrics.trendAnalysis.improving ? (
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
              )}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachCard;