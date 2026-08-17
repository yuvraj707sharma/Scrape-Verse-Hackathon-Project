import fetch from 'node-fetch';
import 'dotenv/config';

// Make sure you add BRIGHTDATA_API_TOKEN to your .env file
const API_TOKEN = process.env.BRIGHTDATA_API_TOKEN;
const COLLECTOR_ID = 'c_msxhiutw28er91v7oo'; // Your specific scraper ID
const LOCAL_API_URL = 'http://localhost:3000/api/ingest';

if (!API_TOKEN) {
  console.error("❌ ERROR: Missing BRIGHTDATA_API_TOKEN in .env file.");
  console.error("Please copy it from Bright Data (Account Settings -> API Keys) and add it to your .env file.");
  process.exit(1);
}

async function triggerScraper(urlToScrape) {
  console.log(`🚀 Triggering Bright Data Scraper for: ${urlToScrape}`);
  
  // 1. Trigger the job
  const triggerRes = await fetch('https://api.brightdata.com/dca/trigger?collector=' + COLLECTOR_ID + '&queue_next=1', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + API_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([{ url: urlToScrape }])
  });

  const triggerData = await triggerRes.json();
  const collectionId = triggerData.collection_id;
  
  if (!collectionId) {
    console.error("❌ Failed to start scraper:", triggerData);
    return;
  }
  
  console.log(`✅ Scraper started! Collection ID: ` + collectionId);
  console.log(`⏳ Waiting for results... (This usually takes 10-30 seconds)`);

  // 2. Poll for results
  let dataset = null;
  while (!dataset) {
    await new Promise(r => setTimeout(r, 5000)); // wait 5 seconds between checks
    
    const statusRes = await fetch('https://api.brightdata.com/dca/dataset?id=' + collectionId, {
      headers: { 'Authorization': 'Bearer ' + API_TOKEN }
    });

    if (statusRes.status === 200) {
      // Data is ready!
      dataset = await statusRes.json();
      console.log(`✅ Data retrieved from Bright Data successfully!`);
    } else if (statusRes.status !== 202) {
      console.error(`❌ Error checking status. Status code: ` + statusRes.status);
      return;
    }
  }

  // 3. Send the data to our local DevVerse backend
  console.log(`📥 Sending extracted data to local DevVerse Hub...`);
  
  // Bright Data returns an array of results. We grab the first one.
  const payload = dataset[0] || dataset; 

  try {
    const ingestRes = await fetch(LOCAL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const ingestData = await ingestRes.json();
    console.log(`🎉 Success! DevVerse processed the data:`, ingestData);
    console.log(`Check your dashboard at http://localhost:3000 to see it live!`);
    
  } catch (error) {
    console.error(`❌ Failed to send data to DevVerse (is the server running on port 3000?)`, error.message);
  }
}

// Run the function with a target URL
triggerScraper('https://nextjs.org/docs');
