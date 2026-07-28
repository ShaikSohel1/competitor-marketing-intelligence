export interface PageSpeedMetrics {
  lighthouse_score: number;
  seo_score: number;
  page_load_ms: number;
  core_web_vitals: {
    fcp: number | null; // First Contentful Paint (ms)
    lcp: number | null; // Largest Contentful Paint (ms)
    cls: number | null; // Cumulative Layout Shift
  };
}

export async function fetchPageSpeedMetrics(url: string): Promise<PageSpeedMetrics | null> {
  try {
    // We use the public (unauthenticated) endpoint for simplicity
    // If rate limits become an issue, we can pass `&key=YOUR_API_KEY`
    const apiKey = process.env.PAGESPEED_API_KEY;
    const keyParam = apiKey ? `&key=${apiKey}` : '';
    
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
      url
    )}&category=performance&category=seo&strategy=desktop${keyParam}`;

    console.info(`[PageSpeed] Fetching metrics for: ${url}`);
    
    const res = await fetch(apiUrl);
    if (!res.ok) {
      console.warn(`[PageSpeed] API error for ${url}: ${res.status}`);
      return null;
    }

    const data = await res.json();
    
    const performanceScore = data.lighthouseResult?.categories?.performance?.score;
    const seoScore = data.lighthouseResult?.categories?.seo?.score;
    
    const audits = data.lighthouseResult?.audits;
    
    // speed-index or interactive
    const pageLoadMs = audits?.['speed-index']?.numericValue || audits?.['interactive']?.numericValue || 0;
    
    const fcp = audits?.['first-contentful-paint']?.numericValue || null;
    const lcp = audits?.['largest-contentful-paint']?.numericValue || null;
    const cls = audits?.['cumulative-layout-shift']?.numericValue || null;

    return {
      lighthouse_score: performanceScore !== undefined ? Math.round(performanceScore * 100) : 0,
      seo_score: seoScore !== undefined ? Math.round(seoScore * 100) : 0,
      page_load_ms: Math.round(pageLoadMs),
      core_web_vitals: {
        fcp: fcp ? Math.round(fcp) : null,
        lcp: lcp ? Math.round(lcp) : null,
        cls: cls ? Number(cls.toFixed(3)) : null,
      },
    };
  } catch (error) {
    console.error(`[PageSpeed] Failed to fetch metrics for ${url}:`, error);
    return null;
  }
}
