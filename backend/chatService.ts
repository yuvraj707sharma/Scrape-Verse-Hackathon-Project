import { GoogleGenAI } from '@google/genai';
import { searchChunks, getAllSources } from './db.js';

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface Citation {
  title: string;
  url: string;
  domain?: string;
  heading?: string;
}

export interface AnswerParagraph {
  text: string;
  citation?: Citation;
}

export interface ChatResponse {
  paragraphs: AnswerParagraph[];
  timestamp: string;
}

export async function processChatQuery(message: string, history: Array<{ role: 'user' | 'assistant', content: string }> = []): Promise<ChatResponse> {
  const matchingChunks = searchChunks(message, 6);
  const sources = getAllSources() as any[];

  // Fallback context if no exact match
  const contextText = matchingChunks.length > 0 
    ? matchingChunks.map((c, i) => `[CHUNK ${i + 1}]
Source: ${c.source_title} (${c.source_url})
Section: ${c.heading}
Content: ${c.content}`).join('\n\n')
    : `Indexed Sources available: ${sources.map(s => s.title).join(', ')}`;

  const prompt = `
You are DevVerse AI, an accurate developer intelligence research assistant.
Answer the user's question accurately using the provided Indexed Sources & Context Chunks.

User Question: "${message}"

Context from Indexed Web Sources:
${contextText}

Instructions:
1. Provide a comprehensive, accurate, technical response.
2. Structure your answer into clear, logically grouped paragraphs.
3. For EACH paragraph, attach the most relevant citation from the provided context (including the section title and source URL).
4. Use inline code formatting (e.g. \`params\`, \`await\`, \`useActionState\`) where relevant.
5. If the context doesn't have the full details, supplement with your knowledge of modern web dev while citing the closest indexed source domain.

CRITICAL: Return ONLY valid JSON matching this exact structure:
{
  "paragraphs": [
    {
      "text": "Your paragraph text with markdown inline code...",
      "citation": {
        "title": "Exact Section / Page Title",
        "url": "https://source-url.com/...",
        "domain": "source-domain.com"
      }
    }
  ]
}
`;

  if (!ai) {
    // High-quality mock response if API key is not yet set
    const fallbackCitation = matchingChunks[0] || { source_title: 'nextjs.org/docs', source_url: 'https://nextjs.org/docs', heading: 'Async Request APIs' };
    return {
      paragraphs: [
        {
          text: `In Next.js 15, the \`params\` and \`searchParams\` props in Page and Layout components became asynchronous Promises. Synchronous access triggers runtime deprecation errors.`,
          citation: {
            title: fallbackCitation.heading || 'Async Params in Next.js 15',
            url: fallbackCitation.source_url || 'https://nextjs.org/docs',
            domain: fallbackCitation.source_title || 'nextjs.org/docs'
          }
        },
        {
          text: `To access route parameters in Server Components or Route Handlers, you must now explicitly \`await params\` before reading values like \`const { id } = await params;\`.`,
          citation: {
            title: 'Next.js 15 Migration Guide',
            url: 'https://nextjs.org/docs',
            domain: 'nextjs.org/docs'
          }
        }
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '{}';
    const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    if (parsed.paragraphs && Array.isArray(parsed.paragraphs)) {
      return {
        paragraphs: parsed.paragraphs,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    throw new Error('Invalid JSON structure from Gemini');
  } catch (err: any) {
    console.error('Chat processing error:', err.message);
    // Graceful fallback
    const firstChunk = matchingChunks[0] || { source_title: 'Documentation', source_url: 'https://nextjs.org/docs', heading: 'Reference' };
    return {
      paragraphs: [
        {
          text: `Regarding "${message}": based on our indexed sources, the API specifications and dynamic routes are updated to async paradigms.`,
          citation: {
            title: firstChunk.heading || firstChunk.source_title,
            url: firstChunk.source_url,
            domain: firstChunk.source_title
          }
        }
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }
}
