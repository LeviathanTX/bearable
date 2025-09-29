import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { useMultiAgentStore } from '../stores/multiAgentStore';
import { defaultConversationModes } from '../stores/multiAgentStore';
import { MultiAgentAIService } from '../services/multiAgentAIService';
import { voiceService } from '../services/elevenLabsVoiceService';
import { speechRecognitionService } from '../services/speechRecognitionService';
import { SpecialistCard } from './SpecialistCard';
import { ElevenLabsVoiceSettings } from './ElevenLabsVoiceSettings';

interface VoiceMultiAgentChatProps {
  user: User;
  onClose?: () => void;
}


export const VoiceMultiAgentChat: React.FC<VoiceMultiAgentChatProps> = ({ user, onClose }) => {
  const {
    availableAgents,
    selectedAgents,
    facilitatorAgent,
    conversationMode,
    activeConversationId,
    isGeneratingResponse,
    isConsensusBuilding,
    selectAgent,
    deselectAgent,
    setFacilitator,
    setConversationMode,
    createConversation,
    addMessage,
    setGeneratingResponse,
    getActiveConversation,
    getSelectedAgentObjects
  } = useMultiAgentStore();

  // Voice-related state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [speechStatus, setSpeechStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  // Reference for cleanup only
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const webSocketRef = useRef<WebSocket | null>(null);

  const activeConversation = getActiveConversation();
  const selectedAgentObjects = getSelectedAgentObjects();

  useEffect(() => {
    // Initialize WebSocket connection to voice server
    const connectWebSocket = () => {
      const wsUrl = process.env.NODE_ENV === 'production'
        ? `wss://${window.location.host}/realtime`
        : 'ws://localhost:3004/realtime';

      webSocketRef.current = new WebSocket(wsUrl);

      webSocketRef.current.onopen = () => {
        console.log('🔗 Connected to conversational voice server');
      };

      webSocketRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'conversation_response') {
            const responseData = message.data;
            console.log(`🗣️ ${responseData.agentName}: "${responseData.text}"`);

            // Add agent response to conversation
            if (activeConversationId) {
              const agent = selectedAgentObjects.find(a => a.id === responseData.agentId);
              addMessage(activeConversationId, {
                type: 'agent',
                role: 'assistant',
                content: responseData.text,
                agentId: responseData.agentId,
                agentName: responseData.agentName,
                agentAvatar: agent?.avatar || '🩺',
                messageType: 'specialist_response',
                expertise: agent?.expertise || [],
                specialization: agent?.specialization || 'primary_care'
              });
            }

            // Reset generating response after receiving response
            setGeneratingResponse(false);
            setSpeechStatus('idle');
          }

          if (message.type === 'conversation_audio') {
            const audioData = message.data;
            console.log(`🔊 Audio received from ${audioData.agentName}`);

            // Play audio directly
            const audioBuffer = Uint8Array.from(atob(audioData.audioData), c => c.charCodeAt(0));
            const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            audio.onended = () => {
              URL.revokeObjectURL(audioUrl);
              setIsSpeaking(false);
              setSpeechStatus('idle');
            };

            setIsSpeaking(true);
            setSpeechStatus('speaking');
            audio.play().catch(console.error);
          }

          if (message.type === 'status') {
            console.log(`📊 Server status: ${message.status}`);
            if (message.status === 'conversation_configured') {
              console.log('✅ Voice conversation configured');
            }
          }

        } catch (error) {
          console.error('❌ WebSocket message error:', error);
        }
      };

      webSocketRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      webSocketRef.current.onclose = () => {
        console.log('🔌 WebSocket disconnected');
      };
    };

    connectWebSocket();

    // Check if voice features are supported
    setVoiceSupported(speechRecognitionService.isRecognitionSupported());

    return () => {
      // Cleanup
      voiceService.stopSpeaking();
      speechRecognitionService.stopListening();
      webSocketRef.current?.close();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  const handleVoiceInput = async (transcript: string) => {
    console.log('🎙️ handleVoiceInput called:', {
      transcript,
      activeConversationId,
      conversationMode: conversationMode?.name,
      selectedAgentsCount: selectedAgents.length
    });

    if (!activeConversationId || !conversationMode) {
      // Auto-start conversation with default settings if voice input is detected
      const defaultMode = defaultConversationModes.find(mode => mode.id === 'general_consultation');
      if (defaultMode && availableAgents.length > 0) {
        setConversationMode(defaultMode);

        // Select a default set of agents
        const defaultAgents = availableAgents.filter(agent =>
          ['dr-maya-wellness', 'nutritionist-sarah', 'therapist-david'].includes(agent.id)
        ).slice(0, 3);

        defaultAgents.forEach(agent => selectAgent(agent.id));

        // Set facilitator
        const defaultFacilitator = availableAgents.find(agent =>
          agent.specialization === 'wellness_coaching'
        );
        if (defaultFacilitator) {
          setFacilitator(defaultFacilitator);
        }

        // Create conversation
        const conversationId = createConversation(defaultMode, user.id);

        // Add welcome message
        if (defaultFacilitator) {
          const welcomeMessage = `Hello ${user.name}! I heard you speaking, so I've started a voice-enabled health consultation for you. I'm ${defaultFacilitator.name}, and we have ${defaultAgents.length} specialists ready to help. What would you like to discuss?`;

          addMessage(conversationId, {
            type: 'agent',
            role: 'assistant',
            content: welcomeMessage,
            agentId: defaultFacilitator.id,
            agentName: defaultFacilitator.name,
            agentAvatar: defaultFacilitator.avatar,
            messageType: 'facilitation'
          });

          // Speak welcome message if voice is enabled
          if (voiceEnabled) {
            voiceService.speakText(welcomeMessage, defaultFacilitator.id);
          }
        }

        // Now process the original voice input
        setSpeechStatus('processing');
        setVoiceTranscript('');

        addMessage(conversationId, {
          type: 'user',
          role: 'user',
          content: transcript,
          messageType: 'user_input',
          inputMethod: 'voice'
        });

        await handleSendMessage(transcript);
      } else {
        // Show error if can't auto-start
        alert('Please set up your consultation by selecting specialists and a consultation type first, then try speaking again.');
        setSpeechStatus('idle');
        setVoiceTranscript('');
      }
      return;
    }

    console.log('💬 Processing voice input for existing conversation');
    setSpeechStatus('processing');
    setVoiceTranscript('');

    // Add user message
    console.log('📝 Adding voice message to active conversation:', activeConversationId);
    addMessage(activeConversationId, {
      type: 'user',
      role: 'user',
      content: transcript,
      messageType: 'user_input',
      inputMethod: 'voice'
    });

    console.log('📤 Sending voice message through handleSendMessage');
    await handleSendMessage(transcript);
  };

  const handleSendMessage = async (messageText?: string) => {
    const userMessage = messageText || currentInput.trim();
    console.log('📤 handleSendMessage called:', {
      messageText,
      userMessage,
      activeConversationId,
      conversationMode: conversationMode?.name,
      selectedAgentsCount: selectedAgents.length
    });

    if (!userMessage || !activeConversationId || !conversationMode) {
      console.log('❌ handleSendMessage early return:', {
        hasUserMessage: !!userMessage,
        hasActiveConversation: !!activeConversationId,
        hasConversationMode: !!conversationMode
      });
      return;
    }

    if (!messageText) {
      // Add user message if it wasn't already added (text input)
      addMessage(activeConversationId, {
        type: 'user',
        role: 'user',
        content: userMessage,
        messageType: 'user_input',
        inputMethod: 'text'
      });
      setCurrentInput('');
    }

    setGeneratingResponse(true);
    setSpeechStatus('processing');

    // Send message to WebSocket server for conversational voice processing
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      const inputMessage = {
        type: 'conversation.input',
        text: userMessage
      };
      webSocketRef.current.send(JSON.stringify(inputMessage));
      console.log('💬 Sent message to conversational voice server:', userMessage);
    } else {
      console.error('❌ WebSocket not connected - falling back to old method');

      // Fallback to old method if WebSocket is not connected
      try {
        const agentResponses = await MultiAgentAIService.generateMultiAgentResponses(
          selectedAgentObjects,
          userMessage,
          activeConversation?.messages || [],
          conversationMode
        );

        for (const response of agentResponses) {
          const agent = selectedAgentObjects.find(a => a.id === response.agentId);

          addMessage(activeConversationId, {
            type: 'agent',
            role: 'assistant',
            content: response.content,
            agentId: response.agentId,
            agentName: response.agentName,
            agentAvatar: agent?.avatar || '🩺',
            messageType: 'specialist_response',
            expertise: agent?.expertise || [],
            specialization: agent?.specialization || 'primary_care'
          });
        }
      } catch (error) {
        console.error('Error generating responses:', error);
        addMessage(activeConversationId, {
          type: 'agent',
          role: 'assistant',
          content: 'I apologize, but there was an error generating responses from our specialists. Please try again.',
          messageType: 'error'
        });
      } finally {
        setGeneratingResponse(false);
        setSpeechStatus('idle');
      }
    }
  };

  const toggleVoiceListening = async () => {
    if (!voiceSupported) return;

    if (isListening) {
      speechRecognitionService.stopListening();
      setIsListening(false);
      setSpeechStatus('idle');
    } else {
      try {
        // Stop any current speech
        if (voiceService.isSpeaking()) {
          voiceService.stopSpeaking();
          setIsSpeaking(false);
        }

        const success = speechRecognitionService.startListening(
          (transcript, isInterim) => {
            console.log('🎤 Speech recognition result:', { transcript, isInterim });
            setVoiceTranscript(transcript);
            if (!isInterim && transcript.trim()) {
              console.log('🗣️ Processing final transcript:', transcript.trim());
              handleVoiceInput(transcript.trim());
            }
          },
          () => {
            console.log('🔇 Speech recognition ended');
            setIsListening(false);
            setSpeechStatus('idle');
            setVoiceTranscript('');
          },
          (error) => {
            console.error('❌ Speech recognition error:', error);
            setSpeechStatus('idle');
            setIsListening(false);
            setVoiceTranscript('');
          }
        );

        if (success) {
          setIsListening(true);
          setSpeechStatus('listening');
        }
      } catch (error) {
        console.error('Failed to start voice recognition:', error);
        setSpeechStatus('idle');
      }
    }
  };

  const handleStartConversation = () => {
    console.log('🚀 handleStartConversation called:', {
      conversationMode: conversationMode?.name,
      selectedAgentsCount: selectedAgents.length,
      facilitatorAgent: facilitatorAgent?.name,
      voiceEnabled
    });

    if (!conversationMode || selectedAgents.length === 0) {
      console.log('❌ Missing requirements for starting conversation');
      alert('Please select a conversation mode and at least one health specialist.');
      return;
    }

    const conversationId = createConversation(conversationMode, user.id);
    console.log('✅ Created conversation:', conversationId);

    // Auto-start voice listening if voice is enabled and supported
    if (voiceEnabled && voiceSupported && !isListening) {
      console.log('🎤 Auto-starting voice listening for new conversation');
      setTimeout(() => {
        toggleVoiceListening();
      }, 1000); // Small delay to let the conversation UI render
    }

    // Configure WebSocket conversation with selected agents
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      const configMessage = {
        type: 'conversation.configure',
        agents: selectedAgentObjects.map(agent => agent.id)
      };
      webSocketRef.current.send(JSON.stringify(configMessage));
      console.log('🩺 Configured conversation with agents:', selectedAgentObjects.map(a => a.name).join(', '));
    }

    // Add welcome message from facilitator
    if (facilitatorAgent) {
      const welcomeMessage = `Hello ${user.name}! Welcome to your ${conversationMode.name} session. I'm ${facilitatorAgent.name}, and I'll be facilitating our discussion today. We have ${selectedAgentObjects.length} specialists ready to help you: ${selectedAgentObjects.map(a => a.name).join(', ')}. ${voiceEnabled ? 'You can speak naturally or type your questions.' : 'Please type your questions to get started.'}`;

      addMessage(conversationId, {
        type: 'agent',
        role: 'assistant',
        content: welcomeMessage,
        agentId: facilitatorAgent.id,
        agentName: facilitatorAgent.name,
        agentAvatar: facilitatorAgent.avatar,
        messageType: 'facilitation'
      });

      // Speak welcome message if voice is enabled
      if (voiceEnabled) {
        voiceService.speakText(welcomeMessage, facilitatorAgent.id);
      }
    }
  };

  const toggleVoiceMode = () => {
    setVoiceEnabled(!voiceEnabled);
    if (voiceEnabled) {
      // Turning off voice mode
      speechRecognitionService.stopListening();
      voiceService.stopSpeaking();
      setSpeechStatus('idle');
      setIsListening(false);
      setIsSpeaking(false);
    }
  };

  if (!activeConversationId) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Voice-Enabled Multi-Agent Health Consultation</h2>
          <p className="text-gray-600">Connect with multiple health specialists using voice and text</p>

          {/* Voice Support Status */}
          <div className="mt-4 p-3 rounded-lg bg-gray-50">
            <div className="flex items-center justify-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${voiceSupported ? 'bg-green-400' : 'bg-red-400'}`}></span>
              <span className="text-sm text-gray-600">
                {voiceSupported ? '🎤 Voice input supported' : '❌ Voice input not available'}
              </span>
            </div>
            {voiceSupported && (
              <div className="flex items-center justify-center space-x-4 mt-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={voiceEnabled}
                    onChange={toggleVoiceMode}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-600">Enable voice responses</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Consultation Mode Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Select Consultation Type</h3>
            <div className="text-sm text-gray-500">
              Mayo Clinic 6-Pillar Health Approach
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {defaultConversationModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setConversationMode(mode)}
                className={`p-4 rounded-lg border-2 transition-all group hover:shadow-md ${
                  conversationMode?.id === mode.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl">{mode.icon}</div>
                  {conversationMode?.id === mode.id && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
                <div className="font-medium text-gray-900 mb-1">{mode.name}</div>
                <div className="text-sm text-gray-600 mb-2">{mode.description}</div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {mode.maxParticipants ? `Up to ${mode.maxParticipants} specialists` : 'Unlimited'}
                  </span>
                  {mode.facilitationStyle === 'facilitated' && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Facilitated</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Specialist Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Build Your Healthcare Team</h3>
            <div className="flex items-center space-x-2">
              {selectedAgents.length > 0 && (
                <div className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                  <span className="mr-1">👥</span>
                  {selectedAgents.length} selected
                </div>
              )}
              {voiceEnabled && (
                <div className="flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                  <span className="mr-1">🎵</span>
                  ElevenLabs Voices
                </div>
              )}
            </div>
          </div>

          {/* Mayo Clinic 6-Pillar Organization */}
          <div className="space-y-6">
            {/* Core Health Coordinators */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <span className="mr-2">🏥</span>
                Primary Care Team
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableAgents
                  .filter(agent => agent.isActive && ['primary_care', 'wellness_coaching'].includes(agent.specialization))
                  .map((agent) => (
                    <SpecialistCard
                      key={agent.id}
                      agent={agent}
                      isSelected={selectedAgents.includes(agent.id)}
                      onToggle={() => {
                        if (selectedAgents.includes(agent.id)) {
                          deselectAgent(agent.id);
                        } else {
                          const maxParticipants = conversationMode?.maxParticipants || 5;
                          if (selectedAgents.length < maxParticipants) {
                            selectAgent(agent.id);
                          }
                        }
                      }}
                      disabled={!selectedAgents.includes(agent.id) && selectedAgents.length >= (conversationMode?.maxParticipants || 5)}
                      voiceEnabled={voiceEnabled}
                    />
                  ))}
              </div>
            </div>

            {/* Lifestyle Medicine Specialists */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <span className="mr-2">🌟</span>
                Mayo Clinic Lifestyle Medicine Specialists
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableAgents
                  .filter(agent => agent.isActive && ['nutrition', 'movement', 'sleep', 'stress', 'social_wellness'].includes(agent.specialization))
                  .map((agent) => (
                    <SpecialistCard
                      key={agent.id}
                      agent={agent}
                      isSelected={selectedAgents.includes(agent.id)}
                      onToggle={() => {
                        if (selectedAgents.includes(agent.id)) {
                          deselectAgent(agent.id);
                        } else {
                          const maxParticipants = conversationMode?.maxParticipants || 5;
                          if (selectedAgents.length < maxParticipants) {
                            selectAgent(agent.id);
                          }
                        }
                      }}
                      disabled={!selectedAgents.includes(agent.id) && selectedAgents.length >= (conversationMode?.maxParticipants || 5)}
                      voiceEnabled={voiceEnabled}
                    />
                  ))}
              </div>
            </div>

            {/* Condition-Specific Specialists */}
            {availableAgents.filter(agent => agent.isActive && ['chronic_care', 'mental_health', 'specialized'].includes(agent.specialization)).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="mr-2">🔬</span>
                  Condition-Specific Specialists
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableAgents
                    .filter(agent => agent.isActive && ['chronic_care', 'mental_health', 'specialized'].includes(agent.specialization))
                    .map((agent) => (
                      <SpecialistCard
                        key={agent.id}
                        agent={agent}
                        isSelected={selectedAgents.includes(agent.id)}
                        onToggle={() => {
                          if (selectedAgents.includes(agent.id)) {
                            deselectAgent(agent.id);
                          } else {
                            const maxParticipants = conversationMode?.maxParticipants || 5;
                            if (selectedAgents.length < maxParticipants) {
                              selectAgent(agent.id);
                            }
                          }
                        }}
                        disabled={!selectedAgents.includes(agent.id) && selectedAgents.length >= (conversationMode?.maxParticipants || 5)}
                        voiceEnabled={voiceEnabled}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Facilitator Selection */}
        {conversationMode?.facilitationStyle === 'facilitated' && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Team Facilitator</h3>
              <div className="text-sm text-gray-500 bg-indigo-50 px-3 py-1 rounded-lg">
                Mayo Clinic Care Coordination
              </div>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-indigo-700">
                🎯 A facilitator will coordinate your specialist team, synthesize recommendations, and ensure all voices are heard during your consultation.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableAgents.filter(agent => agent.specialization === 'wellness_coaching').map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setFacilitator(agent)}
                  className={`p-4 rounded-lg border-2 transition-all text-left group hover:shadow-md ${
                    facilitatorAgent?.id === agent.id
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">{agent.avatar}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{agent.name}</div>
                      <div className="text-sm text-gray-600">{agent.title}</div>
                    </div>
                    {facilitatorAgent?.id === agent.id && (
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Care Coordinator</span>
                    {voiceEnabled && (
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                        🎵 Facilitation Voice
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Start Conversation Button */}
        <div className="text-center">
          <button
            onClick={handleStartConversation}
            disabled={!conversationMode || selectedAgents.length === 0}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Start {voiceEnabled ? 'Voice-Enabled' : ''} Health Consultation
          </button>
        </div>
      </div>
    );
  }

  // Chat Interface
  return (
    <div className="max-w-6xl mx-auto h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">{conversationMode?.name} Session</h2>
            <p className="text-blue-100">
              {selectedAgentObjects.map(agent => agent.name).join(', ')}
              {facilitatorAgent && ` • Facilitated by ${facilitatorAgent.name}`}
              {voiceEnabled && ' • 🎤 Voice Enabled'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Voice Controls */}
            {voiceSupported && voiceEnabled && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleVoiceListening}
                  disabled={isGeneratingResponse || isSpeaking}
                  className={`p-3 rounded-full transition-all ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                      : 'bg-green-500 hover:bg-green-600'
                  } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                >
                  {isListening ? '🔴' : '🎤'}
                </button>
                <div className="text-xs">
                  {speechStatus === 'listening' && 'Listening...'}
                  {speechStatus === 'processing' && 'Processing...'}
                  {speechStatus === 'speaking' && 'Speaking...'}
                  {speechStatus === 'idle' && 'Ready'}
                </div>
              </div>
            )}

            {/* Voice Transcript */}
            {voiceTranscript && (
              <div className="bg-black/20 px-3 py-1 rounded text-sm max-w-xs truncate">
                "{voiceTranscript}"
              </div>
            )}

            {/* Voice Settings Button */}
            {voiceEnabled && (
              <button
                onClick={() => setShowVoiceSettings(true)}
                className="text-white hover:bg-white/20 p-2 rounded transition-colors"
                title="Voice Settings"
              >
                🎛️
              </button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 p-2 rounded"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeConversation?.messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-3xl rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.messageType === 'consensus'
                  ? 'bg-purple-50 border border-purple-200'
                  : message.messageType === 'facilitation'
                  ? 'bg-indigo-50 border border-indigo-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center mb-2">
                  <span className="text-xl mr-2">{message.agentAvatar}</span>
                  <div>
                    <div className="font-medium text-sm">{message.agentName}</div>
                    {message.specialization && (
                      <div className="text-xs text-gray-500 capitalize">
                        {message.specialization.replace('_', ' ')}
                      </div>
                    )}
                  </div>
                  {message.messageType === 'consensus' && (
                    <span className="ml-auto bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                      Team Consensus
                    </span>
                  )}
                  {voiceEnabled && message.agentId && (
                    <button
                      onClick={() => {
                        voiceService.speakText(message.content, message.agentId);
                      }}
                      className="ml-2 text-blue-600 hover:text-blue-800 p-1"
                      title="Speak this message"
                    >
                      🔊
                    </button>
                  )}
                </div>
              )}
              <div className="text-sm leading-relaxed">{message.content}</div>
              {message.role === 'user' && message.inputMethod && (
                <div className="text-xs opacity-75 mt-1">
                  {message.inputMethod === 'voice' ? '🎤 Voice' : '⌨️ Text'}
                </div>
              )}
            </div>
          </div>
        ))}

        {(isGeneratingResponse || isConsensusBuilding) && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-3xl">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">
                  {isConsensusBuilding ? 'Building consensus...' : 'Specialists are responding...'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-4">
          <input
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isGeneratingResponse && handleSendMessage()}
            placeholder={voiceEnabled ? "Type your question or use voice..." : "Type your health question..."}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isGeneratingResponse}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!currentInput.trim() || isGeneratingResponse}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>

        {voiceSupported && (
          <div className="mt-2 text-center">
            <button
              onClick={toggleVoiceMode}
              className={`text-sm px-3 py-1 rounded ${
                voiceEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {voiceEnabled ? '🎤 Voice Mode On' : '🎤 Enable Voice Mode'}
            </button>
          </div>
        )}
      </div>

      {/* ElevenLabs Voice Settings Modal */}
      {showVoiceSettings && (
        <ElevenLabsVoiceSettings
          isOpen={showVoiceSettings}
          onClose={() => setShowVoiceSettings(false)}
          onSettingsChange={(settings) => {
            console.log('ElevenLabs voice settings updated:', settings);
            // Voice settings are now properly configured for the consultation
          }}
        />
      )}
    </div>
  );
};