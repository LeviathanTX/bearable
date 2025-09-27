import React, { useState, useRef, useEffect } from 'react';
import { AICompanion, User, Conversation, Message, CoachTeam } from '../types';
import { AIService } from '../services/aiService';
import { VoiceService } from '../services/voiceService';
import { VoiceSettingsComponent, VoiceSettings } from './VoiceSettings';

interface ChatInterfaceProps {
  user: User;
  companion: AICompanion;
  coachTeam?: CoachTeam;
  conversation: Conversation | null;
  onConversationUpdate: (conversation: Conversation) => void;
  onCoachSelect?: (coach: AICompanion) => void;
  startWithVoice?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  user,
  companion,
  coachTeam,
  conversation,
  onConversationUpdate,
  onCoachSelect,
  startWithVoice = false
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [micEnabled, setMicEnabled] = useState(true);
  const [isVoiceInput, setIsVoiceInput] = useState(false);
  const [hasAutoStartedVoice, setHasAutoStartedVoice] = useState(false);
  const [aiService] = useState(() => new AIService());
  const [voiceService] = useState(() => new VoiceService());
  // const [premiumVoiceService] = useState(() => new PremiumVoiceService());
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  // const [selectedVoiceCharacter, setSelectedVoiceCharacter] = useState(PremiumVoiceService.WELLNESS_BEAR);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice interaction handlers
  const handleVoiceInput = async () => {
    try {
      // If currently listening, stop listening
      if (isListening) {
        voiceService.stopListening();
        setIsListening(false);
        setVoiceTranscript('');
        return;
      }

      // Don't start listening if AI is speaking
      if (isSpeaking) {
        console.log('Cannot start voice input: AI is speaking');
        return;
      }

      // Check if mic is disabled before trying to start
      if (!micEnabled) {
        console.log('Microphone is disabled');
        return;
      }

      setIsListening(true);
      setVoiceTranscript('');

      await voiceService.startHealthConversation(
        (transcript, isFinal) => {
          console.log('Voice transcript:', transcript, 'Final:', isFinal);
          setVoiceTranscript(transcript);

          if (isFinal && transcript.trim()) {
            // Set the message and stop listening
            const finalMessage = transcript.trim();
            setIsListening(false);
            setVoiceTranscript('');
            // Set the input message and mark as voice input for auto-submit
            setIsVoiceInput(true);
            setInputMessage(finalMessage);
          }
        },
        (error) => {
          console.error('Voice input error:', error);
          setIsListening(false);
          setVoiceTranscript('');
          setIsVoiceInput(false); // Reset voice flag on error
          // Show user-friendly error
          alert('Voice recognition error. Please try again or type your message.');
        }
      );
    } catch (error) {
      console.error('Voice service error:', error);
      setIsListening(false);
      setVoiceTranscript('');
      setIsVoiceInput(false); // Reset voice flag on error
      alert('Failed to start voice recognition. Please check your microphone permissions.');
    }
  };

  const handleSpeakResponse = async (message: string) => {
    try {
      if (isSpeaking) {
        // Stop current voice (works for both services)
        voiceService.stopSpeaking();
        // premiumVoiceService.stopCurrentAudio();
        setIsSpeaking(false);
        return;
      }

      // Stop any ongoing voice input when AI starts speaking
      if (isListening) {
        voiceService.stopListening();
        setIsListening(false);
        setVoiceTranscript('');
      }

      setIsSpeaking(true);

      try {
        // TEMPORARY: Skip premium voice due to quota issues, use browser voice directly
        console.log('🔊 Using browser voice (OpenAI quota exceeded)');
        await voiceService.speakHealthTip(message);
        console.log('✅ Browser voice playback completed');
      } catch (voiceError) {
        console.error('Browser voice also failed:', voiceError);
        // If browser voice fails too, there's a deeper issue
        throw voiceError;
      }

      setIsSpeaking(false);
    } catch (error) {
      console.error('Speech synthesis error:', error);
      setIsSpeaking(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize with welcome message
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome-1',
        role: 'assistant',
        content: `Hello ${user.name}! I'm Bearable, your AI health coach powered by Mayo Clinic's lifestyle medicine expertise. I'm here to support you on your wellness journey.\\n\\nHow are you feeling today, and what would you like to work on?`,
        type: 'text',
        timestamp: new Date(),
        metadata: {
          sources: ['Bearable AI'],
          emotionalTone: 'supportive'
        }
      };
      setMessages([welcomeMessage]);
    }

    // Debug: Log current voice information
    if (voiceService.isSpeechSynthesisSupported()) {
      const voiceInfo = voiceService.getCurrentVoiceInfo();
      if (voiceInfo) {
        console.log('Using voice:', voiceInfo);
      }
    }
  }, [user.name, voiceService, messages.length]);

  // Auto-start voice if requested (but only once)
  useEffect(() => {
    if (startWithVoice && messages.length > 0 && !isListening && !isSpeaking && micEnabled && !hasAutoStartedVoice) {
      // Small delay to let the UI render
      setTimeout(() => {
        handleVoiceInput();
        setHasAutoStartedVoice(true); // Mark as auto-started to prevent repeated attempts
      }, 1000);
    }
  }, [startWithVoice, messages.length, isListening, isSpeaking, micEnabled, hasAutoStartedVoice]);

  // Debug: Track microphone state changes
  useEffect(() => {
    console.log('Microphone state changed to:', micEnabled ? 'enabled' : 'disabled');
  }, [micEnabled]);

  // Auto-submit voice messages only
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (isVoiceInput && inputMessage.trim() && !isListening && !isTyping) {
      // Small delay to ensure voice transcription is complete
      timeoutId = setTimeout(() => {
        // Create a synthetic form event to trigger submission
        const syntheticEvent = new Event('submit', { bubbles: true, cancelable: true });
        handleSendMessage(syntheticEvent);
        setIsVoiceInput(false); // Reset flag after submission
      }, 500);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isVoiceInput, inputMessage, isListening, isTyping]);

  const handleSendMessage = async (e: React.FormEvent | Event) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const currentInput = inputMessage.trim();
    const wasVoiceInput = isVoiceInput; // Capture current voice state
    setInputMessage('');
    setIsVoiceInput(false); // Reset voice flag

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: currentInput,
      type: 'text',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Generate AI response with user context
      const context = {
        userName: user.name,
        healthGoals: user.healthProfile.goals.map(g => g.title),
        emotionalState: 'engaged'
      };

      const aiResponse = await aiService.generateResponse(currentInput, context);

      const message: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: aiResponse.content,
        type: 'text',
        timestamp: new Date(),
        metadata: {
          sources: aiResponse.sources,
          confidence: aiResponse.confidence,
          emotionalTone: 'supportive'
        }
      };

      setMessages(prev => [...prev, message]);

      // Auto-speak the response only if it was a voice input
      if (process.env.REACT_APP_VOICE_ENABLED === 'true' && wasVoiceInput) {
        // Small delay to let user see the response
        setTimeout(() => {
          handleSpeakResponse(aiResponse.content);
        }, 800);
      }

    } catch (error) {
      console.error('AI response error:', error);

      // Fallback error message
      const errorMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: "I'm sorry, I encountered an issue generating a response. Let me help you in a different way. What specific health topic would you like to discuss?",
        type: 'text',
        timestamp: new Date(),
        metadata: {
          sources: ['Bearable AI - Error Handler'],
          confidence: 0.8,
          emotionalTone: 'apologetic'
        }
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickResponses = [
    "Tell me about the 6 pillars of lifestyle medicine",
    "How can I start eating healthier?",
    "I need help managing stress",
    "What's a good bedtime routine?",
    "Show me my progress this week"
  ];

  return (
    <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 h-[600px] flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200/60">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-2xl shadow-lg">
            🐻
          </div>
          <div>
            <h2 className="text-lg font-semibold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">{companion.name}</h2>
            <p className="text-sm text-slate-500">Mayo Clinic Lifestyle Medicine AI</p>
          </div>

          {/* Coach Team Selector */}
          {coachTeam && (
            <div className="ml-6">
              <label className="block text-xs text-slate-500 mb-1">Active Coach Team</label>
              <select
                value={companion.id}
                onChange={(e) => {
                  const allCoaches = [coachTeam.primaryCoach, ...Object.values(coachTeam.specialists)];
                  const selectedCoach = allCoaches.find((coach: any) => coach.id === e.target.value);
                  if (selectedCoach && onCoachSelect) {
                    onCoachSelect(selectedCoach);
                  }
                }}
                className="text-sm bg-white/90 border border-slate-200 rounded-lg px-3 py-1 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option key={coachTeam.primaryCoach.id} value={coachTeam.primaryCoach.id}>
                  {coachTeam.primaryCoach.avatar} {coachTeam.primaryCoach.name} (Primary)
                </option>
                {Object.values(coachTeam.specialists).map((coach: any) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.avatar} {coach.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowVoiceSelector(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm transition-colors border border-slate-200"
            title="Choose Voice Character"
          >
            <span>🎭</span>
            <span>Voice Settings</span>
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full animate-pulse-slow shadow-sm"></div>
            <span className="text-sm text-emerald-600 font-medium">Active</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
              {message.role === 'assistant' && (
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-sm">
                    🐻
                  </div>
                  <span className="text-xs text-gray-500">{companion.name}</span>
                </div>
              )}

              <div
                className={`px-4 py-3 rounded-2xl shadow-sm ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                    : 'bg-gradient-to-br from-slate-50 to-blue-50 text-slate-800 border border-slate-200/50'
                }`}
              >
                <p className="text-sm whitespace-pre-line">{message.content}</p>

                {message.role === 'assistant' && (
                  <div className="mt-2 flex items-center justify-between">
                    <button
                      onClick={() => {
                        if (isSpeaking) {
                          voiceService.stopSpeaking();
                          // premiumVoiceService.stopCurrentAudio();
                          setIsSpeaking(false);
                        } else {
                          handleSpeakResponse(message.content);
                        }
                      }}
                      className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-all ${
                        isSpeaking
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100 border border-cyan-200/50'
                      }`}
                      title={isSpeaking ? 'Stop speaking' : 'Read this message aloud'}
                    >
                      <span>{isSpeaking ? '🔇' : '🔊'}</span>
                      <span className="font-medium">
                        {isSpeaking ? 'Stop' : 'Listen'}
                      </span>
                    </button>
                  </div>
                )}

                {message.metadata?.sources && message.role === 'assistant' && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Source: {message.metadata.sources[0]}
                    </p>
                  </div>
                )}
              </div>

              <div className={`text-xs text-gray-400 mt-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-sm">
                  🐻
                </div>
                <span className="text-xs text-gray-500">{companion.name} is typing...</span>
              </div>
              <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Speaking Indicator */}
        {isSpeaking && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-sm">
                  🐻
                </div>
                <span className="text-xs text-amber-600 font-medium">{companion.name} is speaking...</span>
                <button
                  onClick={() => {
                    voiceService.stopSpeaking();
                    // premiumVoiceService.stopCurrentAudio();
                    setIsSpeaking(false);
                  }}
                  className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-full text-xs transition-colors"
                  title="Stop speaking"
                >
                  🔇 Stop
                </button>
              </div>
              <div className="bg-amber-100 px-4 py-3 rounded-2xl border border-amber-200">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-amber-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="text-xs text-amber-700">Reading response aloud...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Responses */}
      {messages.length <= 1 && (
        <div className="px-6 py-2 border-t border-gray-100">
          <p className="text-sm text-gray-500 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {quickResponses.map((response, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(response)}
                className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
              >
                {response}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-6 border-t border-gray-200">
        {/* AI Speaking Controls */}
        {isSpeaking && (
          <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-amber-700 font-medium">
                Bearable AI is speaking...
              </p>
            </div>
            <button
              onClick={() => {
                voiceService.stopSpeaking();
                // premiumVoiceService.stopCurrentAudio();
                setIsSpeaking(false);
              }}
              className="flex items-center space-x-1 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-full transition-colors"
              title="Stop speaking"
            >
              <span className="text-sm">🔇</span>
              <span className="text-xs font-medium">Stop</span>
            </button>
          </div>
        )}

        {/* Voice listening indicator */}
        {isListening && (
          <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-green-700">
                <span className="font-medium">🎤 Listening...</span>
                {voiceTranscript ? (
                  <span className="ml-2">"{voiceTranscript}"</span>
                ) : (
                  <span className="ml-2 text-green-600">Start speaking now</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Voice transcript display for when not actively listening but have transcript */}
        {voiceTranscript && !isListening && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Processing:</span> {voiceTranscript}
            </p>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <div className="relative flex items-center space-x-2">
            <button
              type="button"
              onClick={handleVoiceInput}
              onContextMenu={(e) => {
                e.preventDefault();
                console.log('Microphone toggle:', micEnabled ? 'disabled' : 'enabled');
                setMicEnabled(!micEnabled);
              }}
              disabled={isTyping}
              className={`p-3 rounded-full transition-all duration-200 ${
                !micEnabled
                  ? 'bg-gray-200 text-gray-400'
                  : isListening
                  ? 'bg-red-100 text-red-600 animate-pulse ring-2 ring-red-300'
                  : isSpeaking
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
              title={
                !micEnabled
                  ? 'Microphone disabled - Right-click to enable'
                  : isSpeaking
                  ? 'AI is speaking...'
                  : isListening
                  ? 'Listening - Click to stop'
                  : 'Click to start voice input. Right-click to disable mic.'
              }
            >
              {!micEnabled ? '🎤❌' : isSpeaking ? '🔊' : isListening ? '🎙️' : '🎤'}
            </button>
            {!micEnabled && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            )}

            {/* Quick Voice Quality Toggle */}
            <button
              type="button"
              onClick={() => {
                // Toggle between basic and high-quality voice
                const currentVoice = voiceService.getDefaultVoice();
                console.log('Current voice:', currentVoice?.name);
                // Force refresh voice selection
                // voiceService.loadVoices(); // Private method - removed
                const newVoice = voiceService.getDefaultVoice();
                console.log('New voice:', newVoice?.name);
              }}
              className="p-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors"
              title="Refresh voice selection for better quality"
            >
              🎵
            </button>
          </div>

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => {
              setInputMessage(e.target.value);
              setIsVoiceInput(false); // Reset voice flag when user types manually
            }}
            placeholder={isListening ? 'Listening...' : 'Ask about sleep, nutrition, exercise, stress management...'}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isTyping || isListening}
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            title="Send message"
          >
            ↗️
          </button>
        </form>
      </div>

      {/* Voice Settings */}
      {showVoiceSelector && (
        <VoiceSettingsComponent
          isOpen={showVoiceSelector}
          onClose={() => setShowVoiceSelector(false)}
          onSettingsChange={(settings: VoiceSettings) => {
            console.log('Voice settings updated:', settings);
            // Apply voice settings to the voice service
            // TODO: Integrate with voice service to apply settings
          }}
        />
      )}
    </div>
  );
};