import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/workspace';
import { fetchCompanyProfile } from '@/lib/api';
import type {
  Competitor,
  CompanyProfile,
  Scan,
  ChangeEvent,
  WebsiteSnapshot,
  SeoKeyword,
  SocialPost,
  SocialProfile,
  PricingItem,
  AdCreative,
  AiInsight,
  Alert,
} from '@/types';

interface CompetitorDetailData {
  ourCompany: CompanyProfile | null;
  competitor: Competitor | null;
  scans: Scan[];
  events: ChangeEvent[];
  websiteSnapshots: WebsiteSnapshot[];
  seoKeywords: SeoKeyword[];
  socialPosts: SocialPost[];
  socialProfiles: SocialProfile[];
  pricingItems: PricingItem[];
  advertisements: AdCreative[];
  insights: AiInsight[];
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCompetitorDetail(competitorId: string | undefined): CompetitorDetailData {
  const [ourCompany, setOurCompany] = useState<CompanyProfile | null>(null);
  const [competitor, setCompetitor] = useState<Competitor | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [events, setEvents] = useState<ChangeEvent[]>([]);
  const [websiteSnapshots, setWebsiteSnapshots] = useState<WebsiteSnapshot[]>([]);
  const [seoKeywords, setSeoKeywords] = useState<SeoKeyword[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [socialProfiles, setSocialProfiles] = useState<SocialProfile[]>([]);
  const [pricingItems, setPricingItems] = useState<PricingItem[]>([]);
  const [advertisements, setAdCreatives] = useState<AdCreative[]>([]);
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!competitorId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const userId = await getUserId();
      const profilePromise = fetchCompanyProfile().catch(() => null);
      const compResPromise = supabase
        .from('competitors')
        .select('*')
        .eq('id', competitorId)
        .eq('user_id', userId)
        .maybeSingle();

      const [myProfile, compRes] = await Promise.all([profilePromise, compResPromise]);
      setOurCompany(myProfile);

      if (compRes.error) {
        throw compRes.error;
      }

      const competitorInWorkspace = compRes.data;
      if (!competitorInWorkspace) {
        setCompetitor(null);
        setScans([]);
        setEvents([]);
        setWebsiteSnapshots([]);
        setSeoKeywords([]);
        setSocialPosts([]);
        setSocialProfiles([]);
        setPricingItems([]);
        setAdCreatives([]);
        setInsights([]);
        setAlerts([]);
        setLoading(false);
        return;
      }

      const [scanRes, eventRes, webRes, seoRes, socialRes, socialProfileRes, pricingRes, adRes, insightRes, alertRes] = await Promise.all([
        supabase.from('scans').select('*').eq('competitor_id', competitorId).order('created_at', { ascending: false }).limit(10),
        supabase.from('change_events').select('*').eq('competitor_id', competitorId).order('detected_at', { ascending: false }).limit(50),
        supabase.from('website_snapshots').select('*').eq('competitor_id', competitorId).order('captured_at', { ascending: false }).limit(20),
        supabase.from('seo_keywords').select('*').eq('competitor_id', competitorId).order('captured_at', { ascending: false }).limit(100),
        supabase.from('social_posts').select('*').eq('competitor_id', competitorId).order('posted_at', { ascending: false, nullsFirst: false }).limit(50),
        supabase.from('social_profiles').select('*').eq('competitor_id', competitorId).order('captured_at', { ascending: false }).limit(20),
        supabase.from('pricing_items').select('*').eq('competitor_id', competitorId).order('captured_at', { ascending: false }).limit(100),
        supabase.from('ad_creatives').select('*').eq('competitor_id', competitorId).order('last_seen_at', { ascending: false }).limit(50),
        supabase.from('ai_insights').select('*').eq('competitor_id', competitorId).order('created_at', { ascending: false }).limit(20),
        supabase.from('alerts').select('*').eq('competitor_id', competitorId).order('created_at', { ascending: false }).limit(20),
      ]);

      setCompetitor((competitorInWorkspace ?? null) as Competitor | null);
      setScans((scanRes.data ?? []) as Scan[]);
      setEvents((eventRes.data ?? []) as ChangeEvent[]);
      setWebsiteSnapshots((webRes.data ?? []) as WebsiteSnapshot[]);
      setSeoKeywords((seoRes.data ?? []) as SeoKeyword[]);
      setSocialPosts((socialRes.data ?? []) as SocialPost[]);
      setSocialProfiles((socialProfileRes.data ?? []) as SocialProfile[]);
      setPricingItems((pricingRes.data ?? []) as PricingItem[]);
      setAdCreatives((adRes.data ?? []).map(a => ({
        id: a.id,
        competitor_id: a.competitor_id,
        user_id: a.user_id,
        platform: a.platform,
        ad_type: a.format || 'Image',
        headline: a.headline,
        creative_url: a.creative_url,
        landing_url: a.landing_url,
        budget_estimate: a.metadata?.budget_estimate ? Number(a.metadata.budget_estimate) : 25000,
        status: a.status,
        first_seen_at: a.first_seen_at,
        last_seen_at: a.last_seen_at,
        created_at: a.created_at,
      })) as unknown as AdCreative[]);
      setInsights((insightRes.data ?? []) as AiInsight[]);
      setAlerts((alertRes.data ?? []) as Alert[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load competitor details');
    } finally {
      setLoading(false);
    }
  }, [competitorId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    ourCompany,
    competitor,
    scans,
    events,
    websiteSnapshots,
    seoKeywords,
    socialPosts,
    socialProfiles,
    pricingItems,
    advertisements,
    insights,
    alerts,
    loading,
    error,
    refresh: load,
  };
}
