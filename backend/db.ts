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

export function saveTechTrend(trend: { repo_name: string, stars: number, language: string, description: string }) {
  const insert = db.prepare(`
    INSERT INTO tech_trends (id, repo_name, stars, language, description)
    VALUES (?, ?, ?, ?, ?)
  `);
  insert.run(crypto.randomUUID(), trend.repo_name, trend.stars, trend.language, trend.description);
}

export default db;
