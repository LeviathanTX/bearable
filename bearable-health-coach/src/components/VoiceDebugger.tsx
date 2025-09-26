import React, { useState, useEffect } from 'react';
import { VoiceService } from '../services/voiceService';

export const VoiceDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [voiceService] = useState(() => new VoiceService());

  const runDiagnostics = async () => {
    const info: any = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      isSecure: window.location.protocol === 'https:',
      userAgent: navigator.userAgent,
    };

    // Check API availability
    info.speechRecognition = voiceService.isSpeechRecognitionSupported();
    info.speechSynthesis = voiceService.isSpeechSynthesisSupported();
    info.mediaDevices = 'mediaDevices' in navigator;

    // Browser compatibility
    info.compatibility = voiceService.getCompatibilityInfo();

    // Check microphone permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionStatus('granted');
      info.microphonePermission = 'granted';
    } catch (error: any) {
      setPermissionStatus('denied');
      info.microphonePermission = `denied: ${error.message}`;
      info.microphoneError = error.name;
    }

    // Force voices to load and wait for them
    const loadVoices = () => {
      return new Promise<SpeechSynthesisVoice[]>((resolve) => {
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
          resolve(voices);
        } else {
          speechSynthesis.onvoiceschanged = () => {
            resolve(speechSynthesis.getVoices());
          };
          // Trigger voices loading
          speechSynthesis.cancel();
        }
      });
    };

    try {
      const voices = await loadVoices();
      info.voices = voices.map(v => ({
        name: v.name,
        lang: v.lang,
        localService: v.localService
      }));
      info.voicesLoaded = true;
    } catch (error) {
      info.voices = [];
      info.voicesLoaded = false;
      info.voicesError = 'Failed to load voices';
    }

    setDebugInfo(info);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const testMicrophone = async () => {
    try {
      await voiceService.startHealthConversation(
        (transcript, isFinal) => {
          console.log('Transcript:', transcript, 'Final:', isFinal);
        },
        (error) => {
          console.error('Voice error:', error);
          alert(`Voice error: ${error}`);
        }
      );
    } catch (error) {
      console.error('Test failed:', error);
      alert(`Test failed: ${error}`);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-blue-500 p-4 rounded-lg shadow-lg max-w-md max-h-96 overflow-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">Voice Debug</h3>
        <button
          onClick={runDiagnostics}
          className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
        >
          Refresh
        </button>
      </div>

      <div className="text-xs space-y-1">
        <div className={`p-1 rounded ${permissionStatus === 'granted' ? 'bg-green-100' : 'bg-red-100'}`}>
          <strong>Microphone:</strong> {permissionStatus}
        </div>

        <div>
          <strong>Speech Recognition:</strong> {debugInfo.speechRecognition ? '✅' : '❌'}
        </div>

        <div>
          <strong>Speech Synthesis:</strong> {debugInfo.speechSynthesis ? '✅' : '❌'}
        </div>

        <div>
          <strong>HTTPS:</strong> {debugInfo.isSecure ? '✅' : '❌ (HTTP)'}
        </div>

        <div>
          <strong>Browser:</strong> {debugInfo.compatibility?.browser}
        </div>

        <div>
          <strong>Voices:</strong> {debugInfo.voices?.length || 0} available
        </div>

        {debugInfo.microphoneError && (
          <div className="bg-red-50 p-1 rounded">
            <strong>Error:</strong> {debugInfo.microphoneError}
          </div>
        )}
      </div>

      <div className="mt-2 space-y-1">
        <button
          onClick={testMicrophone}
          className="w-full text-xs bg-green-500 text-white px-2 py-1 rounded"
        >
          Test Microphone
        </button>
      </div>

      <details className="mt-2">
        <summary className="text-xs cursor-pointer">Full Debug Info</summary>
        <pre className="text-xs bg-gray-100 p-1 rounded mt-1 overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </details>
    </div>
  );
};