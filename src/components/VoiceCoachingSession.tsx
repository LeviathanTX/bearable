import React, { useState, useEffect, useRef } from 'react';
import {
  ConversationalVoiceService,
  ConversationState,
  VoiceActivityState,
  ConversationContext,
  VoiceSession
} from '../services/conversationalVoiceService';
import { PremiumVoiceService, VoiceCharacter } from '../services/premiumVoiceService';
import { AIService } from '../services/aiService';
import { User } from '../types';

interface VoiceCoachingSessionProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  sessionType: 'wellness_check' | 'goal_setting' | 'habit_coaching' | 'stress_management' | 'sleep_coaching';
  initialTopic?: string;
}

interface SessionProgress {
  stage: 'introduction' | 'exploration' | 'action_planning' | 'wrap_up' | 'complete';
  stageProgress: number;
  totalProgress: number;
  insights: string[];
  actionItems: string[];
}

export const VoiceCoachingSession: React.FC<VoiceCoachingSessionProps> = ({
  user,
  isOpen,
  onClose,
  sessionType,
  initialTopic
}) => {
  const [conversationalService] = useState(() => new ConversationalVoiceService({
    maxTurnDuration: 45000, // 45 seconds for coaching
    silenceTimeoutUser: 3000, // 3 seconds for thoughtful responses
    silenceTimeoutAssistant: 2000,
    enableInterruptions: true,
    adaptivePacing: true,
    emotionalAdaptation: true,
    conversationStyle: 'coaching'
  }));

  const [aiService] = useState(() => new AIService());
  const [conversationState, setConversationState] = useState<ConversationState | null>(null);
  const [voiceActivity, setVoiceActivity] = useState<VoiceActivityState>({
    isUserSpeaking: false,
    isAssistantSpeaking: false,
    silenceDuration: 0,
    voiceLevel: 0,
    backgroundNoise: 0
  });

  const [sessionProgress, setSessionProgress] = useState<SessionProgress>({
    stage: 'introduction',
    stageProgress: 0,
    totalProgress: 0,
    insights: [],
    actionItems: []
  });

  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<VoiceCharacter>(PremiumVoiceService.WELLNESS_BEAR);
  const [sessionNotes, setSessionNotes] = useState<string[]>([]);
  const [currentPhase, setCurrentPhase] = useState<string>('');

  const sessionStartTime = useRef<Date | null>(null);
  const conversationLog = useRef<Array<{speaker: 'user' | 'assistant', message: string, timestamp: Date}>>([]);

  // Session type configurations
  const sessionConfigs = {
    wellness_check: {
      title: 'Wellness Check-In',
      icon: '🌟',
      stages: ['introduction', 'mood_assessment', 'energy_level', 'recent_challenges', 'positive_moments', 'action_planning', 'wrap_up'],
      estimatedDuration: 10,
      character: PremiumVoiceService.WELLNESS_BEAR
    },
    goal_setting: {
      title: 'Goal Setting Session',
      icon: '🎯',
      stages: ['introduction', 'vision_exploration', 'goal_definition', 'obstacle_identification', 'action_planning', 'commitment', 'wrap_up'],
      estimatedDuration: 15,
      character: PremiumVoiceService.VOICE_OPTIONS.find(v => v.name === 'Professional Coach') || PremiumVoiceService.WELLNESS_BEAR
    },
    habit_coaching: {
      title: 'Habit Coaching',
      icon: '🔄',
      stages: ['introduction', 'current_habits', 'desired_changes', 'barrier_analysis', 'strategy_development', 'implementation_planning', 'wrap_up'],
      estimatedDuration: 12,
      character: PremiumVoiceService.WELLNESS_BEAR
    },
    stress_management: {
      title: 'Stress Management',
      icon: '🧘‍♀️',
      stages: ['introduction', 'stress_assessment', 'trigger_identification', 'coping_strategies', 'relaxation_practice', 'action_planning', 'wrap_up'],
      estimatedDuration: 15,
      character: PremiumVoiceService.VOICE_OPTIONS.find(v => v.name === 'Calm Mentor') || PremiumVoiceService.WELLNESS_BEAR
    },
    sleep_coaching: {
      title: 'Sleep Coaching',
      icon: '😴',
      stages: ['introduction', 'sleep_assessment', 'routine_review', 'environment_optimization', 'habit_adjustment', 'action_planning', 'wrap_up'],
      estimatedDuration: 12,
      character: PremiumVoiceService.VOICE_OPTIONS.find(v => v.name === 'Calm Mentor') || PremiumVoiceService.WELLNESS_BEAR
    }
  };

  const currentConfig = sessionConfigs[sessionType];

  useEffect(() => {
    if (isOpen) {
      initializeSession();
    } else {
      cleanupSession();
    }

    return () => cleanupSession();
  }, [isOpen]);

  useEffect(() => {
    // Set up event handlers
    conversationalService.setOnConversationStateChange(setConversationState);
    conversationalService.setOnVoiceActivityChange(setVoiceActivity);
    conversationalService.setOnTurnTransition((from, to) => {
      console.log(`🔄 Voice coaching turn: ${from} → ${to}`);
    });
    conversationalService.setOnError((error, context) => {
      console.error('Voice coaching error:', error, context);
    });
  }, [conversationalService]);

  const initializeSession = async () => {
    try {
      sessionStartTime.current = new Date();
      setSelectedCharacter(currentConfig.character);

      const initialContext: Partial<ConversationContext> = {
        topic: sessionType,
        emotionalTone: sessionType === 'stress_management' ? 'calm' : 'supportive',
        conversationStyle: 'coaching',
        urgency: 'normal'
      };

      const state = await conversationalService.startConversation(
        currentConfig.character,
        initialContext
      );

      console.log('🎙️ Voice coaching session started:', state.conversationId);

      // Start with introduction
      await startIntroduction();

    } catch (error) {
      console.error('Failed to initialize voice coaching session:', error);
    }
  };

  const startIntroduction = async () => {
    const introductions = {
      wellness_check: `Hello ${user.name}! I'm here for our wellness check-in session. Let's take about 10 minutes to see how you're doing overall. I'll ask about your mood, energy, and what's been going well or challenging lately. Ready to begin?`,
      goal_setting: `Hi ${user.name}! I'm excited to help you with goal setting today. We'll spend about 15 minutes exploring your vision and creating actionable goals. I'll guide you through defining what you want to achieve and how to get there. Shall we start?`,
      habit_coaching: `Hello ${user.name}! Let's work on your habits together. In our 12-minute session, we'll look at your current routines and find ways to build healthier patterns. I'm here to help you create sustainable changes. Ready to dive in?`,
      stress_management: `Hi ${user.name}. I'm here to help you with stress management. Let's take about 15 minutes to explore what's causing stress and find effective ways to handle it. This is a safe space to share what's on your mind. How are you feeling right now?`,
      sleep_coaching: `Hello ${user.name}! Ready to improve your sleep? In our 12-minute session, we'll review your sleep patterns and create a personalized plan for better rest. Good sleep is foundational to everything else. Let's begin, shall we?`
    };

    const intro = introductions[sessionType];
    setCurrentPhase('Introduction');

    try {
      await conversationalService.speak(intro, currentConfig.character, 'supportive');
      await startListening();
    } catch (error) {
      console.error('Introduction failed:', error);
    }
  };

  const startListening = async () => {
    if (!conversationState?.isActive) return;

    setIsListening(true);
    setTranscript('');

    try {
      await conversationalService.startListening(
        (transcript, isFinal, confidence) => {
          setTranscript(transcript);
          if (confidence < 0.7) {
            console.log('⚠️ Low confidence transcript:', confidence);
          }
        },
        async (finalTranscript) => {
          setIsListening(false);
          await handleUserInput(finalTranscript);
        }
      );
    } catch (error) {
      setIsListening(false);
      console.error('Listening failed:', error);
    }
  };

  const handleUserInput = async (userInput: string) => {
    if (!userInput.trim()) return;

    // Log conversation
    conversationLog.current.push({
      speaker: 'user',
      message: userInput,
      timestamp: new Date()
    });

    // Generate contextual response based on session type and current stage
    const response = await generateCoachingResponse(userInput);

    // Log AI response
    conversationLog.current.push({
      speaker: 'assistant',
      message: response.content,
      timestamp: new Date()
    });

    // Speak response
    try {
      const emotionalTone = determineEmotionalTone(userInput, response.content);
      await conversationalService.speak(response.content, selectedCharacter, emotionalTone);

      // Update session progress
      updateSessionProgress(userInput, response.content);

      // Continue conversation
      setTimeout(() => {
        if (sessionProgress.stage !== 'complete') {
          startListening();
        }
      }, 1000);

    } catch (error) {
      console.error('Response speaking failed:', error);
    }
  };

  const generateCoachingResponse = async (userInput: string) => {
    const sessionContext = {
      userName: user.name,
      sessionType,
      currentStage: sessionProgress.stage,
      sessionDuration: sessionStartTime.current ? Date.now() - sessionStartTime.current.getTime() : 0,
      conversationHistory: conversationLog.current.slice(-6), // Last 3 exchanges
      userGoals: user.healthProfile.goals.map(g => g.title),
      insights: sessionProgress.insights
    };

    // Create coaching-specific prompt
    const coachingPrompt = createCoachingPrompt(userInput, sessionContext);

    return await aiService.generateResponse(coachingPrompt, {
      userName: user.name,
      emotionalState: 'coached',
      responseStyle: 'coaching'
    });
  };

  const createCoachingPrompt = (userInput: string, context: any): string => {
    const stageInstructions = {
      introduction: "Acknowledge their response warmly and transition to exploring their current state.",
      exploration: "Ask thoughtful follow-up questions to understand their situation better.",
      action_planning: "Help them identify specific, actionable steps they can take.",
      wrap_up: "Summarize key insights and confirm their commitment to next steps."
    };

    return `As a health coaching AI, respond to: "${userInput}"

Context:
- Session type: ${context.sessionType}
- Current stage: ${context.currentStage}
- User: ${context.userName}
- Duration: ${Math.round(context.sessionDuration / 1000)}s

Instructions:
${stageInstructions[context.currentStage as keyof typeof stageInstructions] || 'Continue the coaching conversation naturally.'}

Keep response:
- Conversational and supportive
- 1-2 sentences max for voice delivery
- Ask one engaging question to continue
- Use Mayo Clinic lifestyle medicine principles when relevant

Response:`;
  };

  const determineEmotionalTone = (userInput: string, aiResponse: string): 'supportive' | 'encouraging' | 'gentle' | 'understanding' | 'energetic' | 'calm' => {
    const userLower = userInput.toLowerCase();

    // Detect emotional cues
    if (userLower.includes('stress') || userLower.includes('anxious') || userLower.includes('overwhelm')) {
      return 'calm';
    }
    if (userLower.includes('sad') || userLower.includes('difficult') || userLower.includes('struggle')) {
      return 'understanding';
    }
    if (userLower.includes('excited') || userLower.includes('great') || userLower.includes('amazing')) {
      return 'energetic';
    }
    if (userLower.includes('tired') || userLower.includes('exhausted')) {
      return 'gentle';
    }

    return 'supportive'; // Default
  };

  const updateSessionProgress = (userInput: string, aiResponse: string) => {
    // Extract insights and action items from the conversation
    const newInsight = extractInsight(userInput);
    const newActionItem = extractActionItem(aiResponse);

    setSessionProgress(prev => {
      const updated = { ...prev };

      if (newInsight) {
        updated.insights.push(newInsight);
      }

      if (newActionItem) {
        updated.actionItems.push(newActionItem);
      }

      // Update stage based on conversation content and time
      const sessionDuration = sessionStartTime.current ? Date.now() - sessionStartTime.current.getTime() : 0;
      const progressRatio = sessionDuration / (currentConfig.estimatedDuration * 60 * 1000);

      updated.totalProgress = Math.min(progressRatio * 100, 95); // Cap at 95% until complete

      return updated;
    });
  };

  const extractInsight = (userInput: string): string | null => {
    // Simple insight extraction based on keywords
    const insightKeywords = ['realize', 'understand', 'feel like', 'notice', 'struggle with', 'good at'];
    const userLower = userInput.toLowerCase();

    for (const keyword of insightKeywords) {
      if (userLower.includes(keyword)) {
        return userInput.slice(0, 100) + (userInput.length > 100 ? '...' : '');
      }
    }
    return null;
  };

  const extractActionItem = (aiResponse: string): string | null => {
    // Extract action-oriented suggestions
    const actionKeywords = ['try', 'consider', 'start with', 'focus on', 'practice'];
    const responseLower = aiResponse.toLowerCase();

    for (const keyword of actionKeywords) {
      if (responseLower.includes(keyword)) {
        return aiResponse.slice(0, 100) + (aiResponse.length > 100 ? '...' : '');
      }
    }
    return null;
  };

  const endSession = async () => {
    try {
      const sessionSummary = await generateSessionSummary();

      await conversationalService.speak(
        sessionSummary,
        selectedCharacter,
        'supportive'
      );

      setSessionProgress(prev => ({
        ...prev,
        stage: 'complete',
        totalProgress: 100
      }));

      // Save session data
      saveSessionData();

      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (error) {
      console.error('Session end failed:', error);
      onClose();
    }
  };

  const generateSessionSummary = async (): Promise<string> => {
    const sessionData = {
      insights: sessionProgress.insights,
      actionItems: sessionProgress.actionItems,
      duration: sessionStartTime.current ? Date.now() - sessionStartTime.current.getTime() : 0
    };

    const summaryPrompt = `Create a brief session summary for ${user.name} after a ${sessionType} session.

Key insights: ${sessionData.insights.join('; ')}
Action items: ${sessionData.actionItems.join('; ')}

Create a 2-sentence summary that:
1. Acknowledges their participation
2. Reminds them of key takeaway or next step

Keep it encouraging and specific.`;

    const response = await aiService.generateResponse(summaryPrompt, {
      userName: user.name,
      responseStyle: 'summary'
    });

    return response.content;
  };

  const saveSessionData = () => {
    const sessionData = {
      type: sessionType,
      startTime: sessionStartTime.current,
      endTime: new Date(),
      insights: sessionProgress.insights,
      actionItems: sessionProgress.actionItems,
      conversationLog: conversationLog.current,
      voiceMetrics: conversationState?.voiceSession
    };

    // Save to localStorage for now (could be sent to backend)
    const existingSessions = JSON.parse(localStorage.getItem('voiceCoachingSessions') || '[]');
    existingSessions.push(sessionData);
    localStorage.setItem('voiceCoachingSessions', JSON.stringify(existingSessions));

    console.log('📊 Voice coaching session saved:', sessionData);
  };

  const cleanupSession = async () => {
    if (conversationalService.isConversationActive()) {
      await conversationalService.stopConversation();
    }
  };

  if (!isOpen) return null;

  const progressPercentage = Math.round(sessionProgress.totalProgress);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-2xl border border-white/20 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200/60 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">{currentConfig.icon}</div>
              <div>
                <h2 className="text-xl font-semibold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                  {currentConfig.title}
                </h2>
                <p className="text-sm text-slate-600">
                  ~{currentConfig.estimatedDuration} minutes • {selectedCharacter.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600"
            >
              ✕
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Session Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            {currentPhase && (
              <p className="text-xs text-slate-500">Current phase: {currentPhase}</p>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 space-y-6">
          {/* Voice Activity Visualization */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200/50">
            <div className="flex items-center justify-center space-x-6">
              {/* User Status */}
              <div className="flex flex-col items-center space-y-2">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-300 ${
                  voiceActivity.isUserSpeaking
                    ? 'bg-green-100 text-green-600 animate-pulse border-2 border-green-300'
                    : isListening
                      ? 'bg-blue-100 text-blue-600 border-2 border-blue-300'
                      : 'bg-slate-100 text-slate-500'
                }`}>
                  🎤
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-slate-700">You</p>
                  <p className="text-xs text-slate-500">
                    {voiceActivity.isUserSpeaking ? 'Speaking' : isListening ? 'Listening' : 'Ready'}
                  </p>
                </div>
              </div>

              {/* Voice Flow Indicator */}
              <div className="flex flex-col items-center space-y-1">
                <div className="flex space-x-1">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        (voiceActivity.isUserSpeaking || voiceActivity.isAssistantSpeaking)
                          ? 'bg-cyan-500 animate-pulse'
                          : 'bg-slate-300'
                      }`}
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-400">Voice Flow</p>
              </div>

              {/* Assistant Status */}
              <div className="flex flex-col items-center space-y-2">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-300 ${
                  voiceActivity.isAssistantSpeaking
                    ? 'bg-cyan-100 text-cyan-600 animate-pulse border-2 border-cyan-300'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  🐻
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-slate-700">Bearable AI</p>
                  <p className="text-xs text-slate-500">
                    {voiceActivity.isAssistantSpeaking ? 'Speaking' : 'Listening'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Transcript */}
          {transcript && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                <span className="font-medium">You're saying:</span> {transcript}
              </p>
            </div>
          )}

          {/* Session Insights */}
          {sessionProgress.insights.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-emerald-800 mb-2">✨ Key Insights</h3>
              <ul className="space-y-1">
                {sessionProgress.insights.map((insight, index) => (
                  <li key={index} className="text-sm text-emerald-700">• {insight}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Items */}
          {sessionProgress.actionItems.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-amber-800 mb-2">🎯 Action Items</h3>
              <ul className="space-y-1">
                {sessionProgress.actionItems.map((item, index) => (
                  <li key={index} className="text-sm text-amber-700">• {item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-6 border-t border-slate-200/60 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              {conversationState?.isActive ? (
                <span className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Session Active</span>
                </span>
              ) : (
                <span>Session Inactive</span>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
              >
                End Session
              </button>

              {sessionProgress.insights.length > 0 || sessionProgress.actionItems.length > 0 ? (
                <button
                  onClick={endSession}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all"
                >
                  Complete & Summarize
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};