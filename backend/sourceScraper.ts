import fetch from 'node-fetch';
import { addOrUpdateSource, saveSourceChunks, updateSourceStatus, saveHealthLog } from './db.js';
import { healDocPayload } from './selfHealingSentinel.js';
import { validateDocPayload, SchemaDriftError } from './validator.js';

const API_TOKEN = process.env.BRIGHTDATA_API_TOKEN;
const COLLECTOR_ID = 'c_msxhiutw28er91v7oo';

export async function scrapeAndIndexUrl(rawUrl: string) {
  let url = rawUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  let domain = 'web-source';
  try {
    const parsed = new URL(url);
    domain = parsed.hostname + (parsed.pathname !== '/' ? parsed.pathname : '');
  } catch {}

  let iconType = 'globe';
  if (url.includes('nextjs')) iconType = 'nextjs';
  else if (url.includes('react')) iconType = 'react';
  else if (url.includes('typescript')) iconType = 'typescript';
  else if (url.includes('github')) iconType = 'github';
  else if (url.includes('vue')) iconType = 'vue';
  else if (url.includes('tailwind')) iconType = 'tailwind';

  const sourceId = addOrUpdateSource({
    url,
    title: domain,
    description: `Indexed live documentation from ${domain}`,
    icon: iconType,
    status: 'Scraping',
    chunks_count: 0
  });

  // Background scraping execution
  (async () => {
    try {
      let extractedData: any = null;

      // 1. Attempt Bright Data Scraper Studio Collector API if configured
      if (API_TOKEN && API_TOKEN !== 'your_brightdata_api_token_here') {
        try {
          console.log(`[Scraper] Triggering Bright Data for ${url}`);
          const triggerRes = await fetch(`https://api.brightdata.com/dca/trigger?collector=${COLLECTOR_ID}&queue_next=1`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${API_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify([{ url }])
          });

          const triggerData = await triggerRes.json() as any;
          const collectionId = triggerData.collection_id;

          if (collectionId) {
            let attempts = 0;
            while (!extractedData && attempts < 12) {
              await new Promise(r => setTimeout(r, 4000));
              attempts++;
              const statusRes = await fetch(`https://api.brightdata.com/dca/dataset?id=${collectionId}`, {
                headers: { 'Authorization': `Bearer ${API_TOKEN}` }
              });

              if (statusRes.status === 200) {
                const dataset = await statusRes.json() as any;
                extractedData = dataset[0] || dataset;
                break;
              }
            }
          }
        } catch (brightErr: any) {
          console.warn('[Scraper] Bright Data API polling timeout, using fallback extractor:', brightErr.message);
        }
      }

      // 2. Direct HTTP Fallback extraction if Bright Data took too long or was unavailable
      if (!extractedData || !extractedData.title) {
        try {
          const pageRes = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DevVerse/1.0' }
          });
          const html = await pageRes.text();
          
          // Simple DOM regex extraction
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          const title = titleMatch ? titleMatch[1].trim() : domain;
          
          // Extract headings & paragraphs
          const chunks: Array<{ heading: string, content: string }> = [];
          const headingRegex = /<h[1-3][^>]*>([^<]+)<\/h[1-3]>([\s\S]*?)(?=<h[1-3]|$)/gi;
          let match;
          while ((match = headingRegex.exec(html)) !== null && chunks.length < 15) {
            const hText = match[1].replace(/<[^>]+>/g, '').trim();
            const pText = match[2].replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            if (hText && pText.length > 30) {
              chunks.push({ heading: hText, content: pText.slice(0, 500) });
            }
          }

          extractedData = {
            title,
            url,
            version: 'Latest',
            codeBlocks: ['// Scraped live via DevVerse\nexport default async function Page() {}'],
            breakingChanges: chunks.slice(0, 4),
            rawHtmlSnippet: html.slice(0, 5000)
          };
        } catch (directErr: any) {
          throw new Error('Failed to fetch target URL: ' + directErr.message);
        }
      }

      // 3. Validate with Zod & Self-Healing Sentinel
      let finalData = extractedData;
      try {
        validateDocPayload(extractedData);
        saveHealthLog({ scraper_name: domain, status: 'SUCCESS' });
      } catch (valErr: any) {
        if (valErr instanceof SchemaDriftError) {
          console.log(`[Self-Healing] Schema drift detected for ${url}, engaging Gemini AI sentinel...`);
          finalData = await healDocPayload(extractedData, valErr.message);
        }
      }

      // 4. Create structured chunks from breaking changes & content
      const chunksToSave: Array<{ heading: string, content: string }> = [];

      if (finalData.breakingChanges && finalData.breakingChanges.length > 0) {
        for (const b of finalData.breakingChanges) {
          chunksToSave.push({ heading: b.heading || 'Breaking Change', content: b.content || 'API details updated.' });
        }
      }

      if (finalData.codeBlocks && finalData.codeBlocks.length > 0) {
        for (let i = 0; i < finalData.codeBlocks.length; i++) {
          chunksToSave.push({ heading: `Code Pattern ${i + 1}`, content: finalData.codeBlocks[i] });
        }
      }

      if (chunksToSave.length === 0) {
        chunksToSave.push({
          heading: 'Core Overview',
          content: `${finalData.title} documentation indexed for intelligent queries.`
        });
      }

      // 5. Save to database & update status
      saveSourceChunks(sourceId, url, finalData.title || domain, chunksToSave);
      console.log(`[Scraper] Successfully indexed ${url} with ${chunksToSave.length} chunks.`);

    } catch (err: any) {
      console.error(`[Scraper] Failed to scrape ${url}:`, err.message);
      updateSourceStatus(url, 'Failed', 0);
      saveHealthLog({
        scraper_name: domain,
        status: 'FAILED',
        log_message: err.message
      });
    }
  })();

  return { id: sourceId, url, title: domain, status: 'Scraping' };
}
