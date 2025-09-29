#!/usr/bin/env node

/**
 * Comprehensive test for conversational voice system
 * Tests the complete flow: WebSocket -> Conversation -> Multi-agents -> TTS -> Audio
 */

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

class ConversationTester {
  constructor() {
    this.ws = null;
    this.responses = [];
    this.audioFiles = [];
    this.testStartTime = Date.now();
  }

  async runTest() {
    console.log('🧪 Starting comprehensive conversational voice test...\n');

    try {
      // Step 1: Connect to WebSocket
      await this.connectWebSocket();

      // Step 2: Configure conversation with health specialists
      await this.configureConversation();

      // Step 3: Test conversation input
      await this.testConversationInput();

      // Step 4: Wait for responses and audio
      await this.waitForResponses();

      // Step 5: Test results
      this.validateResults();

      console.log('\n✅ All tests passed! Conversational voice system is working correctly.');

    } catch (error) {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    } finally {
      if (this.ws) {
        this.ws.close();
      }
    }
  }

  async connectWebSocket() {
    console.log('📡 Connecting to WebSocket...');

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket('ws://localhost:3004/realtime');

      this.ws.on('open', () => {
        console.log('✅ WebSocket connected successfully');
        resolve();
      });

      this.ws.on('message', (data) => {
        this.handleMessage(data);
      });

      this.ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log('🔌 WebSocket connection closed');
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (this.ws.readyState !== WebSocket.OPEN) {
          reject(new Error('WebSocket connection timeout'));
        }
      }, 5000);
    });
  }

  async configureConversation() {
    console.log('🩺 Configuring conversation with health specialists...');

    const configMessage = {
      type: 'conversation.configure',
      agents: ['dr-maya-wellness', 'nutritionist-sarah']
    };

    this.ws.send(JSON.stringify(configMessage));

    // Wait for configuration confirmation
    await this.waitForMessage('conversation_configured', 3000);
    console.log('✅ Conversation configured with health specialists');
  }

  async testConversationInput() {
    console.log('💬 Testing conversation input...');

    const inputMessage = {
      type: 'conversation.input',
      text: 'I want to lose weight and improve my overall health. What should I focus on?'
    };

    this.ws.send(JSON.stringify(inputMessage));
    console.log('✅ Conversation input sent');
  }

  async waitForResponses() {
    console.log('⏳ Waiting for multi-agent responses and audio...');

    // Wait up to 30 seconds for all responses
    const timeout = 30000;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (this.audioFiles.length >= 2) {
        console.log('✅ Received audio from all agents');
        break;
      }
      await this.sleep(100);
    }

    if (this.audioFiles.length < 2) {
      throw new Error(`Expected 2 audio files, got ${this.audioFiles.length}`);
    }

    console.log(`✅ Audio validation passed: ${this.audioFiles.length} audio files received`);
    console.log(`📝 Text responses captured: ${this.responses.length} (Note: Audio generation is primary success metric)`);
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'status') {
        console.log(`📊 Status: ${message.status} - ${message.message || ''}`);

        // Handle conversation responses that come as status messages
        if (message.status === 'conversation_response') {
          const responseData = message.data || message.message;
          if (responseData) {
            console.log(`🗣️ ${responseData.agentName}: "${responseData.text}"`);
            this.responses.push(responseData);
          } else {
            console.log(`🗣️ Response received but no data/message field:`, JSON.stringify(message, null, 2));
          }
        }
      }

      if (message.type === 'conversation_configured') {
        console.log(`🩺 Agents configured: ${message.data.agents.join(', ')}`);
      }

      if (message.type === 'conversation_response') {
        console.log(`🗣️ ${message.data ? message.data.agentName : 'Unknown'}: "${message.data ? message.data.text : message.text}"`);
        this.responses.push(message.data || message);
      }

      if (message.type === 'conversation_audio') {
        const audioData = message.data || message;
        console.log(`🔊 Audio received from ${audioData.agentName} (${Math.round(audioData.audioData.length * 0.75)} bytes)`);
        this.saveAudioFile(audioData);
        this.audioFiles.push(audioData);
      }

    } catch (error) {
      console.log('📨 Raw message:', data.toString().substring(0, 100));
    }
  }

  saveAudioFile(audioData) {
    try {
      const audioBuffer = Buffer.from(audioData.audioData, 'base64');
      const filename = `/tmp/test_${audioData.agentId}_${Date.now()}.mp3`;
      fs.writeFileSync(filename, audioBuffer);
      console.log(`💾 Saved audio file: ${filename} (${audioBuffer.length} bytes)`);
    } catch (error) {
      console.error('❌ Failed to save audio file:', error);
    }
  }

  async waitForMessage(messageType, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for ${messageType}`));
      }, timeout);

      const originalHandler = this.handleMessage;
      this.handleMessage = (data) => {
        originalHandler.call(this, data);
        try {
          const message = JSON.parse(data.toString());
          // Handle both direct message types and status messages
          if (message.type === messageType ||
              (message.type === 'status' && message.status === messageType)) {
            clearTimeout(timer);
            this.handleMessage = originalHandler;
            resolve(message);
          }
        } catch (e) {
          // Ignore parse errors
        }
      };
    });
  }

  validateResults() {
    console.log('\n📋 Validating test results...');

    // Check responses
    const expectedAgents = ['dr-maya-wellness', 'nutritionist-sarah'];
    const receivedAgents = this.responses.map(r => r.agentId);

    for (const agent of expectedAgents) {
      if (!receivedAgents.includes(agent)) {
        throw new Error(`Missing response from agent: ${agent}`);
      }
    }

    // Check text content
    for (const response of this.responses) {
      if (!response.text || response.text.length < 10) {
        throw new Error(`Invalid response text from ${response.agentId}`);
      }
    }

    // Check audio files
    if (this.audioFiles.length !== this.responses.length) {
      throw new Error(`Audio count (${this.audioFiles.length}) doesn't match response count (${this.responses.length})`);
    }

    const totalTime = Date.now() - this.testStartTime;
    console.log(`✅ All validations passed in ${totalTime}ms`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the test
if (require.main === module) {
  const tester = new ConversationTester();
  tester.runTest().catch(console.error);
}

module.exports = ConversationTester;