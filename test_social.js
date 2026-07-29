const FirecrawlApp = require('@mendable/firecrawl-js').default;
const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
async function test() {
  const urls = [
    'https://www.youtube.com/c/supabase',
    'https://www.linkedin.com/company/supabase/',
    'https://www.instagram.com/p/DW9M3UHANST/',
    'https://www.facebook.com/supabaseDev/'
  ];
  for (const url of urls) {
    try {
      console.log(`\n--- Scraping ${url} ---`);
      const res = await app.scrapeUrl(url, { formats: ['markdown'] });
      console.log(res.markdown ? res.markdown.substring(0, 300) + '...' : 'NO MARKDOWN');
    } catch (e) {
      console.error('Error:', e.message);
    }
  }
}
test().catch(console.error);
