import React, { useState, useEffect } from 'react';
import { User, AICompanion, AppState, Conversation } from './types';
import { BearCompanion } from './components/BearCompanion';
import { ChatInterface } from './components/ChatInterface';
import { ActivityLog } from './components/ActivityLog';
import { CaregiverDashboard } from './components/CaregiverDashboard';
import { HealthGoals } from './components/HealthGoals';
import { WelcomeScreen } from './components/WelcomeScreen';
import { VoiceDemo } from './components/VoiceDemo';
import './App.css';

// Mock data for demonstration
const mockUser: User = {
  id: 'demo-user-1',
  name: 'Jane',
  email: 'jane@demo.com',
  avatar: '👩‍💼',
  createdAt: new Date(),
  preferences: {
    language: 'en',
    timezone: 'America/New_York',
    communicationStyle: 'supportive',
    preferredTimes: {
      morning: '08:00',
      evening: '18:00'
    },
    privacySettings: {
      shareWithCaregivers: true,
      allowDataCollection: true,
      publicProfile: false
    }
  },
  healthProfile: {
    age: 34,
    goals: [],
    conditions: [],
    medications: [],
    lifestyle: {
      activityLevel: 'moderately_active',
      sleepHours: 7,
      stressLevel: 3
    }
  }
};

const mockCompanion: AICompanion = {
  id: 'care-bear-1',
  name: 'Wellness Bear',
  personality: 'supportive',
  expertise: ['lifestyle medicine', 'behavioral change', 'Mayo Clinic protocols'],
  avatar: '🐻',
  isActive: true
};

function App() {
  const [appState, setAppState] = useState<AppState>({
    currentUser: null,
    activeCompanion: mockCompanion,
    currentView: 'dashboard',
    isLoading: false,
    error: null
  });

  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [startChatWithVoice, setStartChatWithVoice] = useState(false);

  useEffect(() => {
    // Simulate loading user data
    setTimeout(() => {
      setAppState(prev => ({
        ...prev,
        currentUser: mockUser,
        isLoading: false
      }));
    }, 1000);
  }, []);

  const handleStartJourney = (userName: string) => {
    const updatedUser = { ...mockUser, name: userName };
    setAppState(prev => ({
      ...prev,
      currentUser: updatedUser
    }));
    setShowWelcome(false);
  };

  const handleViewChange = (view: AppState['currentView']) => {
    setAppState(prev => ({ ...prev, currentView: view }));
    // Reset voice start flag when leaving chat
    if (view !== 'chat') {
      setStartChatWithVoice(false);
    }
  };

  if (showWelcome || !appState.currentUser) {
    return <WelcomeScreen onStart={handleStartJourney} isLoading={appState.isLoading} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg">
                🐻
              </div>
              <h1 className="text-xl font-semibold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">Bearable Health Coach</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">
                Hello, {appState.currentUser.name}! 👋
              </span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center ring-2 ring-white shadow-sm">
                {appState.currentUser.avatar}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'dashboard', label: '🏠 Dashboard', view: 'dashboard' as const },
              { id: 'chat', label: '💬 Chat', view: 'chat' as const },
              { id: 'goals', label: '🎯 Goals', view: 'goals' as const },
              { id: 'activity', label: '📊 Activity', view: 'activity' as const },
              { id: 'caregivers', label: '👥 Caregivers', view: 'caregivers' as const },
              { id: 'voice-demo', label: '🎤 Voice Demo', view: 'voice-demo' as const }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => handleViewChange(tab.view)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  appState.currentView === tab.view
                    ? 'border-cyan-500 text-cyan-600 bg-cyan-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {appState.currentView === 'dashboard' && appState.activeCompanion && (
          <div className="space-y-6">
            <BearCompanion
              companion={appState.activeCompanion}
              user={appState.currentUser}
              onStartChat={() => handleViewChange('chat')}
              onStartVoiceChat={() => {
                setStartChatWithVoice(true);
                handleViewChange('chat');
              }}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <HealthGoals userId={appState.currentUser.id} />
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Progress</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Steps</span>
                    <span className="text-sm font-medium">8,432 / 10,000</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '84%' }}></div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Mayo Clinic Tip</h3>
                <p className="text-sm text-gray-600">
                  "A 5-minute walk after meals can help regulate blood sugar levels."
                </p>
                <p className="text-xs text-gray-400 mt-2">Source: Mayo Clinic</p>
              </div>
            </div>
          </div>
        )}

        {appState.currentView === 'chat' && appState.activeCompanion && (
          <ChatInterface
            user={appState.currentUser}
            companion={appState.activeCompanion}
            conversation={currentConversation}
            onConversationUpdate={setCurrentConversation}
            startWithVoice={startChatWithVoice}
          />
        )}

        {appState.currentView === 'goals' && (
          <HealthGoals userId={appState.currentUser.id} />
        )}

        {appState.currentView === 'activity' && (
          <ActivityLog userId={appState.currentUser.id} />
        )}

        {appState.currentView === 'caregivers' && (
          <CaregiverDashboard userId={appState.currentUser.id} />
        )}

        {appState.currentView === 'voice-demo' && (
          <VoiceDemo />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            Powered by Bearable AI × Mayo Clinic Lifestyle Medicine
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
