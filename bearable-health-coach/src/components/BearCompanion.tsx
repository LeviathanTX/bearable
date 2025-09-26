import React, { useState, useEffect } from 'react';
import { AICompanion, User } from '../types';

interface BearCompanionProps {
  companion: AICompanion;
  user: User;
  onStartChat: () => void;
  onStartVoiceChat?: () => void;
}

export const BearCompanion: React.FC<BearCompanionProps> = ({ companion, user, onStartChat, onStartVoiceChat }) => {
  const [isListening, setIsListening] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  const greetingMessages = [
    `Good morning, ${user.name}! Ready to make today amazing? 🌟`,
    `Hello ${user.name}! I noticed you're doing great with your goals. Keep it up! 💪`,
    `Hi there! Want to check in on how you're feeling today? 😊`,
    `${user.name}, your progress this week has been inspiring! Let's chat about what's working well. ✨`,
    `Hey ${user.name}! I have some new Mayo Clinic insights that might interest you. 🩺`
  ];

  const quickSuggestions = [
    "How can I sleep better?",
    "Help me with meal planning",
    "I'm feeling stressed",
    "Show my progress",
    "Daily wellness tip"
  ];

  useEffect(() => {
    // Rotate greeting messages every 5 seconds
    const messageInterval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        const randomMessage = greetingMessages[Math.floor(Math.random() * greetingMessages.length)];
        setCurrentMessage(randomMessage);
        setIsAnimating(false);
      }, 300);
    }, 5000);

    // Set initial message
    setCurrentMessage(greetingMessages[0]);

    return () => clearInterval(messageInterval);
  }, [user.name]);

  const handleVoiceInteraction = () => {
    setIsListening(true);
    // Switch to voice chat mode and start listening immediately
    setTimeout(() => {
      setIsListening(false);
      if (onStartVoiceChat) {
        onStartVoiceChat();
      } else {
        onStartChat();
      }
    }, 500); // Shorter delay for better UX
  };

  const handleQuickSuggestion = (suggestion: string) => {
    // In a real app, this would pass the suggestion to the chat
    onStartChat();
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
      <div className="flex flex-col lg:flex-row items-center space-y-8 lg:space-y-0 lg:space-x-12">
        {/* Bear Companion Visual */}
        <div className="flex-shrink-0 relative">
          {/* Main Bear */}
          <div className="relative">
            <div
              className={`w-32 h-32 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-6xl transition-transform duration-500 shadow-2xl ${
                isListening ? 'scale-110' : 'scale-100'
              }`}
            >
              🐻
            </div>

            {/* Status Indicators */}
            <div className="absolute -top-2 -right-2">
              <div className="w-6 h-6 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center animate-pulse-slow shadow-lg ring-2 ring-white">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>

            {/* Voice Interaction Ripples */}
            {isListening && (
              <div className="absolute inset-0 -m-4">
                <div className="w-40 h-40 rounded-full voice-ripple animate-ping"></div>
                <div className="absolute inset-0 w-40 h-40 rounded-full voice-ripple animate-ping" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute inset-0 w-40 h-40 rounded-full voice-ripple animate-ping" style={{ animationDelay: '1s' }}></div>
              </div>
            )}
          </div>

          {/* Mayo Clinic Badge */}
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-slate-600 to-slate-800 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg ring-1 ring-white/20">
            Mayo Clinic Powered
          </div>
        </div>

        {/* Conversation Area */}
        <div className="flex-1 space-y-6">
          {/* Greeting */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-gray-900">{companion.name}</h2>
              <div className="bg-green-100 text-green-800 text-sm px-2 py-1 rounded-full">
                Active
              </div>
            </div>

            {/* Dynamic Message */}
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-4 max-w-lg border border-cyan-200/30 shadow-sm">
              <div className={`transition-opacity duration-300 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
                <p className="text-slate-800 font-medium">{currentMessage}</p>
              </div>
            </div>
          </div>

          {/* Interaction Options */}
          <div className="space-y-4">
            {/* Voice Button */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleVoiceInteraction}
                disabled={isListening}
                className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg ${
                  isListening
                    ? 'bg-red-100 text-red-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 hover:scale-105 hover:shadow-xl'
                }`}
              >
                <div className="text-xl">
                  {isListening ? '🎙️' : '🎤'}
                </div>
                <span>
                  {isListening ? 'Listening...' : 'Talk to me'}
                </span>
              </button>

              <button
                onClick={onStartChat}
                className="flex items-center space-x-3 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all duration-200 shadow-md hover:shadow-lg border border-slate-200/50"
              >
                <div className="text-xl">💬</div>
                <span>Type instead</span>
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Quick suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {quickSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickSuggestion(suggestion)}
                    className="text-sm bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:border-blue-300 hover:text-blue-700 transition-all duration-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Expertise Tags */}
          <div className="flex flex-wrap gap-2">
            {companion.expertise.map((skill, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 text-xs px-3 py-1 rounded-full font-medium"
              >
                {skill}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Focus */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Today's Focus</h3>
            <p className="text-sm text-gray-600">Let's work on these areas together</p>
          </div>
          <div className="flex space-x-3">
            <div className="text-center">
              <div className="text-2xl mb-1">🚶‍♀️</div>
              <div className="text-xs text-gray-500">Move</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🥗</div>
              <div className="text-xs text-gray-500">Nourish</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">😴</div>
              <div className="text-xs text-gray-500">Rest</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🧘‍♀️</div>
              <div className="text-xs text-gray-500">Calm</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};