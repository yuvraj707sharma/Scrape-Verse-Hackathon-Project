-- Social Listening & Competitive Intelligence — MySQL 9.x schema
-- Run: mysql -u <user> -p <dbname> < schema.sql

CREATE TABLE IF NOT EXISTS mentions (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    source_platform  VARCHAR(50)   NOT NULL,   -- 'reddit', 'youtube', 'news', etc.
    source_url       VARCHAR(1000),
    author_handle    VARCHAR(255),
    text_content     TEXT          NOT NULL,
    engagement_score INT           DEFAULT 0,  -- upvotes / likes
    posted_at        DATETIME,
    raw_metadata     JSON,
    created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_platform  (source_platform),
    INDEX idx_posted_at (posted_at)
);

CREATE TABLE IF NOT EXISTS mentions_analyzed (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    mention_id          BIGINT       NOT NULL,
    sentiment_score     FLOAT,                          -- -1.0 to 1.0
    topic_category      VARCHAR(100),                   -- see TOPIC_CATEGORIES in extractor.py
    entities_mentioned  JSON,                           -- ["JECRC", "MUJ", ...]
    key_phrase_summary  VARCHAR(500),
    embedding           JSON,                           -- text-embedding-004 output (MySQL 8 fallback)
    -- NEW fields (Step 2)
    is_flagged          BOOLEAN      DEFAULT FALSE,
    escalation_reason   VARCHAR(500) NULL,
    escalation_status   ENUM('none','investigating','resolved') DEFAULT 'none',
    program             VARCHAR(100) NULL,              -- 'CSE','MBA','BSc Nursing', etc.
    positives           JSON         NULL,              -- ["praise phrase 1", ...]
    negatives           JSON         NULL,              -- ["complaint phrase 1", ...]
    created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mention_id) REFERENCES mentions(id),
    INDEX idx_topic     (topic_category),
    INDEX idx_mention   (mention_id),
    INDEX idx_flagged   (is_flagged)
);

-- Keyword and competitor management tables (Step 3)
CREATE TABLE IF NOT EXISTS tracked_keywords (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    keyword     VARCHAR(255) NOT NULL,
    category    ENUM('brand','competitor','program','general') DEFAULT 'general',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_keyword (keyword)
);

CREATE TABLE IF NOT EXISTS tracked_competitors (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,
    short_name   VARCHAR(100),
    website_url  VARCHAR(500),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_name (name)
);

-- Semantic search (MySQL 9+):
-- SELECT m.text_content, ma.sentiment_score,
--        DISTANCE(ma.embedding, @query_vec, 'COSINE') AS dist
-- FROM   mentions_analyzed ma
-- JOIN   mentions m ON m.id = ma.mention_id
-- ORDER  BY dist ASC
-- LIMIT  10;

-- MySQL 8 fallback: store embedding as JSON, compute cosine in Python.
-- ALTER TABLE mentions_analyzed MODIFY COLUMN embedding JSON;

-- Migration: run these if upgrading an existing DB (skip if running fresh)
-- ALTER TABLE mentions_analyzed
--     ADD COLUMN is_flagged        BOOLEAN      DEFAULT FALSE,
--     ADD COLUMN escalation_reason VARCHAR(500) NULL,
--     ADD COLUMN escalation_status ENUM('none','investigating','resolved') DEFAULT 'none',
--     ADD COLUMN program           VARCHAR(100) NULL,
--     ADD COLUMN positives         JSON         NULL,
--     ADD COLUMN negatives         JSON         NULL;
