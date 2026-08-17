// Bright Data Scraper Studio IDE - Custom JavaScript Collector for Tech Trends
export async function scrapePage({ page }) {
  await page.waitForSelector('.Box-row, .repo-list-item, .post-item', { timeout: 10000 });

  const items = await page.evaluate(() => {
    // General parser for standard list views
    const rows = Array.from(document.querySelectorAll('.Box-row, article'));
    
    return rows.map(row => {
      const repoName = row.querySelector('h2 a, h1 a')?.innerText?.trim() || 'Unknown';
      const description = row.querySelector('p')?.innerText?.trim() || '';
      const language = row.querySelector('[itemprop="programmingLanguage"]')?.innerText?.trim() || 'Unknown';
      
      const starText = row.querySelector('a[href$="/stargazers"]')?.innerText?.trim() || '0';
      const stars = parseInt(starText.replace(/,/g, '')) || 0;

      return {
        repoName,
        description,
        language,
        stars
      };
    });
  });

  return items;
}
