// Audio Worklet Processor for OpenAI Realtime API
// Handles real-time audio processing with Voice Activity Detection

class RealtimeProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    // Audio processing state
    this.bufferSize = 128; // Small buffer for low latency
    this.audioBuffer = [];
    this.sampleRate = 24000; // OpenAI Realtime preferred sample rate

    // Voice Activity Detection
    this.vadThreshold = 0.01; // Adjust based on environment
    this.vadSmoothingFactor = 0.95;
    this.vadSmoothedEnergy = 0;
    this.vadConsecutiveSpeech = 0;
    this.vadConsecutiveSilence = 0;
    this.vadMinSpeechFrames = 3;
    this.vadMinSilenceFrames = 10;
    this.isSpeaking = false;

    // Audio quality enhancement
    this.dcBlockerX = 0;
    this.dcBlockerY = 0;
    this.dcBlockerAlpha = 0.995;

    console.log('🎙️ Realtime Audio Processor initialized');
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];

    if (!input || input.length === 0) {
      return true;
    }

    const inputChannel = input[0]; // Mono input

    if (inputChannel && inputChannel.length > 0) {
      // Process audio with enhancements
      const processedAudio = this.processAudioData(inputChannel);

      // Voice Activity Detection
      const vadResult = this.detectVoiceActivity(processedAudio);

      // Send processed audio data
      this.port.postMessage({
        type: 'audio',
        data: processedAudio
      });

      // Send VAD results
      if (vadResult.statusChanged) {
        this.port.postMessage({
          type: 'vad',
          data: {
            isSpeaking: vadResult.isSpeaking,
            energy: vadResult.energy,
            confidence: vadResult.confidence
          }
        });
      }
    }

    return true;
  }

  // Process audio data with quality enhancements
  processAudioData(inputData) {
    const processedData = new Float32Array(inputData.length);

    for (let i = 0; i < inputData.length; i++) {
      let sample = inputData[i];

      // DC blocker (high-pass filter to remove DC offset)
      this.dcBlockerY = sample - this.dcBlockerX + this.dcBlockerAlpha * this.dcBlockerY;
      this.dcBlockerX = sample;
      sample = this.dcBlockerY;

      // Soft limiter to prevent clipping
      if (sample > 0.95) {
        sample = 0.95;
      } else if (sample < -0.95) {
        sample = -0.95;
      }

      processedData[i] = sample;
    }

    return processedData;
  }

  // Voice Activity Detection algorithm
  detectVoiceActivity(audioData) {
    // Calculate RMS energy
    let energy = 0;
    for (let i = 0; i < audioData.length; i++) {
      energy += audioData[i] * audioData[i];
    }
    energy = Math.sqrt(energy / audioData.length);

    // Smooth the energy
    this.vadSmoothedEnergy =
      this.vadSmoothingFactor * this.vadSmoothedEnergy +
      (1 - this.vadSmoothingFactor) * energy;

    // Current frame speech detection
    const currentFrameHasSpeech = this.vadSmoothedEnergy > this.vadThreshold;

    let statusChanged = false;
    let confidence = Math.min(this.vadSmoothedEnergy / this.vadThreshold, 2.0);

    if (currentFrameHasSpeech) {
      this.vadConsecutiveSpeech++;
      this.vadConsecutiveSilence = 0;

      // Start speaking if we have enough consecutive speech frames
      if (!this.isSpeaking && this.vadConsecutiveSpeech >= this.vadMinSpeechFrames) {
        this.isSpeaking = true;
        statusChanged = true;
        console.log('🗣️ Speech detected (energy:', this.vadSmoothedEnergy.toFixed(4), ')');
      }
    } else {
      this.vadConsecutiveSilence++;
      this.vadConsecutiveSpeech = 0;

      // Stop speaking if we have enough consecutive silence frames
      if (this.isSpeaking && this.vadConsecutiveSilence >= this.vadMinSilenceFrames) {
        this.isSpeaking = false;
        statusChanged = true;
        console.log('🤐 Speech ended (silence frames:', this.vadConsecutiveSilence, ')');
      }
    }

    return {
      isSpeaking: this.isSpeaking,
      energy: this.vadSmoothedEnergy,
      confidence: confidence,
      statusChanged: statusChanged
    };
  }

  // Adaptive threshold adjustment
  adaptThreshold(backgroundNoise) {
    // Adjust VAD threshold based on background noise
    this.vadThreshold = Math.max(0.005, backgroundNoise * 2.5);
  }
}

// Register the processor
registerProcessor('realtime-processor', RealtimeProcessor);