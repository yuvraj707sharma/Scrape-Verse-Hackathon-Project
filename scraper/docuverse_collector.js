// Bright Data Scraper Studio IDE - Custom JavaScript Collector for Documentation Sites
// This script runs in Bright Data's managed browser environment.

export async function scrapePage({ page }) {
  await page.waitForSelector('main, article, div.content, .markdown-body', { timeout: 10000 });

  const data = await page.evaluate(() => {
    // 1. Extract Core Metadata
    const title = document.querySelector('h1')?.innerText || 'Untitled Doc';
    const category = document.querySelector('nav .active, header nav')?.innerText || 'General';
    const version = document.querySelector('.version-tag, span.badge')?.innerText || 'Latest';
    
    // 2. Extract Code Blocks
    const codeBlocks = Array.from(document.querySelectorAll('pre code')).map(el => el.innerText);
    
    // 3. Extract Breaking Changes & API Rules
    const breakingChanges = Array.from(document.querySelectorAll('h2, h3'))
      .filter(h => h.innerText.toLowerCase().includes('breaking') || h.innerText.toLowerCase().includes('deprecated'))
      .map(h => ({
        heading: h.innerText,
        content: h.nextElementSibling?.innerText || ''
      }));

    // 4. Capture raw HTML snapshot for AI Self-Healing fallback
    const rawHtmlSnippet = document.body.innerHTML.substring(0, 8000); // Send first 8KB of body

    return {
      title,
      category,
      version,
      codeBlocks,
      breakingChanges,
      rawHtmlSnippet,
      url: window.location.href,
      scrapedAt: new Date().toISOString()
    };
  });

  return data;
}
