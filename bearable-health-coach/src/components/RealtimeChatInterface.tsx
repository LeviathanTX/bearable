import React, { useState, useRef, useEffect } from 'react';
import { AICompanion, User, Conversation, Message, CoachTeam } from '../types';
import { createHealthCoachRealtimeService, RealtimeVoiceService } from '../services/realtimeVoiceService';

interface RealtimeChatInterfaceProps {
  user: User;
  companion: AICompanion;
  coachTeam?: CoachTeam;
  conversation: Conversation | null;
  onConversationUpdate: (conversation: Conversation) => void;
  onCoachSelect?: (coach: AICompanion) => void;
  startWithVoice?: boolean;
}

export const RealtimeChatInterface: React.FC<RealtimeChatInterfaceProps> = ({
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
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [isInitialized, setIsInitialized] = useState(false);

  // Realtime service instance - use useRef to make it stable
  const realtimeServiceRef = useRef<RealtimeVoiceService | null>(null);

  // Initialize service only once
  if (!realtimeServiceRef.current) {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY || '';
    realtimeServiceRef.current = createHealthCoachRealtimeService(apiKey);
  }

  const realtimeService = realtimeServiceRef.current;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentTranscriptRef = useRef('');
  const currentResponseRef = useRef('');

  // Initialize Realtime conversation
  useEffect(() => {
    const initializeRealtimeConversation = async () => {
      try {
        console.log('🚀 Initializing Realtime AI conversation...');

        await realtimeService.startConversation(
          // onTranscript
          (text: string, isFinal: boolean) => {
            console.log('📝 Transcript:', text, 'Final:', isFinal);
            if (isFinal) {
              // Add user message to chat when final
              const userMessage: Message = {
                id: `user-${Date.now()}-${Math.random()}`,
                role: 'user',
                content: text,
                type: 'voice',
                timestamp: new Date(),
                metadata: {
                  source: 'realtime',
                  inputType: 'voice'
                }
              };
              setMessages(prev => [...prev, userMessage]);
              setVoiceTranscript('');
              currentTranscriptRef.current = '';
            } else {
              // Show live transcript
              setVoiceTranscript(text);
              currentTranscriptRef.current = text;
            }
          },

          // onResponse (text deltas)
          (responseText: string) => {
            console.log('🤖 AI Response delta:', responseText);
            currentResponseRef.current += responseText;

            // Update or create AI message with accumulated response
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage && lastMessage.role === 'assistant' &&
                  lastMessage.metadata?.source === 'realtime' &&
                  !lastMessage.metadata?.completed) {
                // Update existing message
                return prev.map((msg, index) =>
                  index === prev.length - 1
                    ? { ...msg, content: currentResponseRef.current }
                    : msg
                );
              } else {
                // Create new AI message
                const aiMessage: Message = {
                  id: `ai-${Date.now()}-${Math.random()}`,
                  role: 'assistant',
                  content: currentResponseRef.current,
                  type: 'voice',
                  timestamp: new Date(),
                  metadata: {
                    inputType: 'voice',
                    source: 'realtime',
                    completed: false
                  }
                };
                return [...prev, aiMessage];
              }
            });
          },

          // onAudio (streaming audio)
          (audioData: ArrayBuffer) => {
            console.log('🔊 Received audio stream:', audioData.byteLength, 'bytes');
            // Audio is automatically played by the RealtimeVoiceService
          },

          // onError
          (error: string) => {
            console.error('❌ Realtime conversation error:', error);
            alert(`Realtime conversation error: ${error}`);
          },

          // onStatus
          (status: 'connecting' | 'connected' | 'disconnected' | 'error') => {
            console.log('🔗 Connection status:', status);
            setConnectionStatus(status);
            setIsConnected(status === 'connected');

            if (status === 'connected') {
              // Mark AI response as completed when connection resets
              setMessages(prev => prev.map(msg =>
                msg.role === 'assistant' && msg.metadata?.source === 'realtime'
                  ? { ...msg, metadata: { ...msg.metadata, completed: true } }
                  : msg
              ));
              currentResponseRef.current = '';
            }
          }
        );

        // Update conversation state with listening capability
        setIsListening(realtimeService.isRecording());
        setIsSpeaking(realtimeService.isSpeaking());

      } catch (error) {
        console.error('❌ Failed to initialize Realtime conversation:', error);
        alert(`Failed to start Realtime conversation: ${error}`);
      }
    };

    // Add welcome message and initialize only once
    if (!isInitialized) {
      const welcomeMessage: Message = {
        id: 'welcome-realtime-1',
        role: 'assistant',
        content: `Hello ${user.name}! I'm your Bearable AI health companion with real-time conversational AI. Just start speaking naturally - I can hear you and respond with natural voice interaction!\\n\\nWhat would you like to talk about for your health journey today?`,
        type: 'text',
        timestamp: new Date(),
        metadata: { inputType: 'text', source: 'system' }
      };
      setMessages([welcomeMessage]);
      setIsInitialized(true);

      // Auto-connect after welcome message
      setTimeout(() => {
        initializeRealtimeConversation();
      }, 1000);
    }
  }, [user.name, isInitialized]); // Added isInitialized to prevent re-initialization

  // Handle text input (hybrid mode)
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random()}`,
      role: 'user',
      content: inputMessage,
      type: 'text',
      timestamp: new Date(),
      metadata: { inputType: 'text', source: 'keyboard' }
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // Send text to Realtime API
    try {
      await realtimeService.sendTextMessage(inputMessage);
    } catch (error) {
      console.error('Failed to send text message:', error);
      // Fallback message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I\'m sorry, I\'m having trouble connecting right now. Please try speaking or check your connection.',
        type: 'text',
        timestamp: new Date(),
        metadata: { inputType: 'text' }
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Interrupt AI response (natural conversation)
  const handleInterrupt = async () => {
    try {
      await realtimeService.interrupt();
      console.log('🛑 AI response interrupted');

      // Mark last AI message as completed
      setMessages(prev => prev.map(msg =>
        msg.role === 'assistant' && msg.metadata?.source === 'realtime'
          ? { ...msg, metadata: { ...msg.metadata, completed: true } }
          : msg
      ));
      currentResponseRef.current = '';

    } catch (error) {
      console.error('Failed to interrupt:', error);
    }
  };

  // Toggle connection
  const handleToggleConnection = async () => {
    try {
      if (isConnected) {
        await realtimeService.disconnect();
      } else {
        // Call startConversation instead of just connect to properly set up callbacks
        await realtimeService.startConversation(
          // Use the same callbacks as the auto-initialization
          (text: string, isFinal: boolean) => {
            console.log('📝 Transcript:', text, 'Final:', isFinal);
            if (isFinal) {
              const userMessage: Message = {
                id: `user-${Date.now()}-${Math.random()}`,
                role: 'user',
                content: text,
                type: 'voice',
                timestamp: new Date(),
                metadata: {
                  source: 'realtime',
                  inputType: 'voice'
                }
              };
              setMessages(prev => [...prev, userMessage]);
              setVoiceTranscript('');
              currentTranscriptRef.current = '';
            } else {
              setVoiceTranscript(text);
              currentTranscriptRef.current = text;
            }
          },
          (responseText: string) => {
            console.log('🤖 AI Response delta:', responseText);
            currentResponseRef.current += responseText;
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage && lastMessage.role === 'assistant' &&
                  lastMessage.metadata?.source === 'realtime' &&
                  !lastMessage.metadata?.completed) {
                return prev.map((msg, index) =>
                  index === prev.length - 1
                    ? { ...msg, content: currentResponseRef.current }
                    : msg
                );
              } else {
                const aiMessage: Message = {
                  id: `ai-${Date.now()}-${Math.random()}`,
                  role: 'assistant',
                  content: currentResponseRef.current,
                  type: 'voice',
                  timestamp: new Date(),
                  metadata: {
                    inputType: 'voice',
                    source: 'realtime',
                    completed: false
                  }
                };
                return [...prev, aiMessage];
              }
            });
          },
          (audioData: ArrayBuffer) => {
            console.log('🔊 Received audio stream:', audioData.byteLength, 'bytes');
          },
          (error: string) => {
            console.error('❌ Realtime conversation error:', error);
            setConnectionStatus('error');
            // Add user-friendly error message for payment issues
            let userFriendlyError = error;
            if (error.toLowerCase().includes('quota') || error.toLowerCase().includes('billing') ||
                error.toLowerCase().includes('insufficient') || error.toLowerCase().includes('payment')) {
              userFriendlyError = '💳 OpenAI account needs payment or has exceeded quota. Please check your OpenAI billing at https://platform.openai.com/account/billing';
            }
            const errorMessage: Message = {
              id: `error-${Date.now()}`,
              role: 'assistant',
              content: `I'm experiencing technical difficulties: ${userFriendlyError}. You can still use text mode by typing below.`,
              type: 'text',
              timestamp: new Date(),
              metadata: { inputType: 'text', source: 'error' }
            };
            setMessages(prev => [...prev, errorMessage]);
          },
          (status: 'connecting' | 'connected' | 'disconnected' | 'error') => {
            console.log('🔗 Connection status:', status);
            setConnectionStatus(status);
            setIsConnected(status === 'connected');
            if (status === 'connected') {
              setMessages(prev => prev.map(msg =>
                msg.role === 'assistant' && msg.metadata?.source === 'realtime'
                  ? { ...msg, metadata: { ...msg.metadata, completed: true } }
                  : msg
              ));
              currentResponseRef.current = '';
            }
          }
        );
      }
    } catch (error) {
      console.error('Connection toggle failed:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update listening/speaking status
  useEffect(() => {
    const checkStatus = () => {
      setIsListening(realtimeService.isRecording());
      setIsSpeaking(realtimeService.isSpeaking());
    };

    const interval = setInterval(checkStatus, 100);
    return () => clearInterval(interval);
  }, [realtimeService]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'connecting': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'error': return '🔴';
      default: return '⚫';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header with Realtime Status */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">🐻</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Realtime Bearable AI
              </h1>
              <div className={`text-sm px-2 py-1 rounded-full ${getStatusColor(connectionStatus)}`}>
                {getStatusIcon(connectionStatus)} {connectionStatus.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isConnected && (
              <button
                onClick={handleInterrupt}
                disabled={!isSpeaking}
                className={`px-3 py-2 rounded-lg font-medium transition-all ${
                  isSpeaking
                    ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                title="Interrupt AI response"
              >
                ⏹️ Stop
              </button>
            )}

            <button
              onClick={handleToggleConnection}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isConnected
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isConnected ? '🔌 Disconnect' : '🔗 Connect'}
            </button>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center space-x-4 mt-3">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            isListening ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span>{isListening ? 'Listening...' : 'Not listening'}</span>
          </div>

          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            isSpeaking ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span>{isSpeaking ? 'AI Speaking...' : 'AI Silent'}</span>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800 border border-gray-200'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              {message.metadata && (
                <div className="mt-1 text-xs opacity-75 flex items-center space-x-2">
                  <span>
                    {message.metadata.inputType === 'voice' ? '🎤' : '⌨️'}
                  </span>
                  <span>
                    {message.metadata.source}
                  </span>
                  {message.metadata.source === 'realtime' && !message.metadata.completed && (
                    <span className="animate-pulse">●●●</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Live Transcript */}
        {voiceTranscript && (
          <div className="flex justify-end">
            <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-blue-100 text-blue-800 border border-blue-200">
              <p className="text-sm italic">"{voiceTranscript}"</p>
              <div className="mt-1 text-xs opacity-75">
                🎤 Live transcript...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Text Input (Hybrid Mode) */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={isConnected ? "Type a message or just speak naturally..." : "Connect to start conversation..."}
            disabled={!isConnected}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || !isConnected}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>

        <div className="mt-2 text-xs text-gray-500 text-center">
          {isConnected
            ? "💡 This is real-time conversational AI - just speak naturally! You can also type messages."
            : "🔗 Connect to start your conversational AI health coaching session"
          }
        </div>
      </div>
    </div>
  );
};