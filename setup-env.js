#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🐻 Bearable AI Health Coach - Environment Setup\n');
console.log('This script will help you configure your API keys for real AI responses.\n');

const envPath = path.join(__dirname, '.env');
let envContent = '';

// Read existing .env file
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function updateEnvVariable(content, key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    return content.replace(regex, `${key}=${value}`);
  } else {
    return content + `\n${key}=${value}`;
  }
}

async function setup() {
  try {
    console.log('📝 API Key Configuration');
    console.log('----------------------------------------\n');

    // OpenAI API Key
    console.log('🤖 OpenAI API Key (Recommended)');
    console.log('   Get your API key from: https://platform.openai.com/api-keys');
    console.log('   This enables GPT-4 powered health coaching responses.\n');

    const openaiKey = await question('Enter your OpenAI API key (or press Enter to use demo mode): ');

    if (openaiKey.trim()) {
      envContent = updateEnvVariable(envContent, 'REACT_APP_OPENAI_API_KEY', openaiKey.trim());
      console.log('✅ OpenAI API key configured!\n');
    } else {
      envContent = updateEnvVariable(envContent, 'REACT_APP_OPENAI_API_KEY', 'demo-mode-no-key');
      console.log('ℹ️  Using demo mode - AI responses will be simulated.\n');
    }

    // Claude API Key (optional)
    console.log('🤖 Anthropic Claude API Key (Optional)');
    console.log('   Get your API key from: https://console.anthropic.com/');
    console.log('   This provides alternative AI responses using Claude.\n');

    const claudeKey = await question('Enter your Claude API key (or press Enter to skip): ');

    if (claudeKey.trim()) {
      envContent = updateEnvVariable(envContent, 'REACT_APP_CLAUDE_API_KEY', claudeKey.trim());
      console.log('✅ Claude API key configured!\n');
    } else {
      console.log('⏭️  Skipping Claude API configuration.\n');
    }

    // Write updated .env file
    fs.writeFileSync(envPath, envContent);

    console.log('🎉 Setup Complete!');
    console.log('----------------------------------------');
    console.log('Your API keys have been saved to .env file.');
    console.log('You can start the application with: npm start');
    console.log('\n💡 Tip: Your .env file is gitignored for security.');
    console.log('   Never share your API keys publicly!\n');

    // Check if server is running
    const serverRunning = await question('Would you like to start the development server now? (y/N): ');

    if (serverRunning.toLowerCase() === 'y' || serverRunning.toLowerCase() === 'yes') {
      console.log('\n🚀 Starting development server...\n');
      const { spawn } = require('child_process');
      const server = spawn('npm', ['start'], {
        stdio: 'inherit',
        shell: true
      });

      server.on('close', (code) => {
        console.log(`\n👋 Development server exited with code ${code}`);
        rl.close();
      });
    } else {
      console.log('\n👋 Setup complete! Run "npm start" when ready to begin.');
      rl.close();
    }

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    rl.close();
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
rl.on('SIGINT', () => {
  console.log('\n\n👋 Setup cancelled. Run this script again anytime!');
  rl.close();
  process.exit(0);
});

setup();