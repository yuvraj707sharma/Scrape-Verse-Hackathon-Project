export interface SourceItem {
  id: string;
  url: string;
  title: string;
  description: string;
  icon?: string;
  status: 'Synced' | 'Scraping' | 'Pending' | 'Failed' | string;
  chunks_count: number;
  created_at?: string;
}

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

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text?: string;
  paragraphs?: AnswerParagraph[];
  timestamp: string;
}

export interface ScraperHealthLog {
  id: string;
  scraper_name: string;
  status: 'SUCCESS' | 'HEALED_BY_AI' | 'FAILED' | string;
  broken_selector?: string;
  repaired_selector?: string;
  log_message?: string;
  timestamp: string;
}

export interface TechTrendItem {
  id: string;
  repo_name: string;
  stars: number;
  language: string;
  description: string;
  created_at?: string;
}
