"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DollarSign, RefreshCw, Clock, ShieldCheck, Sparkles, Tag, BarChart3, Grid, List, Activity } from 'lucide-react';
import { useCompetitorList } from '@/hooks/useCompetitorList';
import { fetchPricingSnapshots, fetchPricingItems, fetchCompanyProfile, scanCompetitor } from '@/lib/api';
import { CompetitorFilter } from '@/components/CompetitorFilter';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { PricingKpiCards } from '@/components/pricing/PricingKpiCards';
import { PricingComparisonTable, PricingTableRow } from '@/components/pricing/PricingComparisonTable';
import { PricingHeatmapMatrix, HeatmapItem } from '@/components/pricing/PricingHeatmapMatrix';
import { PricingCharts } from '@/components/pricing/PricingCharts';
import { DiscountDetectionCard, DiscountOffer } from '@/components/pricing/DiscountDetectionCard';
import { AiPricingAnalysis } from '@/components/pricing/AiPricingAnalysis';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import type { PricingSnapshot, Competitor, PricingItem, CompanyProfile } from '@/types';
import { generateDefaultCompanyProfile } from '@/lib/demoData';

export default function PricingIntelligencePage() {
  const { competitors, loading: compsLoading } = useCompetitorList();
  const [filter, setFilter] = useState('all');
  const [snapshots, setSnapshots] = useState<PricingSnapshot[]>([]);
  const [items, setItems] = useState<PricingItem[]>([]);
  const [ourCompany, setOurCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const targetCompId = filter === 'all' ? undefined : filter;
      const [snapData, itemData, companyProf] = await Promise.all([
        fetchPricingSnapshots(targetCompId),
        fetchPricingItems(targetCompId),
        fetchCompanyProfile(),
      ]);
      setSnapshots(snapData || []);
      setItems(itemData || []);
      setOurCompany(companyProf);
    } catch {
      setSnapshots([]);
      setItems([]);
    } font: {
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
      toast({ title: 'Pricing Scan Completed', description: 'Extracted latest pricing tables, plans, and promotional banners.' });
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

  // 1. Table Rows Construction (Our Company vs Competitors)
  const tableRows: PricingTableRow[] = useMemo(() => {
    const list: PricingTableRow[] = [];

    // Add Our Company sample pricing items
    list.push(
      {
        id: 'row_our_1',
        companyName: defaultOurCompany.company_name,
        isOurCompany: true,
        productName: 'Prescription Glasses (Single Vision)',
        category: 'Glasses',
        currentPrice: 1499,
        previousPrice: 1599,
        currency: 'INR',
        discountTag: 'Save ₹100',
        priceIndex: 94,
        status: 'discounted',
        capturedAt: new Date().toISOString(),
      },
      {
        id: 'row_our_2',
        companyName: defaultOurCompany.company_name,
        isOurCompany: true,
        productName: 'Anti-Glare Blue Light Lenses',
        category: 'Lenses',
        currentPrice: 1999,
        previousPrice: 1999,
        currency: 'INR',
        discountTag: null,
        priceIndex: 96,
        status: 'active',
        capturedAt: new Date().toISOString(),
      },
      {
        id: 'row_our_3',
        companyName: defaultOurCompany.company_name,
        isOurCompany: true,
        productName: 'Progressive Multifocal Glasses',
        category: 'Glasses',
        currentPrice: 3499,
        previousPrice: 3799,
        currency: 'INR',
        discountTag: 'Festival Offer',
        priceIndex: 92,
        status: 'discounted',
        capturedAt: new Date().toISOString(),
      }
    );

    // Add items from DB or Competitor Snapshots
    if (items.length > 0) {
      items.forEach((it) => {
        const comp = competitorMap[it.competitor_id];
        list.push({
          id: it.id,
          companyName: comp?.name ?? 'Competitor',
          isOurCompany: false,
          productName: it.product_name,
          category: it.unit || 'Optical',
          currentPrice: it.price,
          previousPrice: it.previous_price,
          currency: it.currency || 'INR',
          discountTag: it.change_type === 'decrease' ? 'Price Drop' : null,
          priceIndex: Math.round((it.price / 2000) * 100),
          status: it.change_type === 'decrease' ? 'discounted' : 'active',
          capturedAt: it.captured_at,
        });
      });
    } else {
      competitors.forEach((c) => {
        const isLenskart = c.name.toLowerCase().includes('lenskart');
        list.push(
          {
            id: `row_${c.id}_1`,
            companyName: c.name,
            isOurCompany: false,
            productName: 'Prescription Eyeglasses Standard',
            category: 'Glasses',
            currentPrice: isLenskart ? 1699 : 1850,
            previousPrice: 1899,
            currency: 'INR',
            discountTag: isLenskart ? 'BUY1GET1' : null,
            priceIndex: isLenskart ? 104 : 112,
            status: isLenskart ? 'discounted' : 'active',
            capturedAt: new Date().toISOString(),
          },
          {
            id: `row_${c.id}_2`,
            companyName: c.name,
            isOurCompany: false,
            productName: 'Blue Cut Screen Glasses',
            category: 'Lenses',
            currentPrice: isLenskart ? 2199 : 2400,
            previousPrice: 2199,
            currency: 'INR',
            discountTag: null,
            priceIndex: isLenskart ? 108 : 118,
            status: 'active',
            capturedAt: new Date().toISOString(),
          }
        );
      });
    }

    return list;
  }, [items, competitors, defaultOurCompany]);

  // 2. Metrics calculation
  const ourRows = tableRows.filter((r) => r.isOurCompany);
  const compRows = tableRows.filter((r) => !r.isOurCompany);

  const ourAvgPrice = ourRows.length ? ourRows.reduce((sum, r) => sum + r.currentPrice, 0) / ourRows.length : 2332;
  const compAvgPrice = compRows.length ? compRows.reduce((sum, r) => sum + r.currentPrice, 0) / compRows.length : 2496;
  const priceDiffPercent = compAvgPrice ? Number((((ourAvgPrice - compAvgPrice) / compAvgPrice) * 100).toFixed(1)) : -6.6;

  // 3. Heatmap Matrix
  const heatmapMatrix: HeatmapItem[] = [
    {
      productName: 'Prescription Glasses (Single Vision)',
      category: 'Glasses',
      ourPrice: 1499,
      competitors: competitors.map((c) => ({
        companyName: c.name,
        price: c.name.toLowerCase().includes('lenskart') ? 1699 : 1850,
      })),
    },
    {
      productName: 'Anti-Glare Blue Light Lenses',
      category: 'Lenses',
      ourPrice: 1999,
      competitors: competitors.map((c) => ({
        companyName: c.name,
        price: c.name.toLowerCase().includes('lenskart') ? 2199 : 2400,
      })),
    },
    {
      productName: 'Progressive Multifocal Lenses',
      category: 'Glasses',
      ourPrice: 3499,
      competitors: competitors.map((c) => ({
        companyName: c.name,
        price: c.name.toLowerCase().includes('lenskart') ? 3899 : 4200,
      })),
    },
  ];

  // 4. Recharts Brand Price Data
  const brandPriceData = [
    { name: `${defaultOurCompany.company_name} (Us)`, avgPrice: Math.round(ourAvgPrice), isOurCompany: true },
    ...competitors.map((c) => {
      const cRows = tableRows.filter((r) => r.companyName === c.name);
      const avg = cRows.length ? cRows.reduce((s, r) => s + r.currentPrice, 0) / cRows.length : 2496;
      return { name: c.name, avgPrice: Math.round(avg) };
    }),
  ];

  // 5. Timeline trend data
  const timelineData = [
    { date: '1 Month Ago', ourPrice: 2450, compAvgPrice: 2580 },
    { date: '3 Weeks Ago', ourPrice: 2400, compAvgPrice: 2550 },
    { date: '2 Weeks Ago', ourPrice: 2380, compAvgPrice: 2520 },
    { date: 'Last Week', ourPrice: 2350, compAvgPrice: 2510 },
    { date: 'Today', ourPrice: Math.round(ourAvgPrice), compAvgPrice: Math.round(compAvgPrice) },
  ];

  // 6. Discount Offers List
  const discountOffers: DiscountOffer[] = [
    {
      id: 'd1',
      companyName: 'Lenskart',
      isOurCompany: false,
      title: 'Buy 1 Get 1 Free on Gold Membership Frames',
      code: 'BOGO2026',
      discountValue: '50% OFF',
      offerType: 'bogo',
      detectedAt: new Date().toISOString(),
    },
    {
      id: 'd2',
      companyName: defaultOurCompany.company_name,
      isOurCompany: true,
      title: 'Flat ₹300 Instant Discount on Progressive Glasses',
      code: 'TITANEYE300',
      discountValue: '₹300 OFF',
      offerType: 'coupon',
      detectedAt: new Date().toISOString(),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing Intelligence"
        description="Side-by-side pricing benchmarks, tier comparisons, discount detection, and AI margin optimization."
        actions={
          <div className="flex items-center gap-2">
            <CompetitorFilter competitors={competitors} value={filter} onChange={setFilter} />
            <Button size="sm" onClick={handleScan} disabled={scanning}>
              {scanning ? <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
              Scan Pricing
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
        <EmptyState icon={DollarSign} title="No competitors tracked" description="Add competitors first to monitor pricing intelligence." />
      ) : (
        <>
          {/* Executive KPI Cards */}
          <PricingKpiCards
            ourAvgPrice={ourAvgPrice}
            compAvgPrice={compAvgPrice}
            priceDiffPercent={priceDiffPercent}
            premiumBrand={competitors[0]?.name || 'Amazon'}
            lowestComp={defaultOurCompany.company_name}
            activeDiscountsCount={discountOffers.length}
            alertsCount={snapshots.length}
            productsComparedCount={tableRows.length}
          />

          {/* Pricing Tabs */}
          <Tabs defaultValue="overview">
            <TabsList className="flex w-full flex-wrap justify-start gap-1 h-auto p-1">
              <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Overview & Charts</TabsTrigger>
              <TabsTrigger value="table" className="gap-1.5"><List className="h-4 w-4" /> Comparison Table ({tableRows.length})</TabsTrigger>
              <TabsTrigger value="heatmap" className="gap-1.5"><Grid className="h-4 w-4" /> Heatmap Matrix</TabsTrigger>
              <TabsTrigger value="discounts" className="gap-1.5"><Tag className="h-4 w-4" /> Discounts & Sales</TabsTrigger>
              <TabsTrigger value="insights" className="gap-1.5"><Sparkles className="h-4 w-4" /> AI Pricing Analysis</TabsTrigger>
            </TabsList>

            {/* TAB 1: OVERVIEW & CHARTS */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <PricingCharts brandData={brandPriceData} timelineData={timelineData} />
            </TabsContent>

            {/* TAB 2: COMPARISON TABLE */}
            <TabsContent value="table" className="space-y-4 mt-4">
              <PricingComparisonTable rows={tableRows} />
            </TabsContent>

            {/* TAB 3: HEATMAP MATRIX */}
            <TabsContent value="heatmap" className="space-y-4 mt-4">
              <PricingHeatmapMatrix matrix={heatmapMatrix} ourCompanyName={defaultOurCompany.company_name} />
            </TabsContent>

            {/* TAB 4: DISCOUNTS & SALES */}
            <TabsContent value="discounts" className="space-y-4 mt-4">
              <DiscountDetectionCard discounts={discountOffers} />
            </TabsContent>

            {/* TAB 5: AI PRICING ANALYSIS */}
            <TabsContent value="insights" className="space-y-4 mt-4">
              <AiPricingAnalysis
                ourCompanyName={defaultOurCompany.company_name}
                ourAvgPrice={ourAvgPrice}
                compAvgPrice={compAvgPrice}
                priceDiffPercent={priceDiffPercent}
              />
            </TabsContent>
          </Tabs>

          {/* Snapshot History Section */}
          {snapshots.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Snapshot Crawl History</CardTitle>
                <CardDescription>Timeline of all pricing data captures from web crawlers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {snapshots.map((snap) => (
                  <div key={snap.id} className="flex flex-col gap-1.5 p-3.5 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">{competitorMap[snap.competitor_id]?.name ?? 'Competitor'}</span>
                      <span className="text-muted-foreground">{formatDate(snap.captured_at)}</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge variant="outline">{snap.plans.length} plans extracted</Badge>
                      {snap.extraction_method && <Badge variant="secondary">{snap.extraction_method}</Badge>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
