// AudioWorklet processor for Realtime API
// Handles real-time audio processing, resampling, and voice activity detection

class RealtimeProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    // Audio buffer for resampling
    this.inputBuffer = [];
    this.targetSampleRate = 24000; // OpenAI Realtime prefers 24kHz
    this.inputSampleRate = globalThis.sampleRate || 48000; // Current audio context sample rate
    this.resampleRatio = this.targetSampleRate / this.inputSampleRate;

    // Voice Activity Detection
    this.vadThreshold = 0.01;
    this.vadSmoothingFactor = 0.95;
    this.currentEnergy = 0;
    this.isSpeaking = false;
    this.silenceFrames = 0;
    this.requiredSilenceFrames = Math.floor(this.targetSampleRate * 0.5 / 128); // 0.5 seconds

    console.log(`🎵 RealtimeProcessor initialized: ${this.inputSampleRate}Hz → ${this.targetSampleRate}Hz (ratio: ${this.resampleRatio})`);
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];

    if (!input || !input[0]) {
      return true; // Keep processor alive
    }

    const inputData = input[0]; // First channel

    // Calculate energy for Voice Activity Detection
    const energy = this.calculateEnergy(inputData);
    this.currentEnergy = this.vadSmoothingFactor * this.currentEnergy + (1 - this.vadSmoothingFactor) * energy;

    // Voice Activity Detection
    const wasSpeaking = this.isSpeaking;
    this.isSpeaking = this.currentEnergy > this.vadThreshold;

    if (this.isSpeaking) {
      this.silenceFrames = 0;
    } else {
      this.silenceFrames++;
    }

    // Send VAD updates
    if (wasSpeaking !== this.isSpeaking) {
      this.port.postMessage({
        type: 'vad',
        data: {
          isSpeaking: this.isSpeaking,
          energy: this.currentEnergy
        }
      });
    }

    // Resample audio to target sample rate (24kHz for OpenAI)
    const resampledData = this.resample(inputData);

    if (resampledData.length > 0) {
      // Send audio data when speaking or recently speaking
      if (this.isSpeaking || this.silenceFrames < this.requiredSilenceFrames) {
        this.port.postMessage({
          type: 'audio',
          data: resampledData
        });
      }
    }

    return true; // Keep processor alive
  }

  calculateEnergy(audioData) {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    return Math.sqrt(sum / audioData.length);
  }

  resample(inputData) {
    // Simple linear interpolation resampling
    if (Math.abs(this.resampleRatio - 1.0) < 0.001) {
      // No resampling needed
      return new Float32Array(inputData);
    }

    const outputLength = Math.floor(inputData.length * this.resampleRatio);
    const output = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const srcIndex = i / this.resampleRatio;
      const srcIndexFloor = Math.floor(srcIndex);
      const srcIndexCeil = Math.min(srcIndexFloor + 1, inputData.length - 1);
      const fraction = srcIndex - srcIndexFloor;

      // Linear interpolation
      output[i] = inputData[srcIndexFloor] * (1 - fraction) + inputData[srcIndexCeil] * fraction;
    }

    return output;
  }
}

// Register the processor
registerProcessor('realtime-processor', RealtimeProcessor);