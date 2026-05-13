// api/ai/generate-message.js
// Deploy this to Vercel and set ANTHROPIC_API_KEY environment variable

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const TONE_DESCRIPTIONS = {
  warm:
    "Heartfelt and present. Show genuine care and attention. Make them feel seen.",
  gentle:
    "Soft and low-pressure. Let them know you care but give them space. No expectations.",
  light:
    "Casual and warm with light humor. Like a friend who's genuinely happy to see them.",
  unhinged:
    "Chaotic affection, lowercase, like a best friend who forgets to text but loves hard. Spontaneous and real.",
  serious:
    "Direct and genuine. No fluff. Just real care expressed clearly.",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { context, tone = "warm" } = req.body;

    if (!context || context.trim().length === 0) {
      return res.status(400).json({ error: "Context is required" });
    }

    const toneDesc = TONE_DESCRIPTIONS[tone] || TONE_DESCRIPTIONS.warm;

    const systemPrompt = `You generate text messages from one person to another. You know the context of why they're reaching out. Generate a single text message in the requested tone. 

Tone: ${toneDesc}

Never generic. Always specific to the context. Return ONLY the message text, no quotes, no explanation.`;

    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 200,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Context: ${context}\n\nGenerate a ${tone} message about this.`,
        },
      ],
    });

    const messageText =
      message.content[0].type === "text"
        ? message.content[0].text.trim()
        : "Hey, thinking of you ✦";

    res.status(200).json({ message: messageText });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
