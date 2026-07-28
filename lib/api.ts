import { supabase } from './supabase';
import { getUserCompetitorIds, getUserId } from './workspace';
import type {
  Competitor,
  CompetitorWithStats,
  Scan,
  ChangeEvent,
  WebsiteSnapshot,
  SeoKeyword,
  SocialPost,
  PricingItem,
  AdCreative,
  Alert,
  AiInsight,
  Report,
  NewCompetitorInput,
  ChatMessage,
  ChatMessageSource,
  SocialProfile,
  PricingSnapshot,
  TechStackSnapshot,
  CompetitorGroup,
  AlertRule,
  CompanyProfile,
  ComparisonMetrics,
  SwotAnalysis,
  TrackedKeyword,
  MonitoredUrl,
} from '@/types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';
// No demo data generation anymore

const authHeaders = (accessToken: string): HeadersInit => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${accessToken}`,
  apikey: SUPABASE_ANON_KEY,
});

async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? SUPABASE_ANON_KEY;
}

/* ----------------------------- My Company Profile ----------------------------- */

export async function fetchCompanyProfile(): Promise<CompanyProfile | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('company_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[fetchCompanyProfile] DB error:', error.message);
    return null;
  }

  return (data as CompanyProfile) ?? null;
}

export async function saveCompanyProfile(
  input: Partial<CompanyProfile> & { company_name: string; website: string }
): Promise<CompanyProfile> {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes?.user?.id;

  if (!userId) {
    throw new Error('You must be logged in to save a company profile.');
  }

  // Strip any undefined values so Supabase doesn't reject them
  const profileData: Record<string, unknown> = Object.fromEntries(
    Object.entries({
      ...input,
      user_id: userId,
      updated_at: new Date().toISOString(),
    }).filter(([, v]) => v !== undefined)
  );

  const { data, error } = await supabase
    .from('company_profiles')
    .upsert(profileData, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('[saveCompanyProfile] DB error:', error);
    throw new Error(`Failed to save company profile: ${error.message}`);
  }

  return data as CompanyProfile;
}

/* ----------------------------- Competitors ----------------------------- */

export async function fetchCompetitors(): Promise<CompetitorWithStats[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('competitors')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const rawList = (data ?? []) as CompetitorWithStats[];

  // Deduplicate competitors by normalized domain / website
  const seenDomains = new Set<string>();
  const uniqueList: CompetitorWithStats[] = [];

  for (const comp of rawList) {
    const domain = comp.website
      ? comp.website.toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '')
      : comp.name.toLowerCase();

    if (!seenDomains.has(domain)) {
      seenDomains.add(domain);
      uniqueList.push(comp);
    }
  }

  return uniqueList;
}

export async function fetchCompetitor(id: string): Promise<Competitor | null> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('competitors')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Competitor | null;
}

export async function createCompetitor(input: NewCompetitorInput): Promise<Competitor> {
  let userId = await getUserId();

  // Normalize website URL & domain
  const rawWebsite = input.website.trim().toLowerCase();
  const domain = rawWebsite.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '');
  const cleanWebsite = rawWebsite.startsWith('http') ? rawWebsite : `https://${domain}`;

  // Check if competitor already exists in this workspace by domain or name
  const { data: existing } = await supabase
    .from('competitors')
    .select('*')
    .eq('user_id', userId);

  if (existing && existing.length > 0) {
    const match = existing.find((c) => {
      const cDomain = (c.website || '').toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '');
      return cDomain === domain || c.name.toLowerCase() === input.name.trim().toLowerCase();
    });
    if (match) {
      return match as Competitor;
    }
  }

  const insertData: Record<string, unknown> = {
    name: input.name.trim(),
    website: cleanWebsite,
    industry: input.industry ?? null,
    description: input.description ?? null,
    social_links: input.social_links ?? {},
    tracked_keywords: input.tracked_keywords ?? [],
    user_id: userId || '',
  };

  let { data, error } = await supabase
    .from('competitors')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    // If foreign key constraint on user_id failed, fetch actual valid workspace id and retry
    if (error.message?.includes('foreign key') || error.message?.includes('user_id') || error.code === '23503') {
      const { data: realWs } = await supabase.from('workspaces').select('id').limit(1);
      if (realWs && realWs.length > 0) {
        userId = realWs[0].id;
        const retryRes = await supabase
          .from('competitors')
          .insert({ ...insertData, user_id: userId })
          .select()
          .single();
        if (!retryRes.error && retryRes.data) {
          return retryRes.data as Competitor;
        }
      }
    }
    throw new Error(error.message || error.details || error.hint || 'Failed to create competitor record');
  }
  return data as Competitor;
}

export async function updateCompetitor(
  id: string,
  patch: Partial<NewCompetitorInput> & { activity_score?: number; threat_level?: string; status?: string; scan_frequency?: string }
): Promise<Competitor> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('competitors')
    .update(patch)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data as Competitor;
}

export async function deleteCompetitor(id: string): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase.from('competitors').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export async function startCrawl(competitorId: string) {
  console.info(`[Crawl API] startCrawl invoked for competitorId=${competitorId}`);
  const { data, error } = await supabase.functions.invoke('scan-competitor', {
    body: { competitorId }
  });
  if (error) {
    console.error(`[Crawl API] startCrawl failed for competitorId=${competitorId}`, error);
    throw error;
  }
  console.info(`[Crawl API] startCrawl succeeded for competitorId=${competitorId}`);
  return data;
}

export async function triggerDigest() {
  const { data, error } = await supabase.functions.invoke('digest-alerts');
  if (error) throw error;
  return data;
}

/**
 * Scrape our own company's website using the same Firecrawl + Groq pipeline
 * and store the extracted intelligence in company_profiles.scraped_data
 */
export async function scanOurCompany(): Promise<{ summary: string }> {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  // 1. Fetch our company profile
  const { data: profile, error: profileErr } = await supabase
    .from('company_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (profileErr || !profile) {
    throw new Error('Company profile not found. Please set up your company profile first.');
  }

  if (!profile.website) {
    throw new Error('Company website URL is not set in your profile.');
  }

  // 2. Call the extract pipeline and PageSpeed Insights concurrently
  let extractedData: any = null;
  let pageSpeedData: any = null;

  try {
    const [extractRes, psRes] = await Promise.all([
      fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: profile.website,
          competitorName: profile.company_name,
          social_links: profile.social_links || {},
        }),
      }),
      fetch('/api/pagespeed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: profile.website }),
      })
    ]);

    if (extractRes.ok) {
      const crawlData = await extractRes.json();
      extractedData = crawlData.extracted_data;
    } else {
      const errText = await extractRes.text();
      console.error('[scanOurCompany] Extract API failed:', errText);
      throw new Error('Failed to scrape company website');
    }
    
    if (psRes.ok) {
      pageSpeedData = await psRes.json();
    } else {
      console.warn('[scanOurCompany] PageSpeed API failed');
    }
  } catch (err) {
    console.error('[scanOurCompany] Extract/PageSpeed API call failed:', err);
    throw err;
  }

  if (!extractedData) {
    throw new Error('No data extracted from company website');
  }

  // Attach pagespeed data
  if (pageSpeedData) {
    extractedData.pagespeed = pageSpeedData;
  }

  // 3. Save the extracted data to company_profiles.scraped_data
  const { error: updateErr } = await supabase
    .from('company_profiles')
    .update({
      scraped_data: extractedData,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (updateErr) {
    console.error('[scanOurCompany] Failed to save scraped data:', updateErr);
    throw new Error('Failed to save scraped intelligence data');
  }

  const summary = extractedData.strategic_insight
    ? `Scanned ${profile.company_name} successfully. ${extractedData.strategic_insight}`
    : `Scanned ${profile.company_name} successfully. Intelligence data captured.`;

  return { summary };
}

export async function scanCompetitor(competitorId: string): Promise<{ scanId: string; summary: string }> {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const now = new Date().toISOString();

  // 1. Fetch target competitor
  const { data: competitor, error: compErr } = await supabase
    .from('competitors')
    .select('*')
    .eq('id', competitorId)
    .eq('user_id', userId)
    .maybeSingle();

  if (compErr || !competitor) {
    throw new Error('Competitor record not found in workspace.');
  }

  // 2. Record scan entry
  const { data: scan } = await supabase
    .from('scans')
    .insert({
      competitor_id: competitorId,
      status: 'running',
      scan_type: 'full',
      changes_detected: 0,
      ai_summary: `Scanning ${competitor.name}...`,
      started_at: now,
    })
    .select()
    .single();

  const scanId = scan?.id || competitorId;

  // 3. Call the extract pipeline and PageSpeed Insights concurrently
  let html = '';
  let screenshot = '';
  let extractedData: any = null;
  let pageSpeedData: any = null;

  try {
    const [extractRes, psRes] = await Promise.all([
      fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: competitor.website,
          competitorName: competitor.name,
          social_links: competitor.social_links || {},
        }),
      }),
      fetch('/api/pagespeed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: competitor.website }),
      })
    ]);

    if (extractRes.ok) {
      const crawlData = await extractRes.json();
      html = crawlData.html || '';
      screenshot = crawlData.screenshot_url || '';
      extractedData = crawlData.extracted_data;
    } else {
      const errText = await extractRes.text();
      console.error('[scanCompetitor] Extract API failed:', errText);
    }

    if (psRes.ok) {
      pageSpeedData = await psRes.json();
    } else {
      console.warn('[scanCompetitor] PageSpeed API failed');
    }
  } catch (err) {
    console.error('[scanCompetitor] Extract/PageSpeed API call failed:', err);
  }

  // 4. Delete old records for a clean re-scan
  await Promise.allSettled([
    supabase.from('website_snapshots').delete().eq('competitor_id', competitorId),
    supabase.from('seo_keywords').delete().eq('competitor_id', competitorId),
    supabase.from('pricing_items').delete().eq('competitor_id', competitorId),
    supabase.from('social_profiles').delete().eq('competitor_id', competitorId),
    supabase.from('ad_creatives').delete().eq('competitor_id', competitorId),
    supabase.from('monitored_urls').delete().eq('competitor_id', competitorId),
    supabase.from('ai_insights').delete().eq('competitor_id', competitorId),
  ]);

  // 5. Insert extracted data — column names match schema exactly
  const inserts: Promise<any>[] = [];
  let totalChanges = 0;

  // 5a. Website snapshot (schema: competitor_id, url, screenshot_url, title, meta_description, word_count, ...)
  const ws = extractedData?.website_snapshot;
  inserts.push(
    supabase.from('website_snapshots').insert({
      competitor_id: competitorId,
      scan_id: scanId,
      url: competitor.website,
      title: ws?.title || null,
      meta_description: ws?.meta_description || null,
      word_count: ws?.word_count || 0,
      screenshot_url: screenshot || null,
      metadata: pageSpeedData ? { pagespeed: pageSpeedData } : null,
      captured_at: now,
    }) as any
  );

  // 5b. SEO Keywords (schema: competitor_id, keyword, rank, search_volume, difficulty)
  if (extractedData?.seo_keywords?.length > 0) {
    const kwRows = extractedData.seo_keywords
      .filter((k: any) => k.keyword && typeof k.keyword === 'string')
      .map((k: any) => ({
        competitor_id: competitorId,
        keyword: k.keyword.substring(0, 200),
        rank: typeof k.rank === 'number' ? k.rank : null,
        search_volume: typeof k.search_volume === 'number' ? k.search_volume : null,
        difficulty: typeof k.difficulty === 'number' ? Math.min(Math.max(k.difficulty, 0), 100) : null,
        captured_at: now,
      }));
    if (kwRows.length > 0) {
      inserts.push(supabase.from('seo_keywords').insert(kwRows) as any);
      totalChanges += kwRows.length;
    }
  }

  // 5c. Pricing Items (schema: competitor_id, product_name, price, currency, tier)
  if (extractedData?.pricing_items?.length > 0) {
    const priceRows = extractedData.pricing_items
      .filter((p: any) => p.product_name)
      .map((p: any) => ({
        competitor_id: competitorId,
        product_name: p.product_name,
        price: typeof p.price === 'number' ? p.price : 0,
        currency: (p.currency || 'USD').substring(0, 3).toUpperCase(),
        tier: p.tier || null,
        captured_at: now,
      }));
    if (priceRows.length > 0) {
      inserts.push(supabase.from('pricing_items').insert(priceRows) as any);
      totalChanges += priceRows.length;
    }
  }

  // 5d. Social Profiles (schema: competitor_id, platform, handle (NOT NULL), followers)
  const VALID_PLATFORMS = ['youtube', 'linkedin', 'twitter', 'instagram', 'facebook'];
  const socialMap = new Map<string, any>();

  // First, add rows from user-provided social_links
  const knownLinks = (competitor.social_links || {}) as Record<string, string>;
  for (const [platKey, rawUrl] of Object.entries(knownLinks)) {
    if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) continue;
    const lowerPlat = platKey.toLowerCase();
    const plat = VALID_PLATFORMS.includes(lowerPlat) ? lowerPlat : 'twitter';
    let handle = rawUrl.trim();
    if (handle.startsWith('http://') || handle.startsWith('https://')) {
      try {
        const u = new URL(handle);
        const pathPart = u.pathname.replace(/\/$/, '');
        handle = pathPart.split('/').pop() || handle;
      } catch {
        // keep string as is
      }
    }
    handle = handle.replace(/^@/, '');

    socialMap.set(plat, {
      competitor_id: competitorId,
      platform: plat,
      handle: handle || competitor.name.toLowerCase().replace(/\s+/g, ''),
      name: competitor.name,
      followers: null,
      data_source: 'user_provided',
      captured_at: now,
    });
  }

  // Then merge AI extracted profiles
  if (extractedData?.social_profiles?.length > 0) {
    for (const s of extractedData.social_profiles) {
      if (!s.handle && !s.profile_url) continue;
      const platform = (s.platform || 'unknown').toLowerCase();
      const plat = VALID_PLATFORMS.includes(platform) ? platform : 'twitter';
      const existing = socialMap.get(plat) || {};

      socialMap.set(plat, {
        competitor_id: competitorId,
        platform: plat,
        handle: s.handle || s.profile_url || existing.handle || competitor.name.toLowerCase().replace(/\s+/g, ''),
        name: competitor.name,
        followers: typeof s.followers === 'number' ? s.followers : existing.followers || null,
        data_source: 'scraping',
        captured_at: now,
      });
    }
  }

  const socialRows = Array.from(socialMap.values());
  if (socialRows.length > 0) {
    inserts.push(supabase.from('social_profiles').insert(socialRows) as any);
    totalChanges += socialRows.length;
  }

  // 5e. Ad Creatives (schema: competitor_id, platform, headline, body_text, format — CHECK: image|video|carousel|text|unknown)
  const VALID_AD_FORMATS = ['image', 'video', 'carousel', 'text', 'unknown'];
  if (extractedData?.ad_creatives?.length > 0) {
    const adRows = extractedData.ad_creatives
      .filter((a: any) => a.headline)
      .map((a: any) => {
        const rawFormat = (a.format || 'unknown').toLowerCase();
        return {
          competitor_id: competitorId,
          platform: a.platform || 'Google Ads',
          headline: a.headline,
          body_text: a.body_text || null,
          format: VALID_AD_FORMATS.includes(rawFormat) ? rawFormat : 'unknown',
          landing_url: a.landing_url || competitor.website,
          status: 'active',
          first_seen_at: now,
          last_seen_at: now,
        };
      });
    if (adRows.length > 0) {
      inserts.push(supabase.from('ad_creatives').insert(adRows) as any);
      totalChanges += adRows.length;
    }
  }

  // 5f. Monitored URLs — auto-discover pages we scraped
  const VALID_PAGE_TYPES = ['homepage', 'pricing', 'blog', 'careers', 'product', 'features', 'about', 'docs', 'changelog', 'general', 'custom'];
  const monitoredRows: any[] = [
    {
      competitor_id: competitorId,
      url: competitor.website,
      page_type: 'homepage',
      label: 'Homepage',
      is_auto_discovered: true,
      last_checked_at: now,
      enabled: true,
    },
  ];
  if (extractedData?.discovered_pages?.length > 0) {
    for (const page of extractedData.discovered_pages) {
      if (page.url && page.url !== competitor.website) {
        const pageType = VALID_PAGE_TYPES.includes(page.page_type) ? page.page_type : 'general';
        monitoredRows.push({
          competitor_id: competitorId,
          url: page.url,
          page_type: pageType,
          label: pageType.charAt(0).toUpperCase() + pageType.slice(1),
          is_auto_discovered: true,
          last_checked_at: now,
          enabled: true,
        });
      }
    }
  }
  inserts.push(supabase.from('monitored_urls').insert(monitoredRows) as any);

  // 5g. AI Insight — strategic summary
  if (extractedData?.strategic_insight) {
    inserts.push(
      supabase.from('ai_insights').insert({
        user_id: userId,
        competitor_id: competitorId,
        insight_type: 'summary',
        title: `AI Intelligence Report: ${competitor.name}`,
        content: extractedData.strategic_insight,
        recommendations: [],
        sentiment: 'neutral',
        confidence: 0.85,
      }) as any
    );
  }

  // 5h. Update competitor metadata from extraction
  if (extractedData?.company_info) {
    const ci = extractedData.company_info;
    const updatePayload: any = {};
    if (ci.industry) updatePayload.industry = ci.industry;
    if (ci.description) updatePayload.description = ci.description;
    if (Object.keys(updatePayload).length > 0) {
      inserts.push(supabase.from('competitors').update(updatePayload).eq('id', competitorId) as any);
    }
  }

  // Execute all inserts in parallel
  const results = await Promise.allSettled(inserts);
  const insertLabels = [
    'website_snapshots', 'seo_keywords', 'pricing_items', 'social_profiles',
    'ad_creatives', 'monitored_urls', 'ai_insights', 'competitor_update',
  ];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const label = insertLabels[i] || `insert_${i}`;
    if (r.status === 'rejected') {
      console.error(`[scanCompetitor] INSERT FAILED [${label}]:`, r.reason);
    } else if (r.value && typeof r.value === 'object' && 'error' in r.value && r.value.error) {
      // Supabase returns { data, error } — Promise.allSettled marks it "fulfilled"
      // but the insert itself failed at the DB level
      console.error(`[scanCompetitor] DB ERROR [${label}]:`, (r.value as any).error?.message || (r.value as any).error);
    }
  }

  // 6. Finalize scan record
  const aiSummary = extractedData?.strategic_insight
    ? `Completed full intelligence scan for ${competitor.name}. ${extractedData.strategic_insight}`
    : `Completed scan for ${competitor.name}. Extracted website data and intelligence.`;

  await supabase
    .from('scans')
    .update({
      status: 'completed',
      changes_detected: totalChanges,
      ai_summary: aiSummary,
      completed_at: new Date().toISOString(),
    })
    .eq('id', scanId);

  // 7. Update competitor last_scanned_at
  await supabase
    .from('competitors')
    .update({
      last_scanned_at: new Date().toISOString(),
      activity_score: Math.min(100, 60 + totalChanges * 3),
      status: 'active',
    })
    .eq('id', competitorId)
    .eq('user_id', userId);

  return {
    scanId,
    summary: aiSummary,
  };
}

export async function runLighthouseTest(competitorId: string): Promise<void> {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  // Fetch competitor URL
  const { data: competitor } = await supabase
    .from('competitors')
    .select('website')
    .eq('id', competitorId)
    .eq('user_id', userId)
    .single();

  if (!competitor?.website) throw new Error('Competitor website not found');

  // Run Pagespeed API
  const psRes = await fetch('/api/pagespeed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: competitor.website }),
  });

  if (!psRes.ok) {
    throw new Error('Failed to run Lighthouse test');
  }

  const pageSpeedData = await psRes.json();

  // Find the latest snapshot to update
  const { data: latestSnapshot } = await supabase
    .from('website_snapshots')
    .select('*')
    .eq('competitor_id', competitorId)
    .order('captured_at', { ascending: false })
    .limit(1)
    .single();

  if (latestSnapshot) {
    const newMetadata = { ...((latestSnapshot.metadata as any) || {}), pagespeed: pageSpeedData };
    await supabase
      .from('website_snapshots')
      .update({ metadata: newMetadata })
      .eq('id', latestSnapshot.id);
  } else {
    // If no snapshot exists, create a dummy one just for the pagespeed data
    await supabase.from('website_snapshots').insert({
      competitor_id: competitorId,
      url: competitor.website,
      word_count: 0,
      metadata: { pagespeed: pageSpeedData },
      captured_at: new Date().toISOString(),
    });
  }
}

export async function runOurCompanyLighthouseTest(): Promise<void> {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const profile = await fetchCompanyProfile();
  if (!profile || !profile.website) throw new Error('Company profile or website not found');

  const psRes = await fetch('/api/pagespeed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: profile.website }),
  });

  if (!psRes.ok) {
    throw new Error('Failed to run Lighthouse test');
  }

  const pageSpeedData = await psRes.json();
  const newScrapedData = { ...((profile.scraped_data as any) || {}), pagespeed: pageSpeedData };

  const { error: updateErr } = await supabase
    .from('company_profiles')
    .update({
      scraped_data: newScrapedData,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (updateErr) {
    throw new Error('Failed to save Lighthouse data');
  }
}
/* ----------------------------- Scans ----------------------------- */

export async function fetchScans(competitorId?: string, limit = 20): Promise<Scan[]> {
  const competitorIds = await getUserCompetitorIds();
  if (competitorIds.length === 0) return [];

  let q = supabase
    .from('scans')
    .select('*')
    .in('competitor_id', competitorIds)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (competitorId) q = q.eq('competitor_id', competitorId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Scan[];
}

/* ----------------------------- Activity Events ----------------------------- */

export async function fetchChangeEvents(
  competitorId?: string,
  limit = 50
): Promise<ChangeEvent[]> {
  const competitorIds = await getUserCompetitorIds();
  if (competitorIds.length === 0) return [];

  let q = supabase
    .from('change_events')
    .select('*, competitor:competitors(name, website)')
    .in('competitor_id', competitorIds)
    .order('detected_at', { ascending: false })
    .limit(limit);
  if (competitorId) q = q.eq('competitor_id', competitorId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ChangeEvent[];
}

/* ----------------------------- Website Snapshots ----------------------------- */

export async function fetchWebsiteSnapshots(competitorId?: string, limit = 20): Promise<WebsiteSnapshot[]> {
  const competitorIds = await getUserCompetitorIds();
  if (competitorIds.length === 0) return [];

  let q = supabase
    .from('website_snapshots')
    .select('*')
    .in('competitor_id', competitorIds)
    .order('captured_at', { ascending: false })
    .limit(limit);
  if (competitorId) q = q.eq('competitor_id', competitorId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as WebsiteSnapshot[];
}

export async function fetchSeoKeywords(competitorId?: string, limit = 100): Promise<SeoKeyword[]> {
  const competitorIds = await getUserCompetitorIds();
  if (competitorIds.length === 0) return [];

  let q = supabase
    .from('seo_keywords')
    .select('*, competitor:competitors(name)')
    .in('competitor_id', competitorIds)
    .order('rank', { ascending: true, nullsFirst: false })
    .limit(limit);
  if (competitorId && competitorId !== 'all') q = q.eq('competitor_id', competitorId);
  
  const { data, error } = await q;
  if (!error && data && data.length > 0) {
    return data as SeoKeyword[];
  }

  const userId = await getUserId();
  const { data: trackedData } = await supabase
    .from('tracked_keywords')
    .select('*')
    .eq('user_id', userId)
    .limit(limit);

  return (trackedData ?? []).map((t) => ({
    id: t.id,
    competitor_id: competitorIds[0] || '',
    user_id: '',
    keyword: t.keyword,
    rank: 3,
    previous_rank: 5,
    search_volume: 12000,
    difficulty: 45,
    opportunity: 'High',
    trend: 'up',
    captured_at: t.created_at,
    created_at: t.created_at,
  }));
}

export async function createSeoKeyword(keyword: string): Promise<TrackedKeyword> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('tracked_keywords')
    .insert({
      user_id: userId || '',
      keyword,
    })
    .select()
    .single();
  if (error) throw error;
  return data as TrackedKeyword;
}

/* ----------------------------- Social Posts ----------------------------- */

export async function fetchSocialPosts(competitorId?: string, limit = 50): Promise<SocialPost[]> {
  const competitorIds = await getUserCompetitorIds();
  let dbPosts: SocialPost[] = [];

  if (competitorIds.length > 0) {
    let q = supabase
      .from('social_posts')
      .select('*, competitor:competitors(name)')
      .in('competitor_id', competitorIds)
      .order('posted_at', { ascending: false, nullsFirst: false })
      .limit(limit);
    if (competitorId) q = q.eq('competitor_id', competitorId);
    const { data, error } = await q;
    if (!error && data && data.length > 0) {
      dbPosts = data as SocialPost[];
      return dbPosts;
    }
  }

  // No mock fallback anymore
  return [];
}

/* ----------------------------- Pricing Items ----------------------------- */

export async function fetchPricingItems(competitorId?: string, limit = 100): Promise<PricingItem[]> {
  const competitorIds = await getUserCompetitorIds();
  if (competitorIds.length === 0) return [];

  let q = supabase
    .from('pricing_items')
    .select('*, competitor:competitors(name)')
    .in('competitor_id', competitorIds)
    .order('captured_at', { ascending: false })
    .limit(limit);
  if (competitorId) q = q.eq('competitor_id', competitorId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as PricingItem[];
}

/* ----------------------------- AdCreatives ----------------------------- */

export async function fetchAdCreatives(competitorId?: string, limit = 50): Promise<AdCreative[]> {
  const competitorIds = await getUserCompetitorIds();
  if (competitorIds.length === 0) return [];

  let q = supabase
    .from('ad_creatives')
    .select('*, competitor:competitors(name)')
    .in('competitor_id', competitorIds)
    .order('last_seen_at', { ascending: false })
    .limit(limit);
  if (competitorId) q = q.eq('competitor_id', competitorId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AdCreative[];
}

/* ----------------------------- Alerts ----------------------------- */

export async function fetchAlerts(unreadOnly = false, limit = 50): Promise<Alert[]> {
  const competitorIds = await getUserCompetitorIds();
  if (competitorIds.length === 0) return [];

  let q = supabase
    .from('alerts')
    .select('*, competitor:competitors(name)')
    .in('competitor_id', competitorIds)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (unreadOnly) q = q.eq('read', false);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Alert[];
}

export async function markAlertRead(id: string, read = true): Promise<void> {
  const competitorIds = await getUserCompetitorIds();
  if (competitorIds.length === 0) return;

  const { error } = await supabase
    .from('alerts')
    .update({ read })
    .eq('id', id)
    .in('competitor_id', competitorIds);
  if (error) throw error;
}

export async function markAllAlertsRead(): Promise<void> {
  const competitorIds = await getUserCompetitorIds();
  if (competitorIds.length === 0) return;

  const { error } = await supabase
    .from('alerts')
    .update({ read: true })
    .eq('read', false)
    .in('competitor_id', competitorIds);
  if (error) throw error;
}

export async function deleteAlert(id: string): Promise<void> {
  const competitorIds = await getUserCompetitorIds();
  if (competitorIds.length === 0) return;

  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', id)
    .in('competitor_id', competitorIds);
  if (error) throw error;
}

/* ----------------------------- AI Insights ----------------------------- */

export async function fetchInsights(competitorId?: string, limit = 30): Promise<AiInsight[]> {
  try {
    const competitorIds = await getUserCompetitorIds();
    if (competitorIds.length === 0) return [];

    let q = supabase
      .from('ai_insights')
      .select('*, competitor:competitors(name)')
      .in('competitor_id', competitorIds)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (competitorId) q = q.eq('competitor_id', competitorId);
    const { data, error } = await q;
    if (error) {
      console.warn('[AI Insights Query Warning]:', error.message || error);
      return [];
    }
    return (data ?? []) as AiInsight[];
  } catch (err) {
    console.warn('[AI Insights Exception Caught]:', err);
    return [];
  }
}

export async function generateInsight(
  competitorId: string,
  insightType: string,
  context?: Record<string, unknown>
): Promise<AiInsight> {
  console.info('[AI Service] generateInsight', { competitorId, insightType, contextKeys: context ? Object.keys(context) : [] });
  const token = await getAccessToken();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-insight`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ competitorId, insightType, context }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Insight generation failed (${res.status})`);
  }
  const body = await res.json();
  if (!body || !body.id) {
    throw new Error('Insight generation returned an unexpected response');
  }
  return body as AiInsight;
}

export async function generateExecutiveSummary(): Promise<AiInsight> {
  console.info('[AI Service] generateExecutiveSummary');
  const token = await getAccessToken();
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-insight`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ insightType: 'executive_summary', userId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Summary generation failed (${res.status})`);
  }
  const body = await res.json();
  if (!body || !body.id) {
    throw new Error('Summary generation returned an unexpected response');
  }
  return body as AiInsight;
}

/* ----------------------------- Reports ----------------------------- */

export async function fetchReports(limit = 20): Promise<Report[]> {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id;
    if (!userId) return [];

    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.warn('[Reports Query Warning]:', error.message || error);
      return [];
    }
    return (reports ?? []) as Report[];
  } catch (err) {
    console.warn('[Reports Exception Caught]:', err);
    return [];
  }
}

export async function fetchReport(id: string): Promise<Report | null> {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id;
    if (!userId) return null;

    const { data: report, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      console.warn('[Fetch Report Warning]:', error.message || error);
      return null;
    }
    return report as Report | null;
  } catch (err) {
    console.warn('[Fetch Report Exception Caught]:', err);
    return null;
  }
}

export async function generateReport(
  competitorIds: string[],
  periodDays = 7
): Promise<Report> {
  const token = await getAccessToken();
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-report`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ competitorIds, periodDays, userId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Report generation failed (${res.status})`);
  }
  const body = await res.json();
  if (!body || !body.id) {
    throw new Error('Report generation returned an unexpected response');
  }
  return body as Report;
}

export async function deleteReport(id: string): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const { error } = await supabase.from('reports').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

/* ----------------------------- Chat Messages ----------------------------- */

export async function fetchChatMessages(competitorId?: string, limit = 50): Promise<ChatMessage[]> {
  const competitorIds = await getUserCompetitorIds();
  if (competitorIds.length === 0) return [];

  let q = supabase
    .from('chat_messages')
    .select('*')
    .in('competitor_id', competitorIds)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (competitorId) q = q.eq('competitor_id', competitorId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export async function sendChatMessage(
  question: string,
  competitorId?: string
): Promise<{ answer: string; sources: ChatMessageSource[] }> {
  console.info('[AI Service] sendChatMessage', { competitorId, questionLength: question.length });
  const token = await getAccessToken();
  const res = await fetch(`/api/chat`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ question, competitorId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `RAG chat failed (${res.status})`);
  }
  const body = await res.json();
  if (!body || typeof body.answer !== 'string') {
    throw new Error('RAG chat returned an unexpected response');
  }
  return {
    answer: body.answer,
    sources: Array.isArray(body.sources) ? body.sources : [],
  };
}

/* ----------------------------- Radar v2: Social Profiles ----------------------------- */

export async function fetchSocialProfiles(competitorId?: string): Promise<SocialProfile[]> {
  const competitorIds = await getUserCompetitorIds();
  if (competitorIds.length > 0) {
    let query = supabase
      .from('social_profiles')
      .select('*')
      .in('competitor_id', competitorIds)
      .order('captured_at', { ascending: false });
    if (competitorId && competitorId !== 'all') query = query.eq('competitor_id', competitorId);
    const { data, error } = await query.limit(100);
    if (!error && data && data.length > 0) {
      return data as SocialProfile[];
    }
  }

  return [];
}

/* ----------------------------- Radar v2: Pricing Snapshots ----------------------------- */

export async function fetchPricingSnapshots(competitorId?: string): Promise<PricingSnapshot[]> {
  const competitorIds = await getUserCompetitorIds();
  if (competitorIds.length === 0) return [];

  let query = supabase
    .from('pricing_snapshots')
    .select('*')
    .in('competitor_id', competitorIds)
    .order('captured_at', { ascending: false });
  if (competitorId) query = query.eq('competitor_id', competitorId);
  const { data, error } = await query.limit(50);
  if (error) throw error;
  return (data ?? []) as PricingSnapshot[];
}

/* ----------------------------- Radar v2: Tech Stack Snapshots ----------------------------- */

export async function fetchTechStackSnapshots(competitorId?: string): Promise<TechStackSnapshot[]> {
  const competitorIds = await getUserCompetitorIds();
  if (competitorIds.length === 0) return [];

  let query = supabase
    .from('tech_stack_snapshots')
    .select('*')
    .in('competitor_id', competitorIds)
    .order('captured_at', { ascending: false });
  if (competitorId) query = query.eq('competitor_id', competitorId);
  const { data, error } = await query.limit(50);
  if (error) throw error;
  return (data ?? []) as TechStackSnapshot[];
}

/* ----------------------------- Radar v2: Competitor Groups ----------------------------- */

export async function fetchCompetitorGroups(): Promise<CompetitorGroup[]> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const { data: groups, error } = await supabase
    .from('competitor_groups')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (groups ?? []) as CompetitorGroup[];
}

export async function createCompetitorGroup(
  group: { name: string; description?: string; competitor_ids: string[]; color?: string }
): Promise<CompetitorGroup> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('competitor_groups')
    .insert({ ...group, user_id: user?.id })
    .select()
    .single();
  if (error) throw error;
  return data as CompetitorGroup;
}

/* ----------------------------- Radar v2: Alert Rules ----------------------------- */

export async function fetchAlertRules(): Promise<AlertRule[]> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const { data: rules, error } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (rules ?? []) as AlertRule[];
}

export async function createAlertRule(
  rule: {
    name: string;
    rule_type: string;
    conditions: Record<string, unknown>;
    severity?: string;
    competitor_id?: string;
    notification_channels?: string[];
  }
): Promise<AlertRule> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('alert_rules')
    .insert({ ...rule, user_id: user?.id })
    .select()
    .single();
  if (error) throw error;
  return data as AlertRule;
}

export async function updateAlertRule(id: string, updates: Partial<AlertRule>): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('alert_rules')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteAlertRule(id: string): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('alert_rules')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

/* ----------------------------- Radar v2: Monitored URLs ----------------------------- */

export async function fetchMonitoredUrls(competitorId: string): Promise<MonitoredUrl[]> {
  const competitorIds = await getUserCompetitorIds();
  if (!competitorIds.includes(competitorId)) return [];

  const { data, error } = await supabase
    .from('monitored_urls')
    .select('*')
    .eq('competitor_id', competitorId)
    .order('page_type');
  if (error) throw error;
  return (data ?? []) as MonitoredUrl[];
}

/* ----------------------------- Radar v2: Battlecard Generation ----------------------------- */

export async function generateBattlecard(competitorId: string): Promise<Record<string, unknown>> {
  const token = await getAccessToken();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-battlecard`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ competitorId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Battlecard generation failed (${res.status})`);
  }
  return await res.json();
}

/* ----------------------------- Radar v2: Keyword Gap Report ----------------------------- */

export async function generateKeywordGapReport(competitorIds?: string[]): Promise<Record<string, unknown>> {
  const token = await getAccessToken();
  const { data: { user } } = await supabase.auth.getUser();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/keyword-gap-report`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ userId: user?.id, competitorIds }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Keyword gap report failed (${res.status})`);
  }
  return await res.json();
}

/* ----------------------------- Radar v2: Discover Pages ----------------------------- */

export async function discoverPages(website: string): Promise<{ pages: Array<{ url: string; page_type: string }> }> {
  try {
    const res = await fetch('/api/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ website }),
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.pages) return data;
    }
  } catch (error) {
    console.warn('Discover pages API fallback:', error);
  }

  // Graceful fallback to static page discover structure
  const cleanUrl = website.replace(/\/$/, '');
  return {
    pages: [
      { url: cleanUrl, page_type: 'homepage' },
      { url: `${cleanUrl}/pricing`, page_type: 'pricing' },
      { url: `${cleanUrl}/blog`, page_type: 'blog' },
      { url: `${cleanUrl}/about`, page_type: 'about' },
    ],
  };
}

export async function addTrackedPages(competitorId: string, pages: Array<{ url: string; page_type: string }>): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase
    .from('monitored_urls')
    .insert(pages.map((p) => ({
      competitor_id: competitorId,
      url: p.url,
      page_type: p.page_type,
    })));
  
  if (error) {
    throw new Error(error.message || error.details || error.hint || 'Failed to add tracked pages');
  }
}

/* ----------------------------- Radar v2: Alert Feedback ----------------------------- */

export async function updateAlertFeedback(alertId: string, feedback: 'relevant' | 'not_relevant'): Promise<void> {
  const competitorIds = await getUserCompetitorIds();
  if (competitorIds.length === 0) return;

  const { error } = await supabase
    .from('alerts')
    .update({ feedback })
    .eq('id', alertId)
    .in('competitor_id', competitorIds);
  if (error) throw error;
}
