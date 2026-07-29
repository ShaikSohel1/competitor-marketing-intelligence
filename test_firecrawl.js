const FirecrawlApp = require('@mendable/firecrawl-js').default;
const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
async function test() {
  const result = await app.scrapeUrl('https://twitter.com/vercel', { formats: ['markdown'] });
  console.log(result.markdown);
}
test().catch(console.error);
