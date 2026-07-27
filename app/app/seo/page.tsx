"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Wand2,
  ShieldAlert,
  ArrowUpDown,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useCompetitorList } from "@/hooks/useCompetitorList";
import { fetchSeoKeywords, createSeoKeyword, generateKeywordGapReport } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { CompetitorFilter } from "@/components/CompetitorFilter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChartTooltip } from "@/components/ChartTooltip";
import { useToast } from "@/hooks/use-toast";
import type { SeoKeyword, Competitor } from "@/types";

export default function SeoKeywordsPage() {
  const { competitors, loading: compsLoading } = useCompetitorList();
  const [keywords, setKeywords] = useState<SeoKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyword, setNewKeyword] = useState("");
  const [adding, setAdding] = useState(false);
  const [filterComp, setFilterComp] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"rank" | "search_volume" | "difficulty">("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [generatingGap, setGeneratingGap] = useState(false);
  const [gapReport, setGapReport] = useState<any>(null);
  const { toast } = useToast();

  const competitorMap: Record<string, Competitor> = useMemo(() => {
    const map: Record<string, Competitor> = {};
    for (const c of competitors) map[c.id] = c;
    return map;
  }, [competitors]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSeoKeywords(filterComp === "all" ? undefined : filterComp);
      setKeywords(data);
    } catch {
      setKeywords([]);
    } finally {
      setLoading(false);
    }
  }, [filterComp]);

  useEffect(() => {
    if (!compsLoading) load();
  }, [load, compsLoading]);

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    setAdding(true);
    try {
      await createSeoKeyword(newKeyword.trim());
      setNewKeyword("");
      load();
      toast({ title: "Keyword added", description: "Successfully tracking new keyword." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const handleGenerateGapReport = async () => {
    setGeneratingGap(true);
    try {
      const report = await generateKeywordGapReport();
      setGapReport(report);
      toast({ title: "Report generated", description: "Keyword gap analysis complete." });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingGap(false);
    }
  };

  // Filtered & Sorted Keywords
  const filteredKeywords = useMemo(() => {
    return keywords
      .filter((k) => {
        const q = searchQuery.toLowerCase();
        return !q || k.keyword.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const valA = a[sortField] ?? 999;
        const valB = b[sortField] ?? 999;
        return sortOrder === "asc" ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
      });
  }, [keywords, searchQuery, sortField, sortOrder]);

  const paginatedKeywords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredKeywords.slice(start, start + pageSize);
  }, [filteredKeywords, page]);

  const totalPages = Math.ceil(filteredKeywords.length / pageSize) || 1;

  // Stats calculation
  const stats = useMemo(() => {
    const total = filteredKeywords.length;
    const avgRank = total
      ? Math.round(
          filteredKeywords.reduce((acc, k) => acc + (k.rank || 0), 0) / total
        )
      : 0;
    const totalVolume = filteredKeywords.reduce((acc, k) => acc + (k.search_volume || 0), 0);
    const highOpp = filteredKeywords.filter((k) => k.opportunity === "High").length;
    return { total, avgRank, totalVolume, highOpp };
  }, [filteredKeywords]);

  // Chart data: volume by keyword
  const chartData = useMemo(() => {
    return filteredKeywords.slice(0, 8).map((k) => ({
      name: k.keyword.length > 15 ? k.keyword.slice(0, 14) + "…" : k.keyword,
      volume: k.search_volume || 0,
      rank: k.rank || 0,
    }));
  }, [filteredKeywords]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Keyword & SEO Monitoring"
        description="Track competitor search engine rankings, search volume, difficulty, and content gaps."
        actions={
          <div className="flex items-center gap-2">
            <CompetitorFilter competitors={competitors} value={filterComp} onChange={setFilterComp} />
            <Button onClick={handleGenerateGapReport} disabled={generatingGap}>
              {generatingGap ? (
                <span className="flex items-center"><Search className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</span>
              ) : (
                <span className="flex items-center"><Wand2 className="mr-2 h-4 w-4" /> Run Gap Analysis</span>
              )}
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Tracked Keywords</p><p className="mt-2 text-3xl font-bold tabular-nums">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Avg Position (Rank)</p><p className="mt-2 text-3xl font-bold tabular-nums text-info">#{stats.avgRank || 1}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Search Volume</p><p className="mt-2 text-3xl font-bold tabular-nums">{stats.totalVolume.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">High Opportunities</p><p className="mt-2 text-3xl font-bold tabular-nums text-success">{stats.highOpp}</p></CardContent></Card>
      </div>

      {/* Chart Row */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Search Volume & SERP Ranks</CardTitle>
            <CardDescription>Estimated monthly search volume for top tracked keywords</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
                  <Bar dataKey="volume" name="Search Volume" radius={[6, 6, 0, 0]} fill="hsl(var(--info))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Keyword Management + Filter Table */}
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Keyword Intelligence Table</CardTitle>
              <CardDescription>Real-time organic search rankings and metrics per competitor.</CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-48 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search keywords..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                }}
              >
                <ArrowUpDown className="mr-1 h-3.5 w-3.5" /> Sort {sortOrder === "asc" ? "↑" : "↓"}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : paginatedKeywords.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No keywords found matching your criteria.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Competitor</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => setSortField("rank")}>
                      Position <ArrowUpDown className="inline h-3 w-3" />
                    </TableHead>
                    <TableHead>Previous</TableHead>
                    <TableHead className="cursor-pointer text-right" onClick={() => setSortField("search_volume")}>
                      Volume <ArrowUpDown className="inline h-3 w-3" />
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => setSortField("difficulty")}>
                      Difficulty <ArrowUpDown className="inline h-3 w-3" />
                    </TableHead>
                    <TableHead>Traffic %</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Opportunity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedKeywords.map((kw) => {
                    const comp = competitorMap[kw.competitor_id];
                    const rankDiff = (kw.previous_rank || 0) - (kw.rank || 0);
                    const trafficShare = kw.metadata && typeof kw.metadata === 'object' && 'traffic_share' in kw.metadata
                      ? String(kw.metadata.traffic_share) + '%'
                      : '12%';

                    return (
                      <TableRow key={kw.id}>
                        <TableCell className="font-semibold text-foreground">{kw.keyword}</TableCell>
                        <TableCell className="text-muted-foreground">{comp?.name || (kw as any).competitor?.name || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={kw.rank && kw.rank <= 3 ? "default" : "secondary"}>
                            #{kw.rank ?? '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">#{kw.previous_rank ?? '—'}</TableCell>
                        <TableCell className="text-right font-mono">{kw.search_volume?.toLocaleString() ?? '—'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-xs">{kw.difficulty}/100</span>
                            <div className="h-1.5 w-12 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${kw.difficulty || 50}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{trafficShare}</TableCell>
                        <TableCell>
                          {kw.trend === 'up' || rankDiff > 0 ? (
                            <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                              <TrendingUp className="h-3.5 w-3.5" /> +{Math.abs(rankDiff) || 1}
                            </span>
                          ) : kw.trend === 'down' || rankDiff < 0 ? (
                            <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                              <TrendingDown className="h-3.5 w-3.5" /> -{Math.abs(rankDiff) || 1}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Minus className="h-3.5 w-3.5" /> 0
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={kw.opportunity === 'High' ? 'default' : 'outline'}
                            className={kw.opportunity === 'High' ? 'bg-success/15 text-success' : ''}
                          >
                            {kw.opportunity}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <span className="text-xs text-muted-foreground">
                  Page {page} of {totalPages} ({filteredKeywords.length} items)
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tracked Keywords Input & Gap Analysis */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Add Custom Keyword</CardTitle>
            <CardDescription>Track new keywords for workspace SERP scans.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddKeyword} className="flex gap-2 mb-4">
              <Input
                placeholder="e.g. Eyeglasses online..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                disabled={adding}
              />
              <Button type="submit" disabled={adding || !newKeyword.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Gap Report Results */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Keyword Gap Analysis</CardTitle>
            <CardDescription>
              {gapReport ? `Analyzed ${gapReport.totalKeywordsAnalyzed} keywords across ${gapReport.competitors?.length} competitors.` : "Run an analysis to see how your domain compares to competitors."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!gapReport && !generatingGap && (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground border border-dashed rounded-md">
                <Search className="h-8 w-8 mb-4 text-muted-foreground/50" />
                <p>No gap report generated yet.</p>
                <Button variant="link" onClick={handleGenerateGapReport}>Run analysis now</Button>
              </div>
            )}

            {generatingGap && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4 border border-dashed rounded-md">
                <Search className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Scraping SERPs and computing gaps...</p>
              </div>
            )}

            {gapReport && !generatingGap && (
              <div className="space-y-4">
                {gapReport.gaps?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold flex items-center text-red-500">
                      <ShieldAlert className="mr-2 h-4 w-4" /> True Content Gaps
                    </h3>
                    <div className="grid gap-2">
                      {gapReport.gaps.map((gap: any, i: number) => (
                        <div key={i} className="p-3 border border-red-500/20 bg-red-500/5 rounded-lg flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-sm">{gap.keyword}</span>
                            <div className="text-xs text-muted-foreground mt-0.5">{gap.recommendation}</div>
                          </div>
                          <Badge variant="destructive">Avg Rank: #{gap.avgRank}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
