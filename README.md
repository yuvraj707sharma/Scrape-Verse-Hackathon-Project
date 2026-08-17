# 🌐 DevVerse Hub — AI-Powered Developer Intelligence Platform

> **Submission for the [Into the Scrape-Verse Hackathon](https://scrapeverse.brightdata.com/) by Bright Data**
> 
> *Powered by Bright Data Scraper Studio · Google Gemini · React 19 · Express · SQLite*

---

## 🚀 What is DevVerse?

DevVerse Hub is a full-stack autonomous developer intelligence platform that:

1. **Scrapes live developer documentation & tech trends** using custom collectors built in **Bright Data Scraper Studio**
2. **Validates & auto-heals broken data** using a Zod schema validator + Google Gemini AI Self-Healing Sentinel
3. **Generates AI Agent Skills** — converting raw docs into structured Markdown skills for autonomous coding agents
4. **Creates content automatically** — blogs, YouTube scripts, and newsletters from live scraped data
5. **Displays everything** in a beautiful real-time React dashboard with live telemetry

---

## 🎥 Demo Video

> 📹 *[Link to Demo Video — add before submission]*

---

## 🏗️ Architecture

```
Target Websites (Next.js Docs, GitHub Trending)
        ↓
Bright Data Scraper Studio (Custom JS Collectors)
        ↓
POST /api/ingest  (Express Webhook Endpoint)
        ↓
  ┌─────────────────────────────────────┐
  │    Zod Schema Validator             │
  │  ✅ Valid → Save to SQLite          │
  │  ❌ Drift → Gemini Self-Healer      │
  └─────────────────────────────────────┘
        ↓
  SQLite Database (scraped_docs, tech_trends,
                   generated_skills, scraper_health_logs)
        ↓
  ┌──────────────────────────────────────┐
  │  React 19 Dashboard (port 3000)      │
  │  • Ecosystem Radar (charts)          │
  │  • Agent Skills & API Inspector      │
  │  • Content Studio (Gemini)           │
  │  • Telemetry & Health Hub            │
  └──────────────────────────────────────┘
```

---

## 🔑 How Bright Data Scraper Studio is Used

This project's entire data pipeline depends on **Bright Data Scraper Studio**:

- **`scraper/docuverse_collector.js`** — Custom Interaction + Parser code for scraping framework documentation (Next.js, React, etc.). Extracts titles, version tags, code blocks, and breaking change headings.
- **`scraper/devpulse_collector.js`** — Custom collector for GitHub Trending page, extracting repo names, stars, languages, and descriptions.
- **`run-scraper.js`** — Node.js script that triggers the Scraper Studio collector via the Bright Data API, polls for results, and pipes the data directly into the DevVerse backend.

The scraper runs in Bright Data's browser worker environment, bypasses bot detection automatically, and POSTs structured JSON to our ingestion endpoint.

---

## 🤖 AI Self-Healing Sentinel (Key Feature)

When a scraped payload fails Zod schema validation (e.g., a website changed its HTML structure), the Self-Healing Sentinel:

1. Catches the `SchemaDriftError`
2. Sends the raw HTML snapshot + broken field names to **Gemini 3.6 Flash**
3. Gemini reads the DOM, extracts missing fields, and suggests a corrected CSS selector
4. The repaired data is saved to SQLite
5. A **"HEALED_BY_AI"** event is logged in the Telemetry Hub dashboard

This means the scraper **never permanently breaks** — it recovers automatically.

---

## 📋 Prerequisites

- **Node.js** v18 or higher
- A **Bright Data account** with a custom scraper created in Scraper Studio ([brightdata.com](https://brightdata.com))
- A **Google Gemini API Key** (free at [aistudio.google.com](https://aistudio.google.com/app/apikey))

---

## ⚡ Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/yuvraj707sharma/Scrape-Verse-Hackathon-Project.git
cd Scrape-Verse-Hackathon-Project
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
BRIGHTDATA_API_TOKEN=your_brightdata_api_token_here
```

> **How to get your keys:**
> - **Gemini API Key**: Go to [Google AI Studio](https://aistudio.google.com/app/apikey) → Create API Key (free)
> - **Bright Data API Token**: Log into [Bright Data](https://brightdata.com) → Account Settings → API Keys → Copy your token

### 4. Start the server

```bash
npm run dev
```

The dashboard will be live at **http://localhost:3000**

### 5. Trigger a live scrape via Bright Data

In a new terminal window:

```bash
node run-scraper.js
```

This will:
- Call the Bright Data API to trigger your Scraper Studio collector
- Wait for the scrape to complete (10–30 seconds)
- Automatically pipe the results into your running DevVerse dashboard

### 6. (Optional) Load mock data without Bright Data credits

If you want to quickly see the dashboard populated without using Bright Data credits:

```bash
# Inject mock documentation data
node test-ingest.js

# Inject mock tech trends data
node test-ingest-trends.js
```

---

## 📁 Project Structure

```
├── scraper/
│   ├── docuverse_collector.js      # Bright Data Scraper Studio: Docs collector
│   ├── devpulse_collector.js       # Bright Data Scraper Studio: Trends collector
│   └── mock_test_payloads.json     # Sample payloads for offline testing
│
├── backend/
│   ├── db.ts                       # SQLite database setup & query helpers
│   ├── validator.ts                # Zod schema validation & SchemaDriftError
│   ├── selfHealingSentinel.ts      # AI Self-Healing engine (Gemini)
│   ├── skillGenerator.ts           # Agent Skill Markdown generator
│   ├── scriptWriter.ts             # Gemini-powered content generation
│   ├── ragEngine.ts                # Keyword search / RAG over scraped docs
│   └── routes/
│       ├── ingestRoutes.ts         # POST /api/ingest (Bright Data webhook)
│       ├── skillRoutes.ts          # GET /api/v1/skills
│       ├── trendRoutes.ts          # GET /api/v1/trends
│       ├── scriptRoutes.ts         # POST /api/v1/scripts/generate
│       ├── ragRoutes.ts            # POST /api/v1/rag/query
│       └── healthRoutes.ts         # GET /api/v1/health
│
├── src/
│   ├── App.tsx                     # Main dashboard layout & navigation
│   └── components/
│       ├── EcosystemRadarTab.tsx   # Tech trends charts (Recharts)
│       ├── AgentSkillsTab.tsx      # Skill viewer + live API Inspector
│       ├── ContentStudioTab.tsx    # AI content generator UI
│       └── TelemetryHubTab.tsx     # Live scraper health & healing events
│
├── server.ts                       # Express server entry point
├── run-scraper.js                  # Bright Data API trigger script
├── test-ingest.js                  # Mock doc ingestion for testing
└── test-ingest-trends.js           # Mock trends ingestion for testing
```

---

## 🌐 Public REST API

The backend exposes a public API that AI agents or external tools can consume:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ingest` | Webhook: Receive scraped data from Bright Data |
| `GET` | `/api/v1/skills` | List all generated Agent Skills |
| `GET` | `/api/v1/skills/:library` | Get a specific library's skill (e.g., `/api/v1/skills/nextjs`) |
| `GET` | `/api/v1/trends` | Get latest tech trends from DB |
| `POST` | `/api/v1/scripts/generate` | Generate a blog/YouTube/newsletter via Gemini |
| `POST` | `/api/v1/rag/query` | Search scraped documentation |
| `GET` | `/api/v1/health` | Get scraper health logs & telemetry |

### Example API call:
```bash
# Generate a tech blog post
curl -X POST http://localhost:3000/api/v1/scripts/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "Next.js 15 breaking changes", "format": "blog"}'
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Web Scraper | Bright Data Scraper Studio (Custom JS collectors) |
| Backend | Node.js + Express + TypeScript |
| Self-Healing AI | Google Gemini 3.6 Flash |
| Schema Validation | Zod |
| Database | SQLite (better-sqlite3) |
| Frontend | React 19 + Vite + TypeScript |
| Charts | Recharts |
| Styling | Tailwind CSS |
| Icons | Lucide React |

---

## 📊 Example Structured Output

After running `node run-scraper.js`, the system produces:

**Scraped Doc (SQLite):**
```json
{
  "title": "Next.js Docs",
  "version": "Latest",
  "url": "https://nextjs.org/docs",
  "codeBlocks": ["export default async function Page(...)"],
  "breakingChanges": [{"heading": "Async Params", "content": "..."}]
}
```

**Generated Agent Skill (`skills/generated/nextjs.md`):**
```markdown
---
name: nextjs-vLatest
description: Live documentation updates, breaking API changes, and code patterns for nextjs
---
# nextjs API Knowledge & Rules
## Breaking Changes & Deprecations
...
```

---

## 🤖 AI Disclosure

This project was built with assistance from **Google Antigravity (AI coding assistant)**. All architecture decisions, Bright Data integration logic, self-healing pipeline design, and Scraper Studio collector code were reviewed, tested, and understood by the developer. The submitted code represents the developer's own technical work and understanding.

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.
