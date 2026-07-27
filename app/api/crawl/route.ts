import { NextResponse } from "next/server";
import FirecrawlApp from "@mendable/firecrawl-js";

export async function POST(req: Request) {
  let url = '';
  let page_id = '';

  try {
    const body = await req.json();
    url = body.url;
    page_id = body.page_id;

    if (!url || !page_id) {
      return NextResponse.json({ error: "Missing url or page_id" }, { status: 400 });
    }

    if (!process.env.FIRECRAWL_API_KEY) {
      throw new Error("FIRECRAWL_API_KEY is not set");
    }

    console.info(`[Crawl API] Starting crawl for url=${url} page_id=${page_id}`);

    // Initialize Firecrawl app
    const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

    // Scrape the URL for HTML and a screenshot
    const scrapeResult = await app.scrapeUrl(url, {
      formats: ["html", "screenshot"],
      timeout: 30000,
    });

    console.info(
      `[Crawl API] Crawl succeeded for url=${url} page_id=${page_id} screenshot=${Boolean(scrapeResult.screenshot)}`
    );

    return NextResponse.json({ 
      html: scrapeResult.html, 
      screenshot_url: scrapeResult.screenshot 
    });

  } catch (error: any) {
    console.error(`[Crawl API] Crawl failed for url=${url || 'unknown'} page_id=${page_id || 'unknown'}`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
