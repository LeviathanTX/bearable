import OpenAI from 'openai';

// Initialize OpenAI client
const getOpenAI = () => {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  if (!apiKey || apiKey === 'demo-mode-no-key') {
    return null;
  }
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
  });
};

// Mayo Clinic Health Coach System Prompt
const SYSTEM_PROMPT = `You are Bearable AI, a compassionate health coaching companion powered by Mayo Clinic's lifestyle medicine expertise. You help users improve their health through evidence-based guidance focusing on the 6 pillars of lifestyle medicine:

1. **Nutrition** - Whole food, plant-rich diets
2. **Physical Activity** - Regular movement and exercise
3. **Sleep** - Quality rest and recovery
4. **Stress Management** - Mindfulness and coping strategies
5. **Social Connection** - Relationships and community
6. **Substance Avoidance** - Limiting harmful substances

## Your Personality & Approach:
- Warm, supportive, and encouraging (like a caring friend + medical expert)
- Use behavioral economics principles for sustainable change
- Provide specific, actionable advice with Mayo Clinic backing
- Always cite sources when giving medical/health information
- Celebrate small wins and progress
- Use appropriate emojis to be engaging but professional
- Keep responses conversational but informative (2-4 sentences usually)

## Key Guidelines:
- ALWAYS emphasize you're for wellness support, not medical diagnosis/treatment
- Encourage users to consult healthcare providers for medical concerns
- Focus on lifestyle interventions and preventive health
- Use motivational interviewing techniques
- Be culturally sensitive and inclusive
- Adapt communication style to user preferences

## Response Format:
- Lead with empathy and understanding
- Provide evidence-based guidance
- Include a clear, actionable next step
- End with encouragement or a relevant question

Remember: You're their health journey companion, not their doctor. Focus on sustainable lifestyle changes that align with Mayo Clinic's proven approaches to wellness.`;

export interface AIResponse {
  content: string;
  sources: string[];
  confidence: number;
  suggestions?: string[];
}

export class AIService {
  private openai: OpenAI | null;

  constructor() {
    this.openai = getOpenAI();
    if (this.openai) {
      console.log('✅ AI Service initialized with OpenAI API');
    } else {
      console.log('⚠️ AI Service running in demo mode (no API key)');
    }
  }

  async generateResponse(
    userMessage: string,
    context?: {
      userName?: string;
      healthGoals?: string[];
      recentActivity?: string[];
      emotionalState?: string;
    }
  ): Promise<AIResponse> {
    // If no API key, fall back to demo responses
    if (!this.openai) {
      return this.getDemoResponse(userMessage);
    }

    try {
      console.log('🤖 AI Service: Making OpenAI API call...');

      // Build context-aware prompt
      let contextPrompt = '';
      if (context) {
        contextPrompt = `\n\nUser Context:
${context.userName ? `- User's name: ${context.userName}` : ''}
${context.healthGoals?.length ? `- Current health goals: ${context.healthGoals.join(', ')}` : ''}
${context.recentActivity?.length ? `- Recent activities: ${context.recentActivity.join(', ')}` : ''}
${context.emotionalState ? `- Current emotional state: ${context.emotionalState}` : ''}`;
      }

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini", // Use cheaper, faster model for health coaching
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextPrompt },
          { role: "user", content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 400,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      const content = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response right now. Please try again.";
      console.log('✅ AI Service: OpenAI response received');

      return {
        content,
        sources: ['Mayo Clinic Lifestyle Medicine', 'Bearable AI'],
        confidence: 0.95,
        suggestions: this.generateSuggestions(userMessage)
      };

    } catch (error) {
      console.error('❌ AI Service Error:', error);
      console.log('🔄 AI Service: Falling back to demo response');
      return this.getDemoResponse(userMessage);
    }
  }

  private getDemoResponse(userMessage: string): AIResponse {
    const message = userMessage.toLowerCase();

    // Enhanced demo responses with Mayo Clinic backing
    if (message.includes('sleep') || message.includes('tired') || message.includes('insomnia')) {
      return {
        content: "Sleep is so important for your overall health! 😴 Mayo Clinic research shows that 7-9 hours of quality sleep can improve immune function, mental clarity, and even help with weight management.\n\nHere are my top 3 evidence-based tips:\n• Keep a consistent bedtime (even on weekends!) 🕘\n• Create a cool, dark environment (60-67°F is ideal) 🌡️\n• Try a 'wind-down' routine 30 minutes before bed 📚\n\nWhat's your biggest sleep challenge right now?",
        sources: ['Mayo Clinic Sleep Medicine', 'American Sleep Foundation'],
        confidence: 0.92,
        suggestions: ['Help me create a bedtime routine', 'Why is sleep so important?', 'I have trouble falling asleep']
      };
    }

    if (message.includes('stress') || message.includes('anxious') || message.includes('worry')) {
      return {
        content: "I hear you on the stress - you're definitely not alone in feeling this way. 🤗 Mayo Clinic's research shows that chronic stress can impact everything from your heart health to your immune system.\n\nLet's try something simple right now: Take 3 deep breaths with me (4 seconds in, 6 seconds out). Ready? 🌬️\n\nFor ongoing stress management, I love recommending:\n• 10-minute daily mindfulness practice 🧘‍♀️\n• Regular movement (even a 5-minute walk helps!) 🚶‍♀️\n• Connecting with someone you trust 💙\n\nWhat usually helps you feel most calm?",
        sources: ['Mayo Clinic Stress Management Program', 'American Psychological Association'],
        confidence: 0.94,
        suggestions: ['Teach me a breathing exercise', 'Help me manage work stress', 'What are signs of too much stress?']
      };
    }

    if (message.includes('nutrition') || message.includes('food') || message.includes('eat') || message.includes('meal')) {
      return {
        content: "Nutrition is one of my favorite topics because small changes can make such a big difference! 🥗 Mayo Clinic's approach emphasizes whole foods that nourish your body and mind.\n\nThe Mediterranean-style eating pattern is gold standard:\n• Fill half your plate with colorful vegetables 🌈\n• Choose whole grains over refined ones 🌾\n• Include healthy fats like olive oil, nuts, and avocados 🥑\n• Aim for lean proteins (fish, beans, poultry) 🐟\n\nWhat's one small nutrition goal we could work on together this week?",
        sources: ['Mayo Clinic Nutrition Guidelines', 'Mediterranean Diet Research'],
        confidence: 0.96,
        suggestions: ['Help me meal plan', 'What are the best snacks?', 'How much water should I drink?']
      };
    }

    if (message.includes('exercise') || message.includes('workout') || message.includes('active') || message.includes('move')) {
      return {
        content: "Movement is medicine! 💪 I love that you're thinking about staying active. Mayo Clinic recommends 150 minutes of moderate activity per week, but here's the beautiful thing - it all adds up!\n\nStart where you are:\n• 10-minute walks after meals (great for blood sugar!) 🚶‍♀️\n• Take stairs when possible 🏃‍♀️\n• Park farther away or get off transit one stop early 🚗\n• Try 'exercise snacks' - 2-3 minutes of movement every hour ⏰\n\nRemember: The best exercise is the one you'll actually do consistently. What activities do you enjoy most?",
        sources: ['Mayo Clinic Physical Activity Guidelines', 'American Heart Association'],
        confidence: 0.93,
        suggestions: ['Create a workout plan', 'I hate exercise, help!', 'Best exercises for beginners']
      };
    }

    // Default response
    return {
      content: `Hi there! I'm so glad you're here and prioritizing your health journey. 🌟 As your Bearable AI companion, I'm here to support you with evidence-based guidance from Mayo Clinic's lifestyle medicine experts.\n\nI can help with:\n• Sleep optimization & better rest 😴\n• Stress management & mindfulness 🧘‍♀️\n• Nutrition guidance & meal planning 🥗\n• Movement & exercise motivation 💪\n• Building healthy habits that stick 🎯\n\nWhat would you like to focus on first? I'm here to meet you exactly where you are!`,
      sources: ['Mayo Clinic Lifestyle Medicine', 'Bearable AI Health Coach'],
      confidence: 0.90,
      suggestions: ['Help me sleep better', 'I\'m feeling stressed', 'Improve my nutrition', 'Start exercising more']
    };
  }

  private generateSuggestions(userMessage: string): string[] {
    const message = userMessage.toLowerCase();

    if (message.includes('sleep')) {
      return ['Create a bedtime routine', 'Why is sleep important?', 'I have trouble falling asleep'];
    }
    if (message.includes('stress')) {
      return ['Teach me breathing exercises', 'Help with work stress', 'Mindfulness tips'];
    }
    if (message.includes('food') || message.includes('nutrition')) {
      return ['Help me meal plan', 'Healthy snack ideas', 'How much water daily?'];
    }
    if (message.includes('exercise')) {
      return ['Create workout plan', 'I hate exercise', 'Best beginner exercises'];
    }

    return ['Tell me about healthy habits', 'What are your top health tips?', 'How can I stay motivated?'];
  }

  // Check if real AI is available
  isRealAIAvailable(): boolean {
    return this.openai !== null;
  }

  // Get current AI status for UI
  getAIStatus(): { type: 'real' | 'demo', message: string } {
    if (this.openai) {
      return { type: 'real', message: 'Connected to OpenAI GPT-4' };
    }
    return {
      type: 'demo',
      message: 'Demo mode - Add OpenAI API key for real AI responses'
    };
  }
}