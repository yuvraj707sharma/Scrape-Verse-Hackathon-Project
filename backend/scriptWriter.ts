import { GoogleGenAI } from '@google/genai';
import db from './db.js';

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function generateMediaScript(topic: string, format: 'blog' | 'youtube' | 'newsletter') {
  // Fetch latest trends and doc changes from DB to ground the script
  const recentTrends = db.prepare('SELECT repo_name, description FROM tech_trends ORDER BY created_at DESC LIMIT 5').all();
  const recentDocs = db.prepare('SELECT title, version FROM scraped_docs ORDER BY created_at DESC LIMIT 3').all();

  const prompt = `
You are an expert Tech Media Writer.
Target Format: ${format}
Topic: ${topic}

Context Data (Recent Trends):
${JSON.stringify(recentTrends, null, 2)}

Context Data (Recent API Docs/Releases):
${JSON.stringify(recentDocs, null, 2)}

Task:
Generate a publication-ready Markdown ${format}. 
If format is 'youtube', include visual cues [VISUAL: ...].
If format is 'blog', use strong headers and code context.
If format is 'newsletter', make it concise and scannable.
Ensure it mentions some of the context data if relevant.
`;

  if (!ai) {
    throw new Error('Script generation failed: GEMINI_API_KEY not set in .env');
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt
    });

    const markdownOutput = response.text || 'Failed to generate content.';

    // Save to database
    const insert = db.prepare(`
      INSERT INTO media_scripts (id, topic, format, markdown_output)
      VALUES (?, ?, ?, ?)
    `);
    insert.run(crypto.randomUUID(), topic, format, markdownOutput);

    return { markdownOutput };
  } catch (err: any) {
    throw new Error('Script generation failed: ' + err.message);
  }
}
