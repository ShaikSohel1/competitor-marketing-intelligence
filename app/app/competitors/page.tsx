"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  MoreHorizontal,
  Eye,
  RefreshCw,
  Pencil,
  Trash2,
  Loader2,
  Activity,
  AlertTriangle,
  Bell,
  ExternalLink,
  Download,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Competitor, ChangeEvent, Alert } from '@/types';
import { supabase } from '@/lib/supabase';
import { fetchCompetitors, scanCompetitor, deleteCompetitor } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { AddCompetitorDialog } from '@/components/AddCompetitorDialog';
import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { threatStyle, formatRelativeTime, domainFromUrl, initials } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ThreatLevel } from '@/types';

export default function () {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [stats, setStats] = useState<Record<string, { changes: number; alerts: number }>>({});
  const [loading, setLoading] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const comps = await fetchCompetitors();
      setCompetitors(comps);

      if (comps.length) {
        const ids = comps.map((c) => c.id);
        const [eventsRes, alertsRes] = await Promise.all([
          supabase.from('change_events').select('competitor_id').in('competitor_id', ids),
          supabase.from('alerts').select('competitor_id, read').in('competitor_id', ids),
        ]);

        const statMap: Record<string, { changes: number; alerts: number }> = {};
        for (const c of comps) statMap[c.id] = { changes: 0, alerts: 0 };
        for (const e of (eventsRes.data ?? []) as Pick<ChangeEvent, 'competitor_id'>[]) {
          if (statMap[e.competitor_id]) statMap[e.competitor_id].changes += 1;
        }
        for (const a of (alertsRes.data ?? []) as Pick<Alert, 'competitor_id' | 'read'>[]) {
          if (statMap[a.competitor_id] && !a.read) statMap[a.competitor_id].alerts += 1;
        }
        setStats(statMap);
      }
    } catch (err) {
      toast({
        title: 'Failed to load competitors',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleScan(id: string) {
    setScanningId(id);
    try {
      await scanCompetitor(id);
      toast({ title: 'Scan complete', description: 'Competitor data has been updated.' });
      await load();
    } catch (err) {
      toast({
        title: 'Scan failed',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setScanningId(null);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteCompetitor(deleteId);
      toast({ title: 'Competitor removed' });
      setDeleteId(null);
      await load();
    } catch (err) {
      toast({
        title: 'Failed to delete',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    }
  }

  const downloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || 'Unknown User';
      const userName = user?.user_metadata?.full_name || 'Authorized User';

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      doc.setFontSize(22);
      doc.setTextColor(41, 128, 185);
      doc.text('Competitor Intelligence Report', pageWidth / 2, 22, { align: 'center' });
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth / 2, 30, { align: 'center' });
      doc.text(`Prepared by: ${userName} (${userEmail})`, pageWidth / 2, 36, { align: 'center' });
      
      // Fetch detailed data for all competitors
      const compIds = competitors.map(c => c.id);
      
      const [monitoredRes, insightsRes] = await Promise.all([
        supabase.from('monitored_urls').select('competitor_id, url, page_type').in('competitor_id', compIds),
        supabase.from('ai_insights').select('competitor_id, title, content').in('competitor_id', compIds).eq('insight_type', 'summary')
      ]);

      const monitoredUrls = monitoredRes.data || [];
      const insights = insightsRes.data || [];

      // Add a summary table first
      const summaryData = competitors.map(c => {
        const s = stats[c.id] ?? { changes: 0, alerts: 0 };
        const pagesCount = monitoredUrls.filter(u => u.competitor_id === c.id).length;
        return [
          c.name,
          c.industry || 'N/A',
          c.threat_level || 'N/A',
          c.activity_score?.toString() || '0',
          pagesCount.toString(),
          s.changes.toString(),
          s.alerts.toString()
        ];
      });

      autoTable(doc, {
        startY: 40,
        head: [['Competitor', 'Industry', 'Threat', 'Activity', 'Pages Scraped', 'Changes', 'Alerts']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        margin: { bottom: 20 }
      });

      // Detailed section for each competitor
      for (let i = 0; i < competitors.length; i++) {
        const c = competitors[i];
        doc.addPage();
        
        doc.setFontSize(18);
        doc.setTextColor(41, 128, 185);
        doc.text(c.name, 14, 22);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Website: ${c.website}`, 14, 28);
        if (c.industry) doc.text(`Industry: ${c.industry}`, 14, 33);
        if (c.description) {
          const splitDesc = doc.splitTextToSize(c.description, pageWidth - 28);
          doc.text(splitDesc, 14, 39);
        }
        
        let currentY = c.description ? 39 + (doc.splitTextToSize(c.description, pageWidth - 28).length * 4) + 10 : 45;

        // Scraped Pages
        const compPages = monitoredUrls.filter(u => u.competitor_id === c.id);
        
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text(`Scraped Pages from Firecrawl (${compPages.length})`, 14, currentY);
        currentY += 8;
        
        if (compPages.length > 0) {
          const pagesData = compPages.map(p => [p.page_type, p.url]);
          autoTable(doc, {
            startY: currentY,
            head: [['Page Type', 'URL']],
            body: pagesData,
            theme: 'plain',
            headStyles: { fillColor: [240, 240, 240], textColor: [0,0,0] },
            styles: { fontSize: 9 }
          });
          currentY = (doc as any).lastAutoTable.finalY + 15;
        } else {
          doc.setFontSize(10);
          doc.text("No pages scraped yet.", 14, currentY);
          currentY += 15;
        }

        // AI Insight
        const compInsight = insights.find(ins => ins.competitor_id === c.id);
        if (compInsight && compInsight.content) {
          if (currentY > doc.internal.pageSize.height - 40) {
            doc.addPage();
            currentY = 20;
          }
          
          doc.setFontSize(14);
          doc.setTextColor(0);
          doc.text('AI Strategic Insight', 14, currentY);
          currentY += 8;
          
          doc.setFontSize(10);
          doc.setTextColor(80);
          const splitText = doc.splitTextToSize(compInsight.content, pageWidth - 28);
          doc.text(splitText, 14, currentY);
        }
      }

      doc.save('competitor-intelligence-report.pdf');
    } catch (err) {
      toast({
        title: 'Error generating PDF',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setDownloadingPDF(false);
    }
  };

  const filtered = competitors.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || (c.industry?.toLowerCase().includes(q) ?? false) || c.website.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Competitors" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
        </div>
      </div>
    );
  }

  if (competitors.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Competitors" description="Manage and monitor your tracked competitors." />
        <EmptyState
          icon={Users}
          title="No competitors yet"
          description="Add your first competitor to start monitoring their website, SEO, social media, pricing, and advertising."
          action={<AddCompetitorDialog onAdded={load} />}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Competitors"
        description="Manage and monitor your tracked competitors."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={downloadPDF} disabled={competitors.length === 0 || downloadingPDF}>
              {downloadingPDF ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {downloadingPDF ? 'Generating PDF...' : 'Download PDF'}
            </Button>
            <AddCompetitorDialog onAdded={load} />
          </div>
        }
      />

      <div className="relative max-w-sm">
        <Input placeholder="Search by name, industry, or website..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => {
          const ts = threatStyle(c.threat_level as ThreatLevel);
          const s = stats[c.id] ?? { changes: 0, alerts: 0 };
          return (
            <Card key={c.id} className="group flex flex-col transition-all hover:shadow-md animate-slide-up">
              <CardContent className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 rounded-xl">
                      <AvatarFallback className="rounded-xl bg-primary/10 text-sm font-bold text-primary">
                        {initials(c.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <Link href={`/app/competitors/${c.id}`} className="block truncate font-semibold hover:text-accent">
                        {c.name}
                      </Link>
                      <a
                        href={c.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 truncate text-xs text-muted-foreground hover:text-foreground"
                      >
                        {domainFromUrl(c.website)} <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/app/competitors/${c.id}`)}>
                        <Eye className="mr-2 h-4 w-4" /> View details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleScan(c.id)} disabled={scanningId === c.id}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Scan now
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/app/competitors/${c.id}`)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(c.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {c.industry && (
                  <p className="mt-3 text-xs text-muted-foreground">{c.industry}</p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline" className={ts.className}>{ts.label} threat</Badge>
                  {s.alerts > 0 && (
                    <Badge variant="outline" className="gap-1 border-destructive/30 text-destructive">
                      <Bell className="h-3 w-3" /> {s.alerts} alert{s.alerts > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-muted/60 p-2">
                    <div className="flex items-center justify-center text-muted-foreground">
                      <Activity className="h-3.5 w-3.5" />
                    </div>
                    <p className="mt-1 text-sm font-bold tabular-nums">{c.activity_score}</p>
                    <p className="text-[10px] text-muted-foreground">Activity</p>
                  </div>
                  <div className="rounded-lg bg-muted/60 p-2">
                    <div className="flex items-center justify-center text-muted-foreground">
                      <RefreshCw className="h-3.5 w-3.5" />
                    </div>
                    <p className="mt-1 text-sm font-bold tabular-nums">{s.changes}</p>
                    <p className="text-[10px] text-muted-foreground">Changes</p>
                  </div>
                  <div className="rounded-lg bg-muted/60 p-2">
                    <div className="flex items-center justify-center text-muted-foreground">
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </div>
                    <p className="mt-1 text-sm font-bold tabular-nums">{s.alerts}</p>
                    <p className="text-[10px] text-muted-foreground">Alerts</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <span className="text-[11px] text-muted-foreground">Scanned {formatRelativeTime(c.last_scanned_at)}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleScan(c.id)}
                    disabled={scanningId === c.id}
                  >
                    {scanningId === c.id ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}
                    Scan
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this competitor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the competitor and all associated scans, activity, alerts, and insights. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className={cn('bg-destructive text-destructive-foreground hover:bg-destructive/90')}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
