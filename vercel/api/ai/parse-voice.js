// api/ai/parse-voice.js
// Deploy this to Vercel and set ANTHROPIC_API_KEY environment variable

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { transcript } = req.body;

    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ error: "Transcript is required" });
    }

    const systemPrompt = `You are a context parser for a relationship app. Given a voice transcript, extract the following in valid JSON format:
- name: The person's name mentioned (or null if it's a task)
- context: Emotional context as one sentence
- suggestedTiming: A follow-up timing string like "1 month", "3 months", "6 months", "1 year"
- category: One of "person", "errand", "creative", "life admin", "self care"

Return ONLY valid JSON with these keys and nothing else.`;

    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 200,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: transcript,
        },
      ],
    });

    // Extract text content
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (error) {
      // Fallback if parsing fails
      parsed = {
        name: null,
        context: "A moment worth remembering",
        suggestedTiming: "1 month",
        category: "person",
      };
    }

    res.status(200).json(parsed);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
