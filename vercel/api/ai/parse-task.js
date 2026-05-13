// api/ai/parse-task.js

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

    const systemPrompt = `You are a task parser. Given a voice transcript about a task, extract:
- text: The task description (concise)
- category: One of "errand", "creative", "life admin", "self care"
- suggestedTiming: When to do it, like "today", "this week", "next month"

Return ONLY valid JSON with these keys.`;

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

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (error) {
      parsed = {
        text: transcript,
        category: "life admin",
        suggestedTiming: "this week",
      };
    }

    res.status(200).json(parsed);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
