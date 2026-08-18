# 🌐 DevVerse Hub — Live AI Developer Intelligence & Cited RAG Platform

> **Submission for the [Into the Scrape-Verse Hackathon](https://scrapeverse.brightdata.com/) by Bright Data**  
> *Powered by Bright Data Scraper Studio · Google Gemini 3.6 Flash · React 19 · Node.js/Express · SQLite*

---

## 📖 Table of Contents
- [Executive Overview](#-executive-overview)
- [Key Features](#-key-features)
- [Architecture Diagram](#-architecture-diagram)
- [How Bright Data Scraper Studio is Used](#-how-bright-data-scraper-studio-is-used)
- [The AI Self-Healing Sentinel](#-the-ai-self-healing-sentinel)
- [Quick Start Guide (Setup in 1 Go)](#-quick-start-guide-setup-in-1-go)
- [How to Test the System](#-how-to-test-the-system)
- [Project Structure](#-project-structure)
- [Public REST API Reference](#-public-rest-api-reference)
- [Example Structured Output](#-example-structured-output)
- [Hackathon Compliance & AI Disclosure](#-hackathon-compliance--ai-disclosure)

---

## 🚀 Executive Overview

**DevVerse Hub** is an autonomous developer intelligence platform that bridges live web data extraction with modern AI agent workflows and cited question answering.

### The Real-World Pain Points Solved:
1. **The LLM Training Cut-off Problem**: Coding models hallucinate deprecated code patterns when frameworks release major updates (e.g. Next.js 15 moving to async `params`, React 19 Server Actions). DevVerse continuously indexes live documentation to give developers and coding agents ground-truth answers.
2. **Silent Scraper Breakages**: Standard scrapers break silently when websites update their CSS or DOM structure. DevVerse features an **Autonomous Self-Healing Sentinel** that catches schema drift, extracts missing data from raw HTML snapshots via Google Gemini, and generates updated CSS selectors.
3. **Information Overload for Tech Creators**: Synthesizes real-time documentation and ecosystem trends into cited answers, Markdown agent skills, and ready-to-publish media scripts.

---

## 🌟 Key Features

- **📚 NotebookLM-Style Cited RAG Chat**: Ask any technical question about indexed web sources. Answers are formatted in clean paragraphs, each accompanied by an **inline clickable citation card** linking directly to the source domain and section title.
- **⚡ Dynamic URL Ingestion**: Paste any documentation URL directly in the UI. DevVerse automatically triggers Bright Data Scraper Studio to scrape, validate with Zod, chunk, and index the content.
- **🩺 Autonomous Self-Healing Sentinel**: If target web page layouts change and a CSS/XPath selector breaks, Gemini automatically recovers the missing fields and logs a `HEALED_BY_AI` repair event.
- **🛠️ AI Agent Skill Generator**: Automatically compiles scraped API changes into standard `.md` skill files (matching the Hermes/Antigravity AI agent specification) for direct integration into AI coding workflows.
- **📊 Ecosystem Radar**: Live charts tracking GitHub repository stars, adoption momentum, and programming language trends.
- **✍️ Content & Script Studio**: One-click generation of technical blog posts, YouTube video scripts (with `[VISUAL]` cues), and developer newsletter digests backed by live scraped data.
- **📡 Real-Time Telemetry Hub**: Full visibility into Bright Data scraper collector runs, success rates, and live stream of AI healing events.

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       Target Web Pages                      │
│        (Next.js Docs, React.dev, TypeScript, GitHub)        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│           Bright Data Scraper Studio (Collector ID)         │
│  • Custom Headless Interaction & Cheerio Parser Logic       │
│  • Residential Proxy Network & Anti-Bot Bypass              │
└──────────────────────────────┬──────────────────────────────┘
                               │ POST /api/ingest / API Poll
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Backend Ingestion & Validation              │
│  • Zod Payload Schema Contract Check                        │
│                                                             │
│   ┌───────────────────────┐       ┌───────────────────────┐ │
│   │   Schema Intact ✅     │       │   Schema Drift / ❌   │ │
│   │   (Valid Structure)   │       │   Broken Selectors    │ │
│   └───────────┬───────────┘       └───────────┬───────────┘ │
│               │                               │             │
│               │                 ┌─────────────▼──────────┐  │
│               │                 │ Gemini Self-Healing    │  │
│               │                 │ Sentinel (DOM Repair)  │  │
│               │                 └─────────────┬──────────┘  │
│               ▼                               ▼             │
│   ┌──────────────────────────────────────────────────────┐  │
│   │             SQLite Database (devverse.db)            │  │
│   │  • sources · content_chunks · scraped_docs           │  │
│   │  • generated_skills · tech_trends · health_logs      │  │
│   └──────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             DevVerse React 19 Frontend Dashboard            │
│  • Sources & Cited RAG Chat Panel (Inline Source Cards)     │
│  • Ecosystem Radar (Recharts Visualizations)                │
│  • Content & Script Studio (Gemini 3.6 Flash)               │
│  • Live Telemetry & Health Stream                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 How Bright Data Scraper Studio is Used

Bright Data Scraper Studio is the core data extraction engine for DevVerse:

1. **`scraper/docuverse_collector.js`**:
   - Runs in Bright Data's browser worker context.
   - Navigates to target documentation URLs and waits for dynamic content to render.
   - Extracts page titles, version badges, code snippets (`pre code`), deprecation warnings, and captures a sanitized raw HTML DOM snapshot for fallback self-healing.
2. **`scraper/devpulse_collector.js`**:
   - Scrapes trending GitHub repositories, star velocity, and language breakdown.
3. **`run-scraper.js` / `backend/sourceScraper.ts`**:
   - Uses the Bright Data API endpoint (`https://api.brightdata.com/dca/trigger?collector=c_msxhiutw28er91v7oo`) to trigger jobs on demand, poll for results, and stream clean structured JSON directly into our ingestion pipeline.

---

## 🩺 The AI Self-Healing Sentinel

When target websites update their UI (e.g. changing class names from `.version-tag` to `.badge-v2`), traditional scrapers fail.

DevVerse handles this automatically:
1. `backend/validator.ts` executes a Zod schema parse.
2. If required fields are missing, it throws a `SchemaDriftError`.
3. `backend/selfHealingSentinel.ts` intercepts the error and feeds the raw HTML snippet to **Gemini 3.6 Flash**.
4. Gemini extracts the missing fields, reconstructs the schema, and suggests an updated CSS selector repair patch.
5. The healed data is saved, and a **`HEALED_BY_AI`** telemetry badge is logged in the dashboard.

---

## ⚡ Quick Start Guide (Setup in 1 Go)

### 1. Clone the repository
```bash
git clone https://github.com/yuvraj707sharma/Scrape-Verse-Hackathon-Project.git
cd Scrape-Verse-Hackathon-Project
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the example `.env` file:
```bash
cp .env.example .env
```
Open `.env` and insert your keys:
```env
# Google Gemini API Key (Free from https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=your_actual_gemini_api_key

# Bright Data API Token (From Account Settings -> API Keys)
BRIGHTDATA_API_TOKEN=your_brightdata_api_token
```

### 4. Start the Application
```bash
npm run dev
```

🎉 Open your browser at **`http://localhost:3000`**!

---

## 🧪 How to Test the System

### Test 1: Live Cited RAG Chat
1. Open `http://localhost:3000`.
2. In the right **Chat** panel, ask:
   > *"What changed with params in Next.js 15?"*
3. Notice the paragraph-by-paragraph answer with **clickable inline citation boxes** pointing to `nextjs.org/docs`.

### Test 2: Add and Index a Live URL
1. In the left **Sources** panel, enter any documentation URL (e.g., `https://tailwindcss.com/docs` or `https://vuejs.org/guide/introduction.html`).
2. Click **`+ Add`**.
3. Watch the status change to `Scraping` and then to `Synced` once chunked.

### Test 3: Test Scraper Trigger from CLI
In a second terminal window:
```bash
node run-scraper.js
```
This triggers a live collection job via Bright Data Scraper Studio and ingests the results into the dashboard.

### Test 4: Content Studio & Telemetry
- Click **Content Studio** in the sidebar to generate AI tech blogs, YouTube scripts, or newsletters based on live data.
- Click **Telemetry** to view the live stream of scraper health events and auto-healing metrics.

---

## 📁 Project Structure

```
├── scraper/
│   ├── docuverse_collector.js      # Bright Data Scraper Studio: Docs collector script
│   ├── devpulse_collector.js       # Bright Data Scraper Studio: Trends collector script
│   └── mock_test_payloads.json     # Sample payloads for offline testing
│
├── backend/
│   ├── db.ts                       # SQLite schema, seed data & database helpers
│   ├── validator.ts                # Zod schema validation & SchemaDriftError
│   ├── selfHealingSentinel.ts      # Gemini AI Self-Healing DOM recovery engine
│   ├── sourceScraper.ts            # Dynamic URL scraping & chunking service
│   ├── chatService.ts              # Cited RAG query engine using Gemini 3.6 Flash
│   ├── skillGenerator.ts           # Markdown AI Agent Skill compiler
│   ├── scriptWriter.ts             # Gemini-powered Content Studio writer
│   ├── ragEngine.ts                # Keyword & semantic search over chunks
│   └── routes/
│       ├── sourceRoutes.ts         # GET /api/sources, POST /api/sources/add
│       ├── chatRoutes.ts           # POST /api/chat (RAG query with citations)
│       ├── ingestRoutes.ts         # POST /api/ingest (Bright Data webhook)
│       ├── skillRoutes.ts          # GET /api/v1/skills
│       ├── trendRoutes.ts          # GET /api/v1/trends
│       ├── scriptRoutes.ts         # POST /api/v1/scripts/generate
│       └── healthRoutes.ts         # GET /api/v1/health (telemetry logs)
│
├── src/
│   ├── App.tsx                     # Main dashboard layout & dual-column view
│   ├── types.ts                    # TypeScript data definitions
│   ├── index.css                   # Tailwind v4 theme & brand tokens
│   └── components/
│       ├── Sidebar.tsx             # Left navigation with brand badge & profile
│       ├── SourcesPanel.tsx        # Live source adder & indexed list
│       ├── ChatPanel.tsx           # Cited chat thread with inline source cards
│       ├── EcosystemRadarTab.tsx   # Recharts repository momentum visualizations
│       ├── ContentStudioTab.tsx    # AI blog, script & newsletter generator
│       └── TelemetryHubTab.tsx     # Scraper health monitor & self-healing logs
│
├── server.ts                       # Express backend server entry point
├── run-scraper.js                  # Bright Data API CLI execution script
├── test-ingest-trends.js           # Mock tech trends ingestion script
└── test-ingest.js                  # Mock doc ingestion script
```

---

## 🌐 Public REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/sources` | Returns all indexed documentation sources and chunk counts |
| `POST` | `/api/sources/add` | Triggers scraping, validation, and chunk indexing for a new URL |
| `POST` | `/api/chat` | Queries indexed chunks and returns paragraph-level cited answers |
| `POST` | `/api/ingest` | Webhook endpoint receiving Bright Data Scraper Studio payloads |
| `GET` | `/api/v1/skills` | Returns all generated AI Agent Skills in Markdown/JSON |
| `GET` | `/api/v1/trends` | Returns tracked repository adoption momentum |
| `POST` | `/api/v1/scripts/generate` | Generates a blog post, YouTube script, or newsletter via Gemini |
| `GET` | `/api/v1/health` | Returns scraper reliability percentage and self-healing logs |

---

## 📊 Example Structured Output

### 1. Cited Chat Response (`POST /api/chat`):
```json
{
  "paragraphs": [
    {
      "text": "In Next.js 15, the `params` object in Server Components and Route Handlers became asynchronous.",
      "citation": {
        "title": "Async Params in Next.js 15",
        "url": "https://nextjs.org/docs",
        "domain": "nextjs.org/docs"
      }
    },
    {
      "text": "You must now `await params` before accessing route segments or values.",
      "citation": {
        "title": "Next.js 15 Migration Guide",
        "url": "https://nextjs.org/docs",
        "domain": "nextjs.org/docs"
      }
    }
  ],
  "timestamp": "11:43 AM"
}
```

### 2. Generated Agent Skill (`skills/generated/nextjs.md`):
```markdown
---
name: nextjs-vLatest
description: Live documentation updates, breaking API changes, and code patterns for nextjs
version: Latest
updated_at: 2026-08-18
---

# nextjs API Knowledge & Rules

## Breaking Changes & Deprecations
### Async Params
In Next.js 15, params and searchParams are Promises that must be awaited.

## Recommended Code Patterns
```typescript
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <h1>Post ID: {id}</h1>;
}
```
```

---

## 🤖 Hackathon Compliance & AI Disclosure

- **Bright Data Scraper Studio**: Mandatory requirement satisfied using custom interaction and parser collectors (`c_msxhiutw28er91v7oo`).
- **Original Code & Contribution**: All frontend components, backend routes, RAG chunking pipelines, and self-healing algorithms were custom designed and implemented during the hackathon.
- **AI Coding Assistant Disclosure**: Built with assistance from Google Antigravity. All architecture, logic, and scraper workflows were reviewed, understood, and tested by the developer.

---

## 📜 License
MIT License © 2026 Aman Singh & DevVerse Team
