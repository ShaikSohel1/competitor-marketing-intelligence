import { NextResponse } from "next/server";
import FirecrawlApp from "@mendable/firecrawl-js";


/**
 * Groq system prompt — every field name maps 1:1 to a Supabase column.
 * CHECK constraints are documented inline so Groq never produces invalid enums.
 */
const GROQ_SYSTEM_PROMPT = `You are an expert competitive-intelligence data-extraction engine.
You will receive markdown scraped from a competitor's website (possibly multiple pages).
Analyze it and return a SINGLE valid JSON object — no commentary, no markdown fences.

Return this exact schema:

{
  "website_snapshot": {
    "title": "string — page <title> tag text",
    "meta_description": "string — meta description content",
    "word_count": "number — estimated total word count across all pages"
  },
  "seo_keywords": [
    {
      "keyword": "string — a keyword the site is clearly targeting",
      "rank": "number|null — estimated Google rank (1-100), null if unknown",
      "search_volume": "number|null — estimated monthly search volume",
      "difficulty": "number|null — SEO difficulty score 0-100"
    }
  ],
  "pricing_items": [
    {
      "product_name": "string — name of the product, plan, or featured item (e.g., 'Wayfarer Sunglasses', 'Pro Plan')",
      "price": "number — numeric price value (0 if free or not listed)",
      "currency": "string — 3-letter currency code e.g. USD, INR, EUR",
      "tier": "string|null — tier name like Basic, Pro, or category like 'Eyewear'"
    }
  ],
  "social_profiles": [
    {
      "platform": "string — one of: youtube, linkedin, twitter, instagram, facebook",
      "handle": "string — the @handle or username (e.g. @lenskart or lenskart)",
      "profile_url": "string — full URL to the social profile",
      "followers": "number|null — estimated follower count, null if unknown"
    }
  ],
  "ad_creatives": [
    {
      "platform": "string — e.g. Google Ads, Meta Ads, LinkedIn Ads",
      "headline": "string — the ad headline text",
      "body_text": "string|null — the ad body copy",
      "format": "string — MUST be one of: image, video, carousel, text, unknown",
      "landing_url": "string|null — the landing page URL"
    }
  ],
  "company_info": {
    "industry": "string|null",
    "description": "string|null — one-sentence company description",
    "employee_count": "number|null",
    "target_audience": "string|null"
  },
  "discovered_pages": [
    {
      "url": "string — full URL of a discovered page",
      "page_type": "string — MUST be one of: homepage, pricing, blog, careers, product, features, about, docs, changelog, general"
    }
  ],
  "strategic_insight": "string — a 2-3 sentence strategic summary of the competitor's positioning, strengths, and weaknesses"
}

RULES:
- Extract 5-15 SEO keywords the site is clearly targeting based on headings, content, and meta tags.
- Extract ALL pricing items visible on any page. For SaaS, extract pricing plans. For E-commerce (like Lenskart/Titan Eye+), extract ANY featured products with prices found on the homepage or categories. Use 0 if the price is missing or free.
- Extract ALL social media links found anywhere on the site.
- Infer 2-4 ad creatives the company might run based on their value propositions. The "format" field MUST be one of: image, video, carousel, text, unknown.
- For discovered_pages, list important internal links you found. The "page_type" MUST be one of: homepage, pricing, blog, careers, product, features, about, docs, changelog, general.
- Be factual. Do not invent data that isn't supported by the page content. Use null for unknown numeric values.
`;

/**
 * Try to scrape a subpage. Returns markdown or empty string on failure.
 */
async function tryScrapeSubpage(
  app: FirecrawlApp,
  baseUrl: string,
  path: string
): Promise<{ markdown: string; url: string }> {
  try {
    const url = new URL(path, baseUrl).href;
    const result = await app.scrapeUrl(url, {
      formats: ["markdown"],
      timeout: 15000,
    });
    return { markdown: result.markdown || "", url };
  } catch {
    return { markdown: "", url: "" };
  }
}

export async function POST(req: Request) {
  let url = "";
  let competitorName = "";

  try {
    const body = await req.json();
    url = body.url;
    competitorName = body.competitorName || "Unknown";
    const socialLinks = body.social_links || body.socialLinks || {};

    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }
    if (!process.env.FIRECRAWL_API_KEY) {
      throw new Error("FIRECRAWL_API_KEY is not set");
    }
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not set");
    }

    // ── 1. Firecrawl: scrape homepage ──────────────────────────────────
    console.info(`[Extract] Scraping homepage: ${url}`);
    const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

    const homepageResult = await app.scrapeUrl(url, {
      formats: ["markdown", "screenshot", "html"],
      timeout: 30000,
    });

    const homepageMarkdown = homepageResult.markdown || "";
    const html = homepageResult.html || "";
    const screenshot = homepageResult.screenshot || "";

    console.info(`[Extract] Homepage scraped. Markdown: ${homepageMarkdown.length} chars`);

    // ── 2. Firecrawl: attempt to scrape key subpages ──────────────────
    const subpages = ["/pricing", "/about", "/blog", "/products", "/features"];
    const subpageResults = await Promise.allSettled(
      subpages.map((path) => tryScrapeSubpage(app, url, path))
    );

    let combinedMarkdown = `# HOMEPAGE\n${homepageMarkdown}\n\n`;
    for (let i = 0; i < subpages.length; i++) {
      const result = subpageResults[i];
      if (result.status === "fulfilled" && result.value.markdown.length > 200) {
        combinedMarkdown += `# ${subpages[i].toUpperCase().replace("/", "")} PAGE\n${result.value.markdown}\n\n`;
      }
    }

    console.info(`[Extract] Combined markdown: ${combinedMarkdown.length} chars`);

    // ── 3. Groq: structured extraction ──────────────────────────────
    // Truncate to stay within token limits (llama-3.1-70b-versatile supports 128k tokens)
    const truncatedMarkdown = combinedMarkdown.substring(0, 150000);
    const socialContext = Object.keys(socialLinks).length > 0
      ? `User Provided Social Media Links: ${JSON.stringify(socialLinks)}\n`
      : "";

    const promptText = `${GROQ_SYSTEM_PROMPT}

Competitor Name: ${competitorName}
Competitor URL: ${url}
${socialContext}
--- SCRAPED WEBSITE CONTENT ---
${truncatedMarkdown}`;

    console.info(`[Extract] Sending ${truncatedMarkdown.length} chars to OpenRouter...`);

    const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct",
        messages: [
          { role: "system", content: GROQ_SYSTEM_PROMPT },
          { role: "user", content: promptText }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!openRouterRes.ok) {
      const errText = await openRouterRes.text();
      console.error("[Extract] OpenRouter API error:", errText);
      throw new Error(`OpenRouter API error: ${openRouterRes.status}`);
    }

    const groqData = await openRouterRes.json();
    const rawText = groqData.choices[0]?.message?.content;

    if (!rawText) {
      console.error("[Extract] OpenRouter returned empty content");
      throw new Error("Empty response from OpenRouter");
    }

    // ── 4. Parse JSON robustly ────────────────────────────────────────
    let structuredData: any;
    try {
      structuredData = JSON.parse(rawText);
    } catch {
      // Groq sometimes wraps in ```json ... ``` fences
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        structuredData = JSON.parse(jsonMatch[1]);
      } else {
        console.error("[Extract] Failed to parse Groq output:", rawText.substring(0, 500));
        throw new Error("Failed to parse Groq JSON output");
      }
    }

    console.info("[Extract] Groq extraction complete.");

    return NextResponse.json({
      html,
      screenshot_url: screenshot,
      extracted_data: structuredData,
    });
  } catch (error: any) {
    console.error(`[Extract] Pipeline failed for url=${url || "unknown"}:`, error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Extraction pipeline failed" },
      { status: 500 }
    );
  }
}
