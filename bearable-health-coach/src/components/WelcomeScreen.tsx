import React, { useState } from 'react';

interface WelcomeScreenProps {
  onStart: (userName: string) => void;
  isLoading: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, isLoading }) => {
  const [userName, setUserName] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      onStart(userName.trim());
    }
  };

  const steps = [
    {
      title: "Welcome to Your Health Journey",
      description: "Your AI-powered companion for better health outcomes",
      content: (
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-32 h-32 mx-auto bear-gradient rounded-full flex items-center justify-center text-6xl animate-pulse-slow">
              🐻
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl">
              🩺
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">Meet Bearable AI</h2>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              Powered by Mayo Clinic's lifestyle medicine expertise and designed to support your health goals with personalized, evidence-based guidance.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "What makes Bearable special?",
      description: "Your comprehensive health companion",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Coaching</h3>
            <p className="text-sm text-gray-600">Personalized behavioral science and Mayo Clinic protocols</p>
          </div>
          <div className="bg-green-50 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Caregiver Support</h3>
            <p className="text-sm text-gray-600">Connect family, friends, and healthcare providers</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Evidence-Based</h3>
            <p className="text-sm text-gray-600">Recommendations backed by medical research</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Privacy First</h3>
            <p className="text-sm text-gray-600">HIPAA-compliant and secure data handling</p>
          </div>
        </div>
      )
    },
    {
      title: "Let's get started!",
      description: "Tell us your name to begin your personalized health journey",
      content: (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bear-gradient rounded-full flex items-center justify-center text-4xl">
            🐻
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto">
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
                What should I call you?
              </label>
              <input
                type="text"
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg"
                placeholder="Enter your name"
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!userName.trim() || isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Setting up your companion...</span>
                </div>
              ) : (
                'Start My Health Journey'
              )}
            </button>
          </form>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bear-gradient w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold">
                🐻
              </div>
              <span className="text-xl font-semibold text-gray-900">Bearable Health Coach</span>
            </div>
            <div className="text-sm text-gray-500">
              Powered by Mayo Clinic
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            {/* Progress Indicator */}
            <div className="flex items-center justify-center mb-8">
              {steps.map((_, index) => (
                <React.Fragment key={index}>
                  <div
                    className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                      index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                  {index < steps.length - 1 && (
                    <div
                      className={`w-12 h-0.5 transition-colors duration-300 ${
                        index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Step Content */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {currentStepData.title}
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                {currentStepData.description}
              </p>
              {currentStepData.content}
            </div>

            {/* Navigation */}
            {currentStep < 2 && (
              <div className="flex justify-center">
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                >
                  {currentStep === 0 ? 'Learn More' : 'Get Started'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          Built with 💙 by Bearable AI × Mayo Clinic Lifestyle Medicine
        </div>
      </footer>
    </div>
  );
};