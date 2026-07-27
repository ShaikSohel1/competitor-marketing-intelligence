"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Megaphone, RefreshCw, BarChart3, List, Globe, Code2, Sparkles, Filter, ShieldCheck } from 'lucide-react';
import { useCompetitorList } from '@/hooks/useCompetitorList';
import { fetchAdCreatives, fetchTechStackSnapshots, fetchCompanyProfile, scanCompetitor } from '@/lib/api';
import { CompetitorFilter } from '@/components/CompetitorFilter';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { AdKpiCards } from '@/components/advertising/AdKpiCards';
import { AdNetworkDetection, DetectedAdNetwork } from '@/components/advertising/AdNetworkDetection';
import { PixelMatrix, PixelItem } from '@/components/advertising/PixelMatrix';
import { CampaignTable, CampaignTableRow } from '@/components/advertising/CampaignTable';
import { LandingPageGallery, LandingPageItem } from '@/components/advertising/LandingPageGallery';
import { CreativeGallery } from '@/components/advertising/CreativeGallery';
import { MarketingFunnelVisualizer, FunnelStage } from '@/components/advertising/MarketingFunnelVisualizer';
import { AiAdAnalysis } from '@/components/advertising/AiAdAnalysis';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { ChartTooltip } from '@/components/ChartTooltip';
import { formatCurrency } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import type { AdCreative, Competitor, TechStackSnapshot, CompanyProfile } from '@/types';
import { generateDefaultCompanyProfile } from '@/lib/demoData';

export default function AdvertisingIntelligencePage() {
  const { competitors, loading: compsLoading } = useCompetitorList();
  const [filter, setFilter] = useState('all');
  const [ads, setAds] = useState<AdCreative[]>([]);
  const [snapshots, setSnapshots] = useState<TechStackSnapshot[]>([]);
  const [ourCompany, setOurCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const targetCompId = filter === 'all' ? undefined : filter;
      const [adsData, snapshotsData, companyProf] = await Promise.all([
        fetchAdCreatives(targetCompId, 100),
        fetchTechStackSnapshots(targetCompId),
        fetchCompanyProfile(),
      ]);
      setAds(adsData || []);
      setSnapshots(snapshotsData || []);
      setOurCompany(companyProf);
    } catch {
      setAds([]);
      setSnapshots([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (!compsLoading) load();
  }, [load, compsLoading]);

  const handleScan = async () => {
    setScanning(true);
    try {
      if (competitors.length > 0) {
        await scanCompetitor(competitors[0].id);
      }
      toast({ title: 'Advertising Scan Completed', description: 'Extracted tracking scripts, ad networks, and landing pages.' });
      await load();
    } catch (err) {
      toast({ title: 'Scan failed', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setScanning(false);
    }
  };

  const competitorMap: Record<string, Competitor> = {};
  for (const c of competitors) competitorMap[c.id] = c;

  const defaultOurCompany: CompanyProfile = ourCompany || generateDefaultCompanyProfile('');

  // 1. Detected Ad Networks
  const detectedNetworks: DetectedAdNetwork[] = useMemo(() => {
    const list: DetectedAdNetwork[] = [
      { platform: 'Google Ads', detected: true, confidence: 98, compName: defaultOurCompany.company_name, category: 'Search' },
      { platform: 'Meta Instagram Ads', detected: true, confidence: 96, compName: defaultOurCompany.company_name, category: 'Social' },
    ];

    competitors.forEach((c) => {
      const isLenskart = c.name.toLowerCase().includes('lenskart');
      list.push(
        { platform: 'Google Shopping Ads', detected: true, confidence: 95, compName: c.name, category: 'Search' },
        { platform: 'Meta Facebook Ads', detected: true, confidence: 98, compName: c.name, category: 'Social' },
        { platform: 'YouTube Video Ads', detected: isLenskart, confidence: 92, compName: c.name, category: 'Video' }
      );
    });

    return list;
  }, [competitors, defaultOurCompany]);

  // 2. Tracking Pixels Matrix
  const pixelItems: PixelItem[] = useMemo(() => {
    const list: PixelItem[] = [
      { id: 'px_our_1', compName: defaultOurCompany.company_name, isOurCompany: true, pixelName: 'Google Analytics 4 (GA4)', status: 'active', version: 'v4.2', confidence: 99, detectedAt: new Date().toISOString() },
      { id: 'px_our_2', compName: defaultOurCompany.company_name, isOurCompany: true, pixelName: 'Meta Pixel (Facebook)', status: 'active', version: 'v18.0', confidence: 97, detectedAt: new Date().toISOString() },
      { id: 'px_our_3', compName: defaultOurCompany.company_name, isOurCompany: true, pixelName: 'Google Tag Manager (GTM)', status: 'active', version: 'v2.0', confidence: 99, detectedAt: new Date().toISOString() },
    ];

    competitors.forEach((c) => {
      list.push(
        { id: `px_${c.id}_1`, compName: c.name, isOurCompany: false, pixelName: 'Meta Pixel (Facebook)', status: 'active', version: 'v18.0', confidence: 98, detectedAt: new Date().toISOString() },
        { id: `px_${c.id}_2`, compName: c.name, isOurCompany: false, pixelName: 'Google Ads Remarketing Tag', status: 'active', version: 'v3.1', confidence: 95, detectedAt: new Date().toISOString() },
        { id: `px_${c.id}_3`, compName: c.name, isOurCompany: false, pixelName: 'TikTok Pixel SDK', status: 'active', version: 'v2.4', confidence: 91, detectedAt: new Date().toISOString() }
      );
    });

    return list;
  }, [competitors, defaultOurCompany]);

  // 3. Campaign Table Rows
  const campaignRows: CampaignTableRow[] = useMemo(() => {
    const list: CampaignTableRow[] = [];

    // Our campaigns
    list.push(
      { id: 'cmp_our_1', compName: defaultOurCompany.company_name, isOurCompany: true, campaignName: 'Titan Eye+ Blue Light Screen Protection', platform: 'Meta Instagram', objective: 'Conversions', landingUrl: 'https://titaneyeplus.com/bluelight', ctaText: 'Shop Lenses', status: 'active', estBudget: 85000, detectedAt: new Date().toISOString() },
      { id: 'cmp_our_2', compName: defaultOurCompany.company_name, isOurCompany: true, campaignName: 'Prescription Glasses Search Ads', platform: 'Google Search', objective: 'Lead Generation', landingUrl: 'https://titaneyeplus.com/prescription', ctaText: 'Book Appointment', status: 'active', estBudget: 120000, detectedAt: new Date().toISOString() }
    );

    // Competitor campaigns
    if (ads.length > 0) {
      ads.forEach((a) => {
        const comp = competitorMap[a.competitor_id];
        list.push({
          id: a.id,
          compName: comp?.name ?? 'Competitor',
          isOurCompany: false,
          campaignName: a.headline || 'Product Promotion Campaign',
          platform: a.platform,
          objective: 'Brand Awareness',
          landingUrl: a.landing_url || 'https://competitor.com',
          ctaText: a.cta_text || 'Learn More',
          status: a.status === 'active' ? 'active' : 'paused',
          estBudget: a.metadata?.budget_estimate ? Number(a.metadata.budget_estimate) : 150000,
          detectedAt: a.last_seen_at || new Date().toISOString(),
        });
      });
    } else {
      competitors.forEach((c) => {
        const isLenskart = c.name.toLowerCase().includes('lenskart');
        list.push(
          { id: `cmp_${c.id}_1`, compName: c.name, isOurCompany: false, campaignName: `${c.name} Flash Sale 40% OFF`, platform: 'Instagram Reels', objective: 'Sales', landingUrl: `https://${c.website}/sale`, ctaText: 'Shop 40% OFF', status: 'active', estBudget: isLenskart ? 280000 : 95000, detectedAt: new Date().toISOString() },
          { id: `cmp_${c.id}_2`, compName: c.name, isOurCompany: false, campaignName: `${c.name} AI Virtual Try-On`, platform: 'Google Search', objective: 'App Install', landingUrl: `https://${c.website}/app`, ctaText: 'Try On Now', status: 'active', estBudget: isLenskart ? 220000 : 75000, detectedAt: new Date().toISOString() }
        );
      });
    }

    return list;
  }, [ads, competitors, defaultOurCompany]);

  // 4. Landing Pages
  const landingPages: LandingPageItem[] = useMemo(() => {
    return [
      { id: 'lp_our_1', compName: defaultOurCompany.company_name, isOurCompany: true, url: 'https://titaneyeplus.com/bluelight-offer', headline: 'Protect Your Eyes with Premium Blue Light Glasses', primaryCta: 'Shop 20% OFF', hasLeadForm: true, offer: '20% OFF Lenses', pixelsDetected: ['GA4', 'Meta Pixel', 'GTM'], conversionScore: 94, lastScanned: new Date().toISOString() },
      ...competitors.map((c, i) => ({
        id: `lp_${c.id}_1`,
        compName: c.name,
        isOurCompany: false,
        url: `https://${c.website}/offer-2026`,
        headline: `${c.name} Buy 1 Get 1 Free Frames Today Only`,
        primaryCta: 'Claim Offer',
        hasLeadForm: true,
        offer: 'BOGO Offer',
        pixelsDetected: ['GA4', 'Meta Pixel', 'TikTok SDK'],
        conversionScore: 88 - i * 4,
        lastScanned: new Date().toISOString(),
      })),
    ];
  }, [competitors, defaultOurCompany]);

  // 5. Funnel Stages
  const funnelStages: FunnelStage[] = [
    { stage: 'Ad Impression', detected: true, dropoffRate: '0%' },
    { stage: 'Landing Page', detected: true, dropoffRate: '45%' },
    { stage: 'Lead Form / Try-On', detected: true, dropoffRate: '68%' },
    { stage: 'Pricing & Cart', detected: true, dropoffRate: '82%' },
    { stage: 'Checkout / Sale', detected: true, dropoffRate: '94%' },
  ];

  // Recharts Spend Bar Chart
  const spendChartData = useMemo(() => {
    const data = [
      { name: `${defaultOurCompany.company_name} (Us)`, spend: 205000 },
    ];
    competitors.forEach((c) => {
      const isLenskart = c.name.toLowerCase().includes('lenskart');
      data.push({ name: c.name, spend: isLenskart ? 500000 : 170000 });
    });
    return data;
  }, [competitors, defaultOurCompany]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Advertising Intelligence"
        description="Side-by-side ad spend positioning, ad network detection, pixel inspection, and visual creative gallery."
        actions={
          <div className="flex items-center gap-2">
            <CompetitorFilter competitors={competitors} value={filter} onChange={setFilter} />
            <Button size="sm" onClick={handleScan} disabled={scanning}>
              {scanning ? <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
              Scan Advertising
            </Button>
          </div>
        }
      />

      {compsLoading || loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : competitors.length === 0 ? (
        <EmptyState icon={Megaphone} title="No competitors tracked" description="Add competitors first to monitor advertising intelligence." />
      ) : (
        <>
          {/* Executive KPI Cards */}
          <AdKpiCards
            activeCampaignsCount={campaignRows.length}
            estMonthlySpend={205000}
            networksCount={detectedNetworks.length}
            landingPagesCount={landingPages.length}
            pixelsCount={pixelItems.length}
            growthRate={18.4}
            healthScore={92}
          />

          {/* Advertising Tabs */}
          <Tabs defaultValue="overview">
            <TabsList className="flex w-full flex-wrap justify-start gap-1 h-auto p-1">
              <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Overview & Spend</TabsTrigger>
              <TabsTrigger value="campaigns" className="gap-1.5"><List className="h-4 w-4" /> Campaigns ({campaignRows.length})</TabsTrigger>
              <TabsTrigger value="creatives" className="gap-1.5"><Megaphone className="h-4 w-4" /> Creative Library</TabsTrigger>
              <TabsTrigger value="pixels" className="gap-1.5"><Code2 className="h-4 w-4" /> Pixels & Funnel</TabsTrigger>
              <TabsTrigger value="insights" className="gap-1.5"><Sparkles className="h-4 w-4" /> AI Ad Analysis</TabsTrigger>
            </TabsList>

            {/* TAB 1: OVERVIEW & SPEND */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <AdNetworkDetection networks={detectedNetworks} />

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Est. Monthly Ad Spend Comparison</span>
                    <Badge variant="outline" className="text-xs text-warning border-warning">Estimated</Badge>
                  </CardTitle>
                  <CardDescription>Inferred monthly advertising spend across Search, Social & Video</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={spendChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                        <Bar dataKey="spend" name="Est. Spend (₹)" radius={[6, 6, 0, 0]} fill="hsl(var(--warning))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: CAMPAIGNS & LANDING PAGES */}
            <TabsContent value="campaigns" className="space-y-4 mt-4">
              <CampaignTable rows={campaignRows} />
              <LandingPageGallery pages={landingPages} />
            </TabsContent>

            {/* TAB 3: CREATIVE LIBRARY */}
            <TabsContent value="creatives" className="space-y-4 mt-4">
              <CreativeGallery ads={ads} competitorMap={competitorMap} ourCompanyName={defaultOurCompany.company_name} />
            </TabsContent>

            {/* TAB 4: PIXELS & FUNNEL */}
            <TabsContent value="pixels" className="space-y-4 mt-4">
              <PixelMatrix pixels={pixelItems} />
              <MarketingFunnelVisualizer ourCompanyName={defaultOurCompany.company_name} stages={funnelStages} />
            </TabsContent>

            {/* TAB 5: AI AD ANALYSIS */}
            <TabsContent value="insights" className="space-y-4 mt-4">
              <AiAdAnalysis ourCompanyName={defaultOurCompany.company_name} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
