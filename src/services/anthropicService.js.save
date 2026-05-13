import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// RATE LIMITING CONFIGURATION
// ============================================================================
// Google: 1,000 calls/month free = ~30/day (we use 20 to be safe)
// Groq: 14,400 calls/day free (plenty)
// HuggingFace: 2,000 calls/day free (plenty)

const GOOGLE_DAILY_LIMIT = 20; // Conservative: ~600/month, stays well under 1,000
const GOOGLE_MONTHLY_LIMIT = 600; // Hard cap for paranoia
const TRACKING_KEYS = {
  GOOGLE_DAILY: 'api_google_daily_tracker',
  GOOGLE_MONTHLY: 'api_google_monthly_tracker',
};

// ============================================================================
// RATE LIMITING HELPERS
// ============================================================================

const hasHitGoogleDailyLimit = async () => {
  try {
    const today = new Date().toDateString();
    const stored = await AsyncStorage.getItem(TRACKING_KEYS.GOOGLE_DAILY);

    if (!stored) {
      // First call today
      await AsyncStorage.setItem(
        TRACKING_KEYS.GOOGLE_DAILY,
        JSON.stringify({ date: today, count: 0 })
      );
      return false;
    }

    const data = JSON.parse(stored);

    // New day? Reset counter
    if (data.date !== today) {
      await AsyncStorage.setItem(
        TRACKING_KEYS.GOOGLE_DAILY,
        JSON.stringify({ date: today, count: 0 })
      );
      return false;
    }

    // Same day, check count
    return data.count >= GOOGLE_DAILY_LIMIT;
  } catch (error) {
    console.error('Error checking Google daily limit:', error);
    return false; // If error, allow the call (fail open)
  }
};

const hasHitGoogleMonthlyLimit = async () => {
  try {
    const thisMonth = new Date().toISOString().substring(0, 7); // "2026-05"
    const stored = await AsyncStorage.getItem(TRACKING_KEYS.GOOGLE_MONTHLY);

    if (!stored) {
      await AsyncStorage.setItem(
        TRACKING_KEYS.GOOGLE_MONTHLY,
        JSON.stringify({ month: thisMonth, count: 0 })
      );
      return false;
    }

    const data = JSON.parse(stored);

    // New month? Reset counter
    if (data.month !== thisMonth) {
      await AsyncStorage.setItem(
        TRACKING_KEYS.GOOGLE_MONTHLY,
        JSON.stringify({ month: thisMonth, count: 0 })
      );
      return false;
    }

    return data.count >= GOOGLE_MONTHLY_LIMIT;
  } catch (error) {
    console.error('Error checking Google monthly limit:', error);
    return false; // If error, allow the call (fail open)
  }
};

const incrementGoogleDailyCount = async () => {
  try {
    const stored = await AsyncStorage.getItem(TRACKING_KEYS.GOOGLE_DAILY);
    const data = JSON.parse(stored);
    data.count += 1;
    await AsyncStorage.setItem(TRACKING_KEYS.GOOGLE_DAILY, JSON.stringify(data));
  } catch (error) {
    console.error('Error incrementing Google daily count:', error);
  }
};

const incrementGoogleMonthlyCount = async () => {
  try {
    const stored = await AsyncStorage.getItem(TRACKING_KEYS.GOOGLE_MONTHLY);
    const data = JSON.parse(stored);
    data.count += 1;
    await AsyncStorage.setItem(TRACKING_KEYS.GOOGLE_MONTHLY, JSON.stringify(data));
  } catch (error) {
    console.error('Error incrementing Google monthly count:', error);
  }
};

// ============================================================================
// API CALLERS
// ============================================================================

// GOOGLE GEMINI
const parseWithGoogle = async (transcript) => {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_API_KEY not set');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are a context parser for a relationship app. Given a voice transcript, extract the following in valid JSON format:
- name: The person's name mentioned (or null if it's a task)
- context: Emotional context as one sentence
- suggestedTiming: A follow-up timing string like "1 month", "3 months", "6 months", "1 year"
- category: One of "person", "errand", "creative", "life admin", "self care"

Return ONLY valid JSON with these keys and nothing else.

Transcript: ${transcript}`,
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Google API error: ${response.status}`);
  }

  const data = await response.json();
  const responseText =
    data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

  try {
    return JSON.parse(responseText);
  } catch (error) {
    return {
      name: null,
      context: 'A moment worth remembering',
      suggestedTiming: '1 month',
      category: 'person',
    };
  }
};

const generateWithGoogle = async (context, tone = 'warm') => {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_API_KEY not set');

  const toneDescriptions = {
    warm: 'Heartfelt and present. Show genuine care and attention. Make them feel seen.',
    gentle: 'Soft and low-pressure. Let them know you care but give them space. No expectations.',
    light: 'Casual and warm with light humor. Like a friend who is genuinely happy to see them.',
    unhinged:
      'Chaotic affection, lowercase, like a best friend who forgets to text but loves hard. Spontaneous and real.',
    serious: 'Direct and genuine. No fluff. Just real care expressed clearly.',
  };

  const toneDesc = toneDescriptions[tone] || toneDescriptions.warm;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You generate text messages from one person to another. You know the context of why they're reaching out. Generate a single text message in the requested tone.

Tone: ${toneDesc}

Never generic. Always specific to the context. Return ONLY the message text, no quotes, no explanation.

Context: ${context}`,
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Google API error: ${response.status}`);
  }

  const data = await response.json();
  const message =
    data.candidates?.[0]?.content?.parts?.[0]?.text || 'Hey, thinking of you ✦';

  return message.trim();
};

// GROQ
const parseWithGroq = async (transcript) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'mixtral-8x7b-32768',
      messages: [
        {
          role: 'system',
          content: `You are a context parser for a relationship app. Given a voice transcript, extract the following in valid JSON format:
- name: The person's name mentioned (or null if it's a task)
- context: Emotional context as one sentence
- suggestedTiming: A follow-up timing string like "1 month", "3 months", "6 months", "1 year"
- category: One of "person", "errand", "creative", "life admin", "self care"

Return ONLY valid JSON with these keys and nothing else.`,
        },
        {
          role: 'user',
          content: transcript,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const responseText = data.choices?.[0]?.message?.content || '{}';

  try {
    return JSON.parse(responseText);
  } catch (error) {
    return {
      name: null,
      context: 'A moment worth remembering',
      suggestedTiming: '1 month',
      category: 'person',
    };
  }
};

const generateWithGroq = async (context, tone = 'warm') => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const toneDescriptions = {
    warm: 'Heartfelt and present. Show genuine care and attention. Make them feel seen.',
    gentle: 'Soft and low-pressure. Let them know you care but give them space. No expectations.',
    light: 'Casual and warm with light humor. Like a friend who is genuinely happy to see them.',
    unhinged:
      'Chaotic affection, lowercase, like a best friend who forgets to text but loves hard. Spontaneous and real.',
    serious: 'Direct and genuine. No fluff. Just real care expressed clearly.',
  };

  const toneDesc = toneDescriptions[tone] || toneDescriptions.warm;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'mixtral-8x7b-32768',
      messages: [
        {
          role: 'system',
          content: `You generate text messages from one person to another. You know the context of why they're reaching out. Generate a single text message in the requested tone.

Tone: ${toneDesc}

Never generic. Always specific to the context. Return ONLY the message text, no quotes, no explanation.`,
        },
        {
          role: 'user',
          content: `Context: ${context}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message?.content || 'Hey, thinking of you ✦';

  return message.trim();
};

// HUGGINGFACE
const parseWithHuggingFace = async (transcript) => {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error('HUGGINGFACE_API_KEY not set');

  const response = await fetch(
    'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1',
    {
      headers: { Authorization: `Bearer ${apiKey}` },
      method: 'POST',
      body: JSON.stringify({
        inputs: `You are a context parser for a relationship app. Given a voice transcript, extract the following in valid JSON format:
- name: The person's name mentioned (or null if it's a task)
- context: Emotional context as one sentence
- suggestedTiming: A follow-up timing string like "1 month", "3 months", "6 months", "1 year"
- category: One of "person", "errand", "creative", "life admin", "self care"

Return ONLY valid JSON with these keys and nothing else.

Transcript: ${transcript}`,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`HuggingFace API error: ${response.status}`);
  }

  const data = await response.json();
  const responseText =
    Array.isArray(data) && data[0]?.generated_text
      ? data[0].generated_text
      : '{}';

  try {
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {
      name: null,
      context: 'A moment worth remembering',
      suggestedTiming: '1 month',
      category: 'person',
    };
  } catch (error) {
    return {
      name: null,
      context: 'A moment worth remembering',
      suggestedTiming: '1 month',
      category: 'person',
    };
  }
};

const generateWithHuggingFace = async (context, tone = 'warm') => {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error('HUGGINGFACE_API_KEY not set');

  const toneDescriptions = {
    warm: 'Heartfelt and present. Show genuine care and attention. Make them feel seen.',
    gentle: 'Soft and low-pressure. Let them know you care but give them space. No expectations.',
    light: 'Casual and warm with light humor. Like a friend who is genuinely happy to see them.',
    unhinged:
      'Chaotic affection, lowercase, like a best friend who forgets to text but loves hard. Spontaneous and real.',
    serious: 'Direct and genuine. No fluff. Just real care expressed clearly.',
  };

  const toneDesc = toneDescriptions[tone] || toneDescriptions.warm;

  const response = await fetch(
    'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1',
    {
      headers: { Authorization: `Bearer ${apiKey}` },
      method: 'POST',
      body: JSON.stringify({
        inputs: `You generate text messages from one person to another. You know the context of why they're reaching out. Generate a single text message in the requested tone.

Tone: ${toneDesc}

Never generic. Always specific to the context. Return ONLY the message text, no quotes, no explanation.

Context: ${context}`,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`HuggingFace API error: ${response.status}`);
  }

  const data = await response.json();
  const message =
    Array.isArray(data) && data[0]?.generated_text
      ? data[0].generated_text
      : 'Hey, thinking of you ✦';

  return message.trim();
};

// ============================================================================
// PUBLIC EXPORTS (Same interface as before)
// ============================================================================

export const parseVoiceTranscript = async (transcript) => {
  try {
    // Check if we've hit Google limits
    const hitDailyLimit = await hasHitGoogleDailyLimit();
    const hitMonthlyLimit = await hasHitGoogleMonthlyLimit();

    if (!hitDailyLimit && !hitMonthlyLimit) {
      // Try Google first
      try {
        console.log('🔵 Using Google API');
        const result = await parseWithGoogle(transcript);
        await incrementGoogleDailyCount();
        await incrementGoogleMonthlyCount();
        return result;
      } catch (error) {
        console.warn('Google API failed, falling back to Groq:', error.message);
      }
    } else {
      console.log('⚠️ Google daily/monthly limit hit, using Groq');
    }

    // Try Groq
    try {
      console.log('🟠 Using Groq API');
      return await parseWithGroq(transcript);
    } catch (error) {
      console.warn('Groq API failed, falling back to HuggingFace:', error.message);
    }

    // Fallback to HuggingFace
    console.log('🟡 Using HuggingFace API');
    return await parseWithHuggingFace(transcript);
  } catch (error) {
    console.error('All APIs failed, returning fallback:', error);
    return {
      name: null,
      context: 'A moment worth remembering',
      suggestedTiming: '1 month',
      category: 'person',
    };
  }
};

export const generateMessage = async (context, tone = 'warm') => {
  try {
    // Check if we've hit Google limits
    const hitDailyLimit = await hasHitGoogleDailyLimit();
    const hitMonthlyLimit = await hasHitGoogleMonthlyLimit();

    if (!hitDailyLimit && !hitMonthlyLimit) {
      // Try Google first
      try {
        console.log('🔵 Using Google API for message generation');
        const result = await generateWithGoogle(context, tone);
        await incrementGoogleDailyCount();
        await incrementGoogleMonthlyCount();
        return result;
      } catch (error) {
        console.warn('Google API failed, falling back to Groq:', error.message);
      }
    } else {
      console.log('⚠️ Google daily/monthly limit hit, using Groq for message');
    }

    // Try Groq
    try {
      console.log('🟠 Using Groq API for message generation');
      return await generateWithGroq(context, tone);
    } catch (error) {
      console.warn('Groq API failed, falling back to HuggingFace:', error.message);
    }

    // Fallback to HuggingFace
    console.log('🟡 Using HuggingFace API for message generation');
    return await generateWithHuggingFace(context, tone);
  } catch (error) {
    console.error('All APIs failed, returning fallback:', error);
    return 'Hey, thinking of you ✦';
  }
};

export const parseTaskTranscript = async (transcript) => {
  try {
    // Check if we've hit Google limits
    const hitDailyLimit = await hasHitGoogleDailyLimit();
    const hitMonthlyLimit = await hasHitGoogleMonthlyLimit();

    if (!hitDailyLimit && !hitMonthlyLimit) {
      // Try Google first
      try {
        console.log('🔵 Using Google API for task parsing');
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are a task parser. Given a voice transcript about a task, extract:
- text: The task description (concise)
- category: One of "errand", "creative", "life admin", "self care"
- suggestedTiming: When to do it, like "today", "this week", "next month"

Return ONLY valid JSON with these keys.

Transcript: ${transcript}`,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const responseText =
            data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
          const parsed = JSON.parse(responseText);
          await incrementGoogleDailyCount();
          await incrementGoogleMonthlyCount();
          return parsed;
        }
      } catch (error) {
        console.warn('Google API failed, falling back to Groq:', error.message);
      }
    }

    // Try Groq
    try {
      console.log('🟠 Using Groq API for task parsing');
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [
            {
              role: 'system',
              content: `You are a task parser. Given a voice transcript about a task, extract:
- text: The task description (concise)
- category: One of "errand", "creative", "life admin", "self care"
- suggestedTiming: When to do it, like "today", "this week", "next month"

Return ONLY valid JSON with these keys.`,
            },
            {
              role: 'user',
              content: transcript,
            },
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const responseText = data.choices?.[0]?.message?.content || '{}';
        return JSON.parse(responseText);
      }
    } catch (error) {
      console.warn('Groq API failed, falling back to HuggingFace:', error.message);
    }

    // Fallback
    return {
      text: transcript,
      category: 'life admin',
      suggestedTiming: 'this week',
    };
  } catch (error) {
    console.error('Task parsing failed:', error);
    return {
      text: transcript,
      category: 'life admin',
      suggestedTiming: 'this week',
    };
  }
};
