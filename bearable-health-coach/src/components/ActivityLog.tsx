import React, { useState } from 'react';
import { ActivityLog as ActivityLogType } from '../types';

interface ActivityLogProps {
  userId: string;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ userId }) => {
  const [activities, setActivities] = useState<ActivityLogType[]>([
    {
      id: 'activity-1',
      userId,
      type: 'exercise',
      title: '5-minute walk after lunch',
      description: 'Short walk around the block to help regulate blood sugar',
      value: 500,
      unit: 'steps',
      category: 'walking',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      source: 'manual',
      tags: ['post-meal', 'blood-sugar']
    },
    {
      id: 'activity-2',
      userId,
      type: 'nutrition',
      title: 'Vegetable serving logged',
      description: 'Mixed green salad with lunch',
      value: 1,
      unit: 'serving',
      category: 'vegetables',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      source: 'manual',
      tags: ['lunch', 'greens']
    },
    {
      id: 'activity-3',
      userId,
      type: 'sleep',
      title: 'Sleep quality recorded',
      description: 'Good quality sleep, felt rested',
      value: 7.5,
      unit: 'hours',
      category: 'sleep_duration',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      source: 'wearable',
      tags: ['quality-sleep', 'rested']
    },
    {
      id: 'activity-4',
      userId,
      type: 'mood',
      title: 'Mood check-in',
      description: 'Feeling positive and motivated today',
      value: 8,
      unit: 'score',
      category: 'emotional_wellbeing',
      timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
      source: 'manual',
      tags: ['positive', 'motivated']
    },
    {
      id: 'activity-5',
      userId,
      type: 'exercise',
      title: 'Morning stretching routine',
      description: '10-minute gentle stretching session',
      value: 10,
      unit: 'minutes',
      category: 'flexibility',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      source: 'manual',
      tags: ['morning', 'flexibility']
    }
  ]);

  const [selectedType, setSelectedType] = useState<string>('all');
  const [showAddActivity, setShowAddActivity] = useState(false);

  const activityTypes = {
    exercise: { icon: '🏃‍♀️', color: 'bg-blue-100 text-blue-800', label: 'Exercise' },
    nutrition: { icon: '🥗', color: 'bg-green-100 text-green-800', label: 'Nutrition' },
    sleep: { icon: '😴', color: 'bg-purple-100 text-purple-800', label: 'Sleep' },
    mood: { icon: '😊', color: 'bg-yellow-100 text-yellow-800', label: 'Mood' },
    medication: { icon: '💊', color: 'bg-red-100 text-red-800', label: 'Medication' },
    vitals: { icon: '❤️', color: 'bg-pink-100 text-pink-800', label: 'Vitals' }
  };

  const sourceLabels = {
    manual: '👤 Manual Entry',
    wearable: '⌚ Wearable Device',
    ai_suggestion: '🤖 AI Suggestion',
    caregiver: '👥 Caregiver'
  };

  const filteredActivities = selectedType === 'all'
    ? activities
    : activities.filter(activity => activity.type === selectedType);

  const todayActivities = activities.filter(activity =>
    new Date(activity.timestamp).toDateString() === new Date().toDateString()
  );

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m ago`;
    } else {
      return `${minutes}m ago`;
    }
  };

  const getActivityRecommendation = (activity: ActivityLogType) => {
    const recommendations = {
      exercise: "Great job staying active! Mayo Clinic recommends 150 minutes of moderate activity weekly.",
      nutrition: "Excellent nutrition choice! Aim for 5-9 servings of fruits and vegetables daily.",
      sleep: "Good sleep is crucial for recovery. Adults need 7-9 hours of quality sleep nightly.",
      mood: "Thank you for tracking your mood. Mental wellness is a key pillar of health.",
      medication: "Consistent medication adherence improves health outcomes significantly.",
      vitals: "Regular vital monitoring helps track your health progress over time."
    };

    return recommendations[activity.type as keyof typeof recommendations];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Activity Log</h2>
            <p className="text-gray-600">Track your daily health activities and patterns</p>
          </div>
          <button
            onClick={() => setShowAddActivity(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            + Log Activity
          </button>
        </div>

        {/* Today's Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Today's Progress</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl mb-1">🏃‍♀️</div>
              <div className="text-lg font-bold text-gray-900">
                {todayActivities.filter(a => a.type === 'exercise').length}
              </div>
              <div className="text-xs text-gray-600">Exercise</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🥗</div>
              <div className="text-lg font-bold text-gray-900">
                {todayActivities.filter(a => a.type === 'nutrition').length}
              </div>
              <div className="text-xs text-gray-600">Nutrition</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">😴</div>
              <div className="text-lg font-bold text-gray-900">
                {todayActivities.find(a => a.type === 'sleep')?.value || 0}h
              </div>
              <div className="text-xs text-gray-600">Sleep</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">😊</div>
              <div className="text-lg font-bold text-gray-900">
                {todayActivities.find(a => a.type === 'mood')?.value || 0}/10
              </div>
              <div className="text-xs text-gray-600">Mood</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Activities
          </button>
          {Object.entries(activityTypes).map(([type, config]) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {config.icon} {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activities yet</h3>
            <p className="text-gray-600 mb-4">Start logging your daily activities to track your health journey</p>
            <button
              onClick={() => setShowAddActivity(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              Log Your First Activity
            </button>
          </div>
        ) : (
          filteredActivities.map((activity) => {
            const activityConfig = activityTypes[activity.type as keyof typeof activityTypes];
            return (
              <div key={activity.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${activityConfig?.color}`}>
                    {activityConfig?.icon}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{activity.title}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{sourceLabels[activity.source]}</span>
                        <span>•</span>
                        <span>{getTimeAgo(activity.timestamp)}</span>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-3">{activity.description}</p>

                    {activity.value && (
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="bg-gray-50 px-3 py-1 rounded-full">
                          <span className="font-medium text-gray-900">
                            {activity.value} {activity.unit}
                          </span>
                        </div>
                        <div className="bg-blue-50 px-3 py-1 rounded-full">
                          <span className="text-blue-800 text-sm font-medium">
                            {activity.category}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Mayo Clinic Recommendation */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <div className="flex items-start space-x-2">
                        <div className="text-blue-600 mt-0.5">💡</div>
                        <div>
                          <p className="text-sm text-blue-800">{getActivityRecommendation(activity)}</p>
                          <p className="text-xs text-blue-600 mt-1">Source: Mayo Clinic Lifestyle Medicine</p>
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    {activity.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {activity.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Activity Modal */}
      {showAddActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Log New Activity</h3>
            <div className="space-y-4">
              <p className="text-gray-600">Choose an activity type to get started:</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(activityTypes).map(([type, config]) => (
                  <button
                    key={type}
                    onClick={() => {
                      // In a real app, this would open a specific form for the activity type
                      const newActivity: ActivityLogType = {
                        id: `activity-${Date.now()}`,
                        userId,
                        type: type as ActivityLogType['type'],
                        title: `${config.label} logged`,
                        description: `Manual entry for ${config.label.toLowerCase()}`,
                        category: 'general',
                        timestamp: new Date(),
                        source: 'manual',
                        tags: []
                      };
                      setActivities(prev => [newActivity, ...prev]);
                      setShowAddActivity(false);
                    }}
                    className={`p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors text-center ${config.color}`}
                  >
                    <div className="text-2xl mb-2">{config.icon}</div>
                    <div className="font-medium">{config.label}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowAddActivity(false)}
                className="w-full mt-4 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};