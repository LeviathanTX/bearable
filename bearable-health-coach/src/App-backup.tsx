import React, { useState, useEffect } from 'react';
import { User, AICompanion, AppState, Conversation, CoachTeam, CarePlan } from './types';
import { BearCompanion } from './components/BearCompanion';
import { ChatInterface } from './components/ChatInterface';
import { RealtimeChatInterface } from './components/RealtimeChatInterface';
import { ActivityLog } from './components/ActivityLog';
import { CaregiverDashboard } from './components/CaregiverDashboard';
import { HealthGoals } from './components/HealthGoals';
import { WelcomeScreen } from './components/WelcomeScreen';
import { CoachTeamSelector } from './components/CoachTeamSelector';
import { CarePlanDashboard } from './components/CarePlanDashboard';
import CoachDashboard from './components/CoachDashboard/CoachDashboard';
import { CoachTeamService } from './services/coachTeamService';
import { CarePlanService } from './services/carePlanService';
import './App.css';

// Mock data for demonstration
const mockUser: User = {
  id: 'demo-user-1',
  name: 'Jane',
  email: 'jane@demo.com',
  avatar: '👩‍💼',
  createdAt: new Date(),
  contactInfo: {
    email: 'jane@demo.com',
    phone: '+1-555-0123'
  },
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
    },
    nudgingPreferences: {
      enableNudging: true,
      channels: {
        inApp: true,
        email: true,
        sms: true,
        phone: false
      },
      frequency: 'moderate',
      types: {
        healthReminders: true,
        goalMotivation: true,
        protocolAdherence: true,
        achievements: true,
        checkIns: true,
        emergencyAlerts: true
      },
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '07:00'
      }
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

// The coach team will be dynamically created based on the user

function App() {
  const [appState, setAppState] = useState<AppState>({
    currentUser: null,
    coachTeam: null,
    activeCoach: null,
    currentCarePlan: null,
    currentView: 'dashboard',
    isLoading: false,
    error: null,
    pendingEscalations: []
  });

  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [startChatWithVoice, setStartChatWithVoice] = useState(false);
  const [useRealtimeAPI, setUseRealtimeAPI] = useState(true); // Enable Realtime API by default

  useEffect(() => {
    // Simulate loading user data
    setTimeout(() => {
      const coachTeam = CoachTeamService.createCoachTeam(mockUser);
      setAppState(prev => ({
        ...prev,
        currentUser: mockUser,
        coachTeam,
        activeCoach: coachTeam.primaryCoach,
        isLoading: false
      }));
    }, 1000);
  }, []);

  const handleStartJourney = (userName: string) => {
    const updatedUser = { ...mockUser, name: userName };
    const coachTeam = CoachTeamService.createCoachTeam(updatedUser);
    setAppState(prev => ({
      ...prev,
      currentUser: updatedUser,
      coachTeam,
      activeCoach: coachTeam.primaryCoach
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

  const handleCoachSelect = (coach: AICompanion) => {
    setAppState(prev => ({ ...prev, activeCoach: coach }));
  };

  const handleStartConversation = (coach: AICompanion) => {
    setAppState(prev => ({ ...prev, activeCoach: coach, currentView: 'chat' }));
  };

  const handleCarePlanCreate = (carePlan: CarePlan) => {
    setAppState(prev => ({ ...prev, currentCarePlan: carePlan }));
  };

  const handleCarePlanUpdate = (carePlan: CarePlan) => {
    setAppState(prev => ({ ...prev, currentCarePlan: carePlan }));
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
              <div>
                <h1 className="text-xl font-semibold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">Bearable AI Coach</h1>
                <p className="text-xs text-gray-500">Mayo Clinic Lifestyle Medicine Platform</p>
              </div>
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
          <div className="flex justify-between items-center">
            <div className="flex space-x-8">
              {[
                { id: 'dashboard', label: '🏠 Dashboard', view: 'dashboard' as const },
                { id: 'chat', label: '💬 Chat', view: 'chat' as const },
                { id: 'coaches', label: '🤖 Manage Coaches', view: 'coaches' as const },
                { id: 'care_plan', label: '📋 Care Plan', view: 'care_plan' as const },
                { id: 'goals', label: '🎯 Goals', view: 'goals' as const },
                { id: 'activity', label: '📊 Activity', view: 'activity' as const },
                { id: 'caregivers', label: '👥 Caregivers', view: 'caregivers' as const }
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

            {/* Realtime API Toggle */}
            {appState.currentView === 'chat' && (
              <div className="flex items-center space-x-3 py-2">
                <span className="text-sm text-slate-600">Voice Mode:</span>
                <button
                  onClick={() => setUseRealtimeAPI(!useRealtimeAPI)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                    useRealtimeAPI
                      ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {useRealtimeAPI ? '🚀 Realtime AI' : '🎙️ Basic Voice'}
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {appState.currentView === 'dashboard' && appState.coachTeam && appState.currentUser && (
          <div className="space-y-6">
            <CoachTeamSelector
              user={appState.currentUser}
              coachTeam={appState.coachTeam}
              activeCoach={appState.activeCoach!}
              onCoachSelect={handleCoachSelect}
              onStartConversation={handleStartConversation}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <HealthGoals userId={appState.currentUser!.id} />
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

        {appState.currentView === 'chat' && appState.activeCoach && appState.currentUser && (
          useRealtimeAPI ? (
            <RealtimeChatInterface
              user={appState.currentUser}
              companion={appState.activeCoach}
              coachTeam={appState.coachTeam || undefined}
              conversation={currentConversation}
              onConversationUpdate={setCurrentConversation}
              onCoachSelect={handleCoachSelect}
              startWithVoice={startChatWithVoice}
            />
          ) : (
            <ChatInterface
              user={appState.currentUser}
              companion={appState.activeCoach}
              coachTeam={appState.coachTeam || undefined}
              conversation={currentConversation}
              onConversationUpdate={setCurrentConversation}
              onCoachSelect={handleCoachSelect}
              startWithVoice={startChatWithVoice}
            />
          )
        )}

        {appState.currentView === 'coaches' && appState.currentUser && (
          <CoachDashboard />
        )}

        {appState.currentView === 'care_plan' && appState.coachTeam && appState.currentUser && (
          <CarePlanDashboard
            user={appState.currentUser}
            coachTeam={appState.coachTeam}
            carePlan={appState.currentCarePlan}
            onCarePlanUpdate={handleCarePlanUpdate}
            onCreateCarePlan={handleCarePlanCreate}
          />
        )}

        {appState.currentView === 'goals' && appState.currentUser && (
          <HealthGoals userId={appState.currentUser.id} />
        )}

        {appState.currentView === 'activity' && appState.currentUser && (
          <ActivityLog userId={appState.currentUser.id} />
        )}

        {appState.currentView === 'caregivers' && (
          <CaregiverDashboard userId={appState.currentUser.id} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            Powered by BearAble AI × Mayo Clinic Lifestyle Medicine Platform
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;