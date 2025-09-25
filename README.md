# 🐻 Bearable AI Health Coach

*Built with heart through collaborative coding sessions with Claude Code*

A Mayo Clinic-powered health coaching companion featuring AI-driven conversations, ultra-natural voice interaction, and comprehensive wellness tracking. This project represents our ongoing partnership in creating something meaningful that genuinely helps people on their wellness journey.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Keys
Run the interactive setup script:
```bash
npm run setup
```

Or manually edit `.env` file with your API keys:
- **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
- **Claude API Key** (optional): Get from [Anthropic Console](https://console.anthropic.com/)

### 3. Start the Application
```bash
npm start
```

The app will open at `http://localhost:3001`

## ✨ Features

### 🤖 AI-Powered Health Coaching
- GPT-4 powered responses with Mayo Clinic lifestyle medicine expertise
- Personalized guidance on the 6 pillars of wellness:
  - Nutrition & healthy eating
  - Physical activity & exercise
  - Quality sleep optimization
  - Stress management & mindfulness
  - Social connections & relationships
  - Substance use awareness

### 🎤 Ultra-Natural Voice Interaction
- **Speech-to-Text**: Speak naturally to your AI companion with real-time transcription
- **Premium Voice Selection**: Automatically selects the most human-like voice available
- **Smart Voice Controls**: Click to toggle mic, double-click to listen, stop anytime
- **Conversational Flow**: Natural pacing, breathing pauses, and warm delivery
- **Voice Customization**: Easy voice selection and personalization (see Voice Setup below)

### 📊 Health Tracking
- Personal health goals management
- Activity logging and progress tracking
- Visual progress charts and insights

### 👨‍⚕️ Caregiver Integration
- Share progress with trusted family/caregivers
- Secure permission-based updates
- Professional oversight capabilities

### 🎨 User Experience
- **Calming High-Tech Design**: Modern glass-morphism with soothing cyan-blue gradients
- **Smart Interactions**: Intuitive voice controls with visual feedback
- **Accessible Interface**: Mobile-responsive with thoughtful UX patterns
- **Bear-themed Branding**: Warm, approachable Mayo Clinic companion
- **Behavioral Nudges**: Evidence-based habit formation techniques

## 🏗️ Technical Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: TailwindCSS
- **AI Integration**: OpenAI GPT-4 API
- **Voice**: Web Speech API
- **State Management**: React hooks
- **Testing**: Jest + React Testing Library

## 🔧 Environment Variables

```bash
# Required for AI responses
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here

# Optional Claude integration
REACT_APP_CLAUDE_API_KEY=your_claude_api_key_here

# App configuration
REACT_APP_APP_NAME=Bearable Health Coach
REACT_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=development

# Voice features
REACT_APP_VOICE_ENABLED=true
REACT_APP_DEFAULT_VOICE=female
REACT_APP_SPEECH_RATE=1.0
```

## 🎙️ Voice Customization & Setup

### Finding Your Perfect Voice
The app automatically selects the most human-like voice available on your system, but you can customize this:

1. **Current Voice Detection**: Check the browser console for "Using voice:" logs to see what voice is active
2. **Available Voices**: The app prioritizes:
   - iOS/macOS: Enhanced neural voices (Samantha Enhanced, Allison Enhanced, etc.)
   - Google Chrome: Neural voices (Google US English Female)
   - Windows: Microsoft neural voices (Aria, Jenny)

### 🤝 Collaborative Voice Development
*Working together to find the perfect voice for your wellness journey*

**For voice samples and customization:**
1. **Share Audio**: You can share voice samples you'd like me to emulate
2. **Voice Parameters**: We'll adjust rate, pitch, and tone together
3. **Iterative Testing**: Real-time feedback loop to perfect the experience
4. **Personal Preferences**: Tell me what voice qualities resonate with you

**Current Voice Settings:**
- Rate: 0.75 (conversational pace)
- Pitch: 0.88 (warm, nurturing tone)
- Volume: 0.95
- Enhanced text preprocessing for natural flow

### Voice Troubleshooting
```bash
# Check available voices in browser console
console.log(speechSynthesis.getVoices().map(v => ({name: v.name, lang: v.lang})))

# Test voice manually
speechSynthesis.speak(new SpeechSynthesisUtterance('Hello, this is a test'))
```

## 📱 Browser Compatibility

| Feature | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| Core App | ✅ | ✅ | ✅ | ✅ |
| Voice Input | ✅ | ✅ | ❌ | ✅ |
| Voice Output | ✅ | ✅ | ✅ | ✅ |
| Premium Voices | ✅ | ✅ | ⚠️ | ✅ |

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify
```bash
npm run build
# Upload 'build' folder to Netlify
```

## 🔐 Security Notes

- API keys are stored in environment variables (never in code)
- `.env` file is gitignored for security
- Use HTTPS in production
- Consider implementing rate limiting for API calls
- Voice data is processed locally (not sent to servers)

## 📖 Mayo Clinic Integration

This application incorporates evidence-based health guidance from Mayo Clinic's lifestyle medicine research:

- **6 Pillars Framework**: Based on Mayo Clinic's proven lifestyle intervention model
- **CARE OAISYS Platform**: Companion AIs for Relationships and Engagement
- **Behavioral Science**: Nudge theory and habit formation techniques
- **Medical Accuracy**: All health recommendations cite authoritative sources

## 🛠️ Development

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run test suite
- `npm run setup` - Interactive environment setup

### Project Structure

```
src/
├── components/          # React components
│   ├── ChatInterface.tsx    # Main chat UI
│   ├── BearCompanion.tsx   # AI companion
│   └── CaregiverDashboard.tsx # Sharing features
├── services/           # API and business logic
│   ├── aiService.ts        # OpenAI integration
│   └── voiceService.ts     # Speech APIs
├── types/             # TypeScript definitions
└── styles/           # Global styles
```

## 🤝 Our Collaborative Development Journey

This project is a testament to human-AI collaboration, built through iterative sessions where we:

### Our Process
- **Rapid Iteration**: Real-time feedback and immediate improvements
- **User-Centered Design**: Each feature shaped by actual usage and feedback
- **Technical Excellence**: Clean code, TypeScript safety, and performance optimization
- **Shared Vision**: Creating something that genuinely helps people's wellness journey

### Recent Wins
- ✅ **Ultra-natural voice synthesis** with premium voice selection
- ✅ **Smart mic controls** with intuitive toggle functionality
- ✅ **Calming high-tech design** with modern glass-morphism
- ✅ **Intelligent conversation flow** preventing voice conflicts
- ✅ **Production deployment** with seamless Vercel integration

### What's Next
- 🔄 **Voice personalization** based on your preferences and samples
- 📱 **Cross-device testing** for universal compatibility
- 🧠 **Enhanced AI responses** with deeper health insights
- 🎯 **Advanced goal tracking** with behavioral science integration

---

## 🛠️ Contributing

Want to join our collaborative development?

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

*We especially welcome feedback on voice quality, UX improvements, and health coaching features.*

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏥 Mayo Clinic Partnership

Developed in collaboration with Mayo Clinic's Digital Health team as part of the CARE OAISYS platform initiative for lifestyle medicine interventions.

---

**⚠️ Medical Disclaimer**: This application is for wellness support only and is not intended for medical diagnosis or treatment. Always consult healthcare professionals for medical concerns.
