import React, { useState } from 'react';
import { HealthGoal } from '../types';

interface HealthGoalsProps {
  userId: string;
}

export const HealthGoals: React.FC<HealthGoalsProps> = ({ userId }) => {
  const [goals, setGoals] = useState<HealthGoal[]>([
    {
      id: 'goal-1',
      title: 'Walk 10,000 steps daily',
      description: 'Increase daily physical activity to improve cardiovascular health',
      category: 'physical_activity',
      target: '10,000 steps',
      timeline: '30 days',
      progress: 84,
      status: 'active',
      createdAt: new Date('2024-09-01'),
      updatedAt: new Date(),
      assignedCoach: 'activity-specialist',
      nudgeSettings: {
        enabled: true,
        frequency: 'medium',
        preferredTypes: ['reminder', 'encouragement'],
        personalizedStyle: 'motivational',
        respectQuietHours: true,
        adaptToMoodPattern: false
      }
    },
    {
      id: 'goal-2',
      title: 'Sleep 8 hours nightly',
      description: 'Establish consistent sleep schedule for better recovery',
      category: 'restorative_sleep',
      target: '8 hours',
      timeline: '21 days',
      progress: 67,
      status: 'active',
      createdAt: new Date('2024-09-05'),
      updatedAt: new Date(),
      assignedCoach: 'sleep-specialist',
      nudgeSettings: {
        enabled: true,
        frequency: 'low',
        preferredTypes: ['reminder', 'education'],
        personalizedStyle: 'gentle',
        respectQuietHours: true,
        adaptToMoodPattern: true
      }
    },
    {
      id: 'goal-3',
      title: 'Eat 5 servings of vegetables',
      description: 'Increase vegetable intake following Mayo Clinic nutrition guidelines',
      category: 'optimal_nutrition',
      target: '5 servings daily',
      timeline: '28 days',
      progress: 43,
      status: 'active',
      createdAt: new Date('2024-09-10'),
      updatedAt: new Date(),
      assignedCoach: 'nutrition-specialist',
      nudgeSettings: {
        enabled: true,
        frequency: 'medium',
        preferredTypes: ['education', 'encouragement'],
        personalizedStyle: 'scientific',
        respectQuietHours: true,
        adaptToMoodPattern: false
      }
    },
    {
      id: 'goal-4',
      title: 'Practice mindfulness daily',
      description: '10 minutes of meditation or deep breathing exercises',
      category: 'stress_management',
      target: '10 minutes daily',
      timeline: '14 days',
      progress: 92,
      status: 'active',
      createdAt: new Date('2024-09-15'),
      updatedAt: new Date(),
      assignedCoach: 'stress-specialist',
      nudgeSettings: {
        enabled: true,
        frequency: 'low',
        preferredTypes: ['reminder', 'challenge'],
        personalizedStyle: 'gentle',
        respectQuietHours: true,
        adaptToMoodPattern: true
      }
    }
  ]);

  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'general' as HealthGoal['category'],
    target: '',
    timeline: ''
  });

  const categoryColors = {
    optimal_nutrition: 'bg-green-100 text-green-800 border-green-200',
    physical_activity: 'bg-blue-100 text-blue-800 border-blue-200',
    restorative_sleep: 'bg-purple-100 text-purple-800 border-purple-200',
    stress_management: 'bg-orange-100 text-orange-800 border-orange-200',
    connectedness: 'bg-pink-100 text-pink-800 border-pink-200',
    substance_avoidance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    medication: 'bg-red-100 text-red-800 border-red-200',
    general: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const categoryIcons = {
    optimal_nutrition: '🥗',
    physical_activity: '🏃‍♀️',
    restorative_sleep: '😴',
    stress_management: '🧘‍♀️',
    connectedness: '🤝',
    substance_avoidance: '🚭',
    medication: '💊',
    general: '🎯'
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title.trim()) return;

    const goal: HealthGoal = {
      id: `goal-${Date.now()}`,
      title: newGoal.title,
      description: newGoal.description,
      category: newGoal.category,
      target: newGoal.target,
      timeline: newGoal.timeline,
      progress: 0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedCoach: newGoal.category === 'general' ? 'primary-coach' : `${newGoal.category.split('_')[0]}-specialist`,
      nudgeSettings: {
        enabled: true,
        frequency: 'medium',
        preferredTypes: ['reminder', 'encouragement'],
        personalizedStyle: 'motivational',
        respectQuietHours: true,
        adaptToMoodPattern: false
      }
    };

    setGoals(prev => [...prev, goal]);
    setNewGoal({ title: '', description: '', category: 'general', target: '', timeline: '' });
    setShowAddGoal(false);
  };

  const updateGoalProgress = (goalId: string, newProgress: number) => {
    setGoals(prev => prev.map(goal =>
      goal.id === goalId
        ? {
            ...goal,
            progress: Math.max(0, Math.min(100, newProgress)),
            status: newProgress >= 100 ? 'completed' : 'active',
            updatedAt: new Date()
          }
        : goal
    ));
  };

  const activeGoals = goals.filter(goal => goal.status === 'active');
  const completedGoals = goals.filter(goal => goal.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Health Goals</h2>
            <p className="text-gray-600">Track your wellness journey with evidence-based targets</p>
          </div>
          <button
            onClick={() => setShowAddGoal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            + Add Goal
          </button>
        </div>

        {/* Goal Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{activeGoals.length}</div>
            <div className="text-sm text-blue-800">Active Goals</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{completedGoals.length}</div>
            <div className="text-sm text-green-800">Completed</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(activeGoals.reduce((acc, goal) => acc + goal.progress, 0) / activeGoals.length) || 0}%
            </div>
            <div className="text-sm text-orange-800">Avg Progress</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((Date.now() - new Date('2024-09-01').getTime()) / (1000 * 60 * 60 * 24))}
            </div>
            <div className="text-sm text-purple-800">Days Active</div>
          </div>
        </div>
      </div>

      {/* Active Goals */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Active Goals</h3>
        {activeGoals.map((goal) => (
          <div key={goal.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl">{categoryIcons[goal.category]}</span>
                  <h4 className="text-lg font-semibold text-gray-900">{goal.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${categoryColors[goal.category]}`}>
                    {goal.category}
                  </span>
                </div>
                <p className="text-gray-600 mb-2">{goal.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>🎯 {goal.target}</span>
                  <span>⏰ {goal.timeline}</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm font-bold text-gray-900">{goal.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Progress Controls */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <button
                  onClick={() => updateGoalProgress(goal.id, goal.progress - 10)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  -10%
                </button>
                <button
                  onClick={() => updateGoalProgress(goal.id, goal.progress + 10)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  +10%
                </button>
                <button
                  onClick={() => updateGoalProgress(goal.id, 100)}
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                >
                  Complete
                </button>
              </div>
              <div className="text-xs text-gray-500">
                Updated {goal.updatedAt.toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Goal Modal */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Add New Health Goal</h3>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Goal Title</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Drink 8 glasses of water daily"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Why is this goal important to you?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as HealthGoal['category'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="general">General</option>
                  <option value="optimal_nutrition">Nutrition</option>
                  <option value="physical_activity">Physical Activity</option>
                  <option value="restorative_sleep">Sleep</option>
                  <option value="stress_management">Stress Management</option>
                  <option value="connectedness">Connectedness</option>
                  <option value="substance_avoidance">Substance Avoidance</option>
                  <option value="medication">Medication</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target</label>
                <input
                  type="text"
                  value={newGoal.target}
                  onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 8 glasses, 30 minutes, 7 hours"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timeline</label>
                <input
                  type="text"
                  value={newGoal.timeline}
                  onChange={(e) => setNewGoal({ ...newGoal, timeline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 30 days, 2 weeks, ongoing"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                >
                  Add Goal
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddGoal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};