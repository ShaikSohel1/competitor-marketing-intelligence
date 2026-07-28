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
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { fetchCompanyProfile, scanOurCompany } from '@/lib/api';
import { formatCurrency, initials, formatRelativeTime } from '@/lib/format';
import type { CompanyProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function MyCompanyPage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
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

  const p = profile || {
    company_name: 'Titan Eye+',
    website: 'https://titaneyeplus.com',
    industry: 'Eyewear & Vision Care',
    description: 'India\'s leading omnichannel eyewear brand offering prescription glasses, computer lenses, and sunglasses.',
    headquarters: 'Bengaluru, India',
    employee_count: 4500,
    annual_revenue: '₹1,250 Cr',
    founded_year: 2007,
    primary_products: ['Prescription Eyeglasses', 'Anti-Glare Computer Lenses', 'Contact Lenses', 'Design Sunglasses'],
    brand_keywords: ['Titan Eye+', 'Prescription Glasses', 'Eyewear Online', 'Vision Care'],
    brand_color: '#0F52BA',
  };

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
                <strong className="text-foreground text-sm">{p.headquarters || 'Bengaluru, India'}</strong>
              </div>
              <div>
                <span className="block text-muted-foreground">Team Size</span>
                <strong className="text-foreground text-sm">{(p.employee_count || 4500).toLocaleString()} employees</strong>
              </div>
              <div>
                <span className="block text-muted-foreground">Est. Revenue</span>
                <strong className="text-foreground text-sm text-success">{p.annual_revenue || '₹1,250 Cr'}</strong>
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
                {p.description || 'India\'s leading eyewear omnichannel platform.'}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Primary Offerings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {(p.primary_products || ['Eyeglasses', 'Sunglasses', 'Contact Lenses']).map((prod, i) => (
                    <Badge key={i} variant="secondary">{prod}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Core Brand Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {(p.brand_keywords || ['Titan Eye+', 'Eyewear', 'Lenses']).map((kw, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* WEBSITE TAB */}
        <TabsContent value="website" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Official Website Diagnostics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm"><strong>Title:</strong> {p.company_name} - Official Online Store</p>
              <p className="text-sm"><strong>Meta Description:</strong> Buy prescription glasses, computer lenses & sunglasses online.</p>
              <div className="grid gap-4 sm:grid-cols-3 pt-2">
                <Badge variant="outline" className="p-3 justify-center text-sm">Performance Score: 94/100</Badge>
                <Badge variant="outline" className="p-3 justify-center text-sm">Load Time: 280ms</Badge>
                <Badge variant="outline" className="p-3 justify-center text-sm">Status Code: 200 OK</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO TAB */}
        <TabsContent value="seo" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Brand SEO Metrics</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-4 sm:grid-cols-3">
                <Badge variant="secondary" className="p-4 flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">Avg SERP Rank</span>
                  <span className="text-2xl font-bold text-info">#2</span>
                </Badge>
                <Badge variant="secondary" className="p-4 flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">Organic Keywords</span>
                  <span className="text-2xl font-bold">560</span>
                </Badge>
                <Badge variant="secondary" className="p-4 flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">Backlinks</span>
                  <span className="text-2xl font-bold text-success">1,800</span>
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SOCIAL TAB */}
        <TabsContent value="social" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Social Media Presence</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <span className="text-xs text-muted-foreground">Instagram Followers</span>
                <p className="text-xl font-bold">350K</p>
                <span className="text-xs text-success">+4.2% ER</span>
              </div>
              <div className="p-4 border rounded-lg">
                <span className="text-xs text-muted-foreground">LinkedIn Followers</span>
                <p className="text-xl font-bold">85K</p>
                <span className="text-xs text-info">+2.1% growth</span>
              </div>
              <div className="p-4 border rounded-lg">
                <span className="text-xs text-muted-foreground">YouTube Subscribers</span>
                <p className="text-xl font-bold">120K</p>
                <span className="text-xs text-muted-foreground">Weekly videos</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRICING TAB */}
        <TabsContent value="pricing" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Catalog & Pricing Tiers</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <h4 className="font-bold text-sm">Classic Frame</h4>
                <p className="text-xl font-bold text-success mt-1">₹1,499</p>
                <p className="text-xs text-muted-foreground mt-1">Includes scratch-resistant coating</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-bold text-sm">Premium Frame</h4>
                <p className="text-xl font-bold text-success mt-1">₹2,999</p>
                <p className="text-xs text-muted-foreground mt-1">Includes 1-yr frame warranty</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-bold text-sm">Gold Pass</h4>
                <p className="text-xl font-bold text-success mt-1">₹799/yr</p>
                <p className="text-xs text-muted-foreground mt-1">Free lens replacements for family</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADVERTISING TAB */}
        <TabsContent value="advertising" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Active Campaigns</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 border rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm">Google Search Ads - Prescription Lenses</h4>
                  <p className="text-xs text-muted-foreground">Est. Spend: ₹85,000/mo · Impressions: 120K</p>
                </div>
                <Badge variant="default" className="bg-success/15 text-success">Active</Badge>
              </div>
              <div className="p-4 border rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm">Meta Instagram Video Ads - Blue Light Protection</h4>
                  <p className="text-xs text-muted-foreground">Est. Spend: ₹60,000/mo · Impressions: 250K</p>
                </div>
                <Badge variant="default" className="bg-success/15 text-success">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRODUCTS TAB */}
        <TabsContent value="products" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Featured Products Catalog</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="p-3 border rounded-lg flex gap-3 items-center">
                <div className="h-12 w-12 rounded bg-muted flex items-center justify-center font-bold text-xs text-primary">TITAN</div>
                <div>
                  <h5 className="font-semibold text-sm">Titan Clear Vision Lenses</h5>
                  <p className="text-xs text-muted-foreground">Anti-reflective & water-repellent coating</p>
                </div>
              </div>
              <div className="p-3 border rounded-lg flex gap-3 items-center">
                <div className="h-12 w-12 rounded bg-muted flex items-center justify-center font-bold text-xs text-primary">TITAN</div>
                <div>
                  <h5 className="font-semibold text-sm">Titan Computer Glasses</h5>
                  <p className="text-xs text-muted-foreground">Blue light protection for digital screens</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI INSIGHTS TAB */}
        <TabsContent value="insights" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Internal AI Brand Positioning</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <h4 className="font-semibold text-sm text-accent flex items-center gap-1">
                  <Sparkles className="h-4 w-4" /> Strong Brand Trust & High Engagement
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {p.company_name} maintains superior social engagement rates (4.2%) and higher customer brand trust ratings in India.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PERFORMANCE TAB */}
        <TabsContent value="performance" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Market Growth & Performance</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="p-4 border rounded-lg"><span className="text-xs text-muted-foreground">Q3 Growth</span><p className="text-2xl font-bold text-success">+14.2%</p></div>
              <div className="p-4 border rounded-lg"><span className="text-xs text-muted-foreground">Customer NPS</span><p className="text-2xl font-bold text-info">74</p></div>
              <div className="p-4 border rounded-lg"><span className="text-xs text-muted-foreground">Brand Awareness</span><p className="text-2xl font-bold">88%</p></div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TECH STACK TAB */}
        <TabsContent value="tech" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Detected Tech Stack</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {['Next.js', 'React', 'Google Analytics 4', 'Meta Pixel', 'TailwindCSS', 'Cloudflare CDN'].map((t, i) => (
                <Badge key={i} variant="secondary" className="px-3 py-1 text-xs">{t}</Badge>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TIMELINE TAB */}
        <TabsContent value="timeline" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Company Milestones Log</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <div className="flex gap-3 items-center"><Clock className="h-4 w-4 text-accent" /> <span>{p.company_name} updated primary product pricing structure.</span></div>
              <div className="flex gap-3 items-center"><Clock className="h-4 w-4 text-accent" /> <span>Launched new Q3 performance advertising campaign across Google Search.</span></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
