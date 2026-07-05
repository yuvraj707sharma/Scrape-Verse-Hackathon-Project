# JECRC Reputational Intelligence Hub (JU Social Analyzer)

A full-stack, AI-powered social listening and reputational analysis platform explicitly built for JECRC University. This system automatically scrapes the internet for mentions of JECRC, analyzes the sentiment of student and parent conversations, compares them against competitors, and presents actionable insights in a beautiful dashboard.

## Features

- **Continuous Web Scraping**: A background Python worker uses SerpAPI, Spider, Reddit API, and YouTube API to actively hunt for mentions across Quora, Reddit, news outlets, LinkedIn, Instagram, X/Twitter, and more.
- **AI-Powered Synthesis**: Integrates with the **Gemini API** to automatically categorize mentions by sentiment (Positive, Neutral, Negative) and topic (Hostel, Placements, Faculty, ROI).
- **Executive Reporting**: Generates a deep, multi-page markdown strategic analysis report based on all scraped data with a single click.
- **AI Copilot Chat**: An intelligent, strictly JECRC-focused chatbot that can answer questions based purely on the scraped data and live Google search grounding.
- **Real-Time Dashboard**: Built with React, Vite, and Tailwind CSS to display tracked keywords, competitor benchmarking matrices, and emerging reputational risks.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts
- **Backend Server**: Node.js, Express, TypeScript
- **Database**: MySQL (Stores mentions, tracked keywords, and competitors)
- **Ingestion Worker**: Python 3 (Requests, BeautifulSoup, SerpAPI, Spider API)
- **AI & Analysis**: Google Gemini API (`gemini-3.5-flash` with Google Search Grounding)

## Prerequisites

- **Node.js** (v18+)
- **Python** (3.8+)
- **MySQL Server** (running on port 3306)
- API Keys for: Gemini, SerpAPI, Spider, Reddit (optional), YouTube (optional)

## Setup & Installation

### 1. Database Setup
Create a MySQL database named `social_listener`:
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS social_listener;"
mysql -u root -p social_listener < db/schema.sql
```

### 2. Environment Configuration
Create a `.env` file in the root directory and add the following keys:
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=social_listener

# AI & APIs
GEMINI_API_KEY=your_gemini_key_here
SERPAPI_KEY=your_serpapi_key_here
SPIDER_API_KEY=your_spider_key_here

# Python Ingestion
INGESTION_INTERVAL_MINUTES=60
DISCOVERY_QUERIES_PER_RUN=20
```

### 3. Install Dependencies
**Node Modules:**
```bash
npm install
```

**Python Requirements:**
```bash
pip install -r requirements.txt
```

## Running the Application

To run the full pipeline, you need to run both the web server and the background Python worker.

### Start the Web Server (Frontend + Backend)
```bash
npm run dev
```
*The app will be available at `http://localhost:3000`.*

### Start the Background Scraper (Python)
In a separate terminal window, run the ingestion worker to start fetching real data from the web:
```bash
python ingestion/worker.py
```

## Disclaimer
This tool is configured strictly for JECRC University analytics and is intended for internal reputational tracking and strategic planning.
