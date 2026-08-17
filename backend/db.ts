import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../devverse.db');
const db = new Database(dbPath, { verbose: console.log });
db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS scraped_docs (
    id TEXT PRIMARY KEY,
    url TEXT,
    title TEXT,
    version TEXT,
    raw_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS api_changes (
    id TEXT PRIMARY KEY,
    doc_id TEXT,
    change_type TEXT,
    heading TEXT,
    content TEXT,
    FOREIGN KEY(doc_id) REFERENCES scraped_docs(id)
  );

  CREATE TABLE IF NOT EXISTS generated_skills (
    id TEXT PRIMARY KEY,
    library_name TEXT,
    version TEXT,
    markdown_content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tech_trends (
    id TEXT PRIMARY KEY,
    repo_name TEXT,
    stars INTEGER,
    language TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS media_scripts (
    id TEXT PRIMARY KEY,
    topic TEXT,
    format TEXT,
    markdown_output TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    url TEXT UNIQUE,
    title TEXT,
    description TEXT,
    icon TEXT,
    status TEXT DEFAULT 'Synced',
    chunks_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS content_chunks (
    id TEXT PRIMARY KEY,
    source_id TEXT,
    source_url TEXT,
    source_title TEXT,
    heading TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(source_id) REFERENCES sources(id)
  );

  CREATE TABLE IF NOT EXISTS scraper_health_logs (
    id TEXT PRIMARY KEY,
    scraper_name TEXT,
    status TEXT,
    broken_selector TEXT,
    repaired_selector TEXT,
    log_message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed default sources if none exist
const existingSources = db.prepare('SELECT COUNT(*) as count FROM sources').get() as { count: number };
if (existingSources.count === 0) {
  const seedSources = [
    {
      id: 'src-nextjs',
      url: 'https://nextjs.org/docs',
      title: 'nextjs.org/docs',
      description: 'Next.js Documentation & App Router',
      icon: 'nextjs',
      status: 'Synced',
      chunks_count: 47,
      chunks: [
        {
          heading: 'Async Params in Next.js 15',
          content: 'In Next.js 15, the params and searchParams objects in Server Components, Client Components, and Route Handlers are now asynchronous Promises. You must await params before accessing route segment properties.'
        },
        {
          heading: 'Next.js 15 Migration Guide',
          content: 'To migrate to Next.js 15, use the automated codemod npx @next/codemod@latest upgrade. fetch requests are now uncached by default (no-store).'
        },
        {
          heading: 'Server Actions and Mutations',
          content: 'Server Actions are asynchronous functions that execute on the server. They can be invoked in Server and Client Components to handle form submissions and data mutations.'
        }
      ]
    },
    {
      id: 'src-react',
      url: 'https://react.dev/reference',
      title: 'react.dev/reference',
      description: 'React Reference & Server Components',
      icon: 'react',
      status: 'Synced',
      chunks_count: 31,
      chunks: [
        {
          heading: 'React 19 Actions and useActionState',
          content: 'React 19 introduces useActionState to manage pending states and error boundaries automatically during async form actions.'
        },
        {
          heading: 'Direct ref as prop',
          content: 'In React 19, forwardRef is deprecated in favor of passing ref directly as a prop to function components.'
        }
      ]
    },
    {
      id: 'src-ts',
      url: 'https://www.typescriptlang.org/docs',
      title: 'typescriptlang.org/docs',
      description: 'TypeScript Documentation',
      icon: 'typescript',
      status: 'Scraping',
      chunks_count: 0,
      chunks: []
    },
    {
      id: 'src-github',
      url: 'https://github.com/trending',
      title: 'github.com/trending',
      description: 'GitHub Trending Repositories',
      icon: 'github',
      status: 'Pending',
      chunks_count: 0,
      chunks: []
    }
  ];

  const insertSource = db.prepare(`
    INSERT INTO sources (id, url, title, description, icon, status, chunks_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertChunk = db.prepare(`
    INSERT INTO content_chunks (id, source_id, source_url, source_title, heading, content)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const s of seedSources) {
    insertSource.run(s.id, s.url, s.title, s.description, s.icon, s.status, s.chunks_count);
    for (const c of s.chunks) {
      insertChunk.run(crypto.randomUUID(), s.id, s.url, s.title, c.heading, c.content);
    }
  }
}


export function saveScrapedDoc(doc: any) {
  const insertDoc = db.prepare(`
    INSERT INTO scraped_docs (id, url, title, version, raw_json)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const insertChange = db.prepare(`
    INSERT INTO api_changes (id, doc_id, change_type, heading, content)
    VALUES (?, ?, ?, ?, ?)
  `);

  const docId = crypto.randomUUID();
  
  db.transaction(() => {
    insertDoc.run(docId, doc.url, doc.title, doc.version || 'latest', JSON.stringify(doc));
    
    if (doc.breakingChanges && doc.breakingChanges.length > 0) {
      for (const change of doc.breakingChanges) {
        insertChange.run(crypto.randomUUID(), docId, 'BREAKING', change.heading, change.content);
      }
    }
  })();

  return docId;
}

export function saveHealthLog(log: { scraper_name: string, status: string, broken_selector?: string, repaired_selector?: string, log_message?: string }) {
  const insert = db.prepare(`
    INSERT INTO scraper_health_logs (id, scraper_name, status, broken_selector, repaired_selector, log_message)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insert.run(crypto.randomUUID(), log.scraper_name, log.status, log.broken_selector || null, log.repaired_selector || null, log.log_message || null);
}

export function saveGeneratedSkill(skill: { library_name: string, version: string, markdown_content: string }) {
  const insert = db.prepare(`
    INSERT INTO generated_skills (id, library_name, version, markdown_content)
    VALUES (?, ?, ?, ?)
  `);
  insert.run(crypto.randomUUID(), skill.library_name, skill.version, skill.markdown_content);
}

export function getAllSkills() {
  return db.prepare('SELECT * FROM generated_skills ORDER BY created_at DESC').all();
}

export function getHealthLogs() {
  return db.prepare('SELECT * FROM scraper_health_logs ORDER BY timestamp DESC LIMIT 50').all();
}

export function getTechTrends() {
  return db.prepare('SELECT * FROM tech_trends ORDER BY created_at DESC LIMIT 50').all();
}

export function getAllSources() {
  return db.prepare('SELECT * FROM sources ORDER BY created_at DESC').all();
}

export function addOrUpdateSource(source: { id?: string, url: string, title: string, description?: string, icon?: string, status?: string, chunks_count?: number }) {
  const id = source.id || crypto.randomUUID();
  const insert = db.prepare(`
    INSERT INTO sources (id, url, title, description, icon, status, chunks_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(url) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      status = excluded.status,
      chunks_count = excluded.chunks_count
  `);
  insert.run(id, source.url, source.title, source.description || '', source.icon || 'globe', source.status || 'Synced', source.chunks_count || 0);
  return id;
}

export function updateSourceStatus(url: string, status: string, chunks_count?: number) {
  if (chunks_count !== undefined) {
    db.prepare('UPDATE sources SET status = ?, chunks_count = ? WHERE url = ?').run(status, chunks_count, url);
  } else {
    db.prepare('UPDATE sources SET status = ? WHERE url = ?').run(status, url);
  }
}

export function saveSourceChunks(sourceId: string, sourceUrl: string, sourceTitle: string, chunks: Array<{ heading: string, content: string }>) {
  const deleteOld = db.prepare('DELETE FROM content_chunks WHERE source_id = ? OR source_url = ?');
  const insertChunk = db.prepare(`
    INSERT INTO content_chunks (id, source_id, source_url, source_title, heading, content)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  db.transaction(() => {
    deleteOld.run(sourceId, sourceUrl);
    for (const chunk of chunks) {
      insertChunk.run(crypto.randomUUID(), sourceId, sourceUrl, sourceTitle, chunk.heading, chunk.content);
    }
    db.prepare('UPDATE sources SET chunks_count = ?, status = ? WHERE id = ?').run(chunks.length, 'Synced', sourceId);
  })();
}

export function searchChunks(query: string, limit: number = 8) {
  const keywords = query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(k => k.length > 2);
  const allChunks = db.prepare('SELECT * FROM content_chunks').all() as any[];

  if (keywords.length === 0) {
    return allChunks.slice(0, limit);
  }

  // Score chunks by keyword matches
  const scored = allChunks.map(chunk => {
    const text = `${chunk.source_title} ${chunk.heading} ${chunk.content}`.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) {
        score += (chunk.heading.toLowerCase().includes(kw) ? 3 : 1);
      }
    }
    return { ...chunk, score };
  });

  return scored
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function deleteSource(id: string) {
  db.transaction(() => {
    db.prepare('DELETE FROM content_chunks WHERE source_id = ?').run(id);
    db.prepare('DELETE FROM sources WHERE id = ?').run(id);
  })();
}

export default db;

