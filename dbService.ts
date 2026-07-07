import { Pool } from 'pg';
import dotenv from 'dotenv';
import { Keyword, Competitor, Mention, SourceType, SentimentType, TopicType } from './src/types.ts';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function fetchKeywordsFromDB(): Promise<Keyword[]> {
  try {
    const result = await pool.query('SELECT id, keyword as text, category, created_at as "createdAt" FROM tracked_keywords');
    return result.rows.map(r => ({
      id: String(r.id),
      text: r.text,
      category: r.category || 'general',
      createdAt: new Date(r.createdAt).toISOString()
    }));
  } catch (e) {
    console.error('Postgres keywords fetch error:', e);
    return [];
  }
}

export async function fetchCompetitorsFromDB(): Promise<Competitor[]> {
  try {
    const result = await pool.query('SELECT id, name, short_name as "shortName", website_url as website, created_at as "addedAt" FROM tracked_competitors');
    return result.rows.map(r => ({
      id: String(r.id),
      name: r.name,
      shortName: r.shortName,
      website: r.website || '',
      addedAt: new Date(r.addedAt).toISOString()
    }));
  } catch (e) {
    console.error('Postgres competitors fetch error:', e);
    return [];
  }
}

export async function fetchMentionsFromDB(): Promise<Mention[]> {
  try {
    const query = `
      SELECT 
        m.id, m.text_content as text, m.source_platform as source, 
        m.source_url as url, m.author_handle as author, m.posted_at as date,
        ma.sentiment_score, ma.topic_category as "primaryTopic", 
        ma.entities_mentioned as comparisons, ma.key_phrase_summary as summary,
        ma.is_flagged as "isFlagged", ma.escalation_reason as "escalationReason", 
        ma.program, ma.positives, ma.negatives
      FROM mentions m
      LEFT JOIN mentions_analyzed ma ON m.id = ma.mention_id
      ORDER BY m.id DESC LIMIT 500
    `;
    const result = await pool.query(query);
    
    return result.rows.map(r => {
      let sentiment: SentimentType = 'neutral';
      if (r.sentiment_score >= 0.3) sentiment = 'positive';
      else if (r.sentiment_score <= -0.3) sentiment = 'negative';

      return {
        id: String(r.id),
        text: r.text,
        title: 'Tracked Social Mention',
        source: (r.source as SourceType) || 'Reddit',
        url: r.url || '',
        author: r.author || 'Anonymous',
        date: r.date ? new Date(r.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        timestamp: r.date ? new Date(r.date).getTime() : Date.now(),
        sentiment: sentiment,
        primaryTopic: (r.primaryTopic as TopicType) || 'other',
        confidence: 0.9,
        comparisons: r.comparisons ? (typeof r.comparisons === 'string' ? JSON.parse(r.comparisons) : r.comparisons) : [],
        summary: r.summary || (r.text ? r.text.substring(0, 100) + '...' : ''),
        positives: r.positives ? (typeof r.positives === 'string' ? JSON.parse(r.positives) : r.positives) : [],
        negatives: r.negatives ? (typeof r.negatives === 'string' ? JSON.parse(r.negatives) : r.negatives) : [],
        isFlagged: !!r.isFlagged,
        escalationReason: r.escalationReason || undefined,
        program: r.program || undefined
      };
    });
  } catch (e) {
    console.error('Postgres mentions fetch error:', e);
    return [];
  }
}

export async function insertKeywordToDB(keyword: Keyword) {
  try {
    await pool.query('INSERT INTO tracked_keywords (keyword, category) VALUES ($1, $2) ON CONFLICT (keyword) DO NOTHING', [keyword.text, keyword.category]);
  } catch (e) {
    console.error(e);
  }
}

export async function insertCompetitorToDB(competitor: Competitor) {
  try {
    await pool.query('INSERT INTO tracked_competitors (name, short_name, website_url) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING', [competitor.name, competitor.shortName, competitor.website]);
  } catch (e) {
    console.error(e);
  }
}

export async function deleteKeywordFromDB(id: string) {
  try {
     if (!id.startsWith('kw-')) {
       await pool.query('DELETE FROM tracked_keywords WHERE id = $1', [parseInt(id)]);
     }
  } catch (e) {
    console.error(e);
  }
}

export async function deleteCompetitorFromDB(id: string) {
  try {
     if (!id.startsWith('comp-')) {
       await pool.query('DELETE FROM tracked_competitors WHERE id = $1', [parseInt(id)]);
     }
  } catch (e) {
    console.error(e);
  }
}
