import { GoogleGenAI } from '@google/genai';
import { saveHealthLog } from './db.js';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('⚠️  GEMINI_API_KEY not set. Self-Healing Sentinel will be disabled.');
}
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function healDocPayload(rawPayload: any, errorDetails: string) {
  const prompt = `
You are an Autonomous Scraper Self-Healing Sentinel.
The scraper failed schema validation with error: ${errorDetails}.

Raw HTML Snippet:
${rawPayload.rawHtmlSnippet || 'No HTML provided'}

Task:
1. Parse the HTML and extract missing fields: 'title', 'version', 'codeBlocks' (array of strings), 'breakingChanges' (array of {heading, content}).
2. Identify why the selector failed and suggest a corrected CSS selector patch.

Return JSON strictly matching this schema:
{
  "repairedData": {
    "title": "...",
    "version": "...",
    "codeBlocks": ["..."],
    "breakingChanges": [{"heading": "...", "content": "..."}]
  },
  "brokenSelector": "unknown",
  "repairedSelector": "...",
  "explanation": "..."
}`;

  if (!ai) {
    throw new Error('Gemini API key not configured. Set GEMINI_API_KEY in .env');
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error('Empty response from Gemini');
    // Strip markdown code fences if present
    const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    const result = JSON.parse(cleaned);

    // Save telemetry
    saveHealthLog({
      scraper_name: 'DocuVerse',
      status: 'HEALED_BY_AI',
      broken_selector: result.brokenSelector,
      repaired_selector: result.repairedSelector,
      log_message: result.explanation
    });

    return {
      url: rawPayload.url || 'unknown-url',
      ...result.repairedData
    };
  } catch (err: any) {
    saveHealthLog({
      scraper_name: 'DocuVerse',
      status: 'FAILED',
      log_message: `Healing failed: ${err.message}`
    });
    throw new Error('Self-healing failed: ' + err.message);
  }
}
