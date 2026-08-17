import db from './db.js';

// Extremely simplified RAG (Keyword-based for hackathon purposes)
// In production, this would use embeddings (e.g. text-embedding-3-small) and pgvector or Milvus.

export function queryRag(question: string) {
  const terms = question.toLowerCase().split(' ').filter(t => t.length > 3);
  if (terms.length === 0) return { context: "No specific keywords found." };

  const allDocs = db.prepare('SELECT title, version, raw_json FROM scraped_docs').all() as any[];
  
  const matches = allDocs.filter(doc => {
    const contentStr = doc.raw_json ? doc.raw_json.toLowerCase() : '';
    return terms.some(term => contentStr.includes(term) || (doc.title && doc.title.toLowerCase().includes(term)));
  }).slice(0, 3); // top 3 matches

  if (matches.length === 0) {
    return { context: "No documentation found relevant to your query." };
  }

  const context = matches.map(m => {
    try {
      const parsed = JSON.parse(m.raw_json);
      return `Source: ${m.title} (v${m.version})\nContent: ${JSON.stringify(parsed.breakingChanges || [])}\nSnippets: ${JSON.stringify(parsed.codeBlocks || [])}`;
    } catch {
      return `Source: ${m.title}`;
    }
  }).join('\n\n');

  return { context };
}
