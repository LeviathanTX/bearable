import React, { useState, useRef, useEffect } from 'react';
import { useAdvisor } from '../../contexts/AdvisorContext';
import { cn } from '../../utils';

interface PitchPracticeModeProps {
  onBack: () => void;
}

export const PitchPracticeMode: React.FC<PitchPracticeModeProps> = ({ onBack }) => {
  const [selectedAdvisors, setSelectedAdvisors] = useState<string[]>([]);
  const [pitchText, setPitchText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [pitchDuration, setPitchDuration] = useState(5); // Default 5 minutes
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [pitchMode, setPitchMode] = useState<'text' | 'voice'>('text');
  
  // Speech analysis states
  const [speechAnalysis, setSpeechAnalysis] = useState<any>(null);
  const [isAnalyzingSpeech, setIsAnalyzingSpeech] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pitchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { celebrityAdvisors, getCelebrityAdvisor } = useAdvisor();

  const toggleAdvisor = (advisorId: string) => {
    setSelectedAdvisors(prev => 
      prev.includes(advisorId) 
        ? prev.filter(id => id !== advisorId)
        : [...prev, advisorId]
    );
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (pitchTimerRef.current) clearInterval(pitchTimerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setRecordedAudio(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setTimeRemaining(pitchDuration * 60);

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start pitch countdown timer
      pitchTimerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please ensure microphone permissions are granted.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (pitchTimerRef.current) {
        clearInterval(pitchTimerRef.current);
      }
    }
  };

  const analyzeSpeech = async (audioBlob: Blob) => {
    setIsAnalyzingSpeech(true);
    
    // Simulate speech analysis (in production, this would call a real speech analysis API)
    setTimeout(() => {
      const mockSpeechAnalysis = {
        duration: recordingTime,
        wordsPerMinute: Math.floor(Math.random() * 50) + 120, // 120-170 WPM
        stressLevel: Math.floor(Math.random() * 40) + 30, // 30-70% stress
        confidenceLevel: Math.floor(Math.random() * 30) + 70, // 70-100% confidence
        honestyIndicator: Math.floor(Math.random() * 20) + 80, // 80-100% honesty
        clarityScore: Math.floor(Math.random() * 25) + 75, // 75-100% clarity
        energyLevel: Math.floor(Math.random() * 30) + 70, // 70-100% energy
        pauseAnalysis: {
          totalPauses: Math.floor(Math.random() * 20) + 10,
          averagePauseLength: (Math.random() * 2 + 0.5).toFixed(1), // 0.5-2.5 seconds
          fillerWords: Math.floor(Math.random() * 15) + 5 // 5-20 filler words
        },
        emotionalTone: {
          enthusiasm: Math.floor(Math.random() * 30) + 70,
          nervousness: Math.floor(Math.random() * 40) + 10,
          authenticity: Math.floor(Math.random() * 20) + 80
        },
        speechPatterns: {
          monotone: Math.random() < 0.3,
          rushing: Math.random() < 0.4,
          unclear: Math.random() < 0.2
        }
      };
      
      setSpeechAnalysis(mockSpeechAnalysis);
      setIsAnalyzingSpeech(false);
    }, 3000);
  };

  const handleAnalyzePitch = async () => {
    if ((pitchMode === 'text' && !pitchText.trim()) || selectedAdvisors.length === 0) return;
    if (pitchMode === 'voice' && !recordedAudio) return;
    
    setIsAnalyzing(true);
    
    // If we have recorded audio, analyze it first
    if (recordedAudio && pitchMode === 'voice') {
      await analyzeSpeech(recordedAudio);
    }
    
    // Simulate analysis delay
    setTimeout(() => {
      const selectedAdvisorObjects = selectedAdvisors.map(id => getCelebrityAdvisor(id)).filter(Boolean);
      
      const baseMetrics = {
        clarity: Math.floor(Math.random() * 25) + 75,
        confidence: Math.floor(Math.random() * 25) + 75,
        structure: Math.floor(Math.random() * 25) + 75,
        engagement: Math.floor(Math.random() * 25) + 75,
      };

      // Adjust metrics based on speech analysis if available
      let adjustedMetrics = { ...baseMetrics };
      if (speechAnalysis && pitchMode === 'voice') {
        adjustedMetrics.clarity = Math.max(0, Math.min(100, speechAnalysis.clarityScore));
        adjustedMetrics.confidence = Math.max(0, Math.min(100, speechAnalysis.confidenceLevel));
        adjustedMetrics.engagement = Math.max(0, Math.min(100, speechAnalysis.energyLevel));
      }
      
      const mockAnalysis = {
        advisors: selectedAdvisorObjects.map(advisor => advisor?.name).join(', '),
        advisorCount: selectedAdvisors.length,
        overallScore: Math.floor(Object.values(adjustedMetrics).reduce((a, b) => a + b) / 4), 
        metrics: adjustedMetrics,
        feedback: generateMultiAdvisorFeedback(selectedAdvisorObjects),
        strengths: generateStrengths(speechAnalysis, pitchMode),
        improvements: generateImprovements(speechAnalysis, pitchMode),
        speechAnalysis: speechAnalysis,
        pitchMode: pitchMode,
        recordingDuration: pitchMode === 'voice' ? recordingTime : null
      };
      
      setAnalysis(mockAnalysis);
      setIsAnalyzing(false);
    }, 2000);
  };

  const generateStrengths = (speechData: any, mode: string) => {
    const baseStrengths = [
      'Clear problem statement',
      'Strong market validation',
      'Passionate delivery'
    ];

    if (mode === 'voice' && speechData) {
      const voiceStrengths = [];
      if (speechData.confidenceLevel > 80) voiceStrengths.push('Very confident delivery');
      if (speechData.honestyIndicator > 90) voiceStrengths.push('Authentic and genuine tone');
      if (speechData.energyLevel > 80) voiceStrengths.push('High energy and enthusiasm');
      if (speechData.wordsPerMinute >= 140 && speechData.wordsPerMinute <= 160) voiceStrengths.push('Perfect speaking pace');
      if (speechData.stressLevel < 40) voiceStrengths.push('Calm and composed delivery');
      
      return [...baseStrengths, ...voiceStrengths];
    }

    return baseStrengths;
  };

  const generateImprovements = (speechData: any, mode: string) => {
    const baseImprovements = [
      'More specific financial metrics',
      'Competitive differentiation',
      'Risk mitigation strategy'
    ];

    if (mode === 'voice' && speechData) {
      const voiceImprovements = [];
      if (speechData.stressLevel > 60) voiceImprovements.push('Work on reducing stress levels during presentation');
      if (speechData.pauseAnalysis.fillerWords > 15) voiceImprovements.push('Reduce filler words (um, uh, like)');
      if (speechData.wordsPerMinute < 120) voiceImprovements.push('Speak at a faster pace to maintain engagement');
      if (speechData.wordsPerMinute > 170) voiceImprovements.push('Slow down speaking pace for better clarity');
      if (speechData.speechPatterns.monotone) voiceImprovements.push('Add more vocal variety and intonation');
      if (speechData.clarityScore < 80) voiceImprovements.push('Improve pronunciation and articulation');
      
      return [...baseImprovements, ...voiceImprovements];
    }

    return baseImprovements;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStressColor = (level: number) => {
    if (level < 40) return 'text-green-600';
    if (level < 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceColor = (level: number) => {
    if (level > 80) return 'text-green-600';
    if (level > 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const generateMultiAdvisorFeedback = (advisors: any[]) => {
    const feedbackPool = {
      'mark-cuban': [
        "Great energy and passion! I love seeing founders who believe in their vision.",
        "Show me the numbers - what's your customer acquisition cost and lifetime value?",
        "Don't scale until you've proven the unit economics work."
      ],
      'reid-hoffman': [
        "Think about network effects - how does each customer make your product more valuable?",
        "What's your defensible moat as you grow and competitors notice you?",
        "Focus on building platform value, not just user growth."
      ],
      'barbara-corcoran': [
        "I love the passion, but let's talk about the sales strategy.",
        "How are you going to get customers to choose you over the competition?",
        "What's your plan for scaling the sales team?"
      ],
      'jason-calacanis': [
        "This market timing feels right - but execution will determine everything.",
        "Have you talked to enough customers to validate this pain point?",
        "What's your go-to-market strategy for the first 1000 customers?"
      ],
      'daymond-john': [
        "Brand positioning is crucial here - what makes you memorable?",
        "How are you building a community around your product?",
        "What's your strategy for viral growth and word-of-mouth?"
      ],
      'sheryl-sandberg': [
        "The market opportunity is clear, but let's dive into your growth strategy.",
        "How are you measuring product-market fit?",
        "What metrics are you tracking to understand user engagement?"
      ]
    };
    
    return advisors.map(advisor => {
      const advisorFeedback = feedbackPool[advisor?.id as keyof typeof feedbackPool] || feedbackPool['mark-cuban'];
      return `${advisor?.name}: ${advisorFeedback[Math.floor(Math.random() * advisorFeedback.length)]}`;
    });
  };

  if (analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setAnalysis(null)}
            className="mb-6 text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Practice Another Pitch
          </button>
          
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Pitch Analysis Results</h1>
              <p className="text-gray-600">Feedback from {analysis.advisorCount} advisor{analysis.advisorCount > 1 ? 's' : ''}: {analysis.advisors}</p>
            </div>

            {/* Overall Score */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full text-white text-2xl font-bold mb-4">
                {analysis.overallScore}
              </div>
              <p className="text-lg font-semibold text-gray-900">Overall Pitch Score</p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {Object.entries(analysis.metrics).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">{value as number}%</div>
                  <div className="text-sm text-gray-600 capitalize">{key}</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{ width: `${value as number}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Feedback */}
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">💪 Strengths</h3>
                <ul className="space-y-2">
                  {analysis.strengths.map((strength: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-gray-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Improvements</h3>
                <ul className="space-y-2">
                  {analysis.improvements.map((improvement: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="text-orange-500 mr-2">→</span>
                      <span className="text-gray-700">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Speech Analysis Results */}
            {analysis.speechAnalysis && analysis.pitchMode === 'voice' && (
              <div className="mt-8 p-6 bg-blue-50 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🎤 Voice & Speech Analysis</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Speech Metrics */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Speech Characteristics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Speaking Pace:</span>
                        <span className="font-medium">{analysis.speechAnalysis.wordsPerMinute} WPM</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stress Level:</span>
                        <span className={`font-medium ${getStressColor(analysis.speechAnalysis.stressLevel)}`}>
                          {analysis.speechAnalysis.stressLevel}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Confidence:</span>
                        <span className={`font-medium ${getConfidenceColor(analysis.speechAnalysis.confidenceLevel)}`}>
                          {analysis.speechAnalysis.confidenceLevel}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Honesty Indicator:</span>
                        <span className="font-medium text-blue-600">{analysis.speechAnalysis.honestyIndicator}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Energy Level:</span>
                        <span className="font-medium text-orange-600">{analysis.speechAnalysis.energyLevel}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Recording Duration:</span>
                        <span className="font-medium">{formatTime(analysis.recordingDuration)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pause Analysis */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Speech Patterns</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Pauses:</span>
                        <span className="font-medium">{analysis.speechAnalysis.pauseAnalysis.totalPauses}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Pause Length:</span>
                        <span className="font-medium">{analysis.speechAnalysis.pauseAnalysis.averagePauseLength}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Filler Words:</span>
                        <span className="font-medium">{analysis.speechAnalysis.pauseAnalysis.fillerWords}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Enthusiasm:</span>
                        <span className="font-medium text-green-600">{analysis.speechAnalysis.emotionalTone.enthusiasm}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nervousness:</span>
                        <span className="font-medium text-red-600">{analysis.speechAnalysis.emotionalTone.nervousness}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Authenticity:</span>
                        <span className="font-medium text-purple-600">{analysis.speechAnalysis.emotionalTone.authenticity}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Speech Patterns Alerts */}
                {(analysis.speechAnalysis.speechPatterns.monotone || 
                  analysis.speechAnalysis.speechPatterns.rushing || 
                  analysis.speechAnalysis.speechPatterns.unclear) && (
                  <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                    <h5 className="font-medium text-yellow-800 mb-2">⚠️ Speech Pattern Alerts</h5>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {analysis.speechAnalysis.speechPatterns.monotone && (
                        <li>• Detected monotone delivery - try varying your pitch and intonation</li>
                      )}
                      {analysis.speechAnalysis.speechPatterns.rushing && (
                        <li>• Speaking too quickly - slow down for better clarity</li>
                      )}
                      {analysis.speechAnalysis.speechPatterns.unclear && (
                        <li>• Some unclear pronunciation detected - focus on articulation</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Detailed Feedback */}
            <div className="mt-8 p-6 bg-gray-50 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💬 Advisory Board Feedback</h3>
              <div className="space-y-4">
                {analysis.feedback.map((comment: string, index: number) => (
                  <div key={index} className="p-3 bg-white rounded-lg border-l-4 border-purple-500">
                    <p className="text-gray-700">{comment}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={onBack}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 text-purple-600 hover:text-purple-700 font-medium"
        >
          ← Back to Dashboard
        </button>
        
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🎤 Pitch Practice</h1>
            <p className="text-gray-600">Get AI-powered feedback on your pitch from celebrity investors</p>
          </div>

          {/* Advisor Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose Your Advisory Board ({selectedAdvisors.length} selected)</h2>
            <p className="text-sm text-gray-600 mb-4">Select multiple advisors to get diverse perspectives on your pitch</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {celebrityAdvisors.map((advisor) => {
                const isSelected = selectedAdvisors.includes(advisor.id);
                const isHost = advisor.id === 'the-host';
                return (
                  <button
                    key={advisor.id}
                    onClick={() => toggleAdvisor(advisor.id)}
                    className={cn(
                      "p-4 border-2 rounded-xl text-left transition-all relative",
                      isHost && !isSelected
                        ? "border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-lg ring-2 ring-amber-200"
                        : isHost && isSelected
                        ? "border-amber-500 bg-gradient-to-br from-amber-100 to-yellow-100 shadow-lg ring-2 ring-amber-300"
                        : isSelected
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-purple-300"
                    )}
                  >
                    {isHost && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full">
                        HOST
                      </div>
                    )}
                    {isSelected && (
                      <div className={cn(
                        "absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center",
                        isHost ? "bg-amber-500" : "bg-purple-500"
                      )}>
                        <span className="text-white text-sm">✓</span>
                      </div>
                    )}
                    <div className={cn(
                      "font-semibold",
                      isHost ? "text-amber-900 mt-6" : "text-gray-900"
                    )}>{advisor.name}</div>
                    <div className={cn(
                      "text-sm",
                      isHost ? "text-amber-700" : "text-gray-600"
                    )}>{advisor.title}</div>
                    <div className={cn(
                      "text-sm mt-1",
                      isHost ? "text-amber-600" : "text-gray-500"
                    )}>{advisor.company}</div>
                    {isHost && (
                      <div className="text-xs text-amber-700 mt-2 font-medium">
                        🎯 Meeting Facilitation • Behavioral Economics
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedAdvisors.length > 0 && (
              <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-700">
                  Selected advisors: {selectedAdvisors.map(id => celebrityAdvisors.find(a => a.id === id)?.name).join(', ')}
                </p>
              </div>
            )}
          </div>

          {/* Pitch Mode Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pitch Mode</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPitchMode('text')}
                className={cn(
                  "p-4 border-2 rounded-xl text-left transition-all",
                  pitchMode === 'text'
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-purple-300"
                )}
              >
                <div className="font-semibold text-gray-900">📝 Text Pitch</div>
                <div className="text-sm text-gray-600 mt-1">Write your pitch and get text-based feedback</div>
              </button>
              <button
                onClick={() => setPitchMode('voice')}
                className={cn(
                  "p-4 border-2 rounded-xl text-left transition-all",
                  pitchMode === 'voice'
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-purple-300"
                )}
              >
                <div className="font-semibold text-gray-900">🎤 Voice Pitch</div>
                <div className="text-sm text-gray-600 mt-1">Record your pitch and get speech analysis</div>
              </button>
            </div>
          </div>

          {/* Timer Settings for Voice Mode */}
          {pitchMode === 'voice' && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Pitch Timer</h2>
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Duration:</label>
                <select
                  value={pitchDuration}
                  onChange={(e) => setPitchDuration(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isRecording}
                >
                  {Array.from({ length: 20 }, (_, i) => i + 1).map(min => (
                    <option key={min} value={min}>{min} minute{min > 1 ? 's' : ''}</option>
                  ))}
                </select>
                <div className="text-sm text-gray-500">
                  {isRecording ? (
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                      Recording: {formatTime(recordingTime)} / {formatTime(pitchDuration * 60)}
                    </span>
                  ) : (
                    timeRemaining > 0 ? `Time remaining: ${formatTime(timeRemaining)}` : `Set timer for ${pitchDuration} minute${pitchDuration > 1 ? 's' : ''}`
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Voice Recording Interface */}
          {pitchMode === 'voice' && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Record Your Pitch</h2>
              <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-xl">
                <div className="mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                    <span className="text-2xl">🎤</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {isRecording ? 'Recording in Progress' : recordedAudio ? 'Recording Complete' : 'Ready to Record'}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {isRecording 
                      ? `Speaking time: ${formatTime(recordingTime)}`
                      : recordedAudio 
                      ? `Recorded ${formatTime(recordingTime)} of pitch audio`
                      : `Click record to start your ${pitchDuration} minute pitch`
                    }
                  </p>
                </div>

                <div className="space-y-4">
                  {!isRecording && !recordedAudio && (
                    <button
                      onClick={startRecording}
                      className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                    >
                      🔴 Start Recording
                    </button>
                  )}

                  {isRecording && (
                    <button
                      onClick={stopRecording}
                      className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                    >
                      ⏹️ Stop Recording
                    </button>
                  )}

                  {recordedAudio && !isRecording && (
                    <div className="space-y-3">
                      <audio controls src={audioUrl} className="w-full max-w-md mx-auto">
                        Your browser does not support the audio element.
                      </audio>
                      <div className="flex space-x-3 justify-center">
                        <button
                          onClick={() => {
                            setRecordedAudio(null);
                            setAudioUrl('');
                            setSpeechAnalysis(null);
                            setRecordingTime(0);
                          }}
                          className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                        >
                          🗑️ Delete & Re-record
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Text Input (only show if text mode) */}
          {pitchMode === 'text' && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Pitch</h2>
              <textarea
                value={pitchText}
                onChange={(e) => setPitchText(e.target.value)}
                placeholder="Enter your pitch here... Tell us about your company, the problem you're solving, your solution, market opportunity, business model, and what you're looking for."
                className="w-full h-40 p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <div className="text-sm text-gray-500 mt-2">
                {pitchText.length} characters • Aim for 200-500 words for best results
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="text-center">
            <button
              onClick={handleAnalyzePitch}
              disabled={
                selectedAdvisors.length === 0 || 
                (pitchMode === 'text' && !pitchText.trim()) ||
                (pitchMode === 'voice' && !recordedAudio) ||
                isAnalyzing ||
                isAnalyzingSpeech
              }
              className={cn(
                "px-8 py-4 rounded-xl font-semibold text-white transition-all",
                (selectedAdvisors.length === 0 || 
                 (pitchMode === 'text' && !pitchText.trim()) ||
                 (pitchMode === 'voice' && !recordedAudio)) 
                  ? "bg-gray-400 cursor-not-allowed"
                  : (isAnalyzing || isAnalyzingSpeech)
                  ? "bg-purple-400 cursor-wait"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              )}
            >
              {isAnalyzingSpeech ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Analyzing Speech Patterns...
                </span>
              ) : isAnalyzing ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Analyzing Your Pitch...
                </span>
              ) : (
                pitchMode === 'voice' ? 'Analyze Voice Pitch' : 'Get AI Feedback'
              )}
            </button>
            
            {/* Instructions based on mode */}
            <div className="mt-4 text-sm text-gray-500">
              {pitchMode === 'text' ? (
                <p>Select advisors and write your pitch to get personalized feedback</p>
              ) : (
                <p>
                  {!recordedAudio 
                    ? 'Record your pitch using the microphone to get voice analysis + AI feedback'
                    : 'Get AI feedback plus detailed speech analysis including stress, confidence, and speaking patterns'
                  }
                </p>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="mt-8 p-6 bg-purple-50 rounded-xl">
            <h3 className="font-semibold text-purple-900 mb-3">💡 Tips for a Great Pitch</h3>
            {pitchMode === 'text' ? (
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Start with a compelling problem statement</li>
                <li>• Clearly explain your unique solution</li>
                <li>• Show market size and opportunity</li>
                <li>• Include business model and revenue projections</li>
                <li>• Mention your team's expertise</li>
                <li>• End with a clear ask (funding, partnership, etc.)</li>
              </ul>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-purple-900 mb-2">Content Tips:</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Start with a compelling hook</li>
                    <li>• Use the problem-solution-market framework</li>
                    <li>• Include concrete examples and metrics</li>
                    <li>• End with a memorable call to action</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-purple-900 mb-2">Voice Tips:</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Speak at 140-160 words per minute</li>
                    <li>• Vary your tone and avoid monotone delivery</li>
                    <li>• Use strategic pauses for emphasis</li>
                    <li>• Minimize filler words (um, uh, like)</li>
                    <li>• Project confidence and enthusiasm</li>
                    <li>• Practice breathing to reduce stress</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};