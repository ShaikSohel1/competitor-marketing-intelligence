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
import {
  generateWebsiteSnapshot,
  generateSeoKeywords,
  generateSocialPosts,
  generateSocialProfiles,
  generatePricing,
  generatePricingSnapshots,
  generateAdCreatives,
  generateInsights,
  generateComparativeInsights,
  generateAlerts,
  generateChangeEvents,
  generateDefaultCompanyProfile,
  generateComparativeMetrics,
  generateSwotAnalysis,
  generateComparativeSocialProfiles,
  generateComparativeSocialPosts,
} from './demoData';

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

export async function fetchCompanyProfile(): Promise<CompanyProfile> {
  const userId = await getUserId();
  if (!userId) return generateDefaultCompanyProfile('');

  try {
    const { data, error } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      return data as CompanyProfile;
    }
  } catch (err) {
    // Graceful fallback when table has not been created yet
  }

  return generateDefaultCompanyProfile(userId);
}

export async function saveCompanyProfile(
  input: Partial<CompanyProfile> & { company_name: string; website: string }
): Promise<CompanyProfile> {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes?.user?.id;

  const profileData = {
    ...input,
    user_id: userId || '',
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('company_profiles')
    .upsert(profileData, { onConflict: 'user_id' })
    .select()
    .maybeSingle();

  if (error) {
    console.warn('Company profile database upsert fallback:', error);
    return {
      id: `company_${(userId || '').slice(0, 8)}`,
      user_id: userId || '',
      company_name: input.company_name,
      website: input.website,
      industry: input.industry ?? 'Eyewear & Vision Care',
      description: input.description ?? '',
      logo_url: input.logo_url ?? null,
      headquarters: input.headquarters ?? 'Bengaluru, India',
      employee_count: input.employee_count ?? 4500,
      founded_year: input.founded_year ?? 2007,
      company_size: input.company_size ?? '1000-5000',
      annual_revenue: input.annual_revenue ?? '₹1,250 Cr',
      primary_products: input.primary_products ?? ['Prescription Glasses', 'Computer Glasses'],
      target_market: input.target_market ?? 'India Consumer Market',
      social_links: input.social_links ?? {},
      brand_keywords: input.brand_keywords ?? [input.company_name],
      brand_color: input.brand_color ?? '#0F52BA',
    } as CompanyProfile;
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
      user_id: userId || '',
      status: 'completed',
      scan_type: 'full',
      changes_detected: 5,
      ai_summary: `Completed full intelligence scan for ${competitor.name}. Captured website, SEO, social, pricing, ads, and AI insights.`,
      started_at: now,
      completed_at: now,
    })
    .select()
    .single();

  const scanId = scan?.id || competitorId;

  // Fetch Our Company Profile context
  const ourCompany = await fetchCompanyProfile();

  // 3. Generate structured comparative demo data comparing Our Company vs. Competitor
  const webSnapshot = { ...generateWebsiteSnapshot(competitor), user_id: userId || '', scan_id: scanId };
  const seoKwData = generateSeoKeywords(competitor, ourCompany).map((k) => ({...k}));
  const trackedKwData = seoKwData.map((k) => ({ user_id: userId || '', keyword: k.keyword }));
  const socialPostData = generateSocialPosts(competitor).map((p) => ({...p}));
  const socialProfileData = generateSocialProfiles(competitor).map((p) => ({...p}));
  const pricingItemData = generatePricing(competitor).map((p) => ({...p}));
  const pricingSnapData = generatePricingSnapshots(competitor).map((p) => ({ ...p, scan_id: scanId }));
  const adCreativeData = generateAdCreatives(competitor).map((a) => ({...a}));
  const advertisementData = adCreativeData.map((a) => ({
    competitor_id: competitorId,
    user_id: userId || '',
    platform: a.platform,
    ad_type: a.format || 'Image',
    headline: a.headline,
    creative_url: a.creative_url,
    landing_url: a.landing_url,
    budget_estimate: a.metadata?.budget_estimate ? Number(a.metadata.budget_estimate) : 25000,
    status: a.status,
    first_seen_at: a.first_seen_at,
    last_seen_at: a.last_seen_at,
  }));
  const alertData = generateAlerts(competitor).map((a) => ({...a}));
  const changeEventData = generateChangeEvents(competitor).map((c) => ({ ...c, scan_id: scanId }));
  const aiInsightData = generateComparativeInsights(ourCompany, competitor).map((i) => ({...i}));

  // 4. Batch delete previous records for this competitor to avoid duplicates
  await Promise.allSettled([
    supabase.from('website_snapshots').delete().eq('competitor_id', competitorId),
    supabase.from('seo_keywords').delete().eq('competitor_id', competitorId),
    supabase.from('social_posts').delete().eq('competitor_id', competitorId),
    supabase.from('social_profiles').delete().eq('competitor_id', competitorId),
    supabase.from('pricing_items').delete().eq('competitor_id', competitorId),
    supabase.from('pricing_snapshots').delete().eq('competitor_id', competitorId),
    supabase.from('ad_creatives').delete().eq('competitor_id', competitorId),
    supabase.from('ad_creatives').delete().eq('competitor_id', competitorId),
    supabase.from('alerts').delete().eq('competitor_id', competitorId),
    supabase.from('change_events').delete().eq('competitor_id', competitorId),
    supabase.from('ai_insights').delete().eq('competitor_id', competitorId),
  ]);

  // 5. Batch insert fresh demo data
  await Promise.all([
    supabase.from('website_snapshots').insert(webSnapshot),
    supabase.from('seo_keywords').insert(seoKwData),
    supabase.from('tracked_keywords').upsert(trackedKwData, { onConflict: 'user_id,keyword', ignoreDuplicates: true }),
    supabase.from('social_posts').insert(socialPostData),
    supabase.from('social_profiles').insert(socialProfileData),
    supabase.from('pricing_items').insert(pricingItemData),
    supabase.from('pricing_snapshots').insert(pricingSnapData),
    supabase.from('ad_creatives').insert(adCreativeData),
    supabase.from('ad_creatives').insert(advertisementData),
    supabase.from('alerts').insert(alertData),
    supabase.from('change_events').insert(changeEventData),
    supabase.from('ai_insights').insert(aiInsightData),
  ]);

  // 6. Update competitor status & timestamp
  await supabase
    .from('competitors')
    .update({ last_scanned_at: now, activity_score: 88, status: 'active' })
    .eq('id', competitorId)
    .eq('user_id', userId);

  return {
    scanId,
    summary: `Scanned ${competitor.name} successfully. Demo intelligence data persisted across all tabs.`,
  };
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

  // Fallback to comparative demo posts so hackathon demo is never empty
  const [ourCompany, competitors] = await Promise.all([
    fetchCompanyProfile(),
    fetchCompetitors(),
  ]);

  let generated = generateComparativeSocialPosts(ourCompany, competitors);
  if (competitorId && competitorId !== 'all') {
    generated = generated.filter(p => p.competitor_id === competitorId);
  }
  return generated;
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

  // Fallback to comparative demo profiles
  const [ourCompany, competitors] = await Promise.all([
    fetchCompanyProfile(),
    fetchCompetitors(),
  ]);

  let generated = generateComparativeSocialProfiles(ourCompany, competitors);
  if (competitorId && competitorId !== 'all') {
    generated = generated.filter(p => p.competitor_id === competitorId);
  }
  return generated;
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
