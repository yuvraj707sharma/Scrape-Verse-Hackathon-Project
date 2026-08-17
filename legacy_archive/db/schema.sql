-- Social Listening & Competitive Intelligence — PostgreSQL (Supabase) schema

CREATE TABLE IF NOT EXISTS mentions (
    id               BIGSERIAL PRIMARY KEY,
    source_platform  VARCHAR(50)   NOT NULL,   -- 'reddit', 'youtube', 'news', etc.
    source_url       VARCHAR(1000),
    author_handle    VARCHAR(255),
    text_content     TEXT          NOT NULL,
    engagement_score INT           DEFAULT 0,  -- upvotes / likes
    posted_at        TIMESTAMP WITH TIME ZONE,
    raw_metadata     JSONB,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_platform ON mentions (source_platform);
CREATE INDEX IF NOT EXISTS idx_posted_at ON mentions (posted_at);

CREATE TABLE IF NOT EXISTS mentions_analyzed (
    id                  BIGSERIAL PRIMARY KEY,
    mention_id          BIGINT       NOT NULL REFERENCES mentions(id),
    sentiment_score     FLOAT,                          -- -1.0 to 1.0
    topic_category      VARCHAR(100),                   -- see TOPIC_CATEGORIES in extractor.py
    entities_mentioned  JSONB,                          -- ["JECRC", "MUJ", ...]
    key_phrase_summary  VARCHAR(500),
    embedding           JSONB,                          -- text-embedding-004 output
    is_flagged          BOOLEAN      DEFAULT FALSE,
    escalation_reason   VARCHAR(500) NULL,
    escalation_status   VARCHAR(50)  DEFAULT 'none' CHECK (escalation_status IN ('none', 'investigating', 'resolved')),
    program             VARCHAR(100) NULL,              -- 'CSE','MBA','BSc Nursing', etc.
    positives           JSONB        NULL,              -- ["praise phrase 1", ...]
    negatives           JSONB        NULL,              -- ["complaint phrase 1", ...]
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_topic ON mentions_analyzed (topic_category);
CREATE INDEX IF NOT EXISTS idx_mention ON mentions_analyzed (mention_id);
CREATE INDEX IF NOT EXISTS idx_flagged ON mentions_analyzed (is_flagged);

-- Keyword and competitor management tables (Step 3)
CREATE TABLE IF NOT EXISTS tracked_keywords (
    id          BIGSERIAL PRIMARY KEY,
    keyword     VARCHAR(255) NOT NULL UNIQUE,
    category    VARCHAR(50)  DEFAULT 'general' CHECK (category IN ('brand', 'competitor', 'program', 'general')),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tracked_competitors (
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(255) NOT NULL UNIQUE,
    short_name   VARCHAR(100),
    website_url  VARCHAR(500),
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
