/**
 * Privacy Dashboard
 *
 * Comprehensive privacy and consent management interface
 * Shows active consents, data access logs, and privacy controls
 */

import React, { useState, useEffect } from 'react';
import {
  DataSharingsSummary,
  ConsentRecord,
  DataAccessLog,
  ConsentScope,
  DataCategory,
  ConsentNotification,
} from '../../types/consent';

interface PrivacyDashboardProps {
  userId: string;
}

type DashboardView = 'overview' | 'consents' | 'access_logs' | 'data_exports' | 'notifications';

export const PrivacyDashboard: React.FC<PrivacyDashboardProps> = ({ userId }) => {
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [summary, setSummary] = useState<DataSharingsSummary | null>(null);
  const [activeConsents, setActiveConsents] = useState<ConsentRecord[]>([]);
  const [accessLogs, setAccessLogs] = useState<DataAccessLog[]>([]);
  const [notifications, setNotifications] = useState<ConsentNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [scopeFilter, setScopeFilter] = useState<ConsentScope | 'all'>('all');
  const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '30d' | 'all'>('7d');

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API calls
      // const summaryData = await consentService.getDataSharingSummary(userId);
      // setSummary(summaryData);

      // Mock data for demonstration
      setSummary({
        userId,
        generatedAt: new Date(),
        activeShares: [
          {
            scope: 'personal_ai',
            recipientId: 'ai-wellness-bear',
            recipientName: 'Wellness Bear',
            recipientType: 'ai',
            dataCategories: ['demographics', 'health_metrics', 'activity_logs'],
            accessLevel: 'detailed',
            grantedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          {
            scope: 'caregiver',
            recipientId: 'caregiver-mom',
            recipientName: 'Mom',
            recipientType: 'person',
            dataCategories: ['activity_logs', 'ai_recommendations'],
            accessLevel: 'summary',
            grantedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          },
        ],
        totalActiveConsents: 3,
        totalDataAccessors: 2,
        dataAccessLastMonth: 47,
        expiringConsents: [],
        unusedConsents: [],
      });

      // Mock notifications
      setNotifications([
        {
          id: 'notif-1',
          userId,
          type: 'new_accessor',
          title: 'New Data Access',
          message: 'Your Mayo Clinic physician requested access to your health metrics',
          severity: 'info',
          actionRequired: true,
          actionDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          read: false,
          acknowledged: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const revokeConsent = async (consentId: string) => {
    if (confirm('Are you sure you want to revoke this consent? The recipient will immediately lose access to your data.')) {
      // TODO: Implement revocation
      // await consentService.revokeConsent(consentId, userId);
      console.log('Revoking consent:', consentId);
      await loadDashboardData();
    }
  };

  const exportData = async () => {
    // TODO: Implement data export
    console.log('Exporting user data...');
    alert('Your data export has been requested. You will receive a download link via email within 24 hours.');
  };

  const requestDataDeletion = async () => {
    if (confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
      // TODO: Implement deletion request
      console.log('Requesting data deletion...');
      alert('Your data deletion request has been submitted. We will process it within 30 days as required by GDPR.');
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
          <div className="text-3xl font-bold">{summary?.totalActiveConsents || 0}</div>
          <div className="text-blue-100 text-sm">Active Consents</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6">
          <div className="text-3xl font-bold">{summary?.totalDataAccessors || 0}</div>
          <div className="text-purple-100 text-sm">Data Accessors</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
          <div className="text-3xl font-bold">{summary?.dataAccessLastMonth || 0}</div>
          <div className="text-green-100 text-sm">Accesses (30d)</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6">
          <div className="text-3xl font-bold">{notifications.filter(n => !n.read).length}</div>
          <div className="text-orange-100 text-sm">Notifications</div>
        </div>
      </div>

      {/* Alerts */}
      {notifications.filter(n => !n.read).length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">Action Required</h3>
          <div className="space-y-2">
            {notifications.filter(n => !n.read).map(notif => (
              <div key={notif.id} className="text-sm text-yellow-800">
                <strong>{notif.title}:</strong> {notif.message}
              </div>
            ))}
          </div>
          <button
            onClick={() => setCurrentView('notifications')}
            className="mt-3 text-sm text-yellow-700 hover:text-yellow-900 font-medium"
          >
            View All Notifications →
          </button>
        </div>
      )}

      {/* Active Shares */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Data Shares</h3>
        <div className="space-y-3">
          {summary?.activeShares.map((share, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    share.recipientType === 'ai' ? 'bg-blue-100 text-blue-600' :
                    share.recipientType === 'person' ? 'bg-purple-100 text-purple-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {share.recipientType === 'ai' ? '🤖' :
                     share.recipientType === 'person' ? '👤' : '🏢'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{share.recipientName}</div>
                    <div className="text-sm text-gray-500">{share.scope.replace(/_/g, ' ')}</div>
                  </div>
                </div>
                <button
                  onClick={() => revokeConsent(share.recipientId)}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Revoke
                </button>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500 mb-1">Data Shared:</div>
                <div className="flex flex-wrap gap-1">
                  {share.dataCategories.map(cat => (
                    <span key={cat} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {cat.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Access Level: <span className="font-medium">{share.accessLevel}</span>
                  {' • '}
                  Granted: {share.grantedAt.toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={exportData}
            className="flex items-center justify-center space-x-2 bg-blue-50 text-blue-700 px-4 py-3 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <span>📥</span>
            <span>Export My Data</span>
          </button>
          <button
            onClick={() => setCurrentView('access_logs')}
            className="flex items-center justify-center space-x-2 bg-purple-50 text-purple-700 px-4 py-3 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <span>📊</span>
            <span>View Access Logs</span>
          </button>
          <button
            onClick={() => setCurrentView('consents')}
            className="flex items-center justify-center space-x-2 bg-green-50 text-green-700 px-4 py-3 rounded-lg hover:bg-green-100 transition-colors"
          >
            <span>⚙️</span>
            <span>Manage Consents</span>
          </button>
          <button
            onClick={requestDataDeletion}
            className="flex items-center justify-center space-x-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg hover:bg-red-100 transition-colors"
          >
            <span>🗑️</span>
            <span>Delete My Data</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderAccessLogs = () => {
    // Mock access logs
    const mockLogs: DataAccessLog[] = [
      {
        id: 'log-1',
        userId,
        accessorId: 'ai-wellness-bear',
        accessorType: 'ai_agent',
        dataCategory: 'health_metrics',
        accessLevel: 'detailed',
        operation: 'read',
        method: 'api',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        success: true,
        purpose: 'Generate personalized health recommendations',
      },
      {
        id: 'log-2',
        userId,
        accessorId: 'caregiver-mom',
        accessorType: 'caregiver',
        dataCategory: 'activity_logs',
        accessLevel: 'summary',
        operation: 'read',
        method: 'ui',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        success: true,
        purpose: 'View daily progress',
      },
      {
        id: 'log-3',
        userId,
        accessorId: 'unknown-accessor',
        accessorType: 'system',
        dataCategory: 'medical_history',
        accessLevel: 'full',
        operation: 'read',
        method: 'api',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
        success: false,
        denialReason: 'No active consent',
        purpose: 'Unauthorized access attempt',
      },
    ];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Data Access Logs</h3>
            <p className="text-sm text-gray-500">HIPAA-compliant audit trail of all data access</p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as typeof timeFilter)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accessor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purpose
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockLogs.map((log) => (
                  <tr key={log.id} className={log.success ? '' : 'bg-red-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.timestamp.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{log.accessorId}</div>
                      <div className="text-xs text-gray-500">{log.accessorType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.dataCategory.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        {log.operation}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs px-2 py-1 rounded ${
                        log.success
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {log.success ? 'Success' : 'Denied'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {log.success ? log.purpose : log.denialReason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>HIPAA Compliance:</strong> All data access is logged and retained for 6 years.
            You have the right to request a full audit report at any time.
          </p>
        </div>
      </div>
    );
  };

  const renderNotifications = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Privacy Notifications</h3>
        <p className="text-sm text-gray-500">Important updates about your data and consents</p>
      </div>

      <div className="space-y-3">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`bg-white border rounded-lg p-4 ${
              !notif.read ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`text-lg ${
                    notif.severity === 'urgent' ? '🔴' :
                    notif.severity === 'warning' ? '⚠️' : 'ℹ️'
                  }`}>
                    {notif.severity === 'urgent' ? '🔴' :
                     notif.severity === 'warning' ? '⚠️' : 'ℹ️'}
                  </span>
                  <h4 className="font-semibold text-gray-900">{notif.title}</h4>
                  {!notif.read && (
                    <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">New</span>
                  )}
                </div>
                <p className="text-sm text-gray-700 mb-2">{notif.message}</p>
                <div className="text-xs text-gray-500">
                  {notif.createdAt.toLocaleString()}
                  {notif.actionDeadline && (
                    <span className="ml-2">• Action required by: {notif.actionDeadline.toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              {notif.actionRequired && (
                <button className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                  Take Action
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your privacy dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Dashboard</h1>
          <p className="text-gray-600">Manage your consents, view data access, and control your privacy</p>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex space-x-1 p-2">
            {[
              { id: 'overview' as DashboardView, label: 'Overview', icon: '🏠' },
              { id: 'consents' as DashboardView, label: 'Consents', icon: '📋' },
              { id: 'access_logs' as DashboardView, label: 'Access Logs', icon: '📊' },
              { id: 'data_exports' as DashboardView, label: 'Data Exports', icon: '📥' },
              { id: 'notifications' as DashboardView, label: 'Notifications', icon: '🔔' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentView(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  currentView === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === 'notifications' && notifications.filter(n => !n.read).length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {currentView === 'overview' && renderOverview()}
        {currentView === 'access_logs' && renderAccessLogs()}
        {currentView === 'notifications' && renderNotifications()}
        {currentView === 'consents' && (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Consents management coming soon...</p>
          </div>
        )}
        {currentView === 'data_exports' && (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Data exports coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};
