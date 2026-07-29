"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  ExternalLink,
  Globe,
  Search,
  Share2,
  DollarSign,
  Megaphone,
  Sparkles,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Trash2,
  Pencil,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Building2,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useCompetitorDetail } from '@/hooks/useCompetitorDetail';
import { fetchCompetitor, updateCompetitor, deleteCompetitor, scanCompetitor, runLighthouseTest, generateInsight } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { ChartTooltip } from '@/components/ChartTooltip';
import { EmptyState } from '@/components/EmptyState';
import { SocialMediaHandlesCard } from '@/components/SocialMediaHandlesCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  threatStyle,
  formatRelativeTime,
  formatDate,
  formatCurrency,
  domainFromUrl,
  initials,
} from '@/lib/format';
import type { ThreatLevel, SeoKeyword } from '@/types';
import {
  compareOverview,
  compareSeo,
  comparePricing,
  compareSocial,
  compareWebsite,
  compareTechnology,
  compareTimeline,
  getExecutiveAnalysis,
} from '@/lib/comparison';

export default function CompetitorDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId as string);
  const router = useRouter();
  const { toast } = useToast();
  const detail = useCompetitorDetail(id);

  const [scanning, setScanning] = useState(false);
  const [runningLighthouse, setRunningLighthouse] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editDesc, setEditDesc] = useState('');

  async function handleScan() {
    if (!id) return;
    setScanning(true);
    try {
      await scanCompetitor(id);
      toast({ title: 'Comparison scan complete', description: 'Head-to-head metrics updated.' });
      await detail.refresh();
    } catch (err) {
      toast({ title: 'Scan failed', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setScanning(false);
    }
  }

  async function handleLighthouseScan() {
    if (!id) return;
    setRunningLighthouse(true);
    try {
      await runLighthouseTest(id);
      toast({ title: 'Lighthouse scan complete', description: 'Website performance metrics updated.' });
      await detail.refresh();
    } catch (err) {
      toast({ title: 'Lighthouse scan failed', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setRunningLighthouse(false);
    }
  }

  async function openEdit() {
    if (!detail.competitor) return;
    const c = await fetchCompetitor(detail.competitor.id);
    if (c) {
      setEditName(c.name);
      setEditWebsite(c.website);
      setEditIndustry(c.industry ?? '');
      setEditDesc(c.description ?? '');
    }
    setEditOpen(true);
  }

  async function handleSaveEdit() {
    if (!id) return;
    try {
      await updateCompetitor(id, {
        name: editName.trim(),
        website: editWebsite.trim(),
        industry: editIndustry.trim() || undefined,
        description: editDesc.trim() || undefined,
      });
      toast({ title: 'Competitor updated' });
      setEditOpen(false);
      await detail.refresh();
    } catch (err) {
      toast({ title: 'Update failed', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    }
  }

  async function handleDelete() {
    if (!id) return;
    try {
      await deleteCompetitor(id);
      toast({ title: 'Competitor removed' });
      router.push('/app/competitors');
    } catch (err) {
      toast({ title: 'Delete failed', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    }
  }

  if (detail.loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (detail.error || !detail.competitor) {
    return (
      <div className="space-y-6">
        <Link href="/app/competitors" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to competitors
        </Link>
        <EmptyState
          icon={Search}
          title="Competitor not found"
          description={detail.error ?? 'This competitor may have been removed.'}
          action={<Button onClick={() => router.push('/app/competitors')}>View all competitors</Button>}
        />
      </div>
    );
  }

  const c = detail.competitor;
  const ourComp = detail.ourCompany || {
    id: 'our_comp',
    company_name: 'Titan Eye+',
    website: 'titaneyeplus.com',
    industry: 'Eyewear & Vision Care',
    description: 'India\'s leading eyewear brand',
    logo_url: null,
    headquarters: 'Bengaluru, India',
    employee_count: 4500,
    founded_year: 2007,
    company_size: '1000-5000',
    annual_revenue: '₹1,250 Cr',
    primary_products: ['Prescription Glasses', 'Computer Lenses'],
    target_market: 'India Consumer Market',
    social_links: {},
    brand_keywords: ['Titan Eye+'],
  };

  const ts = threatStyle(c.threat_level as ThreatLevel);
  const overviewComp = compareOverview(ourComp, c, detail.seoKeywords, detail.pricingItems, detail.socialProfiles, detail.advertisements, detail.websiteSnapshots);
  const seoComp = compareSeo(ourComp, c, detail.seoKeywords);
  const pricingComp = comparePricing(ourComp, c, detail.pricingItems);
  const socialComp = compareSocial(ourComp, c, detail.socialProfiles);
  const webComp = compareWebsite(ourComp, c, detail.websiteSnapshots);
  const techComp = compareTechnology(ourComp, c);
  const timelineComp = compareTimeline(ourComp, c, detail.events, detail.scans);
  const execAnalysis = getExecutiveAnalysis(ourComp, c, detail.insights, detail.seoKeywords, detail.pricingItems, detail.socialProfiles, detail.advertisements);
  const swotAnalysis = {
    strengths: execAnalysis.highlights.length > 0 ? execAnalysis.highlights : ['Run a scan to generate data'],
    weaknesses: ['Self-scan data pending'],
    opportunities: execAnalysis.priorityActions.length > 0 ? execAnalysis.priorityActions : ['Run a scan to identify opportunities'],
    threats: detail.seoKeywords.length > 0
      ? [`${c.name} ranks for ${detail.seoKeywords.length} keywords in your space`]
      : ['Run a scan to identify threats'],
  };

  const renderWinnerBadge = (w: 'our' | 'comp' | 'tie') => {
    if (w === 'our') return <Badge variant="default" className="bg-success/15 text-success">{ourComp.company_name}</Badge>;
    if (w === 'comp') return <Badge variant="secondary">{c.name}</Badge>;
    return <Badge variant="outline">Tie</Badge>;
  };

  return (
    <div className="space-y-6">
      <Link href="/app/competitors" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to competitors
      </Link>

      {/* Head-to-Head Header Banner */}
      <Card className="relative overflow-hidden border-accent/30 shadow-md">
        <CardContent className="relative p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Our Company Badge */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/10 border border-accent/20">
                <Avatar className="h-12 w-12 rounded-lg border">
                  <AvatarFallback className="rounded-lg bg-accent text-accent-foreground font-bold">
                    {initials(ourComp.company_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Badge variant="secondary" className="text-[10px] bg-accent/20 text-accent font-bold">OUR COMPANY</Badge>
                  <h2 className="text-lg font-bold">{ourComp.company_name}</h2>
                </div>
              </div>

              <div className="hidden sm:flex h-8 items-center font-extrabold text-muted-foreground text-sm">VS</div>

              {/* Selected Competitor Badge */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/60 border">
                <Avatar className="h-12 w-12 rounded-lg border">
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">
                    {initials(c.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Badge variant="outline" className="text-[10px]">COMPETITOR</Badge>
                  <h2 className="text-lg font-bold">{c.name}</h2>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={ts.className}>{ts.label} threat</Badge>
              <Badge variant="secondary" className="gap-1">
                <Activity className="h-3.5 w-3.5" /> Score {c.activity_score}/100
              </Badge>
              <Button variant="outline" size="sm" onClick={openEdit}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
              </Button>
              <Button size="sm" onClick={handleScan} disabled={scanning}>
                {scanning ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
                Scan Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Side-by-Side Comparison Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="flex w-full flex-wrap justify-start gap-1 h-auto p-1">
          <TabsTrigger value="overview" className="gap-1.5"><Activity className="h-4 w-4" /> Overview</TabsTrigger>
          <TabsTrigger value="website" className="gap-1.5"><Globe className="h-4 w-4" /> Website</TabsTrigger>
          <TabsTrigger value="seo" className="gap-1.5"><Search className="h-4 w-4" /> SEO</TabsTrigger>
          <TabsTrigger value="pricing" className="gap-1.5"><DollarSign className="h-4 w-4" /> Pricing</TabsTrigger>
          <TabsTrigger value="social" className="gap-1.5"><Share2 className="h-4 w-4" /> Social</TabsTrigger>
          <TabsTrigger value="advertising" className="gap-1.5"><Megaphone className="h-4 w-4" /> Advertising</TabsTrigger>
          <TabsTrigger value="tech" className="gap-1.5"><Zap className="h-4 w-4" /> Tech Stack</TabsTrigger>
          <TabsTrigger value="insights" className="gap-1.5"><Sparkles className="h-4 w-4" /> AI Insights</TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1.5"><Activity className="h-4 w-4" /> Timeline</TabsTrigger>
        </TabsList>

        {/* PART 2: OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Head-to-Head Overview Matrix</CardTitle>
              <CardDescription>Direct comparative metrics: {ourComp.company_name} vs {c.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead className="font-bold text-accent">{ourComp.company_name} (Us)</TableHead>
                      <TableHead className="font-bold">{c.name} (Competitor)</TableHead>
                      <TableHead className="text-right">Positioning</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Overall Score</TableCell>
                      <TableCell className="font-bold text-success">{overviewComp.ourScore}</TableCell>
                      <TableCell className="font-bold text-info">{overviewComp.compScore}</TableCell>
                      <TableCell className="text-right"><Badge variant="outline">Competitive</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">SEO Score</TableCell>
                      <TableCell className="font-bold text-success">{overviewComp.ourSeoScore}</TableCell>
                      <TableCell className="font-bold text-info">{overviewComp.compSeoScore}</TableCell>
                      <TableCell className="text-right"><Badge variant="secondary">Comp +{overviewComp.compSeoScore - overviewComp.ourSeoScore}</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Monthly Traffic</TableCell>
                      <TableCell className="font-mono">{overviewComp.ourTraffic}</TableCell>
                      <TableCell className="font-mono">{overviewComp.compTraffic}</TableCell>
                      <TableCell className="text-right"><Badge variant="outline">Target Gap</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">SERP Keywords</TableCell>
                      <TableCell className="font-bold">{overviewComp.ourKeywords}</TableCell>
                      <TableCell className="font-bold">{overviewComp.compKeywords}</TableCell>
                      <TableCell className="text-right"><Badge variant="secondary">Comp +{overviewComp.compKeywords - overviewComp.ourKeywords}</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Domain Authority</TableCell>
                      <TableCell>{overviewComp.ourDa}</TableCell>
                      <TableCell>{overviewComp.compDa}</TableCell>
                      <TableCell className="text-right"><Badge variant="outline">DA Difference</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Active Ad Campaigns</TableCell>
                      <TableCell>{overviewComp.ourActiveAds}</TableCell>
                      <TableCell>{overviewComp.compActiveAds}</TableCell>
                      <TableCell className="text-right"><Badge variant="secondary">Comp Running More</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Social Followers</TableCell>
                      <TableCell>{overviewComp.ourFollowers}</TableCell>
                      <TableCell>{overviewComp.compFollowers}</TableCell>
                      <TableCell className="text-right"><Badge variant="outline">High Reach</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Pricing Positioning</TableCell>
                      <TableCell><Badge variant="secondary">{overviewComp.ourPricingPosition}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{overviewComp.compPricingPosition}</Badge></TableCell>
                      <TableCell className="text-right"><span className="text-xs text-muted-foreground">Price Gap ~15%</span></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* PART 12: EXECUTIVE AI ANALYSIS */}
          <Card className="border-accent/30 bg-accent/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" /> Executive AI Analysis & Priority Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-foreground">{execAnalysis.summary}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 p-3 rounded-lg border bg-background/60">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase">Key Comparative Insights</h4>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {execAnalysis.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <ChevronRight className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2 p-3 rounded-lg border bg-background/60">
                  <h4 className="text-xs font-bold text-accent uppercase">Priority Action Items</h4>
                  <ol className="space-y-1 text-xs font-medium">
                    {execAnalysis.priorityActions.map((act, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="font-bold text-accent">{i + 1}.</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PART 7: WEBSITE COMPARISON */}
        <TabsContent value="website" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Website Performance Comparison</CardTitle>
              <Button onClick={handleLighthouseScan} disabled={runningLighthouse || scanning} size="sm" variant="outline" className="gap-2">
                {runningLighthouse ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {runningLighthouse ? 'Running Test...' : 'Run Lighthouse Only'}
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>{ourComp.company_name} (Us)</TableHead>
                    <TableHead>{c.name} (Competitor)</TableHead>
                    <TableHead className="text-right">Winner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Page Load Speed</TableCell>
                    <TableCell className={webComp.loadSpeedMs.winner === 'our' ? "font-bold text-success" : ""}>{webComp.loadSpeedMs.our}ms</TableCell>
                    <TableCell className={webComp.loadSpeedMs.winner === 'comp' ? "font-bold text-info" : ""}>{webComp.loadSpeedMs.comp}ms</TableCell>
                    <TableCell className="text-right">{renderWinnerBadge(webComp.loadSpeedMs.winner)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Lighthouse Performance</TableCell>
                    <TableCell className={webComp.performanceScore.winner === 'our' ? "font-bold text-success" : ""}>{webComp.performanceScore.our}/100</TableCell>
                    <TableCell className={webComp.performanceScore.winner === 'comp' ? "font-bold text-info" : ""}>{webComp.performanceScore.comp}/100</TableCell>
                    <TableCell className="text-right">{renderWinnerBadge(webComp.performanceScore.winner)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">SEO Score</TableCell>
                    <TableCell className={webComp.seoScore.winner === 'our' ? "font-bold text-success" : ""}>{webComp.seoScore.our}/100</TableCell>
                    <TableCell className={webComp.seoScore.winner === 'comp' ? "font-bold text-info" : ""}>{webComp.seoScore.comp}/100</TableCell>
                    <TableCell className="text-right">{renderWinnerBadge(webComp.seoScore.winner)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Core Web Vitals</TableCell>
                    <TableCell className={webComp.coreWebVitals.winner === 'our' ? "font-bold text-success" : ""}>{webComp.coreWebVitals.our}</TableCell>
                    <TableCell className={webComp.coreWebVitals.winner === 'comp' ? "font-bold text-info" : ""}>{webComp.coreWebVitals.comp}</TableCell>
                    <TableCell className="text-right">{renderWinnerBadge(webComp.coreWebVitals.winner)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PART 3: SEO COMPARISON */}
        <TabsContent value="seo" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">Keyword Rankings & Gap Analysis</CardTitle>
                <CardDescription>Comparing search positions for target keywords</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">Overlap: {seoComp.keywordOverlap}%</Badge>
                <Badge variant="secondary">Keyword Gaps: {seoComp.keywordGapCount}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Target Keyword</TableHead>
                    <TableHead className="text-center">{ourComp.company_name} Rank</TableHead>
                    <TableHead className="text-center">{c.name} Rank</TableHead>
                    <TableHead className="text-center">Diff</TableHead>
                    <TableHead className="text-right">Volume</TableHead>
                    <TableHead>Recommendation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seoComp.rows.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-semibold">{row.keyword}</TableCell>
                      <TableCell className="text-center font-bold">#{row.ourRank}</TableCell>
                      <TableCell className="text-center font-bold text-info">#{row.compRank}</TableCell>
                      <TableCell className={`text-center font-bold ${row.diff < 0 ? 'text-destructive' : 'text-success'}`}>
                        {row.diff > 0 ? `+${row.diff}` : row.diff}
                      </TableCell>
                      <TableCell className="text-right font-mono">{row.volume.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{row.recommendation}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PART 4: PRICING COMPARISON */}
        <TabsContent value="pricing" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Product Pricing Matrix & Difference</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Tier</TableHead>
                    <TableHead className="text-right">{ourComp.company_name}</TableHead>
                    <TableHead className="text-right">{c.name}</TableHead>
                    <TableHead className="text-right">Price Diff</TableHead>
                    <TableHead>Cheaper Brand</TableHead>
                    <TableHead>Strategic Recommendation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricingComp.map((p, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-semibold">{p.productName}</TableCell>
                      <TableCell className="text-right font-bold">₹{p.ourPrice}</TableCell>
                      <TableCell className="text-right font-bold text-success">₹{p.compPrice}</TableCell>
                      <TableCell className="text-right font-bold text-destructive">₹{p.diff}</TableCell>
                      <TableCell><Badge variant="outline">{p.cheaperBrand}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.recommendation}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PART 5: SOCIAL COMPARISON */}
        <TabsContent value="social" className="space-y-4 mt-4">
          <SocialMediaHandlesCard
            competitor={c}
            socialProfiles={detail.socialProfiles}
            onRefresh={detail.refresh}
          />
          <Card>
            <CardHeader><CardTitle className="text-base">Social Media Channel Comparison</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {socialComp.map((s, idx) => (
                  <div key={idx} className="p-4 border rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-sm">{s.platform}</h4>
                      <Badge variant={s.winner === 'our' ? 'default' : 'secondary'} className={s.winner === 'our' ? 'bg-success/15 text-success' : ''}>
                        {s.winner === 'our' ? `${ourComp.company_name} Leads` : `${c.name} Leads`}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                      <div>
                        <span className="text-muted-foreground">{ourComp.company_name}:</span>
                        <p className="font-bold text-sm">{(s.ourFollowers / 1000).toFixed(0)}K followers</p>
                        <span className="text-success">{s.ourEngagementRate}% ER</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{c.name}:</span>
                        <p className="font-bold text-sm">{(s.compFollowers / 1000).toFixed(0)}K followers</p>
                        <span className="text-info">{s.compEngagementRate}% ER</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PART 6: ADVERTISING COMPARISON */}
        <TabsContent value="advertising" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Ad Campaign Positioning</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 border rounded-lg space-y-2">
                <Badge variant="secondary">{ourComp.company_name} (Us)</Badge>
                <h4 className="font-bold text-sm">Est. Spend: ₹85,000 / month</h4>
                <p className="text-xs text-muted-foreground">Primary Channels: Google Search, Meta Instagram Video Ads</p>
                <Badge variant="outline" className="text-xs">12 Active Ad Creatives</Badge>
              </div>
              <div className="p-4 border rounded-lg space-y-2">
                <Badge variant="outline">{c.name} (Competitor)</Badge>
                <h4 className="font-bold text-sm text-info">Est. Spend: ₹220,000 / month</h4>
                <p className="text-xs text-muted-foreground">Primary Channels: Google Shopping, Instagram Video, YouTube</p>
                <Badge variant="secondary" className="text-xs">27 Active Ad Creatives</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PART 8: TECH STACK COMPARISON */}
        <TabsContent value="tech" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Technology Stack Matrix</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Technology</TableHead>
                    <TableHead className="text-center">{ourComp.company_name}</TableHead>
                    <TableHead className="text-center">{c.name}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {techComp.map((t, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium text-xs text-muted-foreground">{t.category}</TableCell>
                      <TableCell className="font-semibold">{t.name}</TableCell>
                      <TableCell className="text-center">
                        {t.ourHas ? <CheckCircle2 className="h-4 w-4 text-success inline" /> : <XCircle className="h-4 w-4 text-muted-foreground inline" />}
                      </TableCell>
                      <TableCell className="text-center">
                        {t.compHas ? <CheckCircle2 className="h-4 w-4 text-info inline" /> : <XCircle className="h-4 w-4 text-muted-foreground inline" />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PART 9: AI INSIGHTS & SWOT */}
        <TabsContent value="insights" className="space-y-4 mt-4">
          <Card className="border-accent/30">
            <CardHeader><CardTitle className="text-base">Comparative SWOT Matrix</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <h4 className="font-bold text-sm text-success">Strengths ({ourComp.company_name})</h4>
                <ul className="mt-2 space-y-1 text-xs text-foreground/90">
                  {swotAnalysis.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <h4 className="font-bold text-sm text-destructive">Weaknesses</h4>
                <ul className="mt-2 space-y-1 text-xs text-foreground/90">
                  {swotAnalysis.weaknesses.map((w, i) => <li key={i}>• {w}</li>)}
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <h4 className="font-bold text-sm text-accent">Opportunities</h4>
                <ul className="mt-2 space-y-1 text-xs text-foreground/90">
                  {swotAnalysis.opportunities.map((o, i) => <li key={i}>• {o}</li>)}
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                <h4 className="font-bold text-sm text-warning">Threats ({c.name})</h4>
                <ul className="mt-2 space-y-1 text-xs text-foreground/90">
                  {swotAnalysis.threats.map((t, i) => <li key={i}>• {t}</li>)}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PART 10: COMPARATIVE TIMELINE */}
        <TabsContent value="timeline" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Combined Activity Timeline</CardTitle>
              <CardDescription>Interleaved chronological log from both companies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {timelineComp.map((evt) => (
                <div
                  key={evt.id}
                  className={`p-4 border rounded-lg border-l-4 ${
                    evt.isOurCompany ? 'border-l-accent bg-accent/5' : 'border-l-primary bg-muted/40'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Badge variant={evt.isOurCompany ? 'default' : 'secondary'} className={evt.isOurCompany ? 'bg-accent text-accent-foreground font-bold' : ''}>
                        {evt.companyName}
                      </Badge>
                      <span className="font-semibold text-sm">{evt.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(evt.detectedAt)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{evt.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Competitor</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Name</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
            <div className="space-y-1"><Label>Website</Label><Input value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} /></div>
            <div className="space-y-1"><Label>Industry</Label><Input value={editIndustry} onChange={(e) => setEditIndustry(e.target.value)} /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea rows={3} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Competitor?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to remove {c.name}? All intelligence snapshots will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
