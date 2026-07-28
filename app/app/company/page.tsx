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
              {profile.scraped_data?.seo_keywords && profile.scraped_data.seo_keywords.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Target Keyword</th>
                        <th className="px-4 py-3">Estimated Rank</th>
                        <th className="px-4 py-3">Search Volume</th>
                        <th className="px-4 py-3 rounded-tr-lg">Difficulty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.scraped_data.seo_keywords.map((kw: any, idx: number) => (
                        <tr key={idx} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-4 py-3 font-medium">{kw.keyword}</td>
                          <td className="px-4 py-3">
                            {kw.rank ? (
                              <Badge variant={kw.rank <= 10 ? 'default' : 'secondary'} className={kw.rank <= 3 ? 'bg-success/15 text-success hover:bg-success/20' : ''}>
                                #{kw.rank}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {kw.search_volume ? (kw.search_volume > 1000 ? `${(kw.search_volume/1000).toFixed(1)}K` : kw.search_volume) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {kw.difficulty ? (
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${kw.difficulty > 70 ? 'bg-destructive' : kw.difficulty > 40 ? 'bg-info' : 'bg-success'}`}
                                    style={{ width: `${kw.difficulty}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">{kw.difficulty}/100</span>
                              </div>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-lg border border-dashed">
                  <Search className="h-8 w-8 text-muted-foreground mb-3" />
                  <h3 className="font-semibold text-lg">No SEO Data Available</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">Run a scan to fetch the latest SEO metrics and keyword rankings for your company.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SOCIAL TAB */}
        <TabsContent value="social" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Social Media Presence</CardTitle></CardHeader>
            <CardContent>
              {profile.scraped_data?.social_profiles && profile.scraped_data.social_profiles.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {profile.scraped_data.social_profiles.map((social: any, idx: number) => (
                    <a
                      key={idx}
                      href={social.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-accent/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Share2 className="h-5 w-5" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="font-semibold capitalize text-sm">{social.platform}</p>
                          <p className="text-xs text-muted-foreground truncate">{social.handle}</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      {social.followers && (
                        <div className="mt-2 text-xs">
                          <span className="font-bold">{(social.followers / 1000).toFixed(1)}K</span>
                          <span className="text-muted-foreground ml-1">followers</span>
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-lg border border-dashed">
                  <Share2 className="h-8 w-8 text-muted-foreground mb-3" />
                  <h3 className="font-semibold text-lg">No Social Data Available</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">Run a scan to analyze your social media performance across platforms.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRICING TAB */}
        <TabsContent value="pricing" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Catalog & Pricing Tiers</CardTitle></CardHeader>
            <CardContent>
              {profile.scraped_data?.pricing_items && profile.scraped_data.pricing_items.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {profile.scraped_data.pricing_items.map((item: any, idx: number) => (
                    <div key={idx} className="flex flex-col gap-2 rounded-lg border p-4">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-sm">{item.product_name}</p>
                        {item.tier && <Badge variant="outline" className="text-xs">{item.tier}</Badge>}
                      </div>
                      <p className="text-xl font-bold mt-2">
                        {item.price > 0 ? `${item.currency} ${item.price}` : 'Free / Contact'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-lg border border-dashed">
                  <DollarSign className="h-8 w-8 text-muted-foreground mb-3" />
                  <h3 className="font-semibold text-lg">No Pricing Data Available</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">Scan your website to automatically detect products and pricing tiers.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADVERTISING TAB */}
        <TabsContent value="advertising" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Active Campaigns</CardTitle></CardHeader>
            <CardContent>
              {profile.scraped_data?.ad_creatives && profile.scraped_data.ad_creatives.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {profile.scraped_data.ad_creatives.map((ad: any, idx: number) => (
                    <div key={idx} className="flex flex-col gap-2 rounded-lg border p-4">
                      <div className="flex justify-between items-center mb-2">
                        <Badge variant="secondary">{ad.platform}</Badge>
                        <span className="text-xs text-muted-foreground capitalize">{ad.format}</span>
                      </div>
                      <p className="font-bold text-sm leading-snug">{ad.headline}</p>
                      {ad.body_text && <p className="text-sm text-muted-foreground mt-1">{ad.body_text}</p>}
                      {ad.landing_url && (
                        <a href={ad.landing_url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline mt-2 flex items-center gap-1">
                          View Landing Page <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-lg border border-dashed">
                  <Megaphone className="h-8 w-8 text-muted-foreground mb-3" />
                  <h3 className="font-semibold text-lg">No Advertising Data Available</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">Discover active ad campaigns and marketing strategies by running a scan.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRODUCTS TAB */}
        <TabsContent value="products" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Featured Products Catalog</CardTitle></CardHeader>
            <CardContent>
              {profile.scraped_data?.pricing_items && profile.scraped_data.pricing_items.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {profile.scraped_data.pricing_items.map((item: any, idx: number) => (
                    <div key={idx} className="flex flex-col gap-2 rounded-lg border p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Layers className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm leading-tight">{item.product_name}</p>
                          {item.tier && <p className="text-xs text-muted-foreground">{item.tier}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-lg border border-dashed">
                  <Layers className="h-8 w-8 text-muted-foreground mb-3" />
                  <h3 className="font-semibold text-lg">No Products Detected</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">Your product catalog will appear here once extracted.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI INSIGHTS TAB */}
        <TabsContent value="insights" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Internal AI Brand Positioning</CardTitle></CardHeader>
            <CardContent>
              {profile.scraped_data?.strategic_insight ? (
                <div className="space-y-6">
                  <div className="rounded-lg border bg-accent/5 p-4 text-sm leading-relaxed">
                    <p className="font-semibold flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-accent" /> Strategic Summary
                    </p>
                    {profile.scraped_data.strategic_insight}
                  </div>
                  
                  {profile.scraped_data.company_info && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="p-4 border rounded-lg">
                        <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Target Audience</p>
                        <p className="text-sm">{profile.scraped_data.company_info.target_audience || 'Unknown'}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Company Description</p>
                        <p className="text-sm">{profile.scraped_data.company_info.description || 'Unknown'}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-lg border border-dashed">
                  <Sparkles className="h-8 w-8 text-muted-foreground mb-3" />
                  <h3 className="font-semibold text-lg">No AI Insights Yet</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">Run a comprehensive scan to generate AI-driven insights about your market position.</p>
                </div>
              )}
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
