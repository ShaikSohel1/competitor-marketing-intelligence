import { NextResponse } from "next/server";
import FirecrawlApp from "@mendable/firecrawl-js";

export async function POST(req: Request) {
  let websiteUrl = '';
  
  try {
    const { website } = await req.json();
    websiteUrl = website || '';

    if (!websiteUrl) {
      return NextResponse.json({ error: "Missing website url" }, { status: 400 });
    }

    if (!process.env.FIRECRAWL_API_KEY) {
      throw new Error("FIRECRAWL_API_KEY is not set");
    }

    const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
    
    // Use the /map endpoint to discover pages on the website
    const mapResult = await app.mapUrl(websiteUrl, {
      limit: 10,
    });

    // Convert map result to our page_type format
    const cleanUrl = websiteUrl.replace(/\/$/, '');
    
    // Always include the homepage
    const pages = [
      { url: cleanUrl, page_type: 'homepage' }
    ];

    // Attempt to categorize discovered URLs
    if (mapResult.links) {
      for (const result of mapResult.links) {
        const linkUrl = typeof result === 'string' ? result : (result as any).url || '';
        if (!linkUrl) continue;
        if (linkUrl === cleanUrl || linkUrl === cleanUrl + '/') continue;

        let pageType = 'general';
        const lowerLink = linkUrl.toLowerCase();
        if (lowerLink.includes('pricing') || lowerLink.includes('plans')) pageType = 'pricing';
        else if (lowerLink.includes('blog') || lowerLink.includes('news')) pageType = 'blog';
        else if (lowerLink.includes('about') || lowerLink.includes('company')) pageType = 'about';
        else if (lowerLink.includes('careers') || lowerLink.includes('jobs')) pageType = 'careers';
        else if (lowerLink.includes('docs') || lowerLink.includes('help')) pageType = 'docs';
        
        // Prevent adding too many general pages to keep UI clean
        if (pageType !== 'general' || pages.length < 5) {
          pages.push({ url: linkUrl, page_type: pageType });
        }
      }
    }

    return NextResponse.json({ pages });

  } catch (error: any) {
    console.error("Discover Error:", error);
    
    // Fallback on error
    const cleanFallbackUrl = websiteUrl.replace(/\/$/, '');
    return NextResponse.json({ 
      pages: [
        { url: cleanFallbackUrl, page_type: 'homepage' },
        { url: `${cleanFallbackUrl}/pricing`, page_type: 'pricing' },
        { url: `${cleanFallbackUrl}/blog`, page_type: 'blog' },
        { url: `${cleanFallbackUrl}/about`, page_type: 'about' },
      ]
    });
  }
}
