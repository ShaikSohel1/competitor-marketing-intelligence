import { NextResponse } from "next/server";
import FirecrawlApp from "@mendable/firecrawl-js";

const GEMINI_SYSTEM_PROMPT = `
You are an expert AI data extraction tool for a competitive intelligence platform.
Your job is to analyze the markdown scraped from a competitor's website and extract structured business data.
You must return a valid JSON object matching exactly this schema, and nothing else.
If you cannot find real data for a specific field, make a highly educated estimate based on the company's industry and context, or return an empty array/null if estimation is impossible.

Schema required:
{
  "seo_keywords": [
    { "keyword": "string", "volume": number, "difficulty": number, "rank": number }
  ],
  "pricing_items": [
    { "productName": "string", "tier": "string", "price": number, "currency": "string", "features": ["string"] }
  ],
  "social_profiles": [
    { "platform": "string", "url": "string", "followers": number }
  ],
  "ad_creatives": [
    { "headline": "string", "platform": "string", "format": "string" }
  ],
  "company_details": {
    "industry": "string",
    "target_audience": "string",
    "brand_voice": "string",
    "employee_count": number,
    "annual_revenue": "string"
  }
}

Extract 5-10 SEO keywords they are likely targeting.
Extract up to 3 pricing items if available.
Extract any social media profiles linked.
Extract 2-3 hypothetical ad creatives they might be running based on their value proposition.
`;

export async function POST(req: Request) {
  let url = '';
  let competitorName = '';

  try {
    const body = await req.json();
    url = body.url;
    competitorName = body.competitorName;

    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    if (!process.env.FIRECRAWL_API_KEY) {
      throw new Error("FIRECRAWL_API_KEY is not set");
    }

    if (!process.env.NEXT_GEMINI_API_KEY) {
      throw new Error("NEXT_GEMINI_API_KEY is not set");
    }

    console.info(`[Extract API] Scrape starting for url=${url}`);

    // 1. Firecrawl Scrape
    const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
    const scrapeResult = await app.scrapeUrl(url, {
      formats: ["markdown", "screenshot", "html"],
      timeout: 30000,
    });

    const markdown = scrapeResult.markdown || '';
    const html = scrapeResult.html || '';
    const screenshot = scrapeResult.screenshot || '';

    console.info(`[Extract API] Scrape finished. Markdown length: ${markdown.length}`);

    // 2. Gemini Extraction
    console.info(`[Extract API] Sending to Gemini...`);
    const promptText = `${GEMINI_SYSTEM_PROMPT}\n\nCompetitor Name: ${competitorName || 'Unknown'}\nWebsite Markdown:\n${markdown.substring(0, 40000)}`;
    
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.NEXT_GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: promptText }]
        }],
        generationConfig: {
          responseMimeType: "application/json",
        }
      })
    });

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error("[Extract API] Gemini error:", errorText);
      throw new Error("Gemini API failed");
    }

    const geminiData = await geminiRes.json();
    const extractedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!extractedText) {
      throw new Error("Empty response from Gemini");
    }

    const structuredData = JSON.parse(extractedText);
    
    console.info(`[Extract API] Gemini extraction complete. Returning data.`);

    return NextResponse.json({ 
      html, 
      screenshot_url: screenshot,
      extracted_data: structuredData
    });

  } catch (error: any) {
    console.error(`[Extract API] Failed for url=${url || 'unknown'}`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
