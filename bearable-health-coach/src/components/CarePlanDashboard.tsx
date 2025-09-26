import React, { useState, useEffect } from 'react';
import {
  CarePlan,
  CarePlanPhase,
  CarePlanMilestone,
  HealthGoal,
  User,
  CoachTeam,
  LifestylePillar,
  ProactiveInsight
} from '../types';
import { CarePlanService } from '../services/carePlanService';

interface CarePlanDashboardProps {
  user: User;
  coachTeam: CoachTeam;
  carePlan: CarePlan | null;
  onCarePlanUpdate: (carePlan: CarePlan) => void;
  onCreateCarePlan: (plan: CarePlan) => void;
}

export const CarePlanDashboard: React.FC<CarePlanDashboardProps> = ({
  user,
  coachTeam,
  carePlan,
  onCarePlanUpdate,
  onCreateCarePlan
}) => {
  const [insights, setInsights] = useState<ProactiveInsight[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<number>(0);

  useEffect(() => {
    if (carePlan) {
      setSelectedPhase(carePlan.currentPhase);
      // Generate insights based on care plan progress
      const generatedInsights = CarePlanService.generateProactiveInsights(carePlan, []);
      setInsights(generatedInsights);
    }
  }, [carePlan]);

  const handleCreateCarePlan = () => {
    const newCarePlan = CarePlanService.createMayoClinicCarePlan(user, coachTeam);
    onCreateCarePlan(newCarePlan);
  };

  const handleGoalProgressUpdate = (goalId: string, newProgress: number) => {
    if (carePlan) {
      const updatedPlan = CarePlanService.updateCarePlanProgress(carePlan, goalId, newProgress);
      onCarePlanUpdate(updatedPlan);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    if (progress >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getPillarIcon = (pillar: LifestylePillar): string => {
    const icons = {
      optimal_nutrition: '🥗',
      physical_activity: '🏃‍♂️',
      stress_management: '🧘‍♀️',
      restorative_sleep: '😴',
      connectedness: '🤝',
      substance_avoidance: '🚭'
    };
    return icons[pillar] || '🎯';
  };

  if (!carePlan) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full mx-auto flex items-center justify-center text-white text-3xl mb-4">
            📋
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Ready to Start Your Health Journey?
          </h2>
          <p className="text-gray-600 mb-6">
            Create a personalized care plan based on Mayo Clinic's 6 pillars of lifestyle medicine
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[
            { pillar: 'optimal_nutrition', name: 'Nutrition', icon: '🥗' },
            { pillar: 'physical_activity', name: 'Activity', icon: '🏃‍♂️' },
            { pillar: 'stress_management', name: 'Stress', icon: '🧘‍♀️' },
            { pillar: 'restorative_sleep', name: 'Sleep', icon: '😴' },
            { pillar: 'connectedness', name: 'Connection', icon: '🤝' },
            { pillar: 'substance_avoidance', name: 'Wellness', icon: '🚭' }
          ].map((item, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg text-center">
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="text-sm font-medium text-gray-700">{item.name}</div>
            </div>
          ))}
        </div>

        <button
          onClick={handleCreateCarePlan}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
        >
          🚀 Create My Care Plan
        </button>
      </div>
    );
  }

  const currentPhase = carePlan.phases[carePlan.currentPhase];
  const overallProgress = currentPhase ?
    currentPhase.goals.reduce((sum, goal) => sum + goal.progress, 0) / currentPhase.goals.length : 0;

  return (
    <div className="space-y-6">
      {/* Care Plan Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{carePlan.title}</h1>
            <p className="text-gray-600">{carePlan.description}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Overall Progress</div>
            <div className="text-3xl font-bold text-blue-600">{Math.round(overallProgress)}%</div>
          </div>
        </div>

        {/* Phase Progress */}
        <div className="flex items-center space-x-4">
          {carePlan.phases.map((phase, index) => (
            <div key={phase.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                  index < carePlan.currentPhase
                    ? 'bg-green-500'
                    : index === carePlan.currentPhase
                    ? 'bg-blue-500'
                    : 'bg-gray-300'
                }`}
              >
                {index + 1}
              </div>
              <div className="ml-2 text-sm">
                <div className="font-medium text-gray-900">{phase.name}</div>
                <div className="text-gray-500">{phase.durationWeeks} weeks</div>
              </div>
              {index < carePlan.phases.length - 1 && (
                <div className="w-8 h-1 bg-gray-200 mx-4 rounded">
                  <div
                    className={`h-1 rounded ${
                      index < carePlan.currentPhase ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Phase Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {carePlan.phases.map((phase, index) => (
              <button
                key={phase.id}
                onClick={() => setSelectedPhase(index)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedPhase === index
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>{phase.name}</span>
                  {index === carePlan.currentPhase && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      Current
                    </span>
                  )}
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Phase Content */}
        <div className="p-6">
          {selectedPhase < carePlan.phases.length && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {carePlan.phases[selectedPhase].name}
                </h3>
                <p className="text-gray-600">
                  {carePlan.phases[selectedPhase].description}
                </p>
              </div>

              {/* Milestones */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Milestones</h4>
                <div className="space-y-2">
                  {carePlan.phases[selectedPhase].milestones.map(milestone => (
                    <div
                      key={milestone.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg ${
                        milestone.isAchieved ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          milestone.isAchieved ? 'bg-green-500 text-white' : 'bg-gray-300'
                        }`}
                      >
                        {milestone.isAchieved ? '✓' : '○'}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{milestone.title}</div>
                        <div className="text-sm text-gray-600">{milestone.description}</div>
                        {milestone.isAchieved && milestone.celebrationMessage && (
                          <div className="text-sm text-green-700 mt-1">
                            {milestone.celebrationMessage}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Target: {milestone.targetDate.toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Goals */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Goals</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {carePlan.phases[selectedPhase].goals.map(goal => {
                    const specialist = coachTeam.specialists[goal.category as LifestylePillar];
                    return (
                      <div
                        key={goal.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="text-2xl">
                            {getPillarIcon(goal.category as LifestylePillar)}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{goal.title}</h5>
                            <p className="text-sm text-gray-600">{goal.description}</p>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium">{goal.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${getProgressColor(goal.progress)}`}
                              style={{ width: `${goal.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            Coach: {specialist?.name || 'Primary Coach'}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleGoalProgressUpdate(goal.id, Math.min(100, goal.progress + 10))}
                              className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition-colors"
                            >
                              +10%
                            </button>
                            <button
                              onClick={() => handleGoalProgressUpdate(goal.id, Math.max(0, goal.progress - 10))}
                              className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors"
                            >
                              -10%
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 text-sm">
                          <strong>Target:</strong> {goal.target}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Proactive Insights */}
      {insights.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            💡 AI Insights & Recommendations
          </h3>
          <div className="space-y-4">
            {insights.map(insight => (
              <div
                key={insight.id}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.priority === 'high'
                    ? 'bg-red-50 border-red-400'
                    : insight.priority === 'medium'
                    ? 'bg-yellow-50 border-yellow-400'
                    : 'bg-blue-50 border-blue-400'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">
                    {getPillarIcon(insight.pillar)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
                    <p className="text-gray-600 mb-2">{insight.description}</p>
                    <div className="text-sm text-gray-500 mb-2">
                      Generated by {coachTeam.specialists[insight.pillar]?.name} •
                      Confidence: {Math.round(insight.confidence * 100)}%
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-700">Recommendations:</div>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {insight.actionRecommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};