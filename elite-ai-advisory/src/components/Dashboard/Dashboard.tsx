import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useAdvisor } from '../../contexts/AdvisorContext';
import { SettingsModal } from '../Settings/SettingsModal';
import { TestDocumentManagement } from '../Testing/TestDocumentManagement';
import { cn, formatCurrency, calculatePercentage } from '../../utils';
import { ApplicationMode } from '../../types';

interface DashboardProps {
  onModeSelect: (mode: ApplicationMode) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onModeSelect }) => {
  const { user, signOut } = useAuth();
  const { currentTier, limits, usage, pricing } = useSubscription();
  const { celebrityAdvisors, customAdvisors, conversations } = useAdvisor();
  const [showSettings, setShowSettings] = useState(false);
  const [showTestDocument, setShowTestDocument] = useState(false);
  
  const isDemoMode = !process.env.REACT_APP_SUPABASE_URL;

  const modes: { 
    id: ApplicationMode; 
    title: string; 
    description: string; 
    icon: string;
    color: string;
  }[] = [
    {
      id: 'pitch_practice',
      title: 'Pitch Practice',
      description: 'AI-powered pitch analysis with real-time feedback and voice recording',
      icon: '🎤',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'advisory_conversation',
      title: 'Advisory Board',
      description: 'Strategic planning, due diligence, consultations & document analysis',
      icon: '💼',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'test_document' as any,
      title: '🧪 Test Document Features',
      description: 'Test the new document management and MCP folder features',
      icon: '📄',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  const getUsagePercentage = (used: number, limit: number): number => {
    if (limit === -1) return 0; // unlimited
    return calculatePercentage(used, limit);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {isDemoMode && (
        <div className="bg-yellow-500 text-black text-center py-2 px-4 text-sm font-medium">
          🚀 DEMO MODE - All features are simulated for demonstration
        </div>
      )}
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Elite AI Advisory</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, {user?.full_name || user?.email}
              </div>
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-medium",
                currentTier === 'founder' && "bg-blue-100 text-blue-800",
                currentTier === 'scale-up' && "bg-purple-100 text-purple-800",
                currentTier === 'enterprise' && "bg-green-100 text-green-800"
              )}>
                {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} Plan
              </span>
              <button
                onClick={() => onModeSelect('advisor_management')}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Manage Advisors
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="text-gray-500 hover:text-gray-700"
              >
                Settings
              </button>
              <button
                onClick={signOut}
                className="text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">AI Advisor Hours</h3>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {usage.ai_advisor_hours_used}
              {limits.ai_advisor_hours !== -1 && ` / ${limits.ai_advisor_hours}`}
            </div>
            {limits.ai_advisor_hours !== -1 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${getUsagePercentage(usage.ai_advisor_hours_used, limits.ai_advisor_hours)}%` }}
                ></div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Document Analyses</h3>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {usage.document_analyses_used}
              {limits.document_analyses !== -1 && ` / ${limits.document_analyses}`}
            </div>
            {limits.document_analyses !== -1 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${getUsagePercentage(usage.document_analyses_used, limits.document_analyses)}%` }}
                ></div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Pitch Sessions</h3>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {usage.pitch_practice_sessions_used}
              {limits.pitch_practice_sessions !== -1 && ` / ${limits.pitch_practice_sessions}`}
            </div>
            {limits.pitch_practice_sessions !== -1 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full" 
                  style={{ width: `${getUsagePercentage(usage.pitch_practice_sessions_used, limits.pitch_practice_sessions)}%` }}
                ></div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Custom Advisors</h3>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {customAdvisors.length}
              {limits.custom_advisors !== -1 && ` / ${limits.custom_advisors}`}
            </div>
            {limits.custom_advisors !== -1 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full" 
                  style={{ width: `${getUsagePercentage(customAdvisors.length, limits.custom_advisors)}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>

        {/* Application Modes */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Advisory Mode</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  if ((mode.id as string) === 'test_document') {
                    setShowTestDocument(true);
                  } else {
                    onModeSelect(mode.id);
                  }
                }}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left group"
              >
                <div className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto",
                  "bg-gradient-to-r", mode.color
                )}>
                  <span className="text-2xl">{mode.icon}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-center">{mode.title}</h3>
                <p className="text-sm text-gray-600 text-center">{mode.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Conversations */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Conversations</h3>
            {conversations.length > 0 ? (
              <div className="space-y-3">
                {conversations.slice(0, 5).map((conversation) => {
                  const advisor = conversation.advisor_type === 'celebrity'
                    ? celebrityAdvisors.find(a => a.id === conversation.advisor_id)
                    : customAdvisors.find(a => a.id === conversation.advisor_id);
                  
                  return (
                    <div key={conversation.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {advisor?.name.charAt(0) || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {advisor?.name || 'Unknown Advisor'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {conversation.mode.replace('_', ' ')} • {conversation.messages.length} messages
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No conversations yet. Start by selecting a mode above!
              </p>
            )}
          </div>

          {/* Available Advisors */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Advisors</h3>
            <div className="space-y-3">
              {celebrityAdvisors.slice(0, 6).map((advisor) => (
                <div key={advisor.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {advisor.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{advisor.name}</p>
                    <p className="text-xs text-gray-500">{advisor.title}</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Celebrity
                  </span>
                </div>
              ))}
              {customAdvisors.slice(0, 3).map((advisor) => (
                <div key={advisor.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-purple-600">
                      {advisor.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{advisor.name}</p>
                    <p className="text-xs text-gray-500">{advisor.title}</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Custom
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {showTestDocument && (
        <div className="fixed inset-0 bg-white z-50 overflow-auto">
          <div className="p-4">
            <button
              onClick={() => setShowTestDocument(false)}
              className="mb-4 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              ← Back to Dashboard
            </button>
            <TestDocumentManagement />
          </div>
        </div>
      )}
    </div>
  );
};