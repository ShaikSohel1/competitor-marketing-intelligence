"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Globe,
  MapPin,
  Users,
  DollarSign,
  Sparkles,
  RefreshCw,
  Search,
  Share2,
  Megaphone,
  Cpu,
  Activity,
  Layers,
  ExternalLink,
  Edit,
  Clock,
  Loader2,
  Zap,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { fetchCompanyProfile, scanOurCompany, runOurCompanyLighthouseTest } from '@/lib/api';
import { formatCurrency, initials, formatRelativeTime } from '@/lib/format';
import type { CompanyProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function MyCompanyPage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [runningLighthouse, setRunningLighthouse] = useState(false);
  const [tab, setTab] = useState('overview');
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCompanyProfile();
      setProfile(data);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleScan() {
    setScanning(true);
    try {
      const result = await scanOurCompany();
      toast({ title: 'Company scan complete', description: result.summary });
      await load(); // Refresh to show new scraped data
    } catch (err) {
      toast({ title: 'Scan failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setScanning(false);
    }
  }

  async function handleLighthouseScan() {
    setRunningLighthouse(true);
    try {
      await runOurCompanyLighthouseTest();
      toast({ title: 'Lighthouse scan complete', description: 'Website performance metrics updated.' });
      await load(); // Refresh to show new pagespeed data
    } catch (err) {
      toast({ title: 'Lighthouse scan failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setRunningLighthouse(false);
    }
  }

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h2 className="text-xl font-bold mb-2">No Company Profile Found</h2>
        <p className="text-muted-foreground mb-4">Please set up your company profile to view insights.</p>
        <Button asChild>
          <Link href="/app/onboarding">Set up Company Profile</Link>
        </Button>
      </div>
    );
  }

  const p = profile;
  return (
    <div className="space-y-6">
      <PageHeader
        title={p.company_name}
        description={`My Company Profile · ${p.industry || 'Market Leader'} · Workspace Primary Entity`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleScan}
              disabled={scanning}
              className="gap-2"
            >
              {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {scanning ? 'Scanning...' : 'Scan Our Website'}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/app/onboarding">
                <Edit className="mr-2 h-4 w-4" /> {profile ? 'Edit Profile' : 'Create Company Profile'}
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        }
      />

      {/* Header Banner */}
      <Card className="relative overflow-hidden border-accent/30 bg-card">
        <div
          className="absolute top-0 left-0 right-0 h-2"
          style={{ backgroundColor: (p as any).brand_color || '#0F52BA' }}
        />
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 rounded-xl border">
                <AvatarFallback className="rounded-xl bg-accent/15 text-accent font-bold text-xl">
                  {initials(p.company_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{p.company_name}</h2>
                  <Badge variant="secondary" className="bg-accent/15 text-accent font-semibold">
                    OUR COMPANY
                  </Badge>
                </div>
                <a
                  href={p.website.startsWith('http') ? p.website : `https://${p.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mt-1"
                >
                  <Globe className="h-3.5 w-3.5" /> {p.website} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground sm:text-right">
              <div>
                <span className="block text-muted-foreground">Headquarters</span>
                <strong className="text-foreground text-sm">{p.headquarters || 'N/A'}</strong>
              </div>
              <div>
                <span className="block text-muted-foreground">Team Size</span>
                <strong className="text-foreground text-sm">{p.employee_count ? `${p.employee_count.toLocaleString()} employees` : 'N/A'}</strong>
              </div>
              <div>
                <span className="block text-muted-foreground">Est. Revenue</span>
                <strong className="text-foreground text-sm text-success">{p.annual_revenue || 'N/A'}</strong>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs View */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="website">Website</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="advertising">Advertising</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="tech">Tech Stack</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">About Company</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground leading-relaxed">
                {p.description || 'No description provided.'}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Primary Offerings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {p.primary_products?.length ? (
                    p.primary_products.map((prod, i) => (
                      <Badge key={i} variant="secondary">{prod}</Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-xs">N/A</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Core Brand Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {p.brand_keywords?.length ? (
                    p.brand_keywords.map((kw, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-xs">N/A</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* WEBSITE TAB */}
        <TabsContent value="website" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Official Website Diagnostics</CardTitle>
              <Button onClick={handleLighthouseScan} disabled={runningLighthouse || scanning} size="sm" variant="outline" className="gap-2">
                {runningLighthouse ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {runningLighthouse ? 'Running Test...' : 'Run Lighthouse Only'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm"><strong>Title:</strong> {p.scraped_data?.website_snapshots?.[0]?.title || 'N/A'}</p>
              <p className="text-sm"><strong>Meta Description:</strong> {p.scraped_data?.website_snapshots?.[0]?.meta_description || 'N/A'}</p>
              <div className="grid gap-4 sm:grid-cols-3 pt-2">
                <Badge variant={p.scraped_data?.pagespeed?.lighthouse_score ? "default" : "outline"} className={`p-3 justify-center text-sm ${p.scraped_data?.pagespeed?.lighthouse_score ? "bg-success/15 text-success hover:bg-success/20" : ""}`}>
                  Performance Score: {p.scraped_data?.pagespeed?.lighthouse_score || 0}/100
                </Badge>
                <Badge variant={p.scraped_data?.pagespeed?.page_load_ms ? "default" : "outline"} className={`p-3 justify-center text-sm ${p.scraped_data?.pagespeed?.page_load_ms ? "bg-success/15 text-success hover:bg-success/20" : ""}`}>
                  Load Time: {p.scraped_data?.pagespeed?.page_load_ms ? `${p.scraped_data.pagespeed.page_load_ms}ms` : 'N/A'}
                </Badge>
                <Badge variant={p.scraped_data?.pagespeed?.seo_score ? "default" : "outline"} className={`p-3 justify-center text-sm ${p.scraped_data?.pagespeed?.seo_score ? "bg-info/15 text-info hover:bg-info/20" : ""}`}>
                  SEO Score: {p.scraped_data?.pagespeed?.seo_score || 0}/100
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO TAB */}
        <TabsContent value="seo" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Brand SEO Metrics</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-lg border border-dashed">
                <Search className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="font-semibold text-lg">No SEO Data Available</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">Run a scan to fetch the latest SEO metrics and keyword rankings for your company.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SOCIAL TAB */}
        <TabsContent value="social" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Social Media Presence</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-lg border border-dashed">
                <Share2 className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="font-semibold text-lg">No Social Data Available</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">Run a scan to analyze your social media performance across platforms.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRICING TAB */}
        <TabsContent value="pricing" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Catalog & Pricing Tiers</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-lg border border-dashed">
                <DollarSign className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="font-semibold text-lg">No Pricing Data Available</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">Scan your website to automatically detect products and pricing tiers.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADVERTISING TAB */}
        <TabsContent value="advertising" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Active Campaigns</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-lg border border-dashed">
                <Megaphone className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="font-semibold text-lg">No Advertising Data Available</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">Discover active ad campaigns and marketing strategies by running a scan.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRODUCTS TAB */}
        <TabsContent value="products" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Featured Products Catalog</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-lg border border-dashed">
                <Layers className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="font-semibold text-lg">No Products Detected</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">Your product catalog will appear here once extracted.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI INSIGHTS TAB */}
        <TabsContent value="insights" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Internal AI Brand Positioning</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-lg border border-dashed">
                <Sparkles className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="font-semibold text-lg">No AI Insights Yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">Run a comprehensive scan to generate AI-driven insights about your market position.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PERFORMANCE TAB */}
        <TabsContent value="performance" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Market Growth & Performance</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-lg border border-dashed">
                <Activity className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="font-semibold text-lg">No Performance Metrics</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">We need more data points over time to calculate growth and performance.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TECH STACK TAB */}
        <TabsContent value="tech" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Detected Tech Stack</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-lg border border-dashed">
                <Cpu className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="font-semibold text-lg">No Tech Stack Detected</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">Run a scan to analyze the underlying technologies powering your website.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TIMELINE TAB */}
        <TabsContent value="timeline" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Company Milestones Log</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-lg border border-dashed">
                <Clock className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="font-semibold text-lg">No Timeline Events</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">Significant changes and milestones will be logged here automatically.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
