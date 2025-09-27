import React, { useState, useEffect } from 'react';
import { CustomCoach, CoachAnalytics } from '../../types';
import { coachService } from '../../services/coachService';

interface CoachAnalyticsPanelProps {
  coaches: CustomCoach[];
}

type TimeframeOption = 'day' | 'week' | 'month' | 'quarter' | 'year';

const CoachAnalyticsPanel: React.FC<CoachAnalyticsPanelProps> = ({ coaches }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>('month');
  const [analyticsData, setAnalyticsData] = useState<Record<string, CoachAnalytics>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);

  useEffect(() => {
    if (coaches.length > 0) {
      loadAnalytics();
    }
  }, [coaches, selectedTimeframe]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const analyticsPromises = coaches.map(coach =>
        coachService.getCoachAnalytics(coach.id, selectedTimeframe)
      );
      const analyticsResults = await Promise.all(analyticsPromises);

      const analyticsMap: Record<string, CoachAnalytics> = {};
      analyticsResults.forEach(analytics => {
        analyticsMap[analytics.coachId] = analytics;
      });

      setAnalyticsData(analyticsMap);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getOverallMetrics = () => {
    if (coaches.length === 0) return null;

    const totalInteractions = coaches.reduce((sum, coach) =>
      sum + coach.effectivenessMetrics.totalInteractions, 0
    );

    const averageRating = coaches.reduce((sum, coach) =>
      sum + coach.effectivenessMetrics.averageRating, 0
    ) / coaches.length;

    const averageEngagement = coaches.reduce((sum, coach) =>
      sum + coach.effectivenessMetrics.engagementScore, 0
    ) / coaches.length;

    const averageGoalAchievement = coaches.reduce((sum, coach) =>
      sum + coach.effectivenessMetrics.goalAchievementRate, 0
    ) / coaches.length;

    const improvingCount = coaches.filter(coach =>
      coach.effectivenessMetrics.trendAnalysis.improving
    ).length;

    return {
      totalInteractions,
      averageRating,
      averageEngagement,
      averageGoalAchievement,
      improvingCount,
      totalCoaches: coaches.length
    };
  };

  const getTopPerformers = () => {
    return coaches
      .sort((a, b) => b.effectivenessMetrics.averageRating - a.effectivenessMetrics.averageRating)
      .slice(0, 5);
  };

  const getCategoryBreakdown = () => {
    const categoryMap: Record<string, number> = {};
    coaches.forEach(coach => {
      if (coach.template) {
        const category = coach.template.category;
        categoryMap[category] = (categoryMap[category] || 0) + 1;
      }
    });
    return Object.entries(categoryMap).map(([category, count]) => ({
      category: category.replace('_', ' '),
      count,
      percentage: (count / coaches.length) * 100
    }));
  };

  const overallMetrics = getOverallMetrics();
  const topPerformers = getTopPerformers();
  const categoryBreakdown = getCategoryBreakdown();

  if (coaches.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
        <p className="text-gray-600">Create some coaches to view analytics and performance metrics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Timeframe Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Coach Analytics</h2>
        <div className="flex space-x-2">
          {[
            { value: 'day' as TimeframeOption, label: '24h' },
            { value: 'week' as TimeframeOption, label: '7d' },
            { value: 'month' as TimeframeOption, label: '30d' },
            { value: 'quarter' as TimeframeOption, label: '3m' },
            { value: 'year' as TimeframeOption, label: '1y' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedTimeframe(option.value)}
              className={`px-3 py-2 text-sm rounded-lg ${
                selectedTimeframe === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overall Metrics */}
      {overallMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{overallMetrics.totalInteractions}</div>
              <div className="text-sm text-gray-600">Total Interactions</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{overallMetrics.averageRating.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{overallMetrics.averageEngagement.toFixed(0)}%</div>
              <div className="text-sm text-gray-600">Avg Engagement</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{overallMetrics.averageGoalAchievement.toFixed(0)}%</div>
              <div className="text-sm text-gray-600">Goal Achievement</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">{overallMetrics.improvingCount}</div>
              <div className="text-sm text-gray-600">Improving Coaches</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Performers */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Coaches</h3>
          <div className="space-y-4">
            {topPerformers.map((coach, index) => (
              <div key={coach.id} className="flex items-center space-x-4 p-3 border border-gray-100 rounded-lg">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-500' : 'bg-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{coach.name}</div>
                  <div className="text-xs text-gray-500">
                    {coach.template?.category.replace('_', ' ') || 'Custom Coach'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {coach.effectivenessMetrics.averageRating.toFixed(1)} ⭐
                  </div>
                  <div className="text-xs text-gray-500">
                    {coach.effectivenessMetrics.totalInteractions} interactions
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Coach Categories</h3>
          <div className="space-y-4">
            {categoryBreakdown.map((item, index) => (
              <div key={item.category} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-900 capitalize">{item.category}</span>
                  <span className="text-gray-600">{item.count} coaches ({item.percentage.toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${
                      index % 4 === 0 ? 'from-blue-400 to-blue-600' :
                      index % 4 === 1 ? 'from-green-400 to-green-600' :
                      index % 4 === 2 ? 'from-purple-400 to-purple-600' :
                      'from-orange-400 to-orange-600'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Individual Coach Analytics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Individual Coach Performance</h3>
          <select
            value={selectedCoachId || ''}
            onChange={(e) => setSelectedCoachId(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a coach for detailed analytics</option>
            {coaches.map((coach) => (
              <option key={coach.id} value={coach.id}>{coach.name}</option>
            ))}
          </select>
        </div>

        {selectedCoachId && analyticsData[selectedCoachId] ? (
          <div className="space-y-6">
            {/* Detailed metrics for selected coach */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {analyticsData[selectedCoachId].metrics.totalInteractions}
                </div>
                <div className="text-sm text-gray-600">Total Interactions</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {analyticsData[selectedCoachId].metrics.averageSessionDuration.toFixed(0)}s
                </div>
                <div className="text-sm text-gray-600">Avg Session Duration</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {analyticsData[selectedCoachId].metrics.uniqueUsers}
                </div>
                <div className="text-sm text-gray-600">Unique Users</div>
              </div>
            </div>

            {/* Trend visualization placeholder */}
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-gray-600">Performance trends chart coming soon</p>
              </div>
            </div>
          </div>
        ) : selectedCoachId ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">Select a coach to view detailed performance analytics.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachAnalyticsPanel;