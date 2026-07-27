"use client";

import { useState, useMemo } from 'react';
import { Search, Download, ArrowUpDown, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/format';
import { exportToCsv } from '@/lib/exportUtils';

export interface CampaignTableRow {
  id: string;
  compName: string;
  isOurCompany: boolean;
  campaignName: string;
  platform: string;
  objective: string;
  landingUrl: string;
  ctaText: string;
  status: 'active' | 'paused' | 'ended';
  estBudget: number;
  detectedAt: string;
}

interface CampaignTableProps {
  rows: CampaignTableRow[];
}

export function CampaignTable({ rows }: CampaignTableProps) {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [sortField, setSortField] = useState<'estBudget' | 'compName' | 'platform'>('estBudget');
  const [sortAsc, setSortAsc] = useState(false);

  const platforms = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => set.add(r.platform));
    return Array.from(set);
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows
      .filter((r) => {
        const matchesSearch =
          r.campaignName.toLowerCase().includes(search.toLowerCase()) ||
          r.compName.toLowerCase().includes(search.toLowerCase());
        const matchesPlatform = platformFilter === 'all' || r.platform === platformFilter;
        return matchesSearch && matchesPlatform;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];
        if (typeof valA === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [rows, search, platformFilter, sortField, sortAsc]);

  const handleExportCsv = () => {
    const exportData = filteredRows.map((r) => ({
      Company: r.compName,
      Campaign: r.campaignName,
      Platform: r.platform,
      Objective: r.objective,
      LandingUrl: r.landingUrl,
      CTA: r.ctaText,
      Status: r.status,
      EstBudget: r.estBudget,
      DetectedAt: formatDate(r.detectedAt),
    }));
    exportToCsv('advertising_campaigns_report', exportData);
  };

  const toggleSort = (field: 'estBudget' | 'compName' | 'platform') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3">
        <div>
          <CardTitle className="text-base">Ad Campaigns Intelligence Table</CardTitle>
          <CardDescription>Itemized breakdown of active campaigns, objectives, CTAs, and budgets</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCsv}>
          <Download className="mr-1.5 h-3.5 w-3.5 text-accent" /> Export CSV
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaigns or brands..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="h-9 text-xs w-[160px]">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {platforms.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => toggleSort('compName')} className="cursor-pointer">
                  Company <ArrowUpDown className="ml-1 inline h-3 w-3" />
                </TableHead>
                <TableHead>Campaign Name</TableHead>
                <TableHead onClick={() => toggleSort('platform')} className="cursor-pointer">
                  Platform <ArrowUpDown className="ml-1 inline h-3 w-3" />
                </TableHead>
                <TableHead>CTA / Objective</TableHead>
                <TableHead onClick={() => toggleSort('estBudget')} className="text-right cursor-pointer">
                  Est. Budget <ArrowUpDown className="ml-1 inline h-3 w-3" />
                </TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Detected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-xs text-muted-foreground">
                    No active campaign records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((r) => (
                  <TableRow key={r.id} className={r.isOurCompany ? 'bg-accent/5 font-medium' : ''}>
                    <TableCell className="font-bold">
                      {r.compName}
                      {r.isOurCompany && (
                        <Badge variant="secondary" className="ml-2 text-[10px] bg-accent/20 text-accent font-bold">
                          OUR BRAND
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold max-w-[220px] truncate">{r.campaignName}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{r.platform}</Badge></TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-xs">{r.ctaText || 'Learn More'}</span>
                        <span className="text-[10px] text-muted-foreground">{r.objective}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {formatCurrency(r.estBudget, 'INR')}
                      <Badge variant="outline" className="ml-1 text-[9px] text-warning border-warning">
                        Est.
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={r.status === 'active' ? 'default' : 'secondary'}
                        className={r.status === 'active' ? 'bg-success/15 text-success text-[10px]' : 'text-[10px]'}
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {formatDate(r.detectedAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
